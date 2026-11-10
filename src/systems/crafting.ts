// Il crafting di Bruno (design §9): una ricetta trasforma materiali e qualche
// moneta in un'arma. Come il negozio, è una transazione "tutto o niente".
// Le ricette stanno in data/ricette.json; quelle non di base si imparano dalle pergamene.

import { aggiungi, conta, togli, togliPerId, type Inventario } from './inventario';
import { spendiMonete } from './monete';
import type { DefinizioneOggetto } from './oggetti';
import type { DefinizioneArma, DefinizioneArmatura } from './tipi';

export interface Ricetta {
  id: string;
  /** Id dell'oggetto creato (un'arma). */
  risultato: string;
  /** Materiale → quanti ne servono. */
  materiali: Record<string, number>;
  /** Il compenso di Bruno. */
  monete: number;
  /** Bruno la conosce già; le altre si imparano con una pergamena. */
  conosciutaDallInizio: boolean;
}

/** Le ricette che il giocatore può usare: quelle di base più quelle imparate. */
export function ricetteConosciute(tutte: readonly Ricetta[], imparate: readonly string[]): Ricetta[] {
  return tutte.filter((r) => r.conosciutaDallInizio || imparate.includes(r.id));
}

/** Impara una ricetta (da una pergamena). "nuova" è falso se la conoscevi già. */
export function impara(imparate: readonly string[], id: string): { ricette: string[]; nuova: boolean } {
  if (imparate.includes(id)) return { ricette: [...imparate], nuova: false };
  return { ricette: [...imparate, id], nuova: true };
}

export interface Mancanze {
  materiali: { id: string; servono: number; hai: number }[];
  monete: { servono: number; hai: number };
  /** Vero se hai tutto. */
  ok: boolean;
}

/** Per la schermata: per ogni ingrediente quanti ne servono e quanti ne hai. */
export function cosaManca(inventario: Inventario, monete: number, r: Pick<Ricetta, 'materiali' | 'monete'>): Mancanze {
  const materiali = Object.entries(r.materiali).map(([id, servono]) => ({ id, servono, hai: conta(inventario, id) }));
  const ok = materiali.every((m) => m.hai >= m.servono) && monete >= r.monete;
  return { materiali, monete: { servono: r.monete, hai: monete }, ok };
}

interface Bottega {
  monete: number;
  inventario: Inventario;
}

export type EsitoCrafting<T> = { ok: true; stato: T } | { ok: false; errore: string };

export function crea<T extends Bottega>(
  s: T,
  r: Ricetta,
  imparate: readonly string[],
  pile: Readonly<Record<string, number>>,
): EsitoCrafting<T> {
  if (!r.conosciutaDallInizio && !imparate.includes(r.id)) return { ok: false, errore: 'Non conosci questa ricetta' };
  // 1. I materiali: tolti uno per uno; se ne manca anche uno solo, ci si ferma.
  let inventario = s.inventario;
  for (const [id, quantita] of Object.entries(r.materiali)) {
    const dopo = togliPerId(inventario, id, quantita);
    if (!dopo) return { ok: false, errore: `Mancano materiali: servono ${quantita} × ${id}` };
    inventario = dopo;
  }
  // 2. Le monete.
  const pagato = spendiMonete(s, r.monete);
  if (!pagato) return { ok: false, errore: `Non hai abbastanza monete (ne servono ${r.monete})` };
  // 3. L'arma nello zaino: i materiali usati possono aver liberato spazio.
  const esito = aggiungi(inventario, r.risultato, 1, pile[r.risultato] ?? 1);
  if (esito.rimasti > 0) return { ok: false, errore: 'Zaino pieno: fai spazio per la nuova arma' };
  return { ok: true, stato: { ...pagato, inventario: esito.inventario } };
}

export interface DatiSmontaggio {
  oggetti: Record<string, DefinizioneOggetto>;
  armi?: Record<string, DefinizioneArma>;
  armature?: Record<string, DefinizioneArmatura>;
  ricette?: Record<string, Ricetta>;
}

export interface EsitoSmontaggio {
  ok: boolean;
  errore?: string;
  inventario?: Inventario;
  materialiRecuperati?: { id: string; nome: string; quantita: number }[];
  scartati?: { id: string; quantita: number }[];
}

/**
 * Calcola i materiali grezzi recuperabili smontando o distruggendo un'arma o armatura.
 */
export function materialiDaSmontaggio(
  idOggetto: string,
  dati: DatiSmontaggio,
): Record<string, number> {
  const o = dati.oggetti[idOggetto];
  if (!o) return {};
  if (o.tipo !== 'arma' && o.tipo !== 'armatura') return {};

  const recupero: Record<string, number> = {};

  // 1. Se esiste una ricetta di crafting per quest'arma, recupera ~60% dei materiali
  const ricetta = Object.values(dati.ricette ?? {}).find((r) => r.risultato === idOggetto);
  if (ricetta && ricetta.materiali) {
    for (const [mat, qty] of Object.entries(ricetta.materiali)) {
      recupero[mat] = Math.max(1, Math.ceil(qty * 0.6));
    }
  }

  const arma = dati.armi?.[idOggetto];
  const armatura = dati.armature?.[idOggetto];

  // 2. Se non ha una ricetta specifica, calcola in base alla tipologia e rarità
  if (Object.keys(recupero).length === 0) {
    if (arma) {
      const tipo = arma.tipo;
      if (tipo === 'spada' || tipo === 'spadone' || tipo === 'ascia' || tipo === 'mazza') {
        recupero['minerale_ferro'] = tipo === 'ascia' ? 3 : 2;
        recupero['carbone'] = 1;
        if (arma.rarita === 'non_comune' || arma.rarita === 'rara') {
          recupero['minerale_ferro'] += 1;
        }
        if (arma.rarita === 'esotica' || arma.rarita === 'leggendaria') {
          recupero['osso_antico'] = 1;
        }
      } else if (tipo === 'pugnale' || tipo === 'pugnali') {
        recupero['minerale_ferro'] = 1;
        recupero['pelle_lupo'] = 1;
        if (arma.rarita !== 'comune') {
          recupero['minerale_ferro'] += 1;
        }
      } else if (tipo === 'arco' || tipo === 'balestra') {
        recupero['pelle_lupo'] = 2;
        recupero['minerale_ferro'] = 1;
        if (arma.rarita !== 'comune') {
          recupero['gelatina_slime'] = 1;
        }
      } else if (tipo === 'bastone' || tipo === 'bacchetta') {
        recupero['gelatina_slime'] = 2;
        recupero['carbone'] = 1;
        if (arma.rarita !== 'comune') {
          recupero['cristallo_miniera'] = 1;
        }
      } else {
        recupero['minerale_ferro'] = 1;
        recupero['carbone'] = 1;
      }
    } else if (armatura) {
      const pezzo = armatura.pezzo;
      if (pezzo === 'corazza') {
        recupero['minerale_ferro'] = 2;
        recupero['pelle_lupo'] = 1;
      } else if (pezzo === 'elmo') {
        recupero['minerale_ferro'] = 1;
        recupero['carbone'] = 1;
      } else {
        recupero['pelle_lupo'] = 1;
      }
      if (armatura.rarita !== 'comune') {
        recupero['minerale_ferro'] = (recupero['minerale_ferro'] ?? 0) + 1;
      }
    }
  }

  // Bonus per potenziamenti passati
  if (arma && arma.potenziamento && arma.potenziamento > 0) {
    recupero['minerale_ferro'] = (recupero['minerale_ferro'] ?? 0) + arma.potenziamento;
  }

  return recupero;
}

/**
 * Smonta o distrugge un'arma o armatura dallo zaino: libera lo spazio e aggiunge
 * i materiali grezzi recuperati.
 */
export function smontaOggettoDaInventario(
  inventario: Inventario,
  indiceZaino: number,
  dati: DatiSmontaggio,
): EsitoSmontaggio {
  const pila = inventario.spazi[indiceZaino];
  if (!pila) return { ok: false, errore: 'Spazio vuoto' };

  const def = dati.oggetti[pila.id];
  if (!def) return { ok: false, errore: 'Oggetto sconosciuto' };

  if (def.tipo !== 'arma' && def.tipo !== 'armatura') {
    return { ok: false, errore: 'Puoi smontare solo armi e armature' };
  }

  const materiali = materialiDaSmontaggio(pila.id, dati);
  if (Object.keys(materiali).length === 0) {
    return { ok: false, errore: 'Questo oggetto non può essere smontato' };
  }

  // 1. Togli l'oggetto dallo zaino (libera 1 spazio)
  let invAggiornato = togli(inventario, indiceZaino, 1);

  // 2. Aggiungi i materiali recuperati
  const pile = Object.fromEntries(Object.values(dati.oggetti).map((o) => [o.id, o.pila ?? 1]));
  const recuperati: { id: string; nome: string; quantita: number }[] = [];
  const scartati: { id: string; quantita: number }[] = [];

  for (const [matId, qta] of Object.entries(materiali)) {
    const res = aggiungi(invAggiornato, matId, qta, pile[matId] ?? 20);
    invAggiornato = res.inventario;
    const nomeMat = dati.oggetti[matId]?.nome ?? matId;
    recuperati.push({ id: matId, nome: nomeMat, quantita: qta });
    if (res.rimasti > 0) {
      scartati.push({ id: matId, quantita: res.rimasti });
    }
  }

  return {
    ok: true,
    inventario: invAggiornato,
    materialiRecuperati: recuperati,
    scartati,
  };
}

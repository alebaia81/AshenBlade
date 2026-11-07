// Il crafting di Bruno (design §9): una ricetta trasforma materiali e qualche
// moneta in un'arma. Come il negozio, è una transazione "tutto o niente".
// Le ricette stanno in data/ricette.json; quelle non di base si imparano dalle pergamene.

import { aggiungi, conta, togliPerId, type Inventario } from './inventario';
import { spendiMonete } from './monete';

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

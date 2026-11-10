// Cosa indossa l'eroe: due armi (primaria e secondaria) e quattro pezzi di
// armatura (design §8). Funzioni pure come l'inventario: ricevono lo stato
// (zaino + equipaggiamento) e ne restituiscono uno nuovo, oppure un errore
// da mostrare al giocatore. La regola delicata è il LIMITE DELLE ESOTICHE.

import type { Caratteristiche, NomeCaratteristica } from './caratteristiche';
import { dannoBaseArma } from './combattimento';
import type { Inventario } from './inventario';
import type { Rarita } from './oggetti';
import { modificatoreArma, probabilitaCriticoDi } from './personaggio';
import type { DefinizioneArma, DefinizioneArmatura } from './tipi';

export const PEZZI_ARMATURA = ['elmo', 'corazza', 'guanti', 'stivali'] as const;
export type PezzoArmatura = (typeof PEZZI_ARMATURA)[number];

export const SPAZI_EQUIPAGGIAMENTO = ['primaria', 'secondaria', ...PEZZI_ARMATURA] as const;
export type SpazioEquipaggiamento = (typeof SPAZI_EQUIPAGGIAMENTO)[number];

/** Id dell'oggetto in ogni spazio, null = vuoto. La primaria non è mai vuota. */
export type Equipaggiamento = Record<SpazioEquipaggiamento, string | null>;

/**
 * Ciò che serve sapere di un oggetto indossabile per queste regole. È un
 * "riassunto" costruito da armi.json e armature.json in caricaDati: così le
 * regole non dipendono dai due formati diversi (come un'interfaccia in comune).
 */
export interface Indossabile {
  categoria: 'arma' | 'armatura';
  spazio: SpazioEquipaggiamento;
  rarita: Rarita;
  /** Punti di armatura (0 per le armi). */
  armatura: number;
  /** Solo i leggendari: punti in più alle caratteristiche. */
  bonus?: Partial<Caratteristiche>;
  effetti: readonly string[];
  /** Armi che consumano mana: solo per le classi che ne hanno. */
  usaMana: boolean;
}
export type CatalogoIndossabili = Readonly<Record<string, Indossabile>>;

/** Zaino ed equipaggiamento cambiano sempre insieme: un pezzo passa dall'uno all'altro. */
export interface StatoZaino {
  inventario: Inventario;
  equipaggiamento: Equipaggiamento;
}

export type EsitoEquipaggiamento = { ok: true; stato: StatoZaino } | { ok: false; errore: string };

export function creaEquipaggiamento(armaIniziale: string): Equipaggiamento {
  return { primaria: armaIniziale, secondaria: null, elmo: null, corazza: null, guanti: null, stivali: null };
}

const ERRORE_ESOTICA = {
  arma: 'Puoi equipaggiare una sola arma esotica',
  armatura: 'Puoi indossare un solo pezzo d’armatura esotico',
};

/**
 * Indossa l'oggetto nello spazio "indice" dello zaino. Quello che c'era nel suo
 * spazio torna nello zaino, proprio dove stava il nuovo: è uno SCAMBIO, quindi
 * funziona anche con lo zaino pieno. Per le armi si può scegliere se metterle
 * nello spazio "primaria" o "secondaria" (se non specificato, usano quello predefinito).
 */
export function equipaggia(
  s: StatoZaino,
  indice: number,
  catalogo: CatalogoIndossabili,
  opzioni: { haMana: boolean },
  spazioScelto?: 'primaria' | 'secondaria',
): EsitoEquipaggiamento {
  const pila = s.inventario.spazi[indice];
  if (!pila) return { ok: false, errore: 'Spazio vuoto' };
  const nuovo = catalogo[pila.id];
  if (!nuovo) return { ok: false, errore: 'Non si può indossare' };
  if (nuovo.usaMana && !opzioni.haMana) return { ok: false, errore: 'Quest’arma usa il mana: la tua classe non ne ha' };

  const destinazione: SpazioEquipaggiamento =
    nuovo.categoria === 'arma' && (spazioScelto === 'primaria' || spazioScelto === 'secondaria')
      ? spazioScelto
      : nuovo.spazio;

  // Il limite delle esotiche guarda gli ALTRI spazi della stessa categoria:
  // sostituire un'esotica con un'altra nello stesso spazio è permesso.
  if (nuovo.rarita === 'esotica') {
    const altraEsotica = SPAZI_EQUIPAGGIAMENTO.some((spazio) => {
      if (spazio === destinazione) return false;
      const id = s.equipaggiamento[spazio];
      const indossato = id ? catalogo[id] : undefined;
      return indossato?.categoria === nuovo.categoria && indossato.rarita === 'esotica';
    });
    if (altraEsotica) return { ok: false, errore: ERRORE_ESOTICA[nuovo.categoria] };
  }

  const precedente = s.equipaggiamento[destinazione];
  const spazi = [...s.inventario.spazi];
  // Armi e armature non si impilano (pila 1): lo spazio si libera del tutto.
  spazi[indice] = pila.quantita > 1 ? { ...pila, quantita: pila.quantita - 1 } : null;
  if (precedente) {
    const dove = spazi[indice] === null ? indice : spazi.indexOf(null);
    if (dove < 0) return { ok: false, errore: 'Zaino pieno' };
    spazi[dove] = { id: precedente, quantita: 1 };
  }
  return {
    ok: true,
    stato: {
      inventario: { ...s.inventario, spazi },
      equipaggiamento: { ...s.equipaggiamento, [destinazione]: pila.id },
    },
  };
}

/** Scambia tra loro l'arma primaria e l'arma secondaria (se c'è un'arma secondaria). */
export function scambiaArmi(s: StatoZaino): EsitoEquipaggiamento {
  const { primaria, secondaria } = s.equipaggiamento;
  if (!secondaria) return { ok: false, errore: 'Nessuna arma secondaria con cui scambiare' };
  return {
    ok: true,
    stato: {
      inventario: s.inventario,
      equipaggiamento: { ...s.equipaggiamento, primaria: secondaria, secondaria: primaria },
    },
  };
}

/** Toglie il pezzo di uno spazio e lo rimette nel primo spazio libero dello zaino. */
export function togliDa(s: StatoZaino, spazio: SpazioEquipaggiamento): EsitoEquipaggiamento {
  if (spazio === 'primaria') return { ok: false, errore: 'Serve sempre un’arma in mano: impugnane un’altra' };
  const id = s.equipaggiamento[spazio];
  if (!id) return { ok: false, errore: 'Non c’è niente da togliere' };
  const libero = s.inventario.spazi.indexOf(null);
  if (libero < 0) return { ok: false, errore: 'Zaino pieno' };
  const spazi = [...s.inventario.spazi];
  spazi[libero] = { id, quantita: 1 };
  return {
    ok: true,
    stato: { inventario: { ...s.inventario, spazi }, equipaggiamento: { ...s.equipaggiamento, [spazio]: null } },
  };
}

/** Gli oggetti indossati, già cercati nel catalogo. */
function indossati(e: Equipaggiamento, catalogo: CatalogoIndossabili): Indossabile[] {
  return SPAZI_EQUIPAGGIAMENTO.flatMap((spazio) => {
    const id = e[spazio];
    const voce = id ? catalogo[id] : undefined;
    return voce ? [voce] : [];
  });
}

/** Somma dei punti di armatura dei pezzi indossati (design §7). */
export function armaturaTotale(e: Equipaggiamento, catalogo: CatalogoIndossabili): number {
  return indossati(e, catalogo).reduce((totale, v) => totale + v.armatura, 0);
}

/** Punti in più alle caratteristiche dati dai pezzi leggendari. */
export function bonusCaratteristiche(e: Equipaggiamento, catalogo: CatalogoIndossabili): Partial<Caratteristiche> {
  const totale: Partial<Caratteristiche> = {};
  for (const v of indossati(e, catalogo)) {
    for (const [nome, valore] of Object.entries(v.bonus ?? {}) as [NomeCaratteristica, number][]) {
      totale[nome] = (totale[nome] ?? 0) + valore;
    }
  }
  return totale;
}

/** Caratteristiche di base + bonus: quelle che contano davvero in gioco. */
export function conBonus(base: Caratteristiche, bonus: Partial<Caratteristiche>): Caratteristiche {
  const risultato = { ...base };
  for (const [nome, valore] of Object.entries(bonus) as [NomeCaratteristica, number][]) risultato[nome] += valore;
  return risultato;
}

/** Effetti speciali attivi, delle armi o delle armature. */
export function effettiEquipaggiati(
  e: Equipaggiamento,
  catalogo: CatalogoIndossabili,
  categoria: Indossabile['categoria'],
): string[] {
  return indossati(e, catalogo)
    .filter((v) => v.categoria === categoria)
    .flatMap((v) => v.effetti);
}

export interface ConfrontoArma {
  tipo: 'arma';
  spazio: 'primaria' | 'secondaria';
  nomeAttuale: string;
  deltaDanno: number;
  deltaCritico: number;
}

export interface ConfrontoArmatura {
  tipo: 'armatura';
  pezzo: PezzoArmatura;
  nomeAttuale: string;
  deltaArmatura: number;
  deltaBonus: Partial<Caratteristiche>;
}

export type ConfrontoEquipaggiamento = ConfrontoArma | ConfrontoArmatura;

/**
 * Calcola la differenza statistica tra un oggetto selezionato nello zaino e ciò che
 * è attualmente equipaggiato nello slot corrispondente.
 */
export function confrontaConAttuale(
  idOggetto: string,
  equip: Equipaggiamento,
  armi: Record<string, DefinizioneArma>,
  armature: Record<string, DefinizioneArmatura>,
  caratteristiche: Caratteristiche,
): ConfrontoEquipaggiamento | null {
  const arma = armi[idOggetto];
  if (arma) {
    const slot = arma.slot;
    const attualeId = equip[slot];
    const attuale = attualeId ? armi[attualeId] : null;
    const dannoNuovo = dannoBaseArma(arma, arma.potenziamento ?? 0) + modificatoreArma(arma, caratteristiche);
    const dannoAttuale = attuale ? dannoBaseArma(attuale, attuale.potenziamento ?? 0) + modificatoreArma(attuale, caratteristiche) : 0;
    const critNuovo = Math.round(probabilitaCriticoDi(arma, caratteristiche) * 100);
    const critAttuale = attuale ? Math.round(probabilitaCriticoDi(attuale, caratteristiche) * 100) : 0;
    return {
      tipo: 'arma',
      spazio: slot,
      nomeAttuale: attuale ? attuale.nome : 'Nessuna',
      deltaDanno: dannoNuovo - dannoAttuale,
      deltaCritico: critNuovo - critAttuale,
    };
  }

  const armatura = armature[idOggetto];
  if (armatura) {
    const pezzo = armatura.pezzo;
    const attualeId = equip[pezzo];
    const attuale = attualeId ? armature[attualeId] : null;
    const deltaArmatura = armatura.armatura - (attuale?.armatura ?? 0);
    const deltaBonus: Partial<Caratteristiche> = {};
    const tutteLeStat = new Set([
      ...Object.keys(armatura.bonus ?? {}),
      ...Object.keys(attuale?.bonus ?? {}),
    ]) as Set<NomeCaratteristica>;
    for (const stat of tutteLeStat) {
      const valNuovo = armatura.bonus?.[stat] ?? 0;
      const valAttuale = attuale?.bonus?.[stat] ?? 0;
      if (valNuovo !== valAttuale) {
        deltaBonus[stat] = valNuovo - valAttuale;
      }
    }
    return {
      tipo: 'armatura',
      pezzo,
      nomeAttuale: attuale ? attuale.nome : 'Nessuno',
      deltaArmatura,
      deltaBonus,
    };
  }

  return null;
}

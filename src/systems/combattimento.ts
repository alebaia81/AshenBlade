// Le formule del combattimento (design §7 e combat_design_spec §5).

import type { Casuale } from './casuale';
import { leggiDado, tiraDado } from './dadi';

/**
 * Tabella progressione danno per i livelli dell'arma (Liv. 1 a Liv. 5+).
 * Indice 0 = Livello 1 (base, dotazione iniziale): +0
 * Indice 1 = Livello 2 (rinforzata): +2
 * Indice 2 = Livello 3 (affilata): +5 (+3 rispetto a Liv. 2)
 * Indice 3 = Livello 4 (magistrale): +7 (+2 rispetto a Liv. 3)
 * Indice 4 = Livello 5 (maxata/mastercraft): +10 (+3 rispetto a Liv. 4)
 * Indice 5 = Livello 5+ (+5 massimo potenziamento): +13
 */
export const INCREMENTI_DANNO_LIVELLO = [0, 2, 5, 7, 10, 13] as const;

/**
 * Calcola il danno base deterministico dell'arma in base al livello (1 - 5).
 * Valori di riferimento Tabella 5.2:
 * - Spada (Liv. 1 - 5): 10, 12, 15, 17, 20
 * - Arco/Balestra (Liv. 1 - 5): 8, 10, 13, 15, 18
 */
export function dannoBaseArma(
  arma: { tipo: string; id?: string; dannoBase?: number },
  livello: number = 0,
): number {
  let base = arma.dannoBase;
  if (base === undefined) {
    if (arma.tipo === 'spada') base = 10;
    else if (arma.tipo === 'arco') base = 8;
    else if (arma.tipo === 'balestra') base = 10;
    else if (arma.tipo === 'bastone' || arma.tipo === 'bacchetta') base = 8;
    else if (arma.tipo === 'pugnale') base = 7;
    else if (arma.tipo === 'mazza') base = 9;
    else if (arma.tipo === 'ascia') base = 13;
    else base = 10;
  }
  const inc = INCREMENTI_DANNO_LIVELLO[Math.min(livello, INCREMENTI_DANNO_LIVELLO.length - 1)] ?? (livello * 2.5);
  return base + inc;
}

export interface DatiColpo {
  /** Danno base deterministico (fase 5). Se specificato, non si tirano i dadi per il danno dell'arma. */
  dannoBase?: number;
  /** Dado dell'arma, es. "1d6" (usato se dannoBase non è impostato). */
  dado: string;
  /** Modificatore della caratteristica dell'arma (FOR o DES). Fino alla fase 3 vale 0. */
  modificatore: number;
  /** Bonus di potenziamento dell'arma (+1…+5, fase 6). */
  bonus: number;
  /** Armatura del bersaglio. */
  armatura: number;
  /** Tra 0 e 1. */
  probabilitaCritico: number;
  /** Dadi in più, es. ["1d6"] del Chierico contro i non morti. */
  dadiAggiuntivi?: readonly string[];
  /** Moltiplicatore finale, es. 2 per il colpo alle spalle del Ladro, 0.7 per splash cleave. */
  moltiplicatore?: number;
  /** Quanto moltiplica il critico: 2 di solito, 3 con "colpo_critico_doppio". */
  moltiplicatoreCritico?: number;
}

export interface EsitoColpo {
  danno: number;
  critico: boolean;
}

/** 5% di base + 1% per punto di modificatore DES + bonus dell'arma (già in frazione: 0.05 = 5%). */
export function probabilitaCritico(modificatoreDES: number, bonusArma: number): number {
  return Math.min(1, Math.max(0, 0.05 + 0.01 * modificatoreDES + bonusArma));
}

/**
 * Danno di un colpo andato a segno. Non si tira "per colpire": se l'area di colpo
 * tocca il bersaglio, il colpo è riuscito; qui si decide solo QUANTO fa male.
 * Con dannoBase specificato, il calcolo è deterministico (§5 combat design spec):
 * (DannoBaseArma[Livello] + Statistica) * ModificatoreColpo - Armatura.
 */
export function calcolaDanno(dati: DatiColpo, casuale: Casuale): EsitoColpo {
  // Prima il critico, poi il calcolo del danno: l'ordine conta per i test con casuali fissi.
  const critico = casuale() < dati.probabilitaCritico;
  let base: number;

  if (dati.dannoBase !== undefined) {
    // Formula deterministica senza dadi
    base = dati.dannoBase + dati.modificatore;
    for (const extra of dati.dadiAggiuntivi ?? []) {
      const d = leggiDado(extra);
      base += Math.round(d.quantita * ((d.facce + 1) / 2));
    }
  } else {
    // Formula con dadi (mob o test legacy)
    base = tiraDado(leggiDado(dati.dado), casuale) + dati.modificatore + dati.bonus;
    for (const extra of dati.dadiAggiuntivi ?? []) base += tiraDado(leggiDado(extra), casuale);
  }

  // Critico e moltiplicatore si cumulano: un critico alle spalle fa ×4.
  const moltiplicato = base * (critico ? (dati.moltiplicatoreCritico ?? 2) : 1) * (dati.moltiplicatore ?? 1);
  // Almeno 1: un colpo andato a segno deve sempre "sentirsi".
  return { danno: Math.max(1, Math.round(moltiplicato) - dati.armatura), critico };
}

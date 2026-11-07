// Le formule del combattimento (design §7).

import type { Casuale } from './casuale';
import { leggiDado, tiraDado } from './dadi';

export interface DatiColpo {
  /** Dado dell'arma, es. "1d6". */
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
  /** Moltiplicatore finale, es. 2 per il colpo alle spalle del Ladro. */
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
 */
export function calcolaDanno(dati: DatiColpo, casuale: Casuale): EsitoColpo {
  // Prima il critico, poi i dadi: l'ordine conta per i test con casuali fissi.
  const critico = casuale() < dati.probabilitaCritico;
  let base = tiraDado(leggiDado(dati.dado), casuale) + dati.modificatore + dati.bonus;
  for (const extra of dati.dadiAggiuntivi ?? []) base += tiraDado(leggiDado(extra), casuale);
  // Critico e moltiplicatore si cumulano: un critico alle spalle fa ×4.
  const moltiplicato = base * (critico ? (dati.moltiplicatoreCritico ?? 2) : 1) * (dati.moltiplicatore ?? 1);
  // Almeno 1: un colpo andato a segno deve sempre "sentirsi".
  return { danno: Math.max(1, moltiplicato - dati.armatura), critico };
}

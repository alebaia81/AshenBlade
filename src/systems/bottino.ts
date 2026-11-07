// Il bottino dei nemici: ogni voce della tabella ha la sua probabilità e si
// tira a parte, quindi un nemico può lasciare niente, una cosa o più cose.

import type { Casuale } from './casuale';

export interface VoceBottino {
  oggetto: string;
  /** Tra 0 e 1: 0.15 = 15%. */
  probabilita: number;
  /** Quanti ne lascia se esce (1 se non indicato). */
  quantita?: number;
}

export function tiraBottino(tabella: readonly VoceBottino[], casuale: Casuale): { id: string; quantita: number }[] {
  return tabella
    .filter((voce) => casuale() < voce.probabilita)
    .map((voce) => ({ id: voce.oggetto, quantita: voce.quantita ?? 1 }));
}

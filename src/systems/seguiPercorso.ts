// Seguire un percorso: a ogni fotogramma, verso quale punto andare e a che velocità.

import type { Vettore } from './tipi';

export interface PassoPercorso {
  velocita: Vettore;
  /** Indice del punto verso cui si sta andando. */
  indice: number;
  arrivato: boolean;
}

/** Distanza sotto la quale un punto si considera raggiunto. */
const TOLLERANZA = 2;

export function seguiPercorso(posizione: Vettore, punti: readonly Vettore[], indice: number, velocita: number): PassoPercorso {
  let i = indice;
  // Si saltano i punti già raggiunti (anche più di uno, se la fisica ci ha spinto oltre).
  while (i < punti.length && Math.hypot(punti[i]!.x - posizione.x, punti[i]!.y - posizione.y) <= TOLLERANZA) i++;
  if (i >= punti.length) return { velocita: { x: 0, y: 0 }, indice: i, arrivato: true };

  const p = punti[i]!;
  const d = Math.hypot(p.x - posizione.x, p.y - posizione.y);
  return {
    velocita: { x: ((p.x - posizione.x) / d) * velocita, y: ((p.y - posizione.y) / d) * velocita },
    indice: i,
    arrivato: false,
  };
}

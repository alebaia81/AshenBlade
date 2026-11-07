// Dadi in notazione D&D: "2d6+1" significa "tira due dadi da 6 facce e aggiungi 1".

import type { Casuale } from './casuale';

export interface Dado {
  quantita: number;
  facce: number;
  bonus: number;
}

const FORMATO = /^(\d+)d(\d+)([+-]\d+)?$/;

export function leggiDado(testo: string): Dado {
  const parti = FORMATO.exec(testo.trim());
  const quantita = Number(parti?.[1]);
  const facce = Number(parti?.[2]);
  if (!parti || quantita < 1 || facce < 1) {
    throw new Error(`Dado "${testo}" non valido: usa il formato "1d6", "2d4+1" o "1d8-1"`);
  }
  return { quantita, facce, bonus: Number(parti[3] ?? 0) };
}

export function tiraDado(dado: Dado, casuale: Casuale): number {
  let totale = dado.bonus;
  for (let i = 0; i < dado.quantita; i++) {
    // casuale() è tra 0 e 0,999…: moltiplicato per 6 e arrotondato per difetto dà 0–5, +1 dà 1–6.
    totale += 1 + Math.floor(casuale() * dado.facce);
  }
  return totale;
}

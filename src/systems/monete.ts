// Le monete (design §9). Non occupano spazio nello zaino: sono un numero nella
// Partita. Funzioni generiche: valgono per qualunque oggetto con un campo "monete".

import type { Casuale } from './casuale';

/** [minimo, massimo] compresi, come scritto in nemici.json. */
export type IntervalloMonete = readonly [number, number];

/** Quante monete lascia un nemico sconfitto. */
export function moneteDelNemico(intervallo: IntervalloMonete | undefined, casuale: Casuale): number {
  if (!intervallo) return 0;
  const [minimo, massimo] = intervallo;
  return minimo + Math.floor(casuale() * (massimo - minimo + 1));
}

function controlla(quantita: number): void {
  if (!Number.isInteger(quantita) || quantita < 0) throw new Error(`Quantità di monete non valida: ${quantita}`);
}

export function aggiungiMonete<T extends { monete: number }>(x: T, quantita: number): T {
  controlla(quantita);
  return { ...x, monete: x.monete + quantita };
}

/** null se non bastano: chi chiama decide cosa dire al giocatore. */
export function spendiMonete<T extends { monete: number }>(x: T, quantita: number): T | null {
  controlla(quantita);
  if (quantita > x.monete) return null;
  return { ...x, monete: x.monete - quantita };
}

// Le parti "matematiche" degli effetti speciali di armi e armature (design §4, §8).
// Gli effetti sono ETICHETTE nei dati ("risucchio_vita", "spine"…): un registro
// nella scena dice cosa fa ognuna nel mondo; qui ci sono i numeri, testabili.

import type { Vettore } from './tipi';

/** Effetti delle armi che il codice sa interpretare. */
export const EFFETTI_ARMA = [
  'risucchio_vita', // cura una parte del danno inflitto
  'colpo_critico_doppio', // il critico fa ×3
  'rallentamento', // il nemico colpito rallenta
  'fuoco', // il nemico colpito brucia per qualche secondo
  'rimbalzo', // il proiettile salta al nemico vicino
  'invisibile_dopo_uccisione', // dopo un'uccisione l'eroe sparisce per un attimo
] as const;

/** Effetti delle armature esotiche. */
export const EFFETTI_ARMATURA = [
  'doppia_capriola', // Stivali del vento
  'spine', // Corazza di spine
  'veggente', // Elmo del veggente: segnala muri segreti vicini
  'predatore', // Guanti del predatore: i critici curano
] as const;

/** Tutti i numeri degli effetti in un posto: si ribilanciano qui. */
export const NUMERI_EFFETTI = {
  risucchio: 0.2,
  spine: 0.3,
  fuoco: { dannoAlSecondo: 1, durataMs: 3000 },
  rallentamento: { fattore: 0.5, durataMs: 2000 },
  invisibileMs: 2000,
  curaPredatore: 2,
  rimbalzi: 2,
  raggioRimbalzo: 80,
  raggioVeggente: 6 * 16,
};

/** Vita recuperata col risucchio: il 20% del danno, almeno 1 (se il colpo ha fatto danno). */
export function vitaRisucchiata(danno: number): number {
  return danno <= 0 ? 0 : Math.max(1, Math.round(danno * NUMERI_EFFETTI.risucchio));
}

/** Danno rimandato dalla Corazza di spine a chi colpisce: il 30%, almeno 1. */
export function danniRimandati(danno: number): number {
  return danno <= 0 ? 0 : Math.max(1, Math.round(danno * NUMERI_EFFETTI.spine));
}

export function moltiplicatoreCritico(effetti: readonly string[]): number {
  return effetti.includes('colpo_critico_doppio') ? 3 : 2;
}

/** Il bersaglio del prossimo rimbalzo: il più vicino tra quelli non ancora colpiti, entro il raggio. */
export function prossimoRimbalzo(
  da: Vettore,
  candidati: readonly { id: number; posizione: Vettore }[],
  esclusi: ReadonlySet<number>,
  raggio: number,
): number | null {
  let migliore: number | null = null;
  let distanzaMigliore = raggio;
  for (const c of candidati) {
    if (esclusi.has(c.id)) continue;
    const d = Math.hypot(c.posizione.x - da.x, c.posizione.y - da.y);
    if (d <= distanzaMigliore) {
      migliore = c.id;
      distanzaMigliore = d;
    }
  }
  return migliore;
}

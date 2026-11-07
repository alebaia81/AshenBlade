// Prepara i dati per la Tilemap di Phaser partendo dalla nostra mappa a caratteri.
// Una Tilemap non conosce i caratteri: vuole una griglia di NUMERI, dove ogni
// numero è la posizione di una tessera nell'immagine delle tessere (il "tileset").
// Qui facciamo la traduzione carattere → numero, senza Phaser, così si può testare.

import type { Mappa, TipoCella } from './tipi';

/** Colori usati quando la legenda non ne indica uno. */
const COLORI_PREDEFINITI: Record<TipoCella, string> = {
  muro: '#2f3b2f',
  pavimento: '#6b9a4b',
  partenza: '#6b9a4b',
  arrivo: '#6b9a4b',
  uscita: '#c9a227',
  nemico: '#6b9a4b',
  forziere: '#6b9a4b',
  segreto: '#6b9a4b',
  abitante: '#6b9a4b',
  vena: '#6b9a4b',
  cartello: '#6b9a4b',
  porta: '#6b9a4b',
  barriera: '#6b9a4b',
};

export interface DatiTessere {
  /** simboli[i] è il carattere della tessera numero i. */
  simboli: string[];
  /** colori[i] è il colore con cui disegnare la tessera numero i. */
  colori: string[];
  /** indici[riga][col]: numero della tessera in quella posizione. */
  indici: number[][];
  /** Numeri delle tessere solide (i muri). */
  solide: number[];
}

export function preparaTessere(mappa: Mappa): DatiTessere {
  // Ogni simbolo riceve un numero in base alla sua posizione in Object.keys.
  // Attenzione: JavaScript mette PRIMA le chiavi che sembrano numeri ("1", "2"),
  // quindi l'ordine non è sempre quello scritto nel file. Non è un problema:
  // conta solo che simbolo e numero corrispondano, e qui li calcoliamo insieme.
  const simboli = Object.keys(mappa.legenda);
  const voci = simboli.map((s) => mappa.legenda[s]!);
  const numeroDi = new Map(simboli.map((s, i) => [s, i]));

  return {
    simboli,
    colori: voci.map((voce) => voce.colore ?? COLORI_PREDEFINITI[voce.tipo]),
    // analizzaMappa ha già garantito che ogni carattere sia in legenda.
    indici: mappa.simboli.map((riga) => riga.map((s) => numeroDi.get(s)!)),
    solide: voci.flatMap((voce, i) => (voce.tipo === 'muro' ? [i] : [])),
  };
}

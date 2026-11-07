// Regole del movimento dell'eroe: dai tasti premuti alla velocità e alla
// direzione dello sguardo. Nessun Phaser: è matematica pura, quindi si testa facilmente.

import type { Direzione, TastiPremuti, Vettore } from './tipi';

/**
 * Velocità in pixel al secondo.
 * Il vettore viene "normalizzato": in diagonale non si va più veloci.
 * Senza normalizzare, destra+giù darebbe (80, 80), cioè circa 113 px/s (teorema di Pitagora).
 */
export function calcolaVelocita(tasti: TastiPremuti, velocita: number): Vettore {
  // Ogni asse vale -1, 0 o +1. Tasti opposti si annullano da soli.
  const x = (tasti.destra ? 1 : 0) - (tasti.sinistra ? 1 : 0);
  const y = (tasti.giu ? 1 : 0) - (tasti.su ? 1 : 0);

  const lunghezza = Math.hypot(x, y);
  if (lunghezza === 0) return { x: 0, y: 0 };

  return { x: (x / lunghezza) * velocita, y: (y / lunghezza) * velocita };
}

/**
 * Direzione in cui guarda l'eroe. Servirà nella fase 2 per sapere dove colpisce.
 * Regole: da fermo non cambia; se la direzione attuale è ancora tra quelle
 * in cui si sta andando la teniamo (così in diagonale lo sguardo non "sfarfalla");
 * altrimenti vince l'asse orizzontale.
 */
export function aggiornaDirezione(attuale: Direzione, tasti: TastiPremuti): Direzione {
  const x = (tasti.destra ? 1 : 0) - (tasti.sinistra ? 1 : 0);
  const y = (tasti.giu ? 1 : 0) - (tasti.su ? 1 : 0);

  const possibili: Direzione[] = [];
  if (x > 0) possibili.push('destra');
  if (x < 0) possibili.push('sinistra');
  if (y < 0) possibili.push('su');
  if (y > 0) possibili.push('giu');

  if (possibili.length === 0) return attuale;
  if (possibili.includes(attuale)) return attuale;
  return possibili[0]!; // l'orizzontale è inserito per primo
}

/**
 * Come aggiornaDirezione, ma a partire da un vettore di movimento qualsiasi
 * (quello calcolato seguendo un percorso col mouse, che non è mai "solo destra").
 * Un asse conta se la sua componente supera circa sin(22,5°): così un movimento
 * quasi orizzontale vale come "destra" e non come "destra + giù".
 */
export function aggiornaDirezioneDaVettore(attuale: Direzione, v: Vettore): Direzione {
  const SOGLIA = 0.38;
  const lunghezza = Math.hypot(v.x, v.y);
  if (lunghezza === 0) return attuale;
  const x = v.x / lunghezza;
  const y = v.y / lunghezza;
  return aggiornaDirezione(attuale, { destra: x > SOGLIA, sinistra: x < -SOGLIA, su: y < -SOGLIA, giu: y > SOGLIA });
}

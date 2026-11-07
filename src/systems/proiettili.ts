// Proiettili (dardi magici, palla di fuoco): si muovono in linea retta fino
// alla gittata. Qui ci sono solo i conti; disegno e collisioni con i muri
// stanno in scenes/mondo/GestoreProiettili.ts.

import type { Rettangolo } from './geometria';
import type { Vettore } from './tipi';

export interface StatoProiettile {
  posizione: Vettore;
  /** Direzione di lunghezza 1. */
  direzione: Vettore;
  /** Pixel al secondo. */
  velocita: number;
  /** Pixel già percorsi. */
  percorso: number;
  /** Pixel massimi prima di sparire. */
  gittata: number;
}

export function creaProiettile(da: Vettore, direzione: Vettore, velocita: number, gittata: number): StatoProiettile {
  const l = Math.hypot(direzione.x, direzione.y) || 1;
  return { posizione: da, direzione: { x: direzione.x / l, y: direzione.y / l }, velocita, percorso: 0, gittata };
}

/** Dove si trova dopo dtMs millisecondi: spazio = velocità × tempo. */
export function avanza(p: StatoProiettile, dtMs: number): StatoProiettile {
  const passo = (p.velocita * dtMs) / 1000;
  return {
    ...p,
    posizione: { x: p.posizione.x + p.direzione.x * passo, y: p.posizione.y + p.direzione.y * passo },
    percorso: p.percorso + passo,
  };
}

export function finito(p: StatoProiettile): boolean {
  return p.percorso >= p.gittata;
}

/**
 * Bersagli toccati da un cerchio (un'esplosione, o un proiettile tondo).
 * Si misura la distanza dal centro al punto del rettangolo più vicino: un
 * nemico grande è colpito anche se il suo centro è fuori dal raggio.
 */
export function nelRaggio<Id>(centro: Vettore, raggio: number, bersagli: readonly { id: Id; rettangolo: Rettangolo }[]): Id[] {
  return bersagli
    .filter(({ rettangolo: r }) => {
      // Il punto più vicino si trova "schiacciando" il centro dentro il rettangolo.
      const x = Math.max(r.x, Math.min(centro.x, r.x + r.larghezza));
      const y = Math.max(r.y, Math.min(centro.y, r.y + r.altezza));
      return Math.hypot(x - centro.x, y - centro.y) < raggio;
    })
    .map((b) => b.id);
}

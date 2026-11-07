// Mirare col mouse: verso dove attaccare, se il bersaglio è a portata,
// e cosa c'è sotto il punto cliccato.

import { areaDiColpo, intersecano, type FormaArea, type Rettangolo } from './geometria';
import { liberoTra, type Griglia } from './percorso';
import type { Direzione, Vettore } from './tipi';

/**
 * Direzione verso un punto, arrotondata alle 4 direzioni: vince l'asse con la
 * distanza maggiore; a 45° esatti vince l'orizzontale.
 */
export function direzioneVerso(da: Vettore, a: Vettore): Direzione {
  const dx = a.x - da.x;
  const dy = a.y - da.y;
  if (dx === 0 && dy === 0) return 'giu';
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'destra' : 'sinistra';
  return dy < 0 ? 'su' : 'giu';
}

function centro(r: Rettangolo): Vettore {
  return { x: r.x + r.larghezza / 2, y: r.y + r.altezza / 2 };
}

/** Attaccando adesso verso il bersaglio, l'area di colpo lo toccherebbe? */
export function aPortata(centroEroe: Vettore, latoEroe: number, arma: FormaArea, bersaglio: Rettangolo): boolean {
  const direzione = direzioneVerso(centroEroe, centro(bersaglio));
  return intersecano(areaDiColpo(centroEroe, latoEroe, direzione, arma), bersaglio);
}

/**
 * Quale bersaglio c'è sotto il punto? Il margine allarga un po' i rettangoli:
 * i nemici sono piccoli e si muovono, centrarli al pixel sarebbe frustrante.
 */
export function bersaglioSotto<Id>(
  punto: Vettore,
  bersagli: readonly { id: Id; rettangolo: Rettangolo }[],
  margine: number,
): Id | null {
  let migliore: Id | null = null;
  let distanzaMigliore = Infinity;
  for (const { id, rettangolo: r } of bersagli) {
    const dentro =
      punto.x >= r.x - margine &&
      punto.x <= r.x + r.larghezza + margine &&
      punto.y >= r.y - margine &&
      punto.y <= r.y + r.altezza + margine;
    if (!dentro) continue;
    const c = centro(r);
    const d = Math.hypot(c.x - punto.x, c.y - punto.y);
    if (d < distanzaMigliore) {
      migliore = id;
      distanzaMigliore = d;
    }
  }
  return migliore;
}

/** Le armi a distanza tirano solo fino a questa frazione della gittata: un margine contro i bersagli che si allontanano. */
const MARGINE_GITTATA = 0.85;

/** Per le armi a distanza: il bersaglio è abbastanza vicino e nessun muro è in mezzo? */
export function aTiro(g: Griglia, da: Vettore, bersaglio: Vettore, gittata: number, tessera: number): boolean {
  const distanza = Math.hypot(bersaglio.x - da.x, bersaglio.y - da.y);
  // Il proiettile è piccolo: basta un "corridoio" largo 4 px.
  return distanza <= gittata * MARGINE_GITTATA && liberoTra(g, da, bersaglio, 2, tessera);
}

// Conversioni tra le due "unità di misura" del gioco:
// - celle: colonna e riga nella griglia della mappa (numeri interi);
// - pixel: posizione nel mondo, quella che usa Phaser per disegnare e per la fisica.
// Tenerle in un posto solo evita errori di "più o meno mezza tessera".

import type { Cella, Vettore } from './tipi';

/** Centro di una cella in pixel. Gli oggetti di Phaser si posizionano dal centro. */
export function centroCella(cella: Cella, dimensione: number): Vettore {
  return {
    x: cella.col * dimensione + dimensione / 2,
    y: cella.riga * dimensione + dimensione / 2,
  };
}

/** Cella che contiene un punto in pixel. Math.floor gestisce anche i negativi (fuori mappa). */
export function cellaDaPixel(x: number, y: number, dimensione: number): Cella {
  return {
    col: Math.floor(x / dimensione),
    riga: Math.floor(y / dimensione),
  };
}

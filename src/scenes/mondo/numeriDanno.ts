// Numeri del danno che salgono e svaniscono sopra il bersaglio.

import type * as Phaser from 'phaser';
import { ZOOM } from '../../costanti';

export type TipoNumero = 'normale' | 'critico' | 'eroe' | 'esperienza' | 'cura' | 'avviso';

const STILI: Record<TipoNumero, { colore: string; dimensione: number }> = {
  normale: { colore: '#ffffff', dimensione: 8 },
  critico: { colore: '#ffd23f', dimensione: 11 },
  eroe: { colore: '#ff6b6b', dimensione: 8 },
  esperienza: { colore: '#8fd3ff', dimensione: 7 },
  cura: { colore: '#7dff9a', dimensione: 9 },
  avviso: { colore: '#ffe680', dimensione: 6 },
};

export function mostraNumero(scena: Phaser.Scene, x: number, y: number, valore: number | string, tipo: TipoNumero): void {
  const stile = STILI[tipo];
  const testo = scena.add
    .text(x, y - 6, String(valore), {
      fontFamily: 'monospace',
      fontSize: `${stile.dimensione}px`,
      fontStyle: 'bold',
      color: stile.colore,
      stroke: '#000000',
      strokeThickness: 2,
      // La telecamera ingrandisce ×3: disegniamo il testo a risoluzione ×3
      // perché resti nitido invece di diventare a quadretti.
      resolution: ZOOM,
    })
    .setOrigin(0.5)
    .setDepth(20);

  // Due tween in parallelo: una fa salire il testo, l'altra lo fa svanire
  // solo nella seconda metà, così il numero resta leggibile all'inizio.
  scena.tweens.add({ targets: testo, y: y - 20, duration: 700, ease: 'Cubic.easeOut' });
  scena.tweens.add({ targets: testo, alpha: 0, delay: 400, duration: 300, onComplete: () => testo.destroy() });
}

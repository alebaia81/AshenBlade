// Una vena di minerale: una roccia con le venature del materiale che contiene.
// Dalla fase 7 anche un cespuglio di erbe: stesso comportamento, altro disegno
// (scegliere l'aspetto è un dato della mappa, "aspetto": "cespuglio").
// Cliccandola l'eroe ci va e "scava": la roccia trema, cadono 1–2 pezzi e la
// vena resta esaurita (scura) finché non si torna nella zona, come i nemici
// che ricompaiono (§11). Per questo il suo stato NON va nella Partita.

import * as Phaser from 'phaser';
import type { Cella, Vettore } from '../systems/tipi';
import type { AspettoRisolto } from '../systems/sprite';
import { aggiungiImmagine } from '../scenes/grafica';


const LATO = 16;

export class Vena {
  readonly forma: Phaser.GameObjects.Rectangle;
  private readonly venature: Phaser.GameObjects.Graphics;
  private _esaurita = false;
  private readonly immagine: Phaser.GameObjects.Image | null;

  constructor(
    private readonly scena: Phaser.Scene,
    readonly cella: Cella,
    readonly posizione: Vettore,
    readonly materiale: string,
    readonly quantita: readonly [number, number],
    /** Colore delle venature (quello del materiale). */
    private readonly colore: number,
    readonly aspetto: 'roccia' | 'cespuglio' = 'roccia',
    /** Fase 9b: l'immagine del materiale (null = disegno a forme). */
    figura: AspettoRisolto | null = null,
  ) {
    const { x, y } = posizione;
    this.forma = scena.add.rectangle(x, y, LATO, LATO, 0x6e6e6e).setDepth(2).setStrokeStyle(1, 0x3e3e3e);
    // Il cespuglio è tutto disegnato nel Graphics: il rettangolo resta solo come corpo fisico.
    if (aspetto === 'cespuglio') this.forma.setFillStyle(0, 0).setStrokeStyle();
    scena.physics.add.existing(this.forma, true);
    this.venature = scena.add.graphics().setDepth(2);
    this.immagine = figura ? aggiungiImmagine(scena, x, y, figura).setDepth(2) : null;
    if (this.immagine) this.forma.setFillStyle(0, 0).setStrokeStyle();
    this.disegna();
  }

  get esaurita(): boolean {
    return this._esaurita;
  }

  /** Trema un attimo, poi chiama "fatto": la scena fa cadere i materiali. */
  scava(fatto: () => void): void {
    if (this._esaurita) return;
    this._esaurita = true;
    this.scena.tweens.add({
      targets: [this.forma, this.venature, ...(this.immagine ? [this.immagine] : [])],
      x: '+=1.5',
      duration: 50,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        this.disegna();
        fatto();
      },
    });
  }

  private disegna(): void {
    if (this.immagine) {
      // Esaurita: la stessa immagine, spenta. Si capisce che lì non c'è più niente.
      if (this._esaurita) this.immagine.setTint(0x606060);
      return;
    }
    if (this.aspetto === 'cespuglio') {
      this.disegnaCespuglio();
      return;
    }
    const { x, y } = this.posizione;
    const g = this.venature.clear();
    // Venature: tre segmenti del colore del materiale. Esaurita: grigio scuro.
    const c = this._esaurita ? 0x4a4a4a : this.colore;
    this.forma.setFillStyle(this._esaurita ? 0x555555 : 0x6e6e6e);
    g.lineStyle(2, c, 1).beginPath();
    g.moveTo(x - 6, y - 3).lineTo(x - 1, y - 1).lineTo(x + 2, y - 5);
    g.moveTo(x - 4, y + 5).lineTo(x + 1, y + 2).lineTo(x + 6, y + 4);
    g.strokePath();
    if (!this._esaurita) g.fillStyle(0xffffff, 0.7).fillCircle(x + 3, y - 4, 0.8).fillCircle(x - 3, y + 4, 0.8);
  }

  /** Tre ciuffi verdi; finché ha erbe, foglie chiare (il colore del materiale) in cima. */
  private disegnaCespuglio(): void {
    const { x, y } = this.posizione;
    const g = this.venature.clear();
    g.fillStyle(0x000000, 0.2).fillEllipse(x, y + 5, 14, 4);
    g.fillStyle(this._esaurita ? 0x3d5a30 : 0x2f6a2a, 1).fillCircle(x - 4, y + 1, 4.5).fillCircle(x + 4, y + 1, 4.5).fillCircle(x, y - 2, 5);
    if (this._esaurita) return;
    g.fillStyle(this.colore, 1).fillEllipse(x - 3, y - 3, 3, 5).fillEllipse(x + 2, y - 5, 3, 5).fillEllipse(x + 4, y - 1, 3, 4);
    g.fillStyle(0xffffff, 0.6).fillCircle(x + 1, y - 6, 0.7);
  }
}

// La barriera della stanza del boss (fase 8a): una cella libera che si CHIUDE
// quando comincia lo scontro e si riapre quando il boss è sconfitto. Così non
// si può uscire a curarsi e rientrare (design §11, piano della fase 8).

import * as Phaser from 'phaser';
import type { Cella, Vettore } from '../systems/tipi';

const LATO = 16;

export class Barriera {
  readonly forma: Phaser.GameObjects.Rectangle;
  private readonly disegno: Phaser.GameObjects.Graphics;
  private _chiusa = false;

  constructor(
    private readonly scena: Phaser.Scene,
    readonly cella: Cella,
    readonly posizione: Vettore,
  ) {
    const { x, y } = posizione;
    this.forma = scena.add.rectangle(x, y, LATO, LATO).setVisible(false);
    scena.physics.add.existing(this.forma, true);
    (this.forma.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    // Sbarre di luce violacea: magia, non ferro.
    this.disegno = scena.add.graphics().setDepth(6).setVisible(false);
    this.disegno.fillStyle(0x7a3ab0, 0.35).fillRect(x - 8, y - 8, 16, 16);
    this.disegno.fillStyle(0xc89aff, 0.9);
    for (const dx of [-5, 0, 5]) this.disegno.fillRect(x + dx - 0.8, y - 8, 1.6, 16);
  }

  get chiusa(): boolean {
    return this._chiusa;
  }

  /** L'eroe (o un punto) è sopra questa cella? Allora non la si chiude. */
  contiene(p: Vettore): boolean {
    return Math.abs(p.x - this.posizione.x) < LATO / 2 + 6 && Math.abs(p.y - this.posizione.y) < LATO / 2 + 6;
  }

  chiudi(): void {
    this._chiusa = true;
    (this.forma.body as Phaser.Physics.Arcade.StaticBody).enable = true;
    this.disegno.setVisible(true).setAlpha(0);
    this.scena.tweens.add({ targets: this.disegno, alpha: 1, duration: 250 });
  }

  apri(): void {
    this._chiusa = false;
    (this.forma.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    this.scena.tweens.add({ targets: this.disegno, alpha: 0, duration: 400, onComplete: () => this.disegno.setVisible(false) });
  }
}

// Un muro segreto: sembra un pezzo di muro, ma ha una crepa. Si apre colpendolo
// (o cliccandolo da vicino) e dietro c'è un passaggio. Finché è chiuso è un
// corpo statico come i forzieri; aperto sparisce e la cella diventa pavimento.

import * as Phaser from 'phaser';
import type { Rettangolo } from '../systems/geometria';
import type { Cella, Vettore } from '../systems/tipi';

const LATO = 16;

export class MuroSegreto {
  readonly forma: Phaser.GameObjects.Rectangle;
  private readonly crepa: Phaser.GameObjects.Graphics;
  /** Fase 9b: il muro disegnato con la stessa pixel art dei muri della mappa. */
  private readonly immagine: Phaser.GameObjects.Image | null;
  /** Il luccichio dell'Elmo del veggente. */
  private readonly luccichio: Phaser.GameObjects.Rectangle;
  private _aperto: boolean;

  constructor(
    private readonly scena: Phaser.Scene,
    readonly cella: Cella,
    readonly posizione: Vettore,
    /** "mappa:colonna:riga", come per i forzieri: una volta aperto resta aperto. */
    readonly chiave: string,
    colore: number,
    aperto: boolean,
    /** Fase 9b: texture e fotogramma del muro (dall'immagine delle tessere della mappa). */
    muro: { chiave: string; fotogramma: string } | null = null,
  ) {
    this._aperto = aperto;
    const { x, y } = posizione;
    this.forma = scena.add.rectangle(x, y, LATO, LATO, colore).setDepth(2);
    scena.physics.add.existing(this.forma, true);
    this.immagine = muro ? scena.add.image(x, y, muro.chiave, muro.fotogramma).setDepth(2) : null;
    if (this.immagine) this.forma.setFillStyle(colore, 0);
    // (la crepa va disegnata sopra il muro: la creiamo prima, la alziamo qui)
    // La crepa: tre segmenti scuri a zig-zag. È l'unico indizio per chi guarda bene.
    this.crepa = scena.add.graphics().setDepth(2);
    this.crepa.lineStyle(1, 0x5a7a50, 1).beginPath();
    this.crepa.moveTo(x - 3, y - 6).lineTo(x + 1, y - 1).lineTo(x - 2, y + 2).lineTo(x + 3, y + 6).strokePath();
    this.crepa.setDepth(2.1);
    this.luccichio = scena.add.rectangle(x, y, LATO, LATO).setStrokeStyle(1.5, 0xffe680).setDepth(3).setVisible(false);
    if (aperto) this.nascondi();
  }

  get aperto(): boolean {
    return this._aperto;
  }

  rettangolo(): Rettangolo {
    return { x: this.posizione.x - LATO / 2, y: this.posizione.y - LATO / 2, larghezza: LATO, altezza: LATO };
  }

  /** Il muro si sbriciola: un breve tremolio, poi svanisce. */
  apri(): void {
    if (this._aperto) return;
    this._aperto = true;
    (this.forma.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    this.luccichio.setVisible(false);
    this.scena.tweens.add({
      targets: [this.forma, this.crepa, ...(this.immagine ? [this.immagine] : [])],
      alpha: 0,
      duration: 300,
      onComplete: () => this.nascondi(),
    });
  }

  /** Con l'Elmo del veggente il muro brilla quando l'eroe è abbastanza vicino. */
  aggiorna(eroe: Vettore, veggente: boolean, raggio: number, adesso: number): void {
    if (this._aperto) return;
    const vicino = veggente && Math.hypot(eroe.x - this.posizione.x, eroe.y - this.posizione.y) <= raggio;
    this.luccichio.setVisible(vicino);
    if (vicino) this.luccichio.setAlpha(0.5 + 0.5 * Math.sin(adesso / 150));
  }

  private nascondi(): void {
    (this.forma.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    this.forma.setVisible(false);
    this.crepa.setVisible(false);
    this.immagine?.setVisible(false);
    this.luccichio.setVisible(false);
  }
}

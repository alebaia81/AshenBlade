// La figura in pixel art di chi si muove (eroe, compagni, nemici, persone):
// un'immagine che SEGUE il corpo fisico, che resta un rettangolo invisibile.
//
// Perché separarli? Il corpo fisico deve restare semplice e stabile (le
// collisioni non devono cambiare se la figura saltella); la figura invece può
// muoversi, ribaltarsi, colorarsi. È come in una pagina web un elemento con
// la sua "hitbox" fissa e un'animazione CSS solo sul disegno.

import * as Phaser from 'phaser';
import { guardaASinistra, saltello, type AspettoRisolto } from '../systems/sprite';

/** Durata del lampo bianco quando la figura viene colpita. */
const DURATA_LAMPO = 70;

export interface OpzioniFigura {
  /** Lato in pixel nel mondo (16 = una tessera). I boss sono più grandi. */
  lato?: number;
  profondita: number;
  /** Di quanto alzare la figura rispetto al centro del corpo: i piedi vicino al fondo del rettangolo. */
  sollevamento?: number;
}

export class Figura {
  readonly immagine: Phaser.GameObjects.Image;
  private aSinistra = false;
  private lampoFino = 0;
  /** Colore "di stato" (fuoco, rallentato, mira del ragno): sostituisce la tinta di base. */
  private evidenza: number | null = null;
  private readonly sollevamento: number;
  private readonly scala: number;

  constructor(
    private readonly scena: Phaser.Scene,
    /** Il corpo fisico da seguire: posizione, trasparenza, vita. */
    private readonly corpo: Phaser.GameObjects.Rectangle,
    private readonly aspetto: AspettoRisolto,
    opzioni: OpzioniFigura,
  ) {
    this.immagine = scena.add.image(corpo.x, corpo.y, aspetto.chiave, aspetto.fotogramma).setDepth(opzioni.profondita);
    this.scala = (opzioni.lato ?? 16) / 16;
    this.immagine.setScale(this.scala);
    this.sollevamento = opzioni.sollevamento ?? 0;
    this.applicaTinta(0);
    // Dopo la fisica, a ogni fotogramma: la figura raggiunge il corpo.
    scena.events.on(Phaser.Scenes.Events.POST_UPDATE, this.segui, this);
    // Se il corpo viene distrutto (nemico sconfitto, scena che riparte) sparisce anche la figura.
    corpo.once(Phaser.GameObjects.Events.DESTROY, () => this.distruggi());
    scena.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.distruggi());
  }

  /** Lampo bianco: il colpo è andato a segno. */
  lampo(): void {
    this.lampoFino = this.scena.time.now + DURATA_LAMPO;
  }

  /** Un colore di stato, o null per tornare alla tinta normale. */
  evidenzia(colore: number | null): void {
    this.evidenza = colore;
  }

  private segui(): void {
    if (!this.immagine.active) return;
    const adesso = this.scena.time.now;
    const corpoFisico = this.corpo.body as Phaser.Physics.Arcade.Body | null;
    const vx = corpoFisico?.velocity.x ?? 0;
    const vy = corpoFisico?.velocity.y ?? 0;
    const inMovimento = Math.abs(vx) + Math.abs(vy) > 5;
    this.aSinistra = guardaASinistra(this.aSinistra, vx);
    this.immagine
      .setPosition(Math.round(this.corpo.x), Math.round(this.corpo.y - this.sollevamento + saltello(adesso, inMovimento)))
      .setFlipX(this.aSinistra)
      // Anche la scala segue il corpo: il nemico sconfitto "si gonfia" e svanisce.
      .setScale(this.scala * this.corpo.scaleX)
      .setAlpha(this.corpo.alpha * this.aspetto.alfa);
    this.applicaTinta(adesso);
  }

  private applicaTinta(adesso: number): void {
    // In Phaser 4 la tinta ha un "modo": MULTIPLY moltiplica i colori, FILL riempie la forma di un colore solo.
    if (adesso < this.lampoFino) {
      this.immagine.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      return;
    }
    this.immagine.setTintMode(Phaser.TintModes.MULTIPLY);
    if (this.evidenza !== null) this.immagine.setTint(this.evidenza);
    else if (this.aspetto.tinta !== 0xffffff) this.immagine.setTint(this.aspetto.tinta);
    else this.immagine.clearTint();
  }

  private distruggi(): void {
    this.scena.events.off(Phaser.Scenes.Events.POST_UPDATE, this.segui, this);
    if (this.immagine.active) this.immagine.destroy();
  }
}

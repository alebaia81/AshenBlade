// Una porta chiusa a chiave (fase 8a): un muro segreto con un requisito.
// Finché è chiusa è un corpo statico; con la chiave giusta si apre e la cella
// diventa passaggio, per sempre (la Partita ricorda le porte aperte).

import * as Phaser from 'phaser';
import type { Cella, Vettore } from '../systems/tipi';
import type { AspettoRisolto } from '../systems/sprite';
import { aggiungiImmagine } from '../scenes/grafica';


const LATO = 16;

export class Porta {
  readonly forma: Phaser.GameObjects.Rectangle;
  private readonly disegno: Phaser.GameObjects.Graphics | Phaser.GameObjects.Image;
  private _aperta: boolean;

  constructor(
    private readonly scena: Phaser.Scene,
    readonly cella: Cella,
    readonly posizione: Vettore,
    /** "mappa:colonna:riga". */
    readonly chiave: string,
    /** Id dell'oggetto che la apre. */
    readonly serveChiave: string,
    /** "il cancello della cripta", "la porta d'ossa"… */
    readonly nome: string,
    aspetto: 'legno' | 'cancello',
    aperta: boolean,
    /** Fase 9b: l'immagine della porta (null = disegno a forme). */
    immagine: AspettoRisolto | null = null,
  ) {
    this._aperta = aperta;
    const { x, y } = posizione;
    this.forma = scena.add.rectangle(x, y, LATO, LATO).setVisible(false);
    scena.physics.add.existing(this.forma, true);
    this.disegno = immagine ? aggiungiImmagine(scena, x, y, immagine).setDepth(2) : this.disegnaForme(x, y, aspetto);
    if (aperta) this.nascondi();
  }

  /** Il disegno delle fasi 8a–9a, se manca la pixel art. */
  private disegnaForme(x: number, y: number, aspetto: 'legno' | 'cancello'): Phaser.GameObjects.Graphics {
    const g = this.scena.add.graphics().setDepth(2);
    if (aspetto === 'cancello') {
      g.fillStyle(0x15151a, 1).fillRect(x - 8, y - 8, 16, 16);
      g.fillStyle(0x6a6a72, 1);
      for (const dx of [-6, -3, 0, 3, 6]) g.fillRect(x + dx - 0.6, y - 8, 1.2, 16);
      g.fillRect(x - 8, y - 5, 16, 1.2).fillRect(x - 8, y + 3, 16, 1.2);
    } else {
      // Porta di legno con borchie e una toppa: si capisce che serve una chiave.
      g.fillStyle(0x5a3a1e, 1).fillRect(x - 8, y - 8, 16, 16);
      g.lineStyle(0.8, 0x3a2410, 1).lineBetween(x - 3, y - 8, x - 3, y + 8).lineBetween(x + 3, y - 8, x + 3, y + 8);
      g.fillStyle(0xd8d0b8, 1).fillCircle(x - 6, y - 5, 1).fillCircle(x + 6, y - 5, 1).fillCircle(x - 6, y + 5, 1).fillCircle(x + 6, y + 5, 1);
    }
    g.fillStyle(0xb8862a, 1).fillRect(x - 1.5, y - 1, 3, 3); // la toppa
    return g;
  }

  get aperta(): boolean {
    return this._aperta;
  }

  apri(): void {
    if (this._aperta) return;
    this._aperta = true;
    (this.forma.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    this.scena.tweens.add({ targets: this.disegno, alpha: 0, duration: 400, onComplete: () => this.nascondi() });
  }

  private nascondi(): void {
    (this.forma.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    this.disegno.setVisible(false);
  }
}

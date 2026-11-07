// Una persona del villaggio: un corpo e una testa colorati, un'ombra e il nome
// sopra. Sta ferma (un corpo fisico statico, come i forzieri) e si "usa"
// cliccandola: l'eroe ci va e si apre il dialogo (vedi ScenaMondo).

import * as Phaser from 'phaser';
import type { Segno } from '../systems/quest';
import type { DefinizioneAbitante, Vettore } from '../systems/tipi';
import { colore } from './colori';
import type { AspettoRisolto } from '../systems/sprite';
import { aggiungiImmagine } from '../scenes/grafica';


export class Abitante {
  readonly forma: Phaser.GameObjects.Rectangle;
  private readonly disegno: Phaser.GameObjects.Graphics | Phaser.GameObjects.Image;
  /** "!" o "?" sopra il nome (fase 7). */
  private readonly segno: Phaser.GameObjects.Text;
  private _segno: Segno = null;

  constructor(
    scena: Phaser.Scene,
    readonly posizione: Vettore,
    readonly definizione: DefinizioneAbitante,
    /** Fase 9b: la figura in pixel art (null = il disegno a forme delle fasi 5–8). */
    aspetto: AspettoRisolto | null = null,
  ) {
    const { x, y } = posizione;
    // Il corpo fisico è invisibile: il disegno sta nel Graphics qui sotto.
    this.forma = scena.add.rectangle(x, y, 12, 12).setVisible(false);
    scena.physics.add.existing(this.forma, true);

    const ombra = scena.add.graphics().setDepth(8);
    ombra.fillStyle(0x000000, 0.25).fillEllipse(x, y + 6, 12, 4);
    if (aspetto) {
      this.disegno = aggiungiImmagine(scena, x, y - 1, aspetto).setDepth(9);
    } else {
      const g = scena.add.graphics().setDepth(9);
      g.fillStyle(colore(definizione.colore), 1).fillRoundedRect(x - 5, y - 2, 10, 9, 3); // vestito
      g.fillStyle(0xf0d2b0, 1).fillCircle(x, y - 5, 3.5); // testa
      this.disegno = g;
    }

    // Il nome sopra la testa. Il testo è disegnato a risoluzione ×3, come lo zoom
    // della telecamera, altrimenti verrebbe sgranato.
    scena.add
      .text(x, y - 11, definizione.nome, {
        fontFamily: 'sans-serif',
        fontSize: '5px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 1.5,
        resolution: 4,
      })
      .setOrigin(0.5, 1)
      .setDepth(9);

    this.segno = scena.add
      .text(x, y - 17, '', { fontFamily: 'sans-serif', fontSize: '10px', fontStyle: 'bold', color: '#ffd23f', stroke: '#000000', strokeThickness: 2, resolution: 4 })
      .setOrigin(0.5, 1)
      .setDepth(9);
    // Il segno saltella: si nota anche da lontano.
    scena.tweens.add({ targets: this.segno, y: y - 19, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Un piccolo movimento "da respiro", così si capisce che è una persona e non un oggetto.
    scena.tweens.add({ targets: this.disegno, y: this.disegno.y - 0.6, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  /** L'eroe si avvicina: la persona si accende un attimo (per le prove e per l'occhio). */
  get oggettoDisegnato(): Phaser.GameObjects.Graphics | Phaser.GameObjects.Image {
    return this.disegno;
  }

  /** "!" giallo: ha una quest per te. "?" giallo: torna qui. "?" grigio: quest in corso. */
  impostaSegno(segno: Segno): void {
    if (segno === this._segno) return;
    this._segno = segno;
    this.segno.setText(segno === '?attiva' ? '?' : (segno ?? '')).setColor(segno === '?attiva' ? '#b8b8b8' : '#ffd23f');
  }

  get segnoAttuale(): Segno {
    return this._segno;
  }
}

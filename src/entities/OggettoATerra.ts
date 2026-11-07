// Un oggetto caduto a terra (bottino o contenuto di un forziere): l'icona
// dell'oggetto che galleggia su e giù, così si nota. Si raccoglie passandoci sopra.

import type * as Phaser from 'phaser';
import type { DefinizioneOggetto } from '../systems/oggetti';
import type { Vettore } from '../systems/tipi';
import { disegnaOggetto } from '../scenes/interfaccia/iconeOggetti';

/** Lato dell'icona nel mondo, in pixel di mondo (con lo zoom ×3 diventano 30 sullo schermo). */
const LATO = 10;

export class OggettoATerra {
  readonly disegno: Phaser.GameObjects.Graphics;
  private _quantita: number;
  /**
   * Un oggetto appena gettato dallo zaino sarebbe subito raccolto di nuovo,
   * perché l'eroe ci sta sopra: resta "bloccato" finché l'eroe non si allontana.
   */
  bloccato: boolean;

  constructor(
    scena: Phaser.Scene,
    readonly definizione: DefinizioneOggetto,
    quantita: number,
    readonly posizione: Vettore,
    bloccato = false,
  ) {
    this._quantita = quantita;
    this.bloccato = bloccato;
    this.disegno = scena.add.graphics({ x: posizione.x, y: posizione.y }).setDepth(4);
    // Un'ombra sotto, poi l'icona.
    this.disegno.fillStyle(0x000000, 0.25).fillEllipse(0, LATO / 2, LATO * 0.8, LATO * 0.3);
    disegnaOggetto(this.disegno, definizione, LATO);
    // Su e giù all'infinito: yoyo = torna indietro, repeat -1 = per sempre.
    scena.tweens.add({ targets: this.disegno, y: posizione.y - 2, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  get quantita(): number {
    return this._quantita;
  }

  /** Raccolto solo in parte (zaino quasi pieno): ne restano a terra meno. */
  lascia(rimasti: number): void {
    this._quantita = rimasti;
  }

  distruggi(): void {
    this.disegno.destroy();
  }
}

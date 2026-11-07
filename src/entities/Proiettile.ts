// Un proiettile nel mondo: un cerchio colorato che segue lo stato calcolato
// da systems/proiettili.ts. Ha un ciclo di vita breve: nasce, vola, colpisce
// qualcosa (o arriva a fine gittata) e viene distrutto.

import type * as Phaser from 'phaser';
import { avanza, creaProiettile, finito, type StatoProiettile } from '../systems/proiettili';
import type { Vettore } from '../systems/tipi';
import { colore } from './colori';

export class Proiettile {
  readonly forma: Phaser.GameObjects.Arc;
  private stato: StatoProiettile;
  private _attivo = true;

  constructor(
    scena: Phaser.Scene,
    da: Vettore,
    direzione: Vettore,
    velocita: number,
    gittata: number,
    readonly raggio: number,
    coloreProiettile: string,
  ) {
    this.stato = creaProiettile(da, direzione, velocita, gittata);
    this.forma = scena.add.circle(da.x, da.y, raggio, colore(coloreProiettile)).setDepth(9);
    this.forma.setStrokeStyle(1, 0xffffff, 0.8);
  }

  /** Muove il proiettile; restituisce false se ha esaurito la gittata. */
  avanza(dtMs: number): boolean {
    this.stato = avanza(this.stato, dtMs);
    this.forma.setPosition(this.stato.posizione.x, this.stato.posizione.y);
    return !finito(this.stato);
  }

  distruggi(): void {
    this._attivo = false;
    this.forma.destroy();
  }

  get posizione(): Vettore {
    return this.stato.posizione;
  }

  get attivo(): boolean {
    return this._attivo;
  }
}

// Un forziere: un corpo fisico che non si attraversa, chiuso o aperto.
// Si apre cliccandolo da vicino (vedi GuidaEroe e ScenaMondo.interagibileSotto).

import * as Phaser from 'phaser';
import type { Vettore } from '../systems/tipi';
import type { AspettoRisolto } from '../systems/sprite';
import { aggiungiImmagine } from '../scenes/grafica';

/** Fase 9b: le tre immagini di un forziere. */
export interface AspettiForziere {
  chiuso: AspettoRisolto;
  aperto: AspettoRisolto;
  /** Chiuso a chiave: un forziere rinforzato. */
  rinforzato: AspettoRisolto;
}

export class Forziere {
  readonly forma: Phaser.GameObjects.Rectangle;
  private readonly coperchio: Phaser.GameObjects.Graphics;
  private _aperto: boolean;
  private immagine: Phaser.GameObjects.Image | null = null;

  constructor(
    scena: Phaser.Scene,
    readonly posizione: Vettore,
    /** Identifica il forziere nella Partita: "mappa:colonna:riga". */
    readonly chiave: string,
    readonly contenuto: readonly string[],
    aperto: boolean,
    /** Monete dentro, oltre agli oggetti. */
    readonly monete = 0,
    /** Fase 8a: chiuso a chiave (id della chiave piccola). Volpe lo apre comunque. */
    readonly chiusoCon?: string,
    private readonly aspetti: AspettiForziere | null = null,
  ) {
    this._aperto = aperto;
    this.forma = scena.add.rectangle(posizione.x, posizione.y + 1, 14, 10, 0x8a5a2b).setDepth(4);
    this.forma.setStrokeStyle(1, 0x3a2410);
    scena.physics.add.existing(this.forma, true); // true = corpo statico: non si muove mai
    this.coperchio = scena.add.graphics().setDepth(5);
    if (aspetti) {
      // Con la pixel art il rettangolo resta solo come corpo fisico (e per il bordo del fiuto di Volpe).
      this.forma.setFillStyle(0x8a5a2b, 0).setStrokeStyle();
      this.immagine = scena.add.image(posizione.x, posizione.y, aspetti.chiuso.chiave).setDepth(4);
    }
    this.disegna();
  }

  get aperto(): boolean {
    return this._aperto;
  }

  /** Il fiuto di Volpe: un contorno dorato pulsante sui forzieri ancora chiusi. */
  segnala(visibile: boolean, adesso: number): void {
    if (!visibile || this._aperto) {
      if (this.immagine) this.forma.setStrokeStyle();
      else this.forma.setStrokeStyle(1, 0x3a2410);
      return;
    }
    this.forma.setStrokeStyle(1.5, 0xffe680, 0.5 + 0.5 * Math.sin(adesso / 150));
  }

  apri(): void {
    this._aperto = true;
    this.disegna();
  }

  private disegna(): void {
    if (this.immagine && this.aspetti) {
      const a = this._aperto ? this.aspetti.aperto : this.chiusoCon ? this.aspetti.rinforzato : this.aspetti.chiuso;
      this.immagine.destroy();
      this.immagine = aggiungiImmagine(this.coperchio.scene, this.posizione.x, this.posizione.y, a).setDepth(4);
      return;
    }
    const { x, y } = this.posizione;
    const g = this.coperchio.clear();
    if (this._aperto) {
      // Coperchio ribaltato all'indietro e interno scuro: si vede subito che è vuoto.
      g.fillStyle(0x2a1a0a, 1).fillRect(x - 6, y - 2, 12, 3);
      g.fillStyle(0xa06a35, 1).fillRect(x - 7, y - 8, 14, 4);
    } else {
      g.fillStyle(0xa06a35, 1).fillRect(x - 7, y - 5, 14, 5); // coperchio
      g.fillStyle(0xd4a72c, 1).fillRect(x - 1, y - 2, 2, 3); // serratura dorata
      if (this.chiusoCon) {
        // Chiuso a chiave: un lucchetto di ferro davanti, con l'archetto.
        g.lineStyle(1, 0x9a9aa0, 1).strokeCircle(x, y + 1, 1.8);
        g.fillStyle(0x6a6a72, 1).fillRect(x - 2.5, y + 1.5, 5, 4);
      }
    }
  }
}

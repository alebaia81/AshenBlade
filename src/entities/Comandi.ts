// La tastiera e i controlli touch: scorciatoie e comandi (design §13).
// Il comando principale è il mouse/touch, gestito da GuidaEroe, che mette insieme le due cose.

import * as Phaser from 'phaser';
import type { TastiPremuti } from '../systems/tipi';

type Tasto = Phaser.Input.Keyboard.Key;

export interface Tastiera {
  movimento: TastiPremuti;
  /** Premuto proprio in questo fotogramma (non tenuto premuto). */
  attacca: boolean;
  schiva: boolean;
  /** Force Stand: Shift tenuto premuto per mirare e attaccare da fermi. */
  fermo: boolean;
}

export class Comandi {
  private readonly frecce: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private readonly tasti: { W: Tasto; A: Tasto; S: Tasto; D: Tasto; J: Tasto; SPACE: Tasto; SHIFT: Tasto } | null = null;

  public static readonly statoTouch = {
    movimento: { su: false, giu: false, sinistra: false, destra: false },
    attacca: false,
    attaccaTenuto: false,
    schiva: false,
    fermo: false,
  };

  public static segnalaAttaccoTouch(tenuto = false): void {
    Comandi.statoTouch.attacca = true;
    Comandi.statoTouch.attaccaTenuto = tenuto;
  }

  public static rilasciaAttaccoTouch(): void {
    Comandi.statoTouch.attaccaTenuto = false;
  }

  public static consumaAttaccoTouch(): boolean {
    const val = Comandi.statoTouch.attacca || Comandi.statoTouch.attaccaTenuto;
    Comandi.statoTouch.attacca = false;
    return val;
  }

  public static segnalaSchivataTouch(): void {
    Comandi.statoTouch.schiva = true;
  }

  public static consumaSchivataTouch(): boolean {
    const val = Comandi.statoTouch.schiva;
    Comandi.statoTouch.schiva = false;
    return val;
  }

  public static impostaMovimentoTouch(su: boolean, giu: boolean, sinistra: boolean, destra: boolean): void {
    Comandi.statoTouch.movimento.su = su;
    Comandi.statoTouch.movimento.giu = giu;
    Comandi.statoTouch.movimento.sinistra = sinistra;
    Comandi.statoTouch.movimento.destra = destra;
  }

  constructor(scena: Phaser.Scene) {
    const tastiera = scena.input.keyboard;
    if (tastiera) {
      this.frecce = tastiera.createCursorKeys();
      this.tasti = tastiera.addKeys('W,A,S,D,J,SPACE,SHIFT') as typeof this.tasti;
    }
  }

  /** Stato della tastiera/touch in questo istante. Si chiama una volta per fotogramma. */
  leggi(): Tastiera {
    const W = this.tasti?.W;
    const A = this.tasti?.A;
    const S = this.tasti?.S;
    const D = this.tasti?.D;
    const J = this.tasti?.J;
    const SPACE = this.tasti?.SPACE;
    const SHIFT = this.tasti?.SHIFT;

    const daTastiera = {
      su: Boolean(this.frecce?.up.isDown || W?.isDown),
      giu: Boolean(this.frecce?.down.isDown || S?.isDown),
      sinistra: Boolean(this.frecce?.left.isDown || A?.isDown),
      destra: Boolean(this.frecce?.right.isDown || D?.isDown),
    };

    const touch = Comandi.statoTouch.movimento;

    return {
      movimento: {
        su: daTastiera.su || touch.su,
        giu: daTastiera.giu || touch.giu,
        sinistra: daTastiera.sinistra || touch.sinistra,
        destra: daTastiera.destra || touch.destra,
      },
      attacca: (J ? Phaser.Input.Keyboard.JustDown(J) : false) || Comandi.consumaAttaccoTouch(),
      schiva: (SPACE ? Phaser.Input.Keyboard.JustDown(SPACE) : false) || Comandi.consumaSchivataTouch(),
      fermo: Boolean(SHIFT?.isDown || this.frecce?.shift.isDown) || Comandi.statoTouch.fermo,
    };
  }
}

// La tastiera: scorciatoie facoltative (design §13). Il comando principale è il
// mouse, gestito da GuidaEroe, che mette insieme le due cose.

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
  private readonly frecce: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly tasti: { W: Tasto; A: Tasto; S: Tasto; D: Tasto; J: Tasto; SPACE: Tasto; SHIFT: Tasto };

  constructor(scena: Phaser.Scene) {
    const tastiera = scena.input.keyboard;
    if (!tastiera) throw new Error('Tastiera non disponibile in questo browser');
    this.frecce = tastiera.createCursorKeys();
    this.tasti = tastiera.addKeys('W,A,S,D,J,SPACE,SHIFT') as typeof this.tasti;
  }

  /** Stato della tastiera in questo istante. Si chiama una volta per fotogramma. */
  leggi(): Tastiera {
    const { W, A, S, D, J, SPACE, SHIFT } = this.tasti;
    return {
      movimento: {
        su: this.frecce.up.isDown || W.isDown,
        giu: this.frecce.down.isDown || S.isDown,
        sinistra: this.frecce.left.isDown || A.isDown,
        destra: this.frecce.right.isDown || D.isDown,
      },
      // JustDown è vero solo nel fotogramma in cui il tasto viene premuto:
      // tenendo premuto J non si attacca a raffica, serve premerlo di nuovo.
      attacca: Phaser.Input.Keyboard.JustDown(J),
      schiva: Phaser.Input.Keyboard.JustDown(SPACE),
      fermo: SHIFT.isDown || this.frecce.shift.isDown,
    };
  }
}

// Il menu di pausa (fase 9a): Esc durante il gioco "libero", oppure l'icona.
// Il mondo è fermo finché il pannello è aperto, come con lo zaino.

import * as Phaser from 'phaser';
import {
  ALTEZZA_SCHERMO,
  LARGHEZZA_SCHERMO,
  SCENA_INTERFACCIA,
  SCENA_MENU,
  SCENA_MONDO,
  SCENA_OPZIONI,
  SCENA_PAUSA,
  SCENA_SVILUPPATORE,
} from '../costanti';
import { chiediConferma } from './interfaccia/Conferma';
import { Pulsante } from './interfaccia/Pulsante';
import { STILE_TESTO, STILE_TITOLO } from './interfaccia/testi';
import type { ScenaMondo } from './ScenaMondo';

/** Posizioni dei pulsanti (le usano le prove nel browser). */
export const PAUSA = { riprendi: 200, salva: 256, opzioni: 312, menu: 368 };

export class ScenaPausa extends Phaser.Scene {
  private esito!: Phaser.GameObjects.Text;
  private conferma: Phaser.GameObjects.Container | null = null;

  constructor() {
    super(SCENA_PAUSA);
  }

  create(): void {
    const cx = LARGHEZZA_SCHERMO / 2;
    const cy = ALTEZZA_SCHERMO / 2;
    this.conferma = null;
    this.add.rectangle(cx, cy, LARGHEZZA_SCHERMO, ALTEZZA_SCHERMO, 0x000000, 0.55).setInteractive();
    this.add.rectangle(cx, cy, 380, 380, 0x1b2230, 0.98).setStrokeStyle(2, 0x9aa7b8);
    this.add.text(cx, 126, 'Pausa', { ...STILE_TITOLO, fontSize: '26px' }).setOrigin(0.5);
    const voce = (y: number, testo: string, alClic: () => void) => new Pulsante(this, cx, y, { larghezza: 260, altezza: 44, testo, dimensioneTesto: 17, alClic });
    voce(PAUSA.riprendi, 'Riprendi (Esc)', () => this.riprendi());
    voce(PAUSA.salva, 'Salva (F2)', () => this.salva());
    voce(PAUSA.opzioni, 'Opzioni', () => this.apriOpzioni());
    voce(PAUSA.menu, 'Torna al menu', () => this.chiediMenu());
    this.esito = this.add.text(cx, 418, '', { ...STILE_TESTO, fontSize: '14px', color: '#8fe08f', align: 'center' }).setOrigin(0.5);
    this.input.keyboard?.on('keydown-ESC', () => {
      // Con la domanda aperta, Esc la chiude; altrimenti si torna a giocare.
      if (this.conferma?.active) {
        this.conferma.destroy();
        this.conferma = null;
      } else {
        this.riprendi();
      }
    });
    // F2 qui non serve: lo ascolta l'interfaccia, che resta attiva anche durante la pausa.
  }

  private get mondo(): ScenaMondo {
    return this.scene.get(SCENA_MONDO) as ScenaMondo;
  }

  private riprendi(): void {
    this.scene.stop();
    this.scene.resume(SCENA_MONDO);
  }

  private salva(): void {
    const esito = this.mondo.salvaPartita();
    this.esito.setText(esito.messaggio).setColor(esito.ok ? '#8fe08f' : '#ffb0a0');
  }

  private apriOpzioni(): void {
    this.scene.launch(SCENA_OPZIONI, { torna: SCENA_PAUSA });
    this.scene.pause();
  }

  private chiediMenu(): void {
    this.conferma = chiediConferma(this, 'Tornare al menu iniziale?\nCiò che hai fatto dopo l\'ultimo salvataggio andrà perso.', 'Torna al menu', () => {
      // Si fermano tutte le scene del gioco; il menu riparte da zero.
      for (const scena of [SCENA_SVILUPPATORE, SCENA_INTERFACCIA, SCENA_MONDO]) this.scene.stop(scena);
      this.scene.start(SCENA_MENU);
    });
  }
}

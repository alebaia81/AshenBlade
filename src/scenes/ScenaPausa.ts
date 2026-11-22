// Il menu di gioco / pausa: aperto dall'icona hamburger (☰) o da Esc.
// Raggruppa tutte le funzioni secondarie: scheda, registro quest, salvataggio, opzioni, sviluppatore, menu principale.

import * as Phaser from 'phaser';
import {
  ALTEZZA_SCHERMO,
  SCENA_INTERFACCIA,
  SCENA_MENU,
  SCENA_MONDO,
  SCENA_OPZIONI,
  SCENA_PAUSA,
  SCENA_REGISTRO,
  SCENA_SCHEDA,
  SCENA_SVILUPPATORE,
} from '../costanti';
import { chiediConferma } from './interfaccia/Conferma';
import { Pulsante } from './interfaccia/Pulsante';
import { STILE_TESTO, STILE_TITOLO } from './interfaccia/testi';
import type { ScenaMondo } from './ScenaMondo';
import { leggiPartita } from './statoCondiviso';

/** Posizioni dei pulsanti nel menu di gioco. */
export const PAUSA = {
  riprendi: 122,
  scheda: 170,
  registro: 218,
  salva: 266,
  opzioni: 314,
  sviluppatore: 362,
  menu: 410,
};

export class ScenaPausa extends Phaser.Scene {
  private esito!: Phaser.GameObjects.Text;
  private conferma: Phaser.GameObjects.Container | null = null;

  constructor() {
    super(SCENA_PAUSA);
  }

  create(): void {
    const cx = this.scale.width / 2;
    const cy = ALTEZZA_SCHERMO / 2;
    this.conferma = null;
    this.add.rectangle(cx, cy, this.scale.width, ALTEZZA_SCHERMO, 0x000000, 0.55).setInteractive();
    this.add.rectangle(cx, cy, 380, 460, 0x1b2230, 0.98).setStrokeStyle(2, 0x9aa7b8);
    this.add.text(cx, 74, 'Menu di gioco', { ...STILE_TITOLO, fontSize: '24px' }).setOrigin(0.5);

    const voce = (y: number, testo: string, alClic: () => void) =>
      new Pulsante(this, cx, y, { larghezza: 300, altezza: 38, testo, dimensioneTesto: 16, alClic });

    const partita = leggiPartita(this);
    const testoScheda = partita.puntiDaAssegnare > 0
      ? `Scheda personaggio (${partita.puntiDaAssegnare} pt)`
      : 'Scheda del personaggio (C)';

    voce(PAUSA.riprendi, 'Riprendi (Esc)', () => this.riprendi());
    voce(PAUSA.scheda, testoScheda, () => this.apriScheda());
    voce(PAUSA.registro, 'Registro delle quest (L)', () => this.apriRegistro());
    voce(PAUSA.salva, 'Salva (F2)', () => this.salva());
    voce(PAUSA.opzioni, 'Opzioni', () => this.apriOpzioni());
    voce(PAUSA.sviluppatore, 'Modalità sviluppatore (F8)', () => this.toggleSviluppatore());
    voce(PAUSA.menu, 'Torna al menu', () => this.chiediMenu());

    this.esito = this.add.text(cx, 460, '', { ...STILE_TESTO, fontSize: '13px', color: '#8fe08f', align: 'center' }).setOrigin(0.5);

    this.input.keyboard?.on('keydown-ESC', () => {
      // Con la domanda aperta, Esc la chiude; altrimenti si torna a giocare.
      if (this.conferma?.active) {
        this.conferma.destroy();
        this.conferma = null;
      } else {
        this.riprendi();
      }
    });
    this.input.keyboard?.on('keydown-C', () => this.apriScheda());
    this.input.keyboard?.on('keydown-L', () => this.apriRegistro());
    this.input.keyboard?.on('keydown-F8', () => this.toggleSviluppatore());
  }

  private get mondo(): ScenaMondo {
    return this.scene.get(SCENA_MONDO) as ScenaMondo;
  }

  private riprendi(): void {
    this.scene.stop();
    this.scene.resume(SCENA_MONDO);
  }

  private apriScheda(): void {
    this.scene.stop();
    this.scene.launch(SCENA_SCHEDA);
  }

  private apriRegistro(): void {
    this.scene.stop();
    this.scene.launch(SCENA_REGISTRO);
  }

  private toggleSviluppatore(): void {
    this.scene.stop();
    this.scene.resume(SCENA_MONDO);
    this.mondo.alternaSviluppatore();
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

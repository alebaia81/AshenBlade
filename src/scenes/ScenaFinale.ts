// Il finale della storia (fase 8c): poche pagine di testo su fondo nero, una
// alla volta, dopo la sconfitta del Negromante. I testi stanno in
// data/finale.json, come i dialoghi. Alla fine si torna a giocare: il mondo
// resta aperto per le quest rimaste (design §3).

import * as Phaser from 'phaser';
import { ALTEZZA_SCHERMO, LARGHEZZA_SCHERMO, SCENA_FINALE, SCENA_MONDO } from '../costanti';
import type { DatiGioco } from '../data/caricaDati';
import { STILE_TESTO } from './interfaccia/testi';

export class ScenaFinale extends Phaser.Scene {
  private pagina = 0;
  private testo!: Phaser.GameObjects.Text;
  private indicazione!: Phaser.GameObjects.Text;

  constructor(private readonly dati: DatiGioco) {
    super(SCENA_FINALE);
  }

  create(): void {
    this.pagina = 0;
    const cx = LARGHEZZA_SCHERMO / 2;
    const cy = ALTEZZA_SCHERMO / 2;
    this.add.rectangle(cx, cy, LARGHEZZA_SCHERMO, ALTEZZA_SCHERMO, 0x05050a, 1).setInteractive().on('pointerdown', () => this.avanti());
    this.testo = this.add
      .text(cx, cy - 20, '', { ...STILE_TESTO, fontSize: '22px', color: '#f0e8d8', align: 'center', wordWrap: { width: 640 }, lineSpacing: 8 })
      .setOrigin(0.5);
    this.indicazione = this.add.text(cx, ALTEZZA_SCHERMO - 40, 'Clic o spazio per continuare', { ...STILE_TESTO, fontSize: '13px', color: '#8a8a9a' }).setOrigin(0.5);
    this.input.keyboard?.on('keydown-SPACE', () => this.avanti());
    this.input.keyboard?.on('keydown-ENTER', () => this.avanti());
    this.cameras.main.fadeIn(800);
    this.mostra();
  }

  /** Per le prove: a che pagina siamo e quante sono. */
  get stato(): { pagina: number; totale: number; testo: string } {
    return { pagina: this.pagina, totale: this.dati.finale.length, testo: this.testo.text };
  }

  private mostra(): void {
    this.testo.setText(this.dati.finale[this.pagina] ?? '').setAlpha(0);
    this.tweens.add({ targets: this.testo, alpha: 1, duration: 600 });
    this.indicazione.setText(this.pagina === this.dati.finale.length - 1 ? 'Clic per tornare a giocare' : 'Clic o spazio per continuare');
  }

  private avanti(): void {
    this.pagina++;
    if (this.pagina < this.dati.finale.length) {
      this.mostra();
      return;
    }
    this.scene.stop();
    this.scene.resume(SCENA_MONDO);
  }
}

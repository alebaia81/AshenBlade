// Il testo introduttivo (design §3): poche pagine su fondo scuro prima della
// creazione del personaggio. Come il finale, i testi stanno nei dati
// (data/intro.json). Si può saltare in qualunque momento.

import * as Phaser from 'phaser';
import { ALTEZZA_SCHERMO, LARGHEZZA_SCHERMO, SCENA_CREAZIONE, SCENA_INTRO } from '../costanti';
import type { DatiGioco } from '../data/caricaDati';
import { Pulsante } from './interfaccia/Pulsante';
import { STILE_TESTO, STILE_TITOLO } from './interfaccia/testi';

export class ScenaIntro extends Phaser.Scene {
  private pagina = 0;
  private testo!: Phaser.GameObjects.Text;
  private indicazione!: Phaser.GameObjects.Text;
  /** Evita di avviare due volte la creazione (clic ripetuti durante la dissolvenza). */
  private finita = false;

  constructor(private readonly dati: DatiGioco) {
    super(SCENA_INTRO);
  }

  create(): void {
    this.pagina = 0;
    this.finita = false;
    const cx = LARGHEZZA_SCHERMO / 2;
    const cy = ALTEZZA_SCHERMO / 2;
    this.add.rectangle(cx, cy, LARGHEZZA_SCHERMO, ALTEZZA_SCHERMO, 0x07090f, 1).setInteractive().on('pointerdown', () => this.avanti());
    this.add.text(cx, 54, 'Ashen Blade', { ...STILE_TITOLO, fontSize: '34px', color: '#f0e6c8' }).setOrigin(0.5);
    this.add.text(cx, 88, "L'Ombra della Quercia", { ...STILE_TITOLO, fontSize: '18px', color: '#d8c290' }).setOrigin(0.5);
    this.add.graphics().lineStyle(1, 0x6e5d3e, 0.7).lineBetween(cx - 160, 112, cx + 160, 112);
    this.testo = this.add
      .text(cx, cy + 16, '', { ...STILE_TESTO, fontSize: '22px', color: '#f0e8d8', align: 'center', wordWrap: { width: 680 }, lineSpacing: 8 })
      .setOrigin(0.5);
    this.indicazione = this.add.text(cx, ALTEZZA_SCHERMO - 40, '', { ...STILE_TESTO, fontSize: '13px', color: '#8a8a9a' }).setOrigin(0.5);
    new Pulsante(this, LARGHEZZA_SCHERMO - 80, 34, { larghezza: 130, altezza: 36, testo: 'Salta (Esc)', dimensioneTesto: 14, alClic: () => this.fine() });
    this.input.keyboard?.on('keydown-SPACE', () => this.avanti());
    this.input.keyboard?.on('keydown-ENTER', () => this.avanti());
    this.input.keyboard?.on('keydown-ESC', () => this.fine());
    this.cameras.main.fadeIn(600);
    this.mostra();
  }

  /** Per le prove nel browser. */
  get stato(): { pagina: number; totale: number } {
    return { pagina: this.pagina, totale: this.dati.intro.length };
  }

  private mostra(): void {
    this.testo.setText(this.dati.intro[this.pagina] ?? '').setAlpha(0);
    this.tweens.add({ targets: this.testo, alpha: 1, duration: 600 });
    const ultima = this.pagina === this.dati.intro.length - 1;
    this.indicazione.setText(ultima ? 'Clic per creare il tuo personaggio' : 'Clic o spazio per continuare');
  }

  private avanti(): void {
    if (this.finita) return;
    this.pagina++;
    if (this.pagina < this.dati.intro.length) this.mostra();
    else this.fine();
  }

  private fine(): void {
    if (this.finita) return;
    this.finita = true;
    this.cameras.main.fadeOut(300);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(SCENA_CREAZIONE));
  }
}

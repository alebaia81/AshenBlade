// La mappa del tesoro (fase 7b): una pergamena con il disegno di una zona e
// una X rossa. Il disegno NON è un'immagine fatta a mano: è la mappa vera del
// gioco (la stessa griglia di caratteri), ridisegnata in color seppia. Se un
// giorno spostiamo il forziere nei dati, la X si sposta da sola.
// Si apre sopra lo zaino ("Usa" sulla mappa); si chiude con un clic o con Esc.

import * as Phaser from 'phaser';
import { ALTEZZA_SCHERMO, LARGHEZZA_SCHERMO, SCENA_MAPPA_TESORO } from '../costanti';
import type { DatiGioco } from '../data/caricaDati';
import { èCalpestabile, voceIn } from '../systems/mappa';
import { STILE_TESTO, STILE_TITOLO } from './interfaccia/testi';

const AREA = { larghezza: 520, altezza: 330 };

export interface DatiMappaTesoro {
  /** L'oggetto "mappa" usato: da lui si risale alla quest e al forziere. */
  oggetto: string;
}

export class ScenaMappaTesoro extends Phaser.Scene {
  constructor(private readonly dati: DatiGioco) {
    super(SCENA_MAPPA_TESORO);
  }

  create({ oggetto }: DatiMappaTesoro): void {
    const cx = LARGHEZZA_SCHERMO / 2;
    const cy = ALTEZZA_SCHERMO / 2;
    const def = this.dati.oggetti[oggetto];
    const effetto = def?.effetto;
    const quest = effetto?.tipo === 'mappa' ? this.dati.quest[effetto.quest] : undefined;
    const trova = quest?.passi.map((p) => p.obiettivo).find((o) => o.tipo === 'trova');
    const [idMappa, col, riga] = trova?.tipo === 'trova' ? trova.forziere.split(':') : [];
    const mappa = idMappa ? this.dati.mappe[idMappa] : undefined;

    // Velo e pergamena: tutto lo schermo è cliccabile per chiudere.
    this.add.rectangle(cx, cy, LARGHEZZA_SCHERMO, ALTEZZA_SCHERMO, 0x000000, 0.6).setInteractive().on('pointerdown', () => this.chiudi());
    this.add.rectangle(cx, cy, AREA.larghezza + 80, AREA.altezza + 150, 0xe8d9b0).setStrokeStyle(4, 0x8a6a3a);
    this.add.text(cx, cy - AREA.altezza / 2 - 52, def?.nome ?? 'Mappa', { ...STILE_TITOLO, fontSize: '22px', color: '#4a3018' }).setOrigin(0.5);

    if (mappa) {
      // Ogni cella diventa un quadratino: le zone percorribili chiare, il resto scuro.
      const lato = Math.min(AREA.larghezza / mappa.larghezza, AREA.altezza / mappa.altezza);
      const x0 = cx - (mappa.larghezza * lato) / 2;
      const y0 = cy - (mappa.altezza * lato) / 2 + 6;
      const g = this.add.graphics();
      for (let r = 0; r < mappa.altezza; r++) {
        for (let c = 0; c < mappa.larghezza; c++) {
          const voce = voceIn(mappa, c, r);
          // Il muro segreto è disegnato come un muro qualsiasi: la mappa non svela tutto.
          const chiaro = èCalpestabile(mappa, c, r) || voce?.tipo === 'forziere';
          g.fillStyle(chiaro ? 0xd8c290 : 0x8a6a42, 1).fillRect(x0 + c * lato, y0 + r * lato, lato + 0.5, lato + 0.5);
        }
      }
      // La X rossa sul forziere.
      const x = x0 + (Number(col) + 0.5) * lato;
      const y = y0 + (Number(riga) + 0.5) * lato;
      g.lineStyle(4, 0xb02a2a, 1).lineBetween(x - 9, y - 9, x + 9, y + 9).lineBetween(x + 9, y - 9, x - 9, y + 9);
      this.add.text(cx, y0 - 4, mappa.nome, { ...STILE_TESTO, fontSize: '13px', color: '#4a3018', fontStyle: 'italic' }).setOrigin(0.5, 1);
    }
    this.add
      .text(cx, cy + AREA.altezza / 2 + 30, def?.descrizione ?? '', { ...STILE_TESTO, fontSize: '14px', color: '#4a3018', align: 'center', wordWrap: { width: AREA.larghezza } })
      .setOrigin(0.5, 0);
    this.add.text(cx, cy + AREA.altezza / 2 + 92, 'Clic o Esc per chiudere', { ...STILE_TESTO, fontSize: '12px', color: '#7a5a3a' }).setOrigin(0.5);
    this.input.keyboard?.on('keydown-ESC', () => this.chiudi());
  }

  private chiudi(): void {
    this.scene.stop();
  }
}

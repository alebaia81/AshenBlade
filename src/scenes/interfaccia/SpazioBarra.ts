// Un quadrato della barra in basso: icona, tasto (in alto a sinistra),
// quantità (in basso a destra), velo della ricarica e suggerimento.
// A differenza di Pulsante, qui l'icona e i testi cambiano mentre si gioca
// (pozioni che finiscono, arma secondaria cambiata): tutto si ridisegna.

import * as Phaser from 'phaser';
import type { DisegnaIcona } from './icone';

export const LATO_SPAZIO = 44;
const COLORE = 0x2c3440;
const COLORE_SOPRA = 0x3e4a5c;
const BORDO = 0x9aa7b8;
/** Giallo: mirino attivo. Verde: l'arma che hai in mano. */
const BORDI_EVIDENZIATI = { mira: 0xffd23f, inMano: 0x5fd35f } as const;

export class SpazioBarra extends Phaser.GameObjects.Container {
  private readonly sfondo: Phaser.GameObjects.Rectangle;
  private readonly icona: Phaser.GameObjects.Graphics;
  private readonly quantita: Phaser.GameObjects.Text;
  private readonly vela: Phaser.GameObjects.Rectangle;
  private readonly suggerimento: Phaser.GameObjects.Text;
  /** Ultima icona disegnata: si ridisegna solo quando cambia (non 60 volte al secondo). */
  private chiaveIcona = '';
  private evidenziato: keyof typeof BORDI_EVIDENZIATI | null = null;

  constructor(scena: Phaser.Scene, x: number, y: number, tasto: string, alClic: () => void) {
    super(scena, x, y);
    const mezzo = LATO_SPAZIO / 2;
    this.sfondo = scena.add.rectangle(0, 0, LATO_SPAZIO, LATO_SPAZIO, COLORE).setStrokeStyle(2, BORDO);
    this.icona = scena.add.graphics();
    this.vela = scena.add.rectangle(-mezzo, -mezzo, LATO_SPAZIO, 0, 0x000000, 0.6).setOrigin(0, 0);
    const stile = { fontFamily: 'sans-serif', color: '#ffffff', stroke: '#000000', strokeThickness: 3 };
    const testoTasto = scena.add.text(-mezzo + 3, -mezzo + 1, tasto, { ...stile, fontSize: '11px', fontStyle: 'bold' });
    this.quantita = scena.add.text(mezzo - 3, mezzo - 1, '', { ...stile, fontSize: '12px', fontStyle: 'bold' }).setOrigin(1, 1);
    this.add([this.sfondo, this.icona, this.vela, testoTasto, this.quantita]);

    // Il suggerimento sta FUORI dal container, sopra la barra.
    this.suggerimento = scena.add
      .text(x, y - mezzo - 8, '', {
        fontFamily: 'sans-serif',
        fontSize: '13px',
        color: '#ffffff',
        backgroundColor: '#000000cc',
        padding: { x: 6, y: 3 },
        align: 'center',
      })
      .setOrigin(0.5, 1)
      .setDepth(100)
      .setVisible(false);

    this.sfondo.setInteractive({ useHandCursor: true });
    this.sfondo.on('pointerover', () => {
      this.sfondo.setFillStyle(COLORE_SOPRA);
      this.suggerimento.setVisible(this.suggerimento.text !== '');
    });
    this.sfondo.on('pointerout', () => {
      this.sfondo.setFillStyle(COLORE);
      this.suggerimento.setVisible(false);
    });
    this.sfondo.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.leftButtonDown()) alClic();
    });
    scena.add.existing(this);
  }

  /** "chiave" identifica il disegno: se non cambia, l'icona non viene ridisegnata. */
  impostaIcona(chiave: string, disegna: DisegnaIcona | null): this {
    if (chiave === this.chiaveIcona) return this;
    this.chiaveIcona = chiave;
    this.icona.clear();
    disegna?.(this.icona, LATO_SPAZIO * 0.8);
    return this;
  }

  impostaQuantita(testo: string): this {
    if (this.quantita.text !== testo) this.quantita.setText(testo);
    return this;
  }

  /** 1 = appena usato (tutto coperto), 0 = pronto. */
  impostaRicarica(frazione: number): this {
    this.vela.height = LATO_SPAZIO * Math.min(1, Math.max(0, frazione));
    return this;
  }

  impostaEvidenziato(tipo: keyof typeof BORDI_EVIDENZIATI | null): this {
    if (tipo === this.evidenziato) return this;
    this.evidenziato = tipo;
    this.sfondo.setStrokeStyle(tipo ? 3 : 2, tipo ? BORDI_EVIDENZIATI[tipo] : BORDO);
    return this;
  }

  impostaSuggerimento(testo: string): this {
    if (this.suggerimento.text !== testo) this.suggerimento.setText(testo);
    return this;
  }

  /** Spento: si vede in trasparenza (pozioni finite, nessuna arma secondaria). */
  impostaSpento(spento: boolean): this {
    this.setAlpha(spento ? 0.45 : 1);
    return this;
  }
}

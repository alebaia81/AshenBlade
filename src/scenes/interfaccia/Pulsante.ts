// Un pulsante riutilizzabile: rettangolo + testo (o icona), con stato "sopra"
// (hover), attivo/disattivo e selezionato. È un Container: un oggetto che
// raggruppa altri oggetti e li muove insieme, come un <div> con dei figli.

import * as Phaser from 'phaser';
import type { DisegnaIcona } from './icone';
import { suoni } from '../../audio/Suoni';

export interface OpzioniPulsante {
  larghezza: number;
  altezza: number;
  testo?: string;
  dimensioneTesto?: number;
  icona?: DisegnaIcona;
  /** Se vero il testo va a capo per stare nella larghezza del pulsante. */
  aCapo?: boolean;
  /** Testo che compare passandoci sopra col mouse (come l'attributo title in HTML). */
  suggerimento?: string;
  colore?: number;
  alClic: () => void;
}

const COLORE = 0x2c3440;
const COLORE_SOPRA = 0x3e4a5c;
const BORDO = 0x9aa7b8;
const BORDO_SELEZIONATO = 0xffd23f;

export class Pulsante extends Phaser.GameObjects.Container {
  private readonly sfondo: Phaser.GameObjects.Rectangle;
  private readonly etichetta?: Phaser.GameObjects.Text;
  private readonly coloreBase: number;
  private attivo = true;
  private selezionato = false;

  constructor(scena: Phaser.Scene, x: number, y: number, opzioni: OpzioniPulsante) {
    super(scena, x, y);
    this.coloreBase = opzioni.colore ?? COLORE;
    this.sfondo = scena.add.rectangle(0, 0, opzioni.larghezza, opzioni.altezza, this.coloreBase);
    this.sfondo.setStrokeStyle(2, BORDO);
    this.add(this.sfondo);

    if (opzioni.icona) {
      const g = scena.add.graphics();
      opzioni.icona(g, Math.min(opzioni.larghezza, opzioni.altezza) * 0.8);
      this.add(g);
    }
    if (opzioni.testo !== undefined) {
      this.etichetta = scena.add
        .text(0, 0, opzioni.testo, {
          fontFamily: 'sans-serif',
          fontSize: `${opzioni.dimensioneTesto ?? 16}px`,
          color: '#ffffff',
          align: 'center',
          wordWrap: opzioni.aCapo ? { width: opzioni.larghezza - 16 } : undefined,
        })
        .setOrigin(0.5);
      this.add(this.etichetta);
    }

    // L'interattività sta sul rettangolo: Phaser sa già qual è la sua area cliccabile.
    // useHandCursor mostra la "manina" del browser, come cursor: pointer in CSS.
    this.sfondo.setInteractive({ useHandCursor: true });
    this.sfondo.on('pointerover', () => this.attivo && this.sfondo.setFillStyle(COLORE_SOPRA));
    this.sfondo.on('pointerout', () => this.sfondo.setFillStyle(this.coloreBase));

    if (opzioni.suggerimento) {
      // Sotto il pulsante se è nella metà alta dello schermo, sopra se è in basso.
      const sotto = y < scena.scale.height / 2;
      const testo = scena.add
        .text(x, sotto ? y + opzioni.altezza / 2 + 6 : y - opzioni.altezza / 2 - 6, opzioni.suggerimento, {
          fontFamily: 'sans-serif',
          fontSize: '13px',
          color: '#ffffff',
          backgroundColor: '#000000cc',
          padding: { x: 6, y: 3 },
          wordWrap: { width: 280 },
        })
        .setOrigin(x > scena.scale.width - 120 ? 1 : 0.5, sotto ? 0 : 1)
        .setDepth(100)
        .setVisible(false);
      this.sfondo.on('pointerover', () => testo.setVisible(true));
      this.sfondo.on('pointerout', () => testo.setVisible(false));
      // Un clic che apre un pannello sopra il pulsante non genera "pointerout": lo nascondiamo qui.
      this.sfondo.on('pointerdown', () => testo.setVisible(false));
    }
    this.sfondo.on('pointerdown', () => {
      if (!this.attivo) return;
      suoni.effetto('clic');
      opzioni.alClic();
    });

    scena.add.existing(this);
  }

  impostaAttivo(attivo: boolean): this {
    this.attivo = attivo;
    this.setAlpha(attivo ? 1 : 0.35);
    if (this.sfondo.input) this.sfondo.input.cursor = attivo ? 'pointer' : 'default';
    if (!attivo) this.sfondo.setFillStyle(this.coloreBase);
    return this;
  }

  impostaSelezionato(selezionato: boolean): this {
    this.selezionato = selezionato;
    this.sfondo.setStrokeStyle(selezionato ? 3 : 2, selezionato ? BORDO_SELEZIONATO : BORDO);
    return this;
  }

  impostaTesto(testo: string): this {
    this.etichetta?.setText(testo);
    return this;
  }

  get èSelezionato(): boolean {
    return this.selezionato;
  }
}

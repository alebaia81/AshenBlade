// La finestra di dialogo: un riquadro in basso con il nome di chi parla, il
// testo e le risposte da cliccare (o i tasti 1–4). Il mondo è in PAUSA, come
// con la scheda e lo zaino. Cosa succede scegliendo una risposta lo decide
// systems/dialoghi.ts: questa scena si limita a mostrare e a chiamare.

import * as Phaser from 'phaser';
import { ALTEZZA_SCHERMO, LARGHEZZA_SCHERMO, SCENA_DIALOGO, SCENA_MONDO } from '../costanti';
import type { DatiGioco } from '../data/caricaDati';
import { esitoRisposta, risposteVisibili, type CosaApribile, type Dialogo, type Risposta } from '../systems/dialoghi';
import type { DefinizioneAbitante } from '../systems/tipi';
import { STILE_TESTO } from './interfaccia/testi';
import { aggiungiImmagine, aspettoDi } from './grafica';
import type { ScenaMondo } from './ScenaMondo';

const RIQUADRO = { larghezza: 880, altezza: 220, margineBasso: 12 };
const RIGA_RISPOSTA = 26;
const COLORE_RISPOSTA = '#ffe680';

export interface DatiDialogo {
  idAbitante: string;
}

export class ScenaDialogo extends Phaser.Scene {
  private abitante!: DefinizioneAbitante;
  private idAbitante = '';
  private dialogo!: Dialogo;
  private nodo = '';
  private testo!: Phaser.GameObjects.Text;
  private risposte!: Phaser.GameObjects.Container;
  /** Una riga gialla sopra le risposte: cosa è successo alle quest (accettata, ricompensa). */
  private notizia!: Phaser.GameObjects.Text;
  private sinistra = 0;
  private alto = 0;

  constructor(private readonly dati: DatiGioco) {
    super(SCENA_DIALOGO);
  }

  create(dati: DatiDialogo): void {
    this.abitante = this.dati.abitanti[dati.idAbitante]!;
    this.idAbitante = dati.idAbitante;
    this.dialogo = this.dati.dialoghi[this.abitante.dialogo]!;
    this.nodo = this.dialogo.inizio;

    const cx = LARGHEZZA_SCHERMO / 2;
    this.sinistra = cx - RIQUADRO.larghezza / 2;
    this.alto = ALTEZZA_SCHERMO - RIQUADRO.margineBasso - RIQUADRO.altezza;
    // Velo leggero su tutto lo schermo: i clic non arrivano al mondo.
    this.add.rectangle(cx, ALTEZZA_SCHERMO / 2, LARGHEZZA_SCHERMO, ALTEZZA_SCHERMO, 0x000000, 0.25).setInteractive();
    this.add
      .rectangle(cx, this.alto + RIQUADRO.altezza / 2, RIQUADRO.larghezza, RIQUADRO.altezza, 0x1b2230, 0.96)
      .setStrokeStyle(2, 0x9aa7b8);

    // Ritratto: lo stesso disegno della persona nel mondo, in grande.
    const ritratto = this.add.graphics({ x: this.sinistra + 60, y: this.alto + 80 });
    const coloreVestito = parseInt(this.abitante.colore.replace('#', ''), 16);
    ritratto.fillStyle(0x10141c, 1).fillRect(-44, -56, 88, 112);
    const figura = aspettoDi(this.dati.sprite, 'abitanti', this.idAbitante);
    if (figura) {
      // La stessa figura del mondo, 5 volte più grande: con "pixelArt" i pixel restano netti.
      aggiungiImmagine(this, this.sinistra + 60, this.alto + 76, figura).setScale(5);
    } else {
      ritratto.fillStyle(coloreVestito, 1).fillRoundedRect(-28, -2, 56, 50, 14);
      ritratto.fillStyle(0xf0d2b0, 1).fillCircle(0, -22, 20);
    }
    this.add
      .text(this.sinistra + 60, this.alto + 150, this.abitante.nome, { ...STILE_TESTO, fontSize: '13px', fontStyle: 'bold', align: 'center', wordWrap: { width: 110 } })
      .setOrigin(0.5, 0);

    const xTesto = this.sinistra + 130;
    this.testo = this.add.text(xTesto, this.alto + 18, '', { ...STILE_TESTO, fontSize: '17px', wordWrap: { width: RIQUADRO.larghezza - 160 }, lineSpacing: 4 });
    this.risposte = this.add.container(0, 0);
    this.notizia = this.add.text(xTesto, 0, '', { ...STILE_TESTO, fontSize: '14px', color: '#8fe08f', wordWrap: { width: RIQUADRO.larghezza - 160 } });

    for (const [i, tasto] of ['ONE', 'TWO', 'THREE', 'FOUR'].entries()) this.input.keyboard?.on(`keydown-${tasto}`, () => this.rispondi(i));
    this.input.keyboard?.on('keydown-ESC', () => this.chiudi());
    this.mostraNodo();
  }

  private get mondo(): ScenaMondo {
    return this.scene.get(SCENA_MONDO) as ScenaMondo;
  }

  /** Le risposte che si vedono adesso (fase 7: alcune dipendono dalle quest). */
  private get visibili(): Risposta[] {
    const nodo = this.dialogo.nodi[this.nodo];
    return nodo ? risposteVisibili(nodo, (c) => this.mondo.condizioneVera(c)) : [];
  }

  private mostraNodo(): void {
    const nodo = this.dialogo.nodi[this.nodo]!;
    this.testo.setText(nodo.testo);
    this.risposte.removeAll(true);
    // Le risposte stanno in fondo al riquadro, dal basso verso l'alto.
    const xTesto = this.sinistra + 130;
    const visibili = this.visibili;
    const primaY = this.alto + RIQUADRO.altezza - 14 - visibili.length * RIGA_RISPOSTA;
    this.notizia.setY(primaY - 30);
    visibili.forEach((r, i) => {
      const riga = this.add.text(xTesto, primaY + i * RIGA_RISPOSTA, `${i + 1}. ${r.testo}`, { ...STILE_TESTO, fontSize: '16px', color: COLORE_RISPOSTA });
      // Tutta la riga è cliccabile, non solo le lettere (come nel pannello sviluppatore).
      riga.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(-6, -3, RIQUADRO.larghezza - 160, RIGA_RISPOSTA),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
        useHandCursor: true,
      });
      riga.on('pointerover', () => riga.setColor('#ffffff'));
      riga.on('pointerout', () => riga.setColor(COLORE_RISPOSTA));
      riga.on('pointerdown', () => this.rispondi(i));
      this.risposte.add(riga);
    });
  }

  private rispondi(indice: number): void {
    const risposta = this.visibili[indice];
    if (!risposta) return;
    const esito = esitoRisposta(risposta);
    // Prima l'azione (accettare o concludere una quest), poi si va avanti.
    this.notizia.setText('');
    if (esito.azione) this.notizia.setText(this.mondo.azioneQuest(esito.azione) ?? '');
    switch (esito.tipo) {
      case 'nodo':
        this.nodo = esito.id;
        this.mostraNodo();
        return;
      case 'apri':
        this.apri(esito.cosa);
        return;
      case 'chiudi':
        this.chiudi();
    }
  }

  /** Negozio (5b) e taverna (5c): li apre il mondo, che sa quali scene esistono. */
  private apri(cosa: CosaApribile): void {
    this.chiudi();
    this.mondo.apri(cosa);
  }

  private chiudi(): void {
    this.scene.stop();
    this.scene.resume(SCENA_MONDO);
  }
}

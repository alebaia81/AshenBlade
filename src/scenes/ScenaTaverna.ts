// La taverna "Il Cinghiale Zoppo": i quattro compagni (design §10), uno per classe.
// Si apre dal dialogo con Tobia, con il mondo in pausa. Ogni compagno si paga una
// volta; poi riprenderlo è gratis. Uno solo alla volta.

import * as Phaser from 'phaser';
import { ALTEZZA_SCHERMO, LARGHEZZA_SCHERMO, SCENA_MONDO, SCENA_TAVERNA } from '../costanti';
import type { DatiGioco } from '../data/caricaDati';
import { congeda, ingaggia } from '../systems/taverna';
import type { DefinizioneCompagno } from '../systems/tipi';
import { disegnaOggetto } from './interfaccia/iconeOggetti';
import { Pulsante } from './interfaccia/Pulsante';
import { STILE_TESTO, STILE_TITOLO } from './interfaccia/testi';
import { leggiPartita, scriviPartita } from './statoCondiviso';

const PANNELLO = { larghezza: 920, altezza: 490 };
const SCHEDA = { larghezza: 205, altezza: 360, distanza: 220 };

export class ScenaTaverna extends Phaser.Scene {
  private contenuto!: Phaser.GameObjects.Container;
  private monete!: Phaser.GameObjects.Text;
  private esito!: Phaser.GameObjects.Text;
  private sinistra = 0;
  private alto = 0;

  constructor(private readonly dati: DatiGioco) {
    super(SCENA_TAVERNA);
  }

  create(): void {
    const cx = LARGHEZZA_SCHERMO / 2;
    const cy = ALTEZZA_SCHERMO / 2;
    this.sinistra = cx - PANNELLO.larghezza / 2;
    this.alto = cy - PANNELLO.altezza / 2;
    this.add.rectangle(cx, cy, LARGHEZZA_SCHERMO, ALTEZZA_SCHERMO, 0x000000, 0.55).setInteractive();
    this.add.rectangle(cx, cy, PANNELLO.larghezza, PANNELLO.altezza, 0x221a14, 0.97).setStrokeStyle(2, 0xb08a5a);
    this.add.text(this.sinistra + 24, this.alto + 14, 'Il Cinghiale Zoppo', { ...STILE_TITOLO, fontSize: '22px' });
    this.add.text(this.sinistra + 24, this.alto + 44, 'Un compagno ti segue e combatte con te. Si paga una volta sola; uno alla volta.', { ...STILE_TESTO, fontSize: '13px', color: '#c8b8a0' });
    const icona = this.add.graphics({ x: this.sinistra + PANNELLO.larghezza - 120, y: this.alto + 28 });
    disegnaOggetto(icona, this.dati.oggetti['monete']!, 20);
    this.monete = this.add.text(this.sinistra + PANNELLO.larghezza - 104, this.alto + 17, '', { ...STILE_TESTO, fontSize: '20px', color: '#ffe680', fontStyle: 'bold' });
    this.esito = this.add.text(this.sinistra + 24, this.alto + PANNELLO.altezza - 40, '', { ...STILE_TESTO, fontSize: '14px', color: '#ffe680', wordWrap: { width: 560 } });
    new Pulsante(this, this.sinistra + PANNELLO.larghezza - 90, this.alto + PANNELLO.altezza - 32, { larghezza: 150, altezza: 40, testo: 'Chiudi (Esc)', alClic: () => this.chiudi() });
    this.contenuto = this.add.container(0, 0);
    this.input.keyboard?.on('keydown-ESC', () => this.chiudi());
    this.ridisegna();
  }

  private ridisegna(): void {
    const partita = leggiPartita(this);
    this.monete.setText(String(partita.monete));
    this.contenuto.removeAll(true);
    Object.values(this.dati.compagni).forEach((c, i) => this.scheda(c, i));
  }

  /** Una "carta" per compagno: ritratto, descrizione, numeri, bonus, abilità e pulsante. */
  private scheda(c: DefinizioneCompagno, i: number): void {
    const partita = leggiPartita(this);
    const x = this.sinistra + 24 + i * SCHEDA.distanza;
    const y = this.alto + 72;
    const conTe = partita.compagni.attivo === c.id;
    const pagato = partita.compagni.ingaggiati.includes(c.id);
    const coloreC = parseInt(c.colore.replace('#', ''), 16);
    const sfondo = this.add.rectangle(x + SCHEDA.larghezza / 2, y + SCHEDA.altezza / 2, SCHEDA.larghezza, SCHEDA.altezza, conTe ? 0x2e3a2a : 0x14100c);
    sfondo.setStrokeStyle(conTe ? 3 : 2, conTe ? 0x5fd35f : coloreC);
    // Ritratto: corpo e testa, come le persone del villaggio.
    const ritratto = this.add.graphics({ x: x + 34, y: y + 42 });
    ritratto.fillStyle(coloreC, 1).fillRoundedRect(-18, -2, 36, 30, 9);
    ritratto.fillStyle(0xf0d2b0, 1).fillCircle(0, -14, 12);
    const classe = this.dati.classi[c.classe]?.nome ?? c.classe;
    const testo = (dy: number, t: string, stile: Phaser.Types.GameObjects.Text.TextStyle = {}) =>
      this.add.text(x + 10, y + dy, t, { ...STILE_TESTO, fontSize: '12px', wordWrap: { width: SCHEDA.larghezza - 20 }, ...stile });
    this.contenuto.add([
      sfondo,
      ritratto,
      this.add.text(x + 64, y + 16, c.nome, { ...STILE_TESTO, fontSize: '15px', fontStyle: 'bold', color: c.colore, wordWrap: { width: 135 } }),
      this.add.text(x + 64, y + 52, classe, { ...STILE_TESTO, fontSize: '12px', color: '#c8b8a0' }),
      testo(84, c.descrizione, { color: '#e0d8c8' }),
      testo(150, `Vita ${c.vita} · danno ${c.danno}${c.proiettile ? ' (dardi)' : ''}`),
      testo(172, `Bonus: ${c.bonus.descrizione}`, { color: '#a8e0a0' }),
      testo(222, `${c.abilita.nome} (Q)`, { fontStyle: 'bold', color: '#ffe680' }),
      testo(240, `${c.abilita.descrizione} Ricarica ${c.abilita.ricaricaMs / 1000} s.`, { color: '#e0d8c8' }),
    ]);

    const etichetta = conTe ? 'È con te' : pagato ? 'Scegli (già pagato)' : `Ingaggia (${c.prezzo})`;
    const pulsante = new Pulsante(this, x + SCHEDA.larghezza / 2, y + SCHEDA.altezza - 54, {
      larghezza: SCHEDA.larghezza - 24,
      altezza: 32,
      testo: etichetta,
      dimensioneTesto: 14,
      alClic: () => this.scegli(c),
    });
    pulsante.impostaAttivo(!conTe);
    this.contenuto.add(pulsante);
    if (conTe) {
      this.contenuto.add(
        new Pulsante(this, x + SCHEDA.larghezza / 2, y + SCHEDA.altezza - 20, {
          larghezza: SCHEDA.larghezza - 80,
          altezza: 24,
          testo: 'Lascialo qui',
          dimensioneTesto: 12,
          alClic: () => this.lascia(c),
        }),
      );
    }
  }

  private scegli(c: DefinizioneCompagno): void {
    const esito = ingaggia(leggiPartita(this), c.id, c.prezzo);
    if (!esito.ok) {
      this.esito.setText(esito.errore).setColor('#ff9a9a');
      return;
    }
    scriviPartita(this, esito.stato);
    this.esito.setText(esito.pagato > 0 ? `${c.nome} si unisce a te (−${esito.pagato} monete).` : `${c.nome} torna con te.`).setColor('#ffe680');
    this.ridisegna();
  }

  private lascia(c: DefinizioneCompagno): void {
    scriviPartita(this, congeda(leggiPartita(this)));
    this.esito.setText(`${c.nome} resta in taverna. Puoi riprenderlo gratis quando vuoi.`).setColor('#ffe680');
    this.ridisegna();
  }

  private chiudi(): void {
    this.scene.stop();
    this.scene.resume(SCENA_MONDO);
  }
}

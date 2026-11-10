// Le opzioni (fase 9a): un pannello sopra il menu iniziale o sopra la pausa.
// Chi lo apre gli dice dove tornare ("torna"): chiudendo, quella scena riparte.
// Le scelte si ricordano nel browser (systems/opzioni.ts). Il volume di musica
// ed effetti si regolano qui dalla fase 9c.

import * as Phaser from 'phaser';
import { ALTEZZA_SCHERMO, LARGHEZZA_SCHERMO, SCENA_MENU, SCENA_OPZIONI } from '../costanti';
import { leggiOpzioni, scriviOpzioni } from '../systems/opzioni';
import { suoni } from '../audio/Suoni';
import { archivioDelBrowser } from './browser';
import { Pulsante } from './interfaccia/Pulsante';
import { STILE_TESTO, STILE_TITOLO } from './interfaccia/testi';

/** Le opzioni sì/no, con la descrizione per il giocatore. */
const VOCI: { chiave: 'salvataggioAutomatico' | 'mostraIntroduzione'; nome: string; spiegazione: string }[] = [
  { chiave: 'salvataggioAutomatico', nome: 'Salvataggio automatico', spiegazione: 'salva da solo quando entri a Borgo Quercia' },
  { chiave: 'mostraIntroduzione', nome: 'Testo introduttivo', spiegazione: 'la storia prima di creare il personaggio' },
];

const VOLUMI: { chiave: 'volumeMusica' | 'volumeEffetti'; nome: string; spiegazione: string }[] = [
  { chiave: 'volumeMusica', nome: 'Musica', spiegazione: 'da 0 (spenta) a 10' },
  { chiave: 'volumeEffetti', nome: 'Effetti sonori', spiegazione: 'colpi, monete, porte, il bip del dischetto…' },
];

/** Posizioni (per le prove nel browser): righe dei volumi e pulsanti − / +. */
export const OPZIONI_VOLUME = { righe: [253, 317], meno: 650, piu: 750 };

export class ScenaOpzioni extends Phaser.Scene {
  private torna = SCENA_MENU;

  constructor() {
    super(SCENA_OPZIONI);
  }

  init(dati: { torna?: string }): void {
    this.torna = dati.torna ?? SCENA_MENU;
  }

  create(): void {
    const cx = LARGHEZZA_SCHERMO / 2;
    const cy = ALTEZZA_SCHERMO / 2;
    this.add.rectangle(cx, cy, LARGHEZZA_SCHERMO, ALTEZZA_SCHERMO, 0x000000, 0.6).setInteractive();
    this.add.rectangle(cx, cy, 620, 516, 0x1b2230, 0.98).setStrokeStyle(2, 0x9aa7b8);
    this.add.text(cx, cy - 228, 'Opzioni', { ...STILE_TITOLO, fontSize: '24px' }).setOrigin(0.5);

    const archivio = archivioDelBrowser();
    let opzioni = leggiOpzioni(archivio);
    const riga = (i: number, nome: string, spiegazione: string): number => {
      const y = cy - 145 + i * 64;
      this.add.text(cx - 270, y - 14, nome, { ...STILE_TESTO, fontSize: '18px', fontStyle: 'bold' });
      this.add.text(cx - 270, y + 10, spiegazione, { ...STILE_TESTO, fontSize: '13px', color: '#9aa7b8' });
      return y;
    };

    VOCI.forEach((v, i) => {
      const y = riga(i, v.nome, v.spiegazione);
      const pulsante = new Pulsante(this, cx + 220, y, {
        larghezza: 110,
        altezza: 38,
        testo: opzioni[v.chiave] ? 'Sì' : 'No',
        alClic: () => {
          opzioni = { ...opzioni, [v.chiave]: !opzioni[v.chiave] };
          scriviOpzioni(archivio, opzioni);
          pulsante.impostaTesto(opzioni[v.chiave] ? 'Sì' : 'No');
        },
      });
    });

    // Fase 9c: i volumi, da 0 a 10 con − e +. Si sentono subito e si ricordano.
    VOLUMI.forEach((v, i) => {
      const y = riga(VOCI.length + i, v.nome, v.spiegazione);
      const valore = this.add.text(cx + 220, y, '', { ...STILE_TESTO, fontSize: '18px' }).setOrigin(0.5);
      const mostra = () => valore.setText(String(Math.round(opzioni[v.chiave] * 10)));
      const cambia = (passo: number) => {
        const nuovo = Math.min(10, Math.max(0, Math.round(opzioni[v.chiave] * 10) + passo)) / 10;
        opzioni = { ...opzioni, [v.chiave]: nuovo };
        scriviOpzioni(archivio, opzioni);
        suoni.impostaVolumi(opzioni.volumeMusica, opzioni.volumeEffetti);
        // Un "clic" di prova: si sente subito com'è il nuovo volume degli effetti.
        if (v.chiave === 'volumeEffetti') suoni.effetto('raccolta');
        mostra();
      };
      new Pulsante(this, cx + 170, y, { larghezza: 36, altezza: 32, testo: '−', alClic: () => cambia(-1) });
      new Pulsante(this, cx + 270, y, { larghezza: 36, altezza: 32, testo: '+', alClic: () => cambia(1) });
      mostra();
    });

    // Scuotimento schermo: vibrazione telecamera su colpi critici ed eventi boss
    const yScuotimento = 372;
    this.add.text(cx - 270, yScuotimento - 14, 'Scuotimento schermo', { ...STILE_TESTO, fontSize: '18px', fontStyle: 'bold' });
    this.add.text(cx - 270, yScuotimento + 10, 'vibrazione della visuale su colpi critici e boss', { ...STILE_TESTO, fontSize: '13px', color: '#9aa7b8' });
    const pulsanteScuotimento = new Pulsante(this, cx + 220, yScuotimento, {
      larghezza: 110,
      altezza: 34,
      testo: opzioni.scuotimentoSchermo ? 'Sì' : 'No',
      alClic: () => {
        opzioni = { ...opzioni, scuotimentoSchermo: !opzioni.scuotimentoSchermo };
        scriviOpzioni(archivio, opzioni);
        pulsanteScuotimento.impostaTesto(opzioni.scuotimentoSchermo ? 'Sì' : 'No');
      },
    });

    // Controlli touch: levetta e tasti per smartphone e tablet
    const yTouch = 418;
    this.add.text(cx - 270, yTouch - 14, 'Controlli touch', { ...STILE_TESTO, fontSize: '18px', fontStyle: 'bold' });
    this.add.text(cx - 270, yTouch + 10, 'levetta e pulsanti per smartphone e tablet', { ...STILE_TESTO, fontSize: '13px', color: '#9aa7b8' });
    const pulsanteTouch = new Pulsante(this, cx + 220, yTouch, {
      larghezza: 110,
      altezza: 34,
      testo: opzioni.controlliTouch ? 'Sì' : 'No',
      alClic: () => {
        opzioni = { ...opzioni, controlliTouch: !opzioni.controlliTouch };
        scriviOpzioni(archivio, opzioni);
        pulsanteTouch.impostaTesto(opzioni.controlliTouch ? 'Sì' : 'No');
      },
    });

    // Schermo intero: non si ricorda (il browser lo permette solo dopo un clic).
    const yIntero = 464;
    this.add.text(cx - 270, yIntero - 14, 'Schermo intero', { ...STILE_TESTO, fontSize: '18px', fontStyle: 'bold' });
    this.add.text(cx - 270, yIntero + 10, 'come il tasto F11 del browser', { ...STILE_TESTO, fontSize: '13px', color: '#9aa7b8' });
    const intero = new Pulsante(this, cx + 220, yIntero, {
      larghezza: 110,
      altezza: 34,
      testo: this.scale.isFullscreen ? 'Sì' : 'No',
      alClic: () => {
        if (this.scale.isFullscreen) this.scale.stopFullscreen();
        else this.scale.startFullscreen();
        // Il browser cambia modalità un attimo dopo: aggiorniamo il testo con calma.
        this.time.delayedCall(300, () => intero.impostaTesto(this.scale.isFullscreen ? 'Sì' : 'No'));
      },
    });

    new Pulsante(this, cx, 506, { larghezza: 180, altezza: 34, testo: 'Chiudi (Esc)', alClic: () => this.chiudi() });
    this.input.keyboard?.on('keydown-ESC', () => this.chiudi());
  }

  private chiudi(): void {
    this.scene.stop();
    this.scene.resume(this.torna);
  }
}

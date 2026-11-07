// La bottega di Gemma. Si apre dal dialogo ("Fammi vedere la merce"), con il
// mondo in pausa. A sinistra la merce, al centro il tuo zaino, a destra i
// dettagli e il pulsante Compra / Vendi.
// Clic: seleziona. Clic destro: compra o vende subito (come "usa al volo" nello zaino).
// I prezzi e le regole stanno in systems/negozio.ts.

import * as Phaser from 'phaser';
import { ALTEZZA_SCHERMO, CHIAVE_PARTITA, LARGHEZZA_SCHERMO, SCENA_MONDO, SCENA_NEGOZIO } from '../costanti';
import type { DatiGioco, DefinizioneNegozio } from '../data/caricaDati';
import { modificatore } from '../systems/caratteristiche';
import { èDiMissione } from '../systems/oggetti';
import { compra, prezzoAcquisto, prezzoVendita, vendi } from '../systems/negozio';
import { colorePerRarita } from '../systems/oggetti';
import { caratteristicheTotali, type Partita } from '../systems/partita';
import { righeOggetto } from './interfaccia/descrizioni';
import { disegnaOggetto } from './interfaccia/iconeOggetti';
import { Pulsante } from './interfaccia/Pulsante';
import { conSegno, STILE_TESTO, STILE_TITOLO } from './interfaccia/testi';
import { leggiPartita, scriviPartita } from './statoCondiviso';

const PANNELLO = { larghezza: 900, altezza: 480 };
const RIGA = 23;
const SPAZIO = 46;
const DISTANZA = 52;
const COLONNE = 4;
const numero = (colore: string) => parseInt(colore.replace('#', ''), 16);

/** Cosa è selezionato (o sotto il mouse): una merce del negozio o uno spazio dello zaino. */
type Scelta = { da: 'merce'; id: string } | { da: 'zaino'; indice: number };

export class ScenaNegozio extends Phaser.Scene {
  private negozio!: DefinizioneNegozio;
  private selezione: Scelta | null = null;
  private sopra: Scelta | null = null;
  /** Ciò che si ridisegna a ogni cambiamento (righe della merce e spazi dello zaino). */
  private contenuto!: Phaser.GameObjects.Container;
  private monete!: Phaser.GameObjects.Text;
  private nomeOggetto!: Phaser.GameObjects.Text;
  private dettagli!: Phaser.GameObjects.Text;
  private esito!: Phaser.GameObjects.Text;
  private azione!: Pulsante;
  private sinistra = 0;
  private alto = 0;

  constructor(private readonly dati: DatiGioco) {
    super(SCENA_NEGOZIO);
  }

  create(dati: { negozio: string }): void {
    this.negozio = this.dati.negozi[dati.negozio]!;
    this.selezione = null;
    this.sopra = null;
    const cx = LARGHEZZA_SCHERMO / 2;
    const cy = ALTEZZA_SCHERMO / 2;
    this.sinistra = cx - PANNELLO.larghezza / 2;
    this.alto = cy - PANNELLO.altezza / 2;
    const { sinistra, alto } = this;

    this.add.rectangle(cx, cy, LARGHEZZA_SCHERMO, ALTEZZA_SCHERMO, 0x000000, 0.55).setInteractive();
    this.add.rectangle(cx, cy, PANNELLO.larghezza, PANNELLO.altezza, 0x1b2230, 0.97).setStrokeStyle(2, 0x9aa7b8);
    this.add.text(sinistra + 24, alto + 16, this.negozio.nome, { ...STILE_TITOLO, fontSize: '22px' });
    const intestazione = { ...STILE_TESTO, fontSize: '13px', color: '#9aa7b8' };
    this.add.text(sinistra + 24, alto + 50, 'In vendita (prezzo per uno)', intestazione);
    this.add.text(sinistra + 460, alto + 50, 'Il tuo zaino', intestazione);

    // Le monete in alto a destra, con la stessa icona dell'interfaccia.
    const icona = this.add.graphics({ x: sinistra + PANNELLO.larghezza - 120, y: alto + 30 });
    disegnaOggetto(icona, this.dati.oggetti['monete']!, 20);
    this.monete = this.add.text(sinistra + PANNELLO.larghezza - 104, alto + 19, '', { ...STILE_TESTO, fontSize: '20px', color: '#ffe680', fontStyle: 'bold' });

    const destra = sinistra + 680;
    this.nomeOggetto = this.add.text(destra, alto + 70, '', { ...STILE_TITOLO, fontSize: '17px', wordWrap: { width: 200 } });
    this.dettagli = this.add.text(destra, alto + 100, '', { ...STILE_TESTO, fontSize: '13px', wordWrap: { width: 200 }, lineSpacing: 3 });
    this.azione = new Pulsante(this, destra + 100, alto + 352, { larghezza: 200, altezza: 40, testo: '', dimensioneTesto: 15, alClic: () => this.esegui() });
    this.esito = this.add.text(destra, alto + 380, '', { ...STILE_TESTO, fontSize: '13px', color: '#ffe680', wordWrap: { width: 200 } });
    this.add.text(sinistra + 24, alto + PANNELLO.altezza - 30, 'Clic: seleziona · Clic destro: compra o vende subito', { ...STILE_TESTO, fontSize: '13px', color: '#9aa7b8' });
    new Pulsante(this, sinistra + PANNELLO.larghezza - 90, alto + PANNELLO.altezza - 32, { larghezza: 150, altezza: 40, testo: 'Chiudi (Esc)', alClic: () => this.chiudi() });

    this.contenuto = this.add.container(0, 0);
    this.input.mouse?.disableContextMenu();
    this.input.keyboard?.on('keydown-ESC', () => this.chiudi());
    const ascolta = () => this.ridisegna();
    this.registry.events.on(`changedata-${CHIAVE_PARTITA}`, ascolta);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.registry.events.off(`changedata-${CHIAVE_PARTITA}`, ascolta));
    this.ridisegna();
  }

  /** Modificatore del Carisma, compresi i bonus dei pezzi leggendari. */
  private modificatoreCAR(partita: Partita): number {
    return modificatore(caratteristicheTotali(partita, this.dati.indossabili).CAR);
  }

  private prezzi(id: string, partita: Partita): { compra: number; vendi: number } {
    const base = this.dati.oggetti[id]?.prezzo ?? 0;
    const car = this.modificatoreCAR(partita);
    return { compra: prezzoAcquisto(base, car), vendi: prezzoVendita(base, car) };
  }

  private ridisegna(): void {
    const partita = leggiPartita(this);
    const { sinistra, alto } = this;
    this.monete.setText(String(partita.monete));
    this.contenuto.removeAll(true);

    // ---- la merce ----
    this.negozio.merce.forEach((id, i) => {
      const o = this.dati.oggetti[id]!;
      const y = alto + 78 + i * RIGA;
      const scelto = this.selezione?.da === 'merce' && this.selezione.id === id;
      const sfondo = this.add.rectangle(sinistra + 24 + 205, y, 410, RIGA - 2, scelto ? 0x3e4a5c : 0x10141c);
      if (scelto) sfondo.setStrokeStyle(2, 0xffd23f);
      this.rendiCliccabile(sfondo, { da: 'merce', id });
      const icona = this.add.graphics({ x: sinistra + 38, y });
      disegnaOggetto(icona, o, 18);
      const prezzo = this.prezzi(id, partita).compra;
      this.contenuto.add([
        sfondo,
        icona,
        this.add.text(sinistra + 54, y, o.nome, { ...STILE_TESTO, fontSize: '14px', color: colorePerRarita(o.rarita) }).setOrigin(0, 0.5),
        // In rosso se non te lo puoi permettere.
        this.add.text(sinistra + 424, y, `${prezzo}`, { ...STILE_TESTO, fontSize: '14px', color: prezzo > partita.monete ? '#ff7a7a' : '#ffe680' }).setOrigin(1, 0.5),
      ]);
    });

    // ---- lo zaino ----
    partita.inventario.spazi.forEach((pila, i) => {
      const x = sinistra + 460 + (i % COLONNE) * DISTANZA + SPAZIO / 2;
      const y = alto + 72 + Math.floor(i / COLONNE) * DISTANZA + SPAZIO / 2;
      const o = pila ? this.dati.oggetti[pila.id] : undefined;
      const scelto = this.selezione?.da === 'zaino' && this.selezione.indice === i;
      const sfondo = this.add.rectangle(x, y, SPAZIO, SPAZIO, scelto ? 0x3e4a5c : 0x10141c);
      sfondo.setStrokeStyle(scelto ? 3 : 2, o ? numero(colorePerRarita(o.rarita)) : 0x4a5568);
      this.contenuto.add(sfondo);
      if (!pila || !o) return;
      this.rendiCliccabile(sfondo, { da: 'zaino', indice: i });
      const icona = this.add.graphics({ x, y });
      disegnaOggetto(icona, o, 34);
      this.contenuto.add(icona);
      if (pila.quantita > 1) {
        this.contenuto.add(
          this.add
            .text(x + SPAZIO / 2 - 3, y + SPAZIO / 2 - 1, String(pila.quantita), { ...STILE_TESTO, fontSize: '12px', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 })
            .setOrigin(1, 1),
        );
      }
    });
    // Una selezione nello zaino non deve puntare a uno spazio rimasto vuoto (pila venduta tutta).
    if (this.selezione?.da === 'zaino' && !partita.inventario.spazi[this.selezione.indice]) this.selezione = null;
    this.mostraDettagli(partita);
  }

  private rendiCliccabile(oggetto: Phaser.GameObjects.Rectangle, scelta: Scelta): void {
    oggetto.setInteractive({ useHandCursor: true });
    oggetto.on('pointerover', () => {
      this.sopra = scelta;
      this.mostraDettagli(leggiPartita(this));
    });
    oggetto.on('pointerout', () => {
      this.sopra = null;
      this.mostraDettagli(leggiPartita(this));
    });
    oggetto.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.selezione = scelta;
      this.esito.setText('');
      if (p.rightButtonDown()) this.esegui();
      else this.ridisegna();
    });
  }

  /** Id dell'oggetto di una scelta (merce o spazio dello zaino). */
  private idDi(scelta: Scelta | null, partita: Partita): string | null {
    if (!scelta) return null;
    return scelta.da === 'merce' ? scelta.id : (partita.inventario.spazi[scelta.indice]?.id ?? null);
  }

  /** Dettagli di ciò che è sotto il mouse, altrimenti della selezione; e il pulsante giusto. */
  private mostraDettagli(partita: Partita): void {
    const scelta = this.sopra ?? this.selezione;
    const id = this.idDi(scelta, partita);
    const o = id ? this.dati.oggetti[id] : undefined;
    if (!scelta || !id || !o) {
      this.nomeOggetto.setText('');
      const car = this.modificatoreCAR(partita);
      this.dettagli.setText(
        [
          'Passa il mouse su un oggetto.',
          '',
          `Il tuo Carisma: ${conSegno(car)}`,
          car !== 0 ? `I prezzi cambiano del ${Math.min(25, Math.abs(car) * 5)}% a tuo ${car > 0 ? 'favore' : 'sfavore'}.` : 'Prezzi normali.',
          'Gemma ricompra a metà prezzo.',
        ].join('\n'),
      );
    } else {
      this.nomeOggetto.setText(o.nome).setColor(colorePerRarita(o.rarita));
      const prezzi = this.prezzi(id, partita);
      const righe = righeOggetto(id, this.dati).slice(0, 7);
      righe.push('', scelta.da === 'merce' ? `Prezzo: ${prezzi.compra} monete` : `Gemma ti dà: ${prezzi.vendi} monete`);
      this.dettagli.setText(righe.join('\n'));
    }

    // Il pulsante segue la SELEZIONE (non il mouse): è ciò che verrà comprato o venduto.
    const idSelezione = this.idDi(this.selezione, partita);
    if (!this.selezione || !idSelezione) {
      this.azione.impostaTesto('Scegli un oggetto').impostaAttivo(false);
    } else if (this.selezione.da === 'merce') {
      this.azione.impostaTesto(`Compra (${this.prezzi(idSelezione, partita).compra})`).impostaAttivo(true);
    } else if (èDiMissione(this.dati.oggetti[idSelezione])) {
      this.azione.impostaTesto('Non si vende').impostaAttivo(false);
    } else {
      this.azione.impostaTesto(`Vendi (${this.prezzi(idSelezione, partita).vendi})`).impostaAttivo(true);
    }
  }

  /** Compra o vende la selezione. */
  private esegui(): void {
    const partita = leggiPartita(this);
    const scelta = this.selezione;
    const id = this.idDi(scelta, partita);
    if (!scelta || !id) return;
    if (scelta.da !== 'merce' && èDiMissione(this.dati.oggetti[id])) return;
    const nome = this.dati.oggetti[id]!.nome;
    const prezzi = this.prezzi(id, partita);
    const esito = scelta.da === 'merce' ? compra(partita, id, prezzi.compra, this.dati.oggetti) : vendi(partita, scelta.indice, prezzi.vendi);
    if (!esito.ok) {
      this.esito.setText(esito.errore).setColor('#ff9a9a');
      return;
    }
    this.esito.setText(scelta.da === 'merce' ? `Comprato: ${nome} (−${prezzi.compra})` : `Venduto: ${nome} (+${prezzi.vendi})`).setColor('#ffe680');
    scriviPartita(this, esito.stato); // l'evento changedata ridisegna tutto
  }

  private chiudi(): void {
    this.scene.stop();
    this.scene.resume(SCENA_MONDO);
  }
}

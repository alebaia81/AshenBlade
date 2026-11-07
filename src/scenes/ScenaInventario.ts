// Lo zaino. Come la scheda, si apre sopra il mondo che resta in pausa.
// A sinistra la griglia degli spazi, a destra i dettagli dell'oggetto sotto
// il mouse (o selezionato), i pulsanti Usa / Getta / Preferiti e, in basso,
// la riga della BARRA DEI PREFERITI: ci si trascinano pozioni e armi.
// Clic: seleziona. Clic destro: usa al volo (pozioni) o impugna (armi).
// Le armature qui si guardano soltanto: si indossano dalla scheda (design §8).

import { èDiMissione } from '../systems/oggetti';
import * as Phaser from 'phaser';
import { ALTEZZA_SCHERMO, CHIAVE_PARTITA, LARGHEZZA_SCHERMO, SCENA_INVENTARIO, SCENA_MONDO } from '../costanti';
import type { DatiGioco } from '../data/caricaDati';
import { colorePerRarita } from '../systems/oggetti';
import type { Partita } from '../systems/partita';
import { cosaFa, NUMERO_PREFERITI } from '../systems/preferiti';
import { righeOggetto } from './interfaccia/descrizioni';
import { disegnaOggetto } from './interfaccia/iconeOggetti';
import { Pulsante } from './interfaccia/Pulsante';
import { STILE_TESTO, STILE_TITOLO } from './interfaccia/testi';
import type { ScenaMondo } from './ScenaMondo';
import { leggiPartita } from './statoCondiviso';

const PANNELLO = { larghezza: 760, altezza: 470 };
const SPAZIO = 56;
const DISTANZA = 62;
const COLONNE = 4;
/** La riga dei preferiti dentro lo zaino: 6 quadrati da 46 ogni 54 px. */
const PREFERITO = { lato: 46, distanza: 54 };

const numero = (colore: string) => parseInt(colore.replace('#', ''), 16);

/** Cosa si sta trascinando: un oggetto dello zaino o uno spazio della barra. */
type Trascinamento = { da: 'zaino'; id: string } | { da: 'barra'; id: string; indice: number };

export class ScenaInventario extends Phaser.Scene {
  private selezionato: number | null = null;
  private sopra: number | null = null;
  /** Tutto ciò che si ridisegna a ogni cambiamento sta qui dentro e si svuota ogni volta. */
  private griglia!: Phaser.GameObjects.Container;
  private titolo!: Phaser.GameObjects.Text;
  private dettagli!: Phaser.GameObjects.Text;
  private nomeOggetto!: Phaser.GameObjects.Text;
  private esito!: Phaser.GameObjects.Text;
  private usa!: Pulsante;
  private getta!: Pulsante;
  private aiPreferiti!: Pulsante;
  private altroSlot!: Pulsante;
  private scambiaArmiBtn!: Pulsante;
  private inMano!: Phaser.GameObjects.Text;
  private sinistra = 0;
  private alto = 0;
  private destra = 0;
  private trascinamento: Trascinamento | null = null;
  /** L'icona che segue il mouse durante il trascinamento. */
  private fantasma: Phaser.GameObjects.Graphics | null = null;
  /** Il "pointerup" che chiude un trascinamento non deve valere anche come clic. */
  private appenaTrascinato = false;

  constructor(private readonly dati: DatiGioco) {
    super(SCENA_INVENTARIO);
  }

  create(): void {
    this.selezionato = null;
    this.sopra = null;
    this.trascinamento = null;
    this.fantasma = null;
    const cx = LARGHEZZA_SCHERMO / 2;
    const cy = ALTEZZA_SCHERMO / 2;
    this.sinistra = cx - PANNELLO.larghezza / 2;
    this.alto = cy - PANNELLO.altezza / 2;
    this.destra = this.sinistra + 24 + COLONNE * DISTANZA + 30;
    const destra = this.destra;

    // Velo modale: assorbe i clic, come nella scheda.
    this.add.rectangle(cx, cy, LARGHEZZA_SCHERMO, ALTEZZA_SCHERMO, 0x000000, 0.55).setInteractive();
    this.add.rectangle(cx, cy, PANNELLO.larghezza, PANNELLO.altezza, 0x1b2230, 0.97).setStrokeStyle(2, 0x9aa7b8);
    this.titolo = this.add.text(this.sinistra + 24, this.alto + 16, '', { ...STILE_TITOLO, fontSize: '20px' });
    this.inMano = this.add.text(this.sinistra + 24, this.alto + 44, '', { ...STILE_TESTO, fontSize: '13px', color: '#c8c8c8' });
    this.griglia = this.add.container(0, 0);

    this.nomeOggetto = this.add.text(destra, this.alto + 70, '', { ...STILE_TITOLO, fontSize: '20px', wordWrap: { width: 380 } });
    this.dettagli = this.add.text(destra, this.alto + 104, '', { ...STILE_TESTO, wordWrap: { width: 380 }, lineSpacing: 6 });
    this.esito = this.add.text(destra, this.alto + 316, '', { ...STILE_TESTO, fontSize: '14px', color: '#ffe680', wordWrap: { width: 380 } });
    const pulsante = (dx: number, testo: string, alClic: () => void) =>
      new Pulsante(this, destra + dx, this.alto + 290, { larghezza: 110, altezza: 38, testo, alClic });
    this.usa = pulsante(60, 'Usa', () => this.usaSelezionato());
    this.getta = pulsante(190, 'Getta', () => this.gettaSelezionato());
    this.aiPreferiti = pulsante(320, 'Preferiti', () => this.mettiNeiPreferiti());
    this.altroSlot = new Pulsante(this, destra + 88, this.alto + 252, {
      larghezza: 165,
      altezza: 28,
      testo: 'Come primaria (1ª)',
      dimensioneTesto: 13,
      alClic: () => this.impugnaInAltroSlot(),
    });
    this.scambiaArmiBtn = new Pulsante(this, destra + 275, this.alto + 252, {
      larghezza: 145,
      altezza: 28,
      testo: 'Scambia 1ª ↔ 2ª',
      dimensioneTesto: 13,
      alClic: () => {
        this.esito.setText(this.mondo.scambiaArmiEquipaggiate());
        this.ridisegna();
      },
    });
    this.add.text(destra, this.alto + 342, 'Barra dei preferiti: trascina qui pozioni e armi (fuori per toglierle)', {
      ...STILE_TESTO,
      fontSize: '12px',
      color: '#9aa7b8',
    });
    new Pulsante(this, cx + PANNELLO.larghezza / 2 - 90, this.alto + PANNELLO.altezza - 34, {
      larghezza: 150,
      altezza: 40,
      testo: 'Chiudi (I)',
      alClic: () => this.chiudi(),
    });
    this.add.text(this.sinistra + 24, this.alto + PANNELLO.altezza - 46, 'Clic: seleziona · Clic destro: usa o impugna · Trascina: nei preferiti', {
      ...STILE_TESTO,
      fontSize: '13px',
      color: '#9aa7b8',
    });

    this.preparaTrascinamento();
    this.input.keyboard?.on('keydown-I', () => this.chiudi());
    this.input.keyboard?.on('keydown-ESC', () => this.chiudi());
    // Se la partita cambia (pozione usata, borsa che amplia lo zaino) si ridisegna tutto.
    const ascolta = () => this.ridisegna();
    this.registry.events.on(`changedata-${CHIAVE_PARTITA}`, ascolta);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.registry.events.off(`changedata-${CHIAVE_PARTITA}`, ascolta));
    this.ridisegna();
  }

  private get mondo(): ScenaMondo {
    return this.scene.get(SCENA_MONDO) as ScenaMondo;
  }

  /** Centro dello spazio "i" della riga dei preferiti. */
  private centroPreferito(i: number): { x: number; y: number } {
    return { x: this.destra + PREFERITO.lato / 2 + i * PREFERITO.distanza, y: this.alto + 388 };
  }

  /** Quale spazio dei preferiti c'è sotto un punto dello schermo (o null). */
  private preferitoSotto(x: number, y: number): number | null {
    for (let i = 0; i < NUMERO_PREFERITI; i++) {
      const c = this.centroPreferito(i);
      if (Math.abs(x - c.x) <= PREFERITO.lato / 2 && Math.abs(y - c.y) <= PREFERITO.lato / 2) return i;
    }
    return null;
  }

  // ---- trascinamento ----

  /**
   * Il trascinamento di Phaser funziona a eventi, come il drag & drop HTML:
   * dragstart (si parte), drag (il mouse si muove), dragend (si lascia).
   * Gli eventi arrivano alla scena per qualunque oggetto "draggable": qui
   * decidiamo cosa fare in base a cosa si sta trascinando.
   */
  private preparaTrascinamento(): void {
    // Sotto i 6 pixel di movimento è un clic, non un trascinamento.
    this.input.dragDistanceThreshold = 6;
    this.input.on('dragstart', (p: Phaser.Input.Pointer, oggetto: Phaser.GameObjects.GameObject) => {
      const dati = oggetto.getData('trascina') as Trascinamento | undefined;
      if (!dati) return;
      this.trascinamento = dati;
      const definizione = this.dati.oggetti[dati.id];
      this.fantasma = this.add.graphics({ x: p.x, y: p.y }).setDepth(50).setAlpha(0.85);
      if (definizione) disegnaOggetto(this.fantasma, definizione, 40);
    });
    this.input.on('drag', (p: Phaser.Input.Pointer) => this.fantasma?.setPosition(p.x, p.y));
    this.input.on('dragend', (p: Phaser.Input.Pointer) => {
      const t = this.trascinamento;
      this.fantasma?.destroy();
      this.fantasma = null;
      this.trascinamento = null;
      this.appenaTrascinato = true;
      if (!t) return;
      const destinazione = this.preferitoSotto(p.x, p.y);
      if (destinazione !== null) {
        const errore = this.mondo.impostaPreferito(destinazione, t.id);
        this.esito.setText(errore ?? `${this.dati.oggetti[t.id]?.nome ?? t.id} nello spazio ${destinazione + 1} dei preferiti`);
      } else if (t.da === 'barra') {
        // Trascinato fuori dalla barra: il collegamento sparisce (l'oggetto resta nello zaino).
        this.mondo.rimuoviPreferito(t.indice);
        this.esito.setText(`Spazio ${t.indice + 1} dei preferiti svuotato`);
      }
      this.ridisegna();
    });
    // Arriva DOPO i "pointerup" dei singoli oggetti: azzera il segnale del trascinamento.
    this.input.on('pointerup', () => (this.appenaTrascinato = false));
  }

  // ---- disegno ----

  private ridisegna(): void {
    // Durante un trascinamento non si distrugge l'oggetto trascinato: si ridisegna alla fine.
    if (this.trascinamento) return;
    const partita = leggiPartita(this);
    const inv = partita.inventario;
    const occupati = inv.spazi.filter((s) => s !== null).length;
    this.titolo.setText(`Zaino — ${occupati} / ${inv.capacita} spazi`);

    // Svuotare e ricostruire la griglia è semplice e, con 24 spazi al massimo, velocissimo.
    this.griglia.removeAll(true);
    inv.spazi.forEach((pila, i) => {
      const x = this.sinistra + 24 + (i % COLONNE) * DISTANZA + SPAZIO / 2;
      const y = this.alto + 66 + Math.floor(i / COLONNE) * DISTANZA + SPAZIO / 2;
      const definizione = pila ? this.dati.oggetti[pila.id] : undefined;
      const bordo = definizione ? numero(colorePerRarita(definizione.rarita)) : 0x4a5568;
      const sfondo = this.add.rectangle(x, y, SPAZIO, SPAZIO, i === this.selezionato ? 0x3e4a5c : 0x10141c);
      sfondo.setStrokeStyle(i === this.selezionato ? 3 : 2, bordo);
      sfondo.setInteractive({ useHandCursor: pila !== null, draggable: pila !== null });
      if (pila) sfondo.setData('trascina', { da: 'zaino', id: pila.id } satisfies Trascinamento);
      sfondo.on('pointerover', () => {
        this.sopra = i;
        this.mostraDettagli(partita);
      });
      sfondo.on('pointerout', () => {
        this.sopra = null;
        this.mostraDettagli(partita);
      });
      // Il clic destro agisce subito; il sinistro seleziona al RILASCIO, così un
      // trascinamento non diventa anche una selezione.
      sfondo.on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (!pila || !p.rightButtonDown()) return;
        this.selezionato = i;
        this.esito.setText('');
        this.usaSelezionato();
      });
      sfondo.on('pointerup', (p: Phaser.Input.Pointer) => {
        if (!pila || this.appenaTrascinato || p.rightButtonReleased()) return;
        this.selezionato = i;
        this.esito.setText('');
        this.ridisegna();
      });
      this.griglia.add(sfondo);
      if (pila && definizione) {
        const icona = this.add.graphics({ x, y });
        disegnaOggetto(icona, definizione, 40);
        this.griglia.add(icona);
        if (pila.quantita > 1) this.griglia.add(this.numeroAngolo(x + SPAZIO / 2 - 4, y + SPAZIO / 2 - 2, String(pila.quantita), 14));
      }
    });
    this.disegnaPreferiti(partita);
    // La selezione non deve puntare a uno spazio rimasto vuoto.
    if (this.selezionato !== null && !inv.spazi[this.selezionato]) this.selezionato = null;
    this.mostraDettagli(partita);
  }

  /** La riga dei preferiti: uguale alla barra in basso, ma qui si trascina. */
  private disegnaPreferiti(partita: Partita): void {
    const tipoDi = (id: string) => this.dati.oggetti[id]?.tipo;
    for (let i = 0; i < NUMERO_PREFERITI; i++) {
      const { x, y } = this.centroPreferito(i);
      const azione = cosaFa(partita.preferiti, i, partita.inventario, partita.equipaggiamento, tipoDi);
      const sfondo = this.add.rectangle(x, y, PREFERITO.lato, PREFERITO.lato, 0x10141c).setStrokeStyle(2, 0x6b7686);
      this.griglia.add(sfondo);
      this.griglia.add(this.numeroAngolo(x - PREFERITO.lato / 2 + 3, y - PREFERITO.lato / 2 + 1, String(i + 1), 11, 0));
      if (azione.tipo === 'vuoto') continue;
      sfondo.setInteractive({ useHandCursor: true, draggable: true });
      sfondo.setData('trascina', { da: 'barra', id: azione.id, indice: i } satisfies Trascinamento);
      // Clic destro su uno spazio della barra: lo svuota (alternativa al trascinare fuori).
      sfondo.on('pointerdown', (p: Phaser.Input.Pointer) => p.rightButtonDown() && this.mondo.rimuoviPreferito(i));
      const definizione = this.dati.oggetti[azione.id];
      if (definizione) {
        const icona = this.add.graphics({ x, y });
        disegnaOggetto(icona, definizione, 34);
        const spento = azione.tipo === 'pozione' ? azione.quantita === 0 : !azione.inMano && azione.indiceZaino < 0;
        icona.setAlpha(spento ? 0.4 : 1);
        this.griglia.add(icona);
      }
      if (azione.tipo === 'pozione') this.griglia.add(this.numeroAngolo(x + PREFERITO.lato / 2 - 3, y + PREFERITO.lato / 2 - 1, String(azione.quantita), 12));
      if (azione.tipo === 'arma' && azione.inMano) sfondo.setStrokeStyle(3, 0x5fd35f);
    }
  }

  /** Un numerino con il bordo nero in un angolo (quantità o tasto). */
  private numeroAngolo(x: number, y: number, testo: string, dimensione: number, origine = 1): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, testo, { ...STILE_TESTO, fontSize: `${dimensione}px`, fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 })
      .setOrigin(origine, origine);
  }

  /** Dettagli dell'oggetto sotto il mouse, altrimenti di quello selezionato. */
  private mostraDettagli(partita: Partita): void {
    const indice = this.sopra ?? this.selezionato;
    const pila = indice !== null ? partita.inventario.spazi[indice] : null;
    const definizione = pila ? this.dati.oggetti[pila.id] : undefined;
    if (!pila || !definizione) {
      this.nomeOggetto.setText('');
      this.dettagli.setText(partita.inventario.spazi.some((s) => s) ? 'Passa il mouse su un oggetto.' : 'Lo zaino è vuoto.');
    } else {
      this.nomeOggetto.setText(definizione.nome).setColor(colorePerRarita(definizione.rarita));
      const righe = righeOggetto(pila.id, this.dati);
      if (pila.quantita > 1) righe.push('', `Quantità: ${pila.quantita}`);
      if (definizione.tipo === 'armatura') righe.push('', 'Si indossa dalla scheda del personaggio (C).');
      this.dettagli.setText(righe.join('\n'));
    }
    const selezione = this.selezionato !== null ? partita.inventario.spazi[this.selezionato] : null;
    const tipo = selezione ? this.dati.oggetti[selezione.id]?.tipo : undefined;
    // Lo stesso pulsante fa cose diverse a seconda dell'oggetto: bevi la pozione, impugna l'arma.
    this.usa.impostaTesto(tipo === 'arma' ? 'Impugna' : 'Usa');
    const usabile = selezione ? tipo === 'arma' || this.dati.oggetti[selezione.id]?.effetto !== undefined : false;
    this.usa.impostaAttivo(usabile);
    // Per le armi si può anche scegliere esplicitamente l'altro slot (primaria o secondaria), o scambiare le due impugnate.
    if (selezione && tipo === 'arma') {
      const slotPredefinito = this.dati.armi[selezione.id]?.slot ?? 'primaria';
      const altro = slotPredefinito === 'primaria' ? 'secondaria' : 'primaria';
      this.altroSlot.impostaTesto(altro === 'primaria' ? 'Come primaria (1ª)' : 'Come secondaria (2ª)');
      this.altroSlot.setVisible(true).impostaAttivo(true);
    } else {
      this.altroSlot.setVisible(false).impostaAttivo(false);
    }
    this.scambiaArmiBtn.setVisible(!!partita.equipaggiamento.secondaria).impostaAttivo(!!partita.equipaggiamento.secondaria);
    // Lettere e chiavi delle quest non si gettano: si perderebbero per sempre.
    this.getta.impostaAttivo(!!selezione && !èDiMissione(this.dati.oggetti[selezione.id]));
    this.aiPreferiti.impostaAttivo(tipo === 'pozione' || tipo === 'arma');
    const nome = (id: string | null) => (id ? (this.dati.oggetti[id]?.nome ?? id) : 'nessuna');
    this.inMano.setText(`In mano (1ª): ${nome(partita.equipaggiamento.primaria)} · Secondaria (2ª): ${nome(partita.equipaggiamento.secondaria)}`);
  }

  private impugnaInAltroSlot(): void {
    if (this.selezionato === null) return;
    const pila = leggiPartita(this).inventario.spazi[this.selezionato];
    if (!pila || this.dati.oggetti[pila.id]?.tipo !== 'arma') return;
    const slotPredefinito = this.dati.armi[pila.id]?.slot ?? 'primaria';
    const altro: 'primaria' | 'secondaria' = slotPredefinito === 'primaria' ? 'secondaria' : 'primaria';
    const messaggio = this.mondo.indossaDaZaino(this.selezionato, 0, altro);
    this.esito.setText(messaggio);
    this.ridisegna();
  }

  private usaSelezionato(): void {
    if (this.selezionato === null) return;
    const pila = leggiPartita(this).inventario.spazi[this.selezionato];
    const tipo = pila ? this.dati.oggetti[pila.id]?.tipo : undefined;
    if (tipo === 'armatura') {
      this.esito.setText('Le armature si indossano dalla scheda del personaggio (C).');
      return;
    }
    const messaggio = tipo === 'arma' ? this.mondo.indossaDaZaino(this.selezionato) : this.mondo.usaOggettoInventario(this.selezionato);
    this.esito.setText(messaggio ?? '');
    this.ridisegna();
  }

  /** Pulsante "Preferiti": l'oggetto selezionato va nel primo spazio libero della barra. */
  private mettiNeiPreferiti(): void {
    if (this.selezionato === null) return;
    const partita = leggiPartita(this);
    const pila = partita.inventario.spazi[this.selezionato];
    if (!pila) return;
    const già = partita.preferiti.indexOf(pila.id);
    if (già >= 0) {
      this.esito.setText(`È già nello spazio ${già + 1} dei preferiti`);
      return;
    }
    const libero = partita.preferiti.indexOf(null);
    if (libero < 0) {
      this.esito.setText('La barra è piena: trascinalo sopra uno spazio per sostituirlo');
      return;
    }
    const errore = this.mondo.impostaPreferito(libero, pila.id);
    this.esito.setText(errore ?? `Nello spazio ${libero + 1} dei preferiti (tasto ${libero + 1})`);
  }

  private gettaSelezionato(): void {
    if (this.selezionato === null) return;
    this.mondo.gettaOggetto(this.selezionato);
    this.esito.setText('Gettato a terra accanto a te.');
    this.selezionato = null;
    this.ridisegna();
  }

  private chiudi(): void {
    this.scene.stop();
    this.scene.resume(SCENA_MONDO);
  }
}

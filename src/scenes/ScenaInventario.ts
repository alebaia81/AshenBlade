// Lo zaino. Come la scheda, si apre sopra il mondo che resta in pausa.
// A sinistra la griglia degli spazi con le schede di filtro (Tutti, Equip, Pozioni, Missioni),
// a destra i dettagli dell'oggetto sotto il mouse (o selezionato), anteprima con confronto
// delle statistiche (+/- danno, critico, armatura, bonus), i pulsanti Usa / Indossa / Getta / Preferiti
// e, in basso, la riga della BARRA DEI PREFERITI.
// Clic: seleziona. Clic destro: usa al volo (pozioni) o impugna/indossa (armi/armature).

import { èDiMissione } from '../systems/oggetti';
import * as Phaser from 'phaser';
import { ALTEZZA_SCHERMO, CHIAVE_PARTITA, LARGHEZZA_SCHERMO, SCENA_INVENTARIO, SCENA_MONDO } from '../costanti';
import type { DatiGioco } from '../data/caricaDati';
import { confrontaConAttuale } from '../systems/equipaggiamento';
import type { Pila } from '../systems/inventario';
import { colorePerRarita } from '../systems/oggetti';
import { caratteristicheTotali, type Partita } from '../systems/partita';
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

type CategoriaInventario = 'tutto' | 'equip' | 'consumabili' | 'missione';

interface SlotGriglia {
  pila: Pila | null;
  indiceZaino: number | null;
  daTasca: boolean;
  indiceTasca?: number;
}

export class ScenaInventario extends Phaser.Scene {
  private categoria: CategoriaInventario = 'tutto';
  private selezionato: number | null = null;
  private selezionatoTasca: number | null = null;
  private sopraSlot: SlotGriglia | null = null;

  /** Tutto ciò che si ridisegna a ogni cambiamento sta qui dentro e si svuota ogni volta. */
  private griglia!: Phaser.GameObjects.Container;
  private confrontoContainer!: Phaser.GameObjects.Container;
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

  private tabTutto!: Pulsante;
  private tabEquip!: Pulsante;
  private tabConsumabili!: Pulsante;
  private tabMissioni!: Pulsante;

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
    this.categoria = 'tutto';
    this.selezionato = null;
    this.selezionatoTasca = null;
    this.sopraSlot = null;
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

    this.titolo = this.add.text(this.sinistra + 24, this.alto + 14, '', { ...STILE_TITOLO, fontSize: '18px' });

    // Schede di filtro categorie
    this.tabTutto = new Pulsante(this, this.sinistra + 50, this.alto + 42, {
      larghezza: 52,
      altezza: 22,
      testo: 'Tutti',
      dimensioneTesto: 12,
      alClic: () => this.cambiaCategoria('tutto'),
    });
    this.tabEquip = new Pulsante(this, this.sinistra + 108, this.alto + 42, {
      larghezza: 56,
      altezza: 22,
      testo: 'Equip',
      dimensioneTesto: 12,
      alClic: () => this.cambiaCategoria('equip'),
    });
    this.tabConsumabili = new Pulsante(this, this.sinistra + 171, this.alto + 42, {
      larghezza: 62,
      altezza: 22,
      testo: 'Pozioni',
      dimensioneTesto: 12,
      alClic: () => this.cambiaCategoria('consumabili'),
    });
    this.tabMissioni = new Pulsante(this, this.sinistra + 244, this.alto + 42, {
      larghezza: 76,
      altezza: 22,
      testo: 'Missioni',
      dimensioneTesto: 12,
      alClic: () => this.cambiaCategoria('missione'),
    });

    this.griglia = this.add.container(0, 0);

    // Pannello dettagli e confronto a destra
    this.inMano = this.add.text(destra, this.alto + 14, '', { ...STILE_TESTO, fontSize: '12px', color: '#c8c8c8' });
    this.nomeOggetto = this.add.text(destra, this.alto + 38, '', { ...STILE_TITOLO, fontSize: '18px', wordWrap: { width: 380 } });
    this.dettagli = this.add.text(destra, this.alto + 64, '', { ...STILE_TESTO, fontSize: '13px', wordWrap: { width: 380 }, lineSpacing: 2 });
    this.confrontoContainer = this.add.container(destra, this.alto + 148);

    this.altroSlot = new Pulsante(this, destra + 88, this.alto + 236, {
      larghezza: 165,
      altezza: 28,
      testo: 'Come primaria (1ª)',
      dimensioneTesto: 13,
      alClic: () => this.impugnaInAltroSlot(),
    });
    this.scambiaArmiBtn = new Pulsante(this, destra + 275, this.alto + 236, {
      larghezza: 145,
      altezza: 28,
      testo: 'Scambia 1ª ↔ 2ª',
      dimensioneTesto: 13,
      alClic: () => {
        this.esito.setText(this.mondo.scambiaArmiEquipaggiate());
        this.ridisegna();
      },
    });

    const pulsante = (dx: number, testo: string, alClic: () => void) =>
      new Pulsante(this, destra + dx, this.alto + 274, { larghezza: 110, altezza: 34, testo, alClic });
    this.usa = pulsante(60, 'Usa', () => this.usaSelezionato());
    this.getta = pulsante(190, 'Getta', () => this.gettaSelezionato());
    this.aiPreferiti = pulsante(320, 'Preferiti', () => this.mettiNeiPreferiti());

    this.esito = this.add.text(destra, this.alto + 312, '', { ...STILE_TESTO, fontSize: '13px', color: '#ffe680', wordWrap: { width: 380 } });
    this.add.text(destra, this.alto + 338, 'Barra dei preferiti: trascina qui pozioni e armi (fuori per toglierle)', {
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
    this.add.text(this.sinistra + 24, this.alto + PANNELLO.altezza - 34, 'Clic: seleziona · Clic destro: usa / indossa · Trascina: nei preferiti', {
      ...STILE_TESTO,
      fontSize: '12px',
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

  private cambiaCategoria(cat: CategoriaInventario): void {
    this.categoria = cat;
    this.selezionato = null;
    this.selezionatoTasca = null;
    this.sopraSlot = null;
    this.esito.setText('');
    this.ridisegna();
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

  private preparaTrascinamento(): void {
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
        this.mondo.rimuoviPreferito(t.indice);
        this.esito.setText(`Spazio ${t.indice + 1} dei preferiti svuotato`);
      }
      this.ridisegna();
    });
    this.input.on('pointerup', () => (this.appenaTrascinato = false));
  }

  // ---- disegno ----

  private preparaSlotDaMostrare(partita: Partita): SlotGriglia[] {
    const inv = partita.inventario;
    const cat = this.categoria;

    if (cat === 'missione') {
      const tasca = partita.tascaMissioni ?? [];
      const slots: SlotGriglia[] = tasca.map((pila, idx) => ({
        pila,
        indiceZaino: null,
        daTasca: true,
        indiceTasca: idx,
      }));
      while (slots.length < 12) {
        slots.push({ pila: null, indiceZaino: null, daTasca: true });
      }
      return slots;
    }

    if (cat === 'equip') {
      const slots: SlotGriglia[] = [];
      inv.spazi.forEach((pila, i) => {
        if (!pila) return;
        const def = this.dati.oggetti[pila.id];
        if (def && (def.tipo === 'arma' || def.tipo === 'armatura')) {
          slots.push({ pila, indiceZaino: i, daTasca: false });
        }
      });
      while (slots.length < 12) {
        slots.push({ pila: null, indiceZaino: null, daTasca: false });
      }
      return slots;
    }

    if (cat === 'consumabili') {
      const slots: SlotGriglia[] = [];
      inv.spazi.forEach((pila, i) => {
        if (!pila) return;
        const def = this.dati.oggetti[pila.id];
        if (def && (def.tipo === 'pozione' || def.tipo === 'pergamena' || def.effetto !== undefined)) {
          slots.push({ pila, indiceZaino: i, daTasca: false });
        }
      });
      while (slots.length < 12) {
        slots.push({ pila: null, indiceZaino: null, daTasca: false });
      }
      return slots;
    }

    // Default 'tutto': mostra gli spazi completi dello zaino
    return inv.spazi.map((pila, i) => ({
      pila,
      indiceZaino: i,
      daTasca: false,
    }));
  }

  private ridisegna(): void {
    if (this.trascinamento) return;
    const partita = leggiPartita(this);
    const inv = partita.inventario;
    const occupati = inv.spazi.filter((s) => s !== null).length;
    const nMissioni = (partita.tascaMissioni ?? []).length;

    // Aggiorna stato e aspetto schede
    this.tabTutto.impostaSelezionato(this.categoria === 'tutto');
    this.tabEquip.impostaSelezionato(this.categoria === 'equip');
    this.tabConsumabili.impostaSelezionato(this.categoria === 'consumabili');
    this.tabMissioni.impostaTesto(nMissioni > 0 ? `Miss. (${nMissioni})` : 'Missioni');
    this.tabMissioni.impostaSelezionato(this.categoria === 'missione');

    if (this.categoria === 'missione') {
      this.titolo.setText(`Missioni & Chiavi — ${nMissioni} oggetti (Peso 0)`);
    } else if (this.categoria === 'equip') {
      this.titolo.setText(`Equipaggiamento nello zaino`);
    } else if (this.categoria === 'consumabili') {
      this.titolo.setText(`Pozioni e consumabili nello zaino`);
    } else {
      this.titolo.setText(`Zaino — ${occupati} / ${inv.capacita} spazi`);
    }

    this.griglia.removeAll(true);
    const slots = this.preparaSlotDaMostrare(partita);

    slots.forEach((slot, visualIndex) => {
      const x = this.sinistra + 24 + (visualIndex % COLONNE) * DISTANZA + SPAZIO / 2;
      const y = this.alto + 68 + Math.floor(visualIndex / COLONNE) * DISTANZA + SPAZIO / 2;
      const pila = slot.pila;
      const definizione = pila ? this.dati.oggetti[pila.id] : undefined;
      const bordo = definizione ? numero(colorePerRarita(definizione.rarita)) : 0x4a5568;

      const èSelezionato = slot.daTasca
        ? (this.selezionatoTasca !== null && slot.indiceTasca === this.selezionatoTasca)
        : (this.selezionato !== null && slot.indiceZaino === this.selezionato);

      const sfondo = this.add.rectangle(x, y, SPAZIO, SPAZIO, èSelezionato ? 0x3e4a5c : 0x10141c);
      sfondo.setStrokeStyle(èSelezionato ? 3 : 2, bordo);

      const interattivo = pila !== null;
      sfondo.setInteractive({ useHandCursor: interattivo, draggable: interattivo && !slot.daTasca });
      if (pila && !slot.daTasca) sfondo.setData('trascina', { da: 'zaino', id: pila.id } satisfies Trascinamento);

      sfondo.on('pointerover', () => {
        this.sopraSlot = slot;
        this.mostraDettagli(partita);
      });
      sfondo.on('pointerout', () => {
        this.sopraSlot = null;
        this.mostraDettagli(partita);
      });

      sfondo.on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (!pila || !p.rightButtonDown()) return;
        if (slot.daTasca) return;
        this.selezionato = slot.indiceZaino;
        this.selezionatoTasca = null;
        this.esito.setText('');
        this.usaSelezionato();
      });

      sfondo.on('pointerup', (p: Phaser.Input.Pointer) => {
        if (!pila || this.appenaTrascinato || p.rightButtonReleased()) return;
        if (slot.daTasca) {
          this.selezionatoTasca = slot.indiceTasca ?? null;
          this.selezionato = null;
        } else {
          this.selezionato = slot.indiceZaino;
          this.selezionatoTasca = null;
        }
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

    // Ripulisci selezioni se l'oggetto non esiste più
    if (this.selezionato !== null && !inv.spazi[this.selezionato]) this.selezionato = null;
    if (this.selezionatoTasca !== null && !(partita.tascaMissioni ?? [])[this.selezionatoTasca]) this.selezionatoTasca = null;

    this.mostraDettagli(partita);
  }

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

  private numeroAngolo(x: number, y: number, testo: string, dimensione: number, origine = 1): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, testo, { ...STILE_TESTO, fontSize: `${dimensione}px`, fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 })
      .setOrigin(origine, origine);
  }

  /** Dettagli dell'oggetto sotto il mouse, altrimenti di quello selezionato. */
  private mostraDettagli(partita: Partita): void {
    let pila: Pila | null = null;
    let daTasca = false;

    if (this.sopraSlot?.pila) {
      pila = this.sopraSlot.pila;
      daTasca = this.sopraSlot.daTasca;
    } else if (this.selezionato !== null && partita.inventario.spazi[this.selezionato]) {
      pila = partita.inventario.spazi[this.selezionato] ?? null;
      daTasca = false;
    } else if (this.selezionatoTasca !== null && (partita.tascaMissioni ?? [])[this.selezionatoTasca]) {
      pila = (partita.tascaMissioni ?? [])[this.selezionatoTasca]!;
      daTasca = true;
    }

    const definizione = pila ? this.dati.oggetti[pila.id] : undefined;
    this.confrontoContainer.removeAll(true);

    if (!pila || !definizione) {
      this.nomeOggetto.setText('');
      this.dettagli.setText(partita.inventario.spazi.some((s) => s) ? 'Passa il mouse su un oggetto.' : 'Lo zaino è vuoto.');
    } else {
      this.nomeOggetto.setText(definizione.nome).setColor(colorePerRarita(definizione.rarita));
      const righe = righeOggetto(pila.id, this.dati);
      if (pila.quantita > 1) righe.push('', `Quantità: ${pila.quantita}`);
      if (daTasca || definizione.tipo === 'missione') {
        righe.push('', 'Oggetto di missione: peso 0 (non occupa spazio nello zaino).');
      }
      this.dettagli.setText(righe.join('\n'));

      // Anteprima e confronto statistiche se equipaggiabile
      const confronto = confrontaConAttuale(
        pila.id,
        partita.equipaggiamento,
        this.dati.armi,
        this.dati.armature,
        caratteristicheTotali(partita, this.dati.indossabili),
      );

      if (confronto) {
        let dy = 0;
        const txtHeader = this.add.text(0, dy, `Confronto con: ${confronto.nomeAttuale}`, {
          ...STILE_TESTO,
          fontSize: '12px',
          color: '#ffd23f',
          fontStyle: 'bold',
        });
        this.confrontoContainer.add(txtHeader);
        dy += 18;

        if (confronto.tipo === 'arma') {
          const { deltaDanno, deltaCritico } = confronto;
          const strDanno = deltaDanno > 0 ? `▲ +${deltaDanno} Danno` : deltaDanno < 0 ? `▼ ${deltaDanno} Danno` : '= Stesso Danno';
          const colDanno = deltaDanno > 0 ? '#5fd35f' : deltaDanno < 0 ? '#ff6b6b' : '#9aa7b8';
          const tD = this.add.text(0, dy, strDanno, { ...STILE_TESTO, fontSize: '13px', color: colDanno, fontStyle: 'bold' });
          this.confrontoContainer.add(tD);
          dy += 16;

          if (deltaCritico !== 0) {
            const strCrit = deltaCritico > 0 ? `▲ +${deltaCritico}% Critico` : `▼ ${deltaCritico}% Critico`;
            const colCrit = deltaCritico > 0 ? '#5fd35f' : '#ff6b6b';
            const tC = this.add.text(0, dy, strCrit, { ...STILE_TESTO, fontSize: '13px', color: colCrit });
            this.confrontoContainer.add(tC);
            dy += 16;
          }
        } else {
          const { deltaArmatura, deltaBonus } = confronto;
          const strArm = deltaArmatura > 0 ? `▲ +${deltaArmatura} Difesa` : deltaArmatura < 0 ? `▼ ${deltaArmatura} Difesa` : '= Stessa Difesa';
          const colArm = deltaArmatura > 0 ? '#5fd35f' : deltaArmatura < 0 ? '#ff6b6b' : '#9aa7b8';
          const tA = this.add.text(0, dy, strArm, { ...STILE_TESTO, fontSize: '13px', color: colArm, fontStyle: 'bold' });
          this.confrontoContainer.add(tA);
          dy += 16;

          for (const [stat, val] of Object.entries(deltaBonus)) {
            if (!val) continue;
            const strB = val > 0 ? `▲ +${val} ${stat.toUpperCase()}` : `▼ ${val} ${stat.toUpperCase()}`;
            const colB = val > 0 ? '#5fd35f' : '#ff6b6b';
            const tB = this.add.text(0, dy, strB, { ...STILE_TESTO, fontSize: '12px', color: colB });
            this.confrontoContainer.add(tB);
            dy += 16;
          }
        }
      }
    }

    // Gestione pulsanti d'azione (in base alla selezione effettiva)
    const selZaino = this.selezionato !== null ? partita.inventario.spazi[this.selezionato] : null;
    const selTasca = this.selezionatoTasca !== null ? (partita.tascaMissioni ?? [])[this.selezionatoTasca] : null;

    if (selTasca) {
      this.usa.impostaTesto('Usa').impostaAttivo(false);
      this.getta.impostaAttivo(false);
      this.aiPreferiti.impostaAttivo(false);
      this.altroSlot.setVisible(false).impostaAttivo(false);
    } else if (selZaino) {
      const tipo = this.dati.oggetti[selZaino.id]?.tipo;
      const usabile = tipo === 'arma' || tipo === 'armatura' || this.dati.oggetti[selZaino.id]?.effetto !== undefined;
      const etichettaUsa = tipo === 'arma' ? 'Impugna' : tipo === 'armatura' ? 'Indossa' : 'Usa';
      this.usa.impostaTesto(etichettaUsa).impostaAttivo(usabile);

      if (tipo === 'arma') {
        const slotPredefinito = this.dati.armi[selZaino.id]?.slot ?? 'primaria';
        const altro = slotPredefinito === 'primaria' ? 'secondaria' : 'primaria';
        this.altroSlot.impostaTesto(altro === 'primaria' ? 'Come primaria (1ª)' : 'Come secondaria (2ª)');
        this.altroSlot.setVisible(true).impostaAttivo(true);
      } else {
        this.altroSlot.setVisible(false).impostaAttivo(false);
      }

      this.getta.impostaAttivo(!èDiMissione(this.dati.oggetti[selZaino.id]));
      this.aiPreferiti.impostaAttivo(tipo === 'pozione' || tipo === 'arma');
    } else {
      this.usa.impostaTesto('Usa').impostaAttivo(false);
      this.getta.impostaAttivo(false);
      this.aiPreferiti.impostaAttivo(false);
      this.altroSlot.setVisible(false).impostaAttivo(false);
    }

    this.scambiaArmiBtn.setVisible(!!partita.equipaggiamento.secondaria).impostaAttivo(!!partita.equipaggiamento.secondaria);
    const nome = (id: string | null) => (id ? (this.dati.oggetti[id]?.nome ?? id) : 'nessuna');
    this.inMano.setText(`In mano (1ª): ${nome(partita.equipaggiamento.primaria)} · 2ª: ${nome(partita.equipaggiamento.secondaria)}`);
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
    if (!pila) return;
    const tipo = this.dati.oggetti[pila.id]?.tipo;
    let messaggio: string | null = null;
    if (tipo === 'arma' || tipo === 'armatura') {
      messaggio = this.mondo.indossaDaZaino(this.selezionato);
    } else {
      messaggio = this.mondo.usaOggettoInventario(this.selezionato);
    }
    this.esito.setText(messaggio ?? '');
    this.ridisegna();
  }

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

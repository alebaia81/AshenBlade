// La fucina di Bruno. Si apre dal dialogo ("Lavoriamo."), con il mondo in pausa.
// Scheda "Crea": a sinistra le ricette conosciute, a destra cosa serve per la
// ricetta scelta (in verde ciò che hai, in rosso ciò che manca) e il pulsante Crea.
// Scheda "Potenzia" (6b): a sinistra le armi che hai (in mano e nello zaino),
// a destra il livello attuale e il prossimo, cosa serve e il pulsante Potenzia.
// Le regole stanno in systems/crafting.ts e systems/potenziamento.ts.

import * as Phaser from 'phaser';
import { ALTEZZA_SCHERMO, CHIAVE_PARTITA, LARGHEZZA_SCHERMO, SCENA_FUCINA, SCENA_MONDO } from '../costanti';
import type { DatiGioco } from '../data/caricaDati';
import { cosaManca, crea, ricetteConosciute, type Ricetta } from '../systems/crafting';
import { colorePerRarita } from '../systems/oggetti';
import { costoPotenziamento, livelloDi, MASSIMO_POTENZIAMENTO, potenzia, type DoveArma } from '../systems/potenziamento';
import { dannoBaseArma } from '../systems/combattimento';
import { righeOggetto } from './interfaccia/descrizioni';
import { disegnaOggetto } from './interfaccia/iconeOggetti';
import { Pulsante } from './interfaccia/Pulsante';
import { STILE_TESTO, STILE_TITOLO } from './interfaccia/testi';
import { leggiPartita, scriviPartita } from './statoCondiviso';

const PANNELLO = { larghezza: 900, altezza: 480 };
const RIGA = 46;
const VERDE = '#8fe08f';
const ROSSO = '#ff8a8a';
/** Righe che stanno nell'elenco prima del suggerimento in fondo. */
const RIGHE_VISIBILI = 7;

/** Un'arma che si può portare dal fabbro, con dove si trova. */
interface ArmaInOfficina {
  id: string;
  dove: DoveArma;
  etichetta: string;
}

const stessoPosto = (a: DoveArma, b: DoveArma) => JSON.stringify(a) === JSON.stringify(b);

export class ScenaFucina extends Phaser.Scene {
  private scheda: 'crea' | 'potenzia' = 'crea';
  private scelta: string | null = null;
  private armaScelta: DoveArma | null = null;
  private schede!: { crea: Pulsante; potenzia: Pulsante };
  private contenuto!: Phaser.GameObjects.Container;
  private monete!: Phaser.GameObjects.Text;
  private esito!: Phaser.GameObjects.Text;
  private sinistra = 0;
  private alto = 0;

  constructor(private readonly dati: DatiGioco) {
    super(SCENA_FUCINA);
  }

  create(): void {
    const cx = LARGHEZZA_SCHERMO / 2;
    const cy = ALTEZZA_SCHERMO / 2;
    this.sinistra = cx - PANNELLO.larghezza / 2;
    this.alto = cy - PANNELLO.altezza / 2;
    const { sinistra, alto } = this;
    this.scelta = null;
    this.armaScelta = null;
    this.scheda = 'crea';

    this.add.rectangle(cx, cy, LARGHEZZA_SCHERMO, ALTEZZA_SCHERMO, 0x000000, 0.55).setInteractive();
    this.add.rectangle(cx, cy, PANNELLO.larghezza, PANNELLO.altezza, 0x231b17, 0.97).setStrokeStyle(2, 0xc0602a);
    this.add.text(sinistra + 24, alto + 16, 'La fucina di Bruno', { ...STILE_TITOLO, fontSize: '22px' });
    // Le due schede, come nella scheda del personaggio.
    this.schede = {
      crea: new Pulsante(this, sinistra + 420, alto + 30, { larghezza: 120, altezza: 32, testo: 'Crea', dimensioneTesto: 14, alClic: () => this.mostraScheda('crea') }),
      potenzia: new Pulsante(this, sinistra + 550, alto + 30, { larghezza: 130, altezza: 32, testo: 'Potenzia', dimensioneTesto: 14, alClic: () => this.mostraScheda('potenzia') }),
    };
    const icona = this.add.graphics({ x: sinistra + PANNELLO.larghezza - 120, y: alto + 30 });
    disegnaOggetto(icona, this.dati.oggetti['monete']!, 20);
    this.monete = this.add.text(sinistra + PANNELLO.larghezza - 104, alto + 19, '', { ...STILE_TESTO, fontSize: '20px', color: '#ffe680', fontStyle: 'bold' });
    this.esito = this.add.text(sinistra + 400, alto + 400, '', { ...STILE_TESTO, fontSize: '14px', color: '#ffe680', wordWrap: { width: 330 } });
    new Pulsante(this, sinistra + PANNELLO.larghezza - 90, alto + PANNELLO.altezza - 32, { larghezza: 150, altezza: 40, testo: 'Chiudi (Esc)', alClic: () => this.chiudi() });

    this.contenuto = this.add.container(0, 0);
    this.input.keyboard?.on('keydown-ESC', () => this.chiudi());
    const ascolta = () => this.ridisegna();
    this.registry.events.on(`changedata-${CHIAVE_PARTITA}`, ascolta);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.registry.events.off(`changedata-${CHIAVE_PARTITA}`, ascolta));
    this.ridisegna();
  }

  private get conosciute(): Ricetta[] {
    return ricetteConosciute(Object.values(this.dati.ricette), leggiPartita(this).ricette);
  }

  private mostraScheda(scheda: 'crea' | 'potenzia'): void {
    this.scheda = scheda;
    this.esito.setText('');
    this.ridisegna();
  }

  private ridisegna(): void {
    this.schede.crea.impostaSelezionato(this.scheda === 'crea');
    this.schede.potenzia.impostaSelezionato(this.scheda === 'potenzia');
    if (this.scheda === 'potenzia') this.ridisegnaPotenzia();
    else this.ridisegnaCrea();
  }

  private ridisegnaCrea(): void {
    const partita = leggiPartita(this);
    const { sinistra, alto } = this;
    this.monete.setText(String(partita.monete));
    this.contenuto.removeAll(true);
    const ricette = this.conosciute;
    if (!this.scelta && ricette.length > 0) this.scelta = ricette[0]!.id;

    // ---- elenco delle ricette ----
    ricette.forEach((r, i) => {
      const o = this.dati.oggetti[r.risultato]!;
      const y = alto + 92 + i * RIGA;
      const scelta = r.id === this.scelta;
      const pronta = cosaManca(partita.inventario, partita.monete, r).ok;
      const sfondo = this.add.rectangle(sinistra + 24 + 170, y, 340, RIGA - 4, scelta ? 0x4a3a2c : 0x14100c).setStrokeStyle(scelta ? 2 : 1, scelta ? 0xffd23f : 0x5a4a3a);
      sfondo.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        this.scelta = r.id;
        this.esito.setText('');
        this.ridisegna();
      });
      const icona = this.add.graphics({ x: sinistra + 44, y });
      disegnaOggetto(icona, o, 30);
      this.contenuto.add([
        sfondo,
        icona,
        this.add.text(sinistra + 66, y - 10, o.nome, { ...STILE_TESTO, fontSize: '15px', color: colorePerRarita(o.rarita) }).setOrigin(0, 0.5),
        this.add.text(sinistra + 66, y + 10, pronta ? 'hai tutto' : 'mancano materiali', { ...STILE_TESTO, fontSize: '12px', color: pronta ? VERDE : '#9a8a7a' }).setOrigin(0, 0.5),
      ]);
    });
    this.contenuto.add(
      this.add.text(sinistra + 24, alto + PANNELLO.altezza - 46, `Ricette conosciute: ${ricette.length}. Altre si imparano dalle pergamene (usale dallo zaino).`, {
        ...STILE_TESTO,
        fontSize: '13px',
        color: '#c8b8a0',
      }),
    );
    this.dettagli();
  }

  /** A destra: l'arma, i materiali che servono e il pulsante. */
  private dettagli(): void {
    const partita = leggiPartita(this);
    const r = this.scelta ? this.dati.ricette[this.scelta] : undefined;
    if (!r) return;
    const x = this.sinistra + 400;
    const alto = this.alto;
    const o = this.dati.oggetti[r.risultato]!;
    const manca = cosaManca(partita.inventario, partita.monete, r);
    this.contenuto.add([
      this.add.text(x, alto + 72, o.nome, { ...STILE_TITOLO, fontSize: '19px', color: colorePerRarita(o.rarita) }),
      this.add.text(x, alto + 102, righeOggetto(r.risultato, this.dati).filter((t) => t !== '').slice(0, 4).join('\n'), { ...STILE_TESTO, fontSize: '13px', color: '#d8d0c0', wordWrap: { width: 470 } }),
      this.add.text(x, alto + 200, 'Servono:', { ...STILE_TESTO, fontSize: '14px', fontStyle: 'bold' }),
    ]);
    manca.materiali.forEach((m, i) => {
      const ok = m.hai >= m.servono;
      const nome = this.dati.oggetti[m.id]?.nome ?? m.id;
      const y = alto + 226 + i * 24;
      const icona = this.add.graphics({ x: x + 10, y: y + 8 });
      disegnaOggetto(icona, this.dati.oggetti[m.id]!, 18);
      this.contenuto.add([icona, this.add.text(x + 26, y, `${ok ? '✔' : '✘'} ${m.servono} × ${nome}  (ne hai ${m.hai})`, { ...STILE_TESTO, fontSize: '14px', color: ok ? VERDE : ROSSO })]);
    });
    const yMonete = alto + 226 + manca.materiali.length * 24;
    const moneteOk = manca.monete.hai >= manca.monete.servono;
    this.contenuto.add(this.add.text(x + 26, yMonete, `${moneteOk ? '✔' : '✘'} ${r.monete} monete per il lavoro di Bruno`, { ...STILE_TESTO, fontSize: '14px', color: moneteOk ? VERDE : ROSSO }));
    const pulsante = new Pulsante(this, x + 80, alto + 370, { larghezza: 160, altezza: 40, testo: 'Crea', alClic: () => this.creaScelta() });
    pulsante.impostaAttivo(manca.ok);
    this.contenuto.add(pulsante);
  }

  private creaScelta(): void {
    const r = this.scelta ? this.dati.ricette[this.scelta] : undefined;
    if (!r) return;
    const partita = leggiPartita(this);
    const pile = Object.fromEntries(Object.values(this.dati.oggetti).map((o) => [o.id, o.pila]));
    const esito = crea(partita, r, partita.ricette, pile);
    if (!esito.ok) {
      this.esito.setText(esito.errore).setColor(ROSSO);
      return;
    }
    this.esito.setText(`Bruno batte il ferro… Ecco: ${this.dati.oggetti[r.risultato]!.nome}! È nel tuo zaino.`).setColor('#ffe680');
    scriviPartita(this, esito.stato);
  }

  // ---------------- scheda Potenzia ----------------

  /** Prima quelle in mano, poi quelle nello zaino, nell'ordine degli spazi. */
  private armiDisponibili(): ArmaInOfficina[] {
    const { equipaggiamento, inventario } = leggiPartita(this);
    const armi: ArmaInOfficina[] = [];
    for (const spazio of ['primaria', 'secondaria'] as const) {
      const id = equipaggiamento[spazio];
      if (id) armi.push({ id, dove: { spazio }, etichetta: spazio === 'primaria' ? 'in mano' : 'arma secondaria' });
    }
    inventario.spazi.forEach((p, i) => {
      if (p && this.dati.armi[p.id]) armi.push({ id: p.id, dove: { zaino: i }, etichetta: `zaino, spazio ${i + 1}` });
    });
    return armi;
  }

  private ridisegnaPotenzia(): void {
    const partita = leggiPartita(this);
    const { sinistra, alto } = this;
    this.monete.setText(String(partita.monete));
    this.contenuto.removeAll(true);
    const armi = this.armiDisponibili();
    // Se l'arma scelta non c'è più (venduta, spostata), si riparte dalla prima.
    if (!this.armaScelta || !armi.some((a) => stessoPosto(a.dove, this.armaScelta!))) this.armaScelta = armi[0]?.dove ?? null;

    armi.slice(0, RIGHE_VISIBILI).forEach((a, i) => {
      const o = this.dati.oggetti[a.id]!;
      const y = alto + 92 + i * RIGA;
      const scelta = stessoPosto(a.dove, this.armaScelta!);
      const { livello } = livelloDi(a.id);
      const sfondo = this.add.rectangle(sinistra + 24 + 170, y, 340, RIGA - 4, scelta ? 0x4a3a2c : 0x14100c).setStrokeStyle(scelta ? 2 : 1, scelta ? 0xffd23f : 0x5a4a3a);
      sfondo.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        this.armaScelta = a.dove;
        this.esito.setText('');
        this.ridisegna();
      });
      const icona = this.add.graphics({ x: sinistra + 44, y });
      disegnaOggetto(icona, o, 30);
      const stato = livello >= MASSIMO_POTENZIAMENTO ? 'Liv. 5 (Max)' : `Liv. ${livello + 1} → Liv. ${livello + 2}`;
      this.contenuto.add([
        sfondo,
        icona,
        this.add.text(sinistra + 66, y - 10, o.nome, { ...STILE_TESTO, fontSize: '15px', color: colorePerRarita(o.rarita) }).setOrigin(0, 0.5),
        this.add.text(sinistra + 66, y + 10, `${a.etichetta} · ${stato}`, { ...STILE_TESTO, fontSize: '12px', color: '#9a8a7a' }).setOrigin(0, 0.5),
      ]);
    });
    const altre = armi.length - RIGHE_VISIBILI;
    const nota = altre > 0 ? `Altre ${altre} armi nello zaino: riordinalo per vederle qui.` : 'Danno deterministico: nessun tiro di dadi, potenziamento garantito fino a Liv. 5.';
    this.contenuto.add(this.add.text(sinistra + 24, alto + PANNELLO.altezza - 46, nota, { ...STILE_TESTO, fontSize: '13px', color: '#c8b8a0' }));
    this.dettagliPotenzia(armi);
  }

  /** A destra: com'è ora, come sarà, quanto costa. */
  private dettagliPotenzia(armi: ArmaInOfficina[]): void {
    const a = armi.find((x) => this.armaScelta && stessoPosto(x.dove, this.armaScelta));
    const x = this.sinistra + 400;
    const alto = this.alto;
    if (!a) {
      this.contenuto.add(this.add.text(x, alto + 80, 'Non hai armi da potenziare.', { ...STILE_TESTO, fontSize: '15px' }));
      return;
    }
    const partita = leggiPartita(this);
    const arma = this.dati.armi[a.id]!;
    const { base, livello } = livelloDi(a.id);
    const costo = costoPotenziamento(livello, arma.rarita, this.dati.potenziamenti);
    const dAttuale = dannoBaseArma(arma, livello);
    this.contenuto.add(this.add.text(x, alto + 72, `${arma.nome} (Liv. ${livello + 1})`, { ...STILE_TITOLO, fontSize: '19px', color: colorePerRarita(arma.rarita) }));
    if (!costo) {
      this.contenuto.add(this.add.text(x, alto + 106, `Danno: ${dAttuale} (base) + ${arma.caratteristica}\n\nÈ già al massimo (Liv. ${MASSIMO_POTENZIAMENTO}). Bruno non può fare di meglio.`, { ...STILE_TESTO, fontSize: '14px', color: '#d8d0c0' }));
      return;
    }
    const dProssimo = dannoBaseArma(arma, livello + 1);
    const incremento = dProssimo - dAttuale;
    const prossima = this.dati.armi[`${base}+${livello + 1}`]!;
    this.contenuto.add([
      this.add.text(x, alto + 104, `Danno attuale:   ${dAttuale} (base) + ${arma.caratteristica} (Liv. ${livello + 1})`, { ...STILE_TESTO, fontSize: '14px', color: '#d8d0c0' }),
      this.add.text(x, alto + 126, `Diventa ${prossima.nome}:   Liv. ${livello + 1} → Liv. ${livello + 2}: Danno ${dAttuale} → ${dProssimo} (+${incremento})`, { ...STILE_TESTO, fontSize: '14px', color: VERDE }),
      this.add.text(x, alto + 148, `Valore: ${arma.prezzo} → ${prossima.prezzo} monete`, { ...STILE_TESTO, fontSize: '13px', color: '#9a8a7a' }),
      this.add.text(x, alto + 200, 'Servono:', { ...STILE_TESTO, fontSize: '14px', fontStyle: 'bold' }),
    ]);
    const manca = cosaManca(partita.inventario, partita.monete, costo);
    manca.materiali.forEach((m, i) => {
      const ok = m.hai >= m.servono;
      const nome = this.dati.oggetti[m.id]?.nome ?? m.id;
      const y = alto + 226 + i * 24;
      const icona = this.add.graphics({ x: x + 10, y: y + 8 });
      disegnaOggetto(icona, this.dati.oggetti[m.id]!, 18);
      this.contenuto.add([icona, this.add.text(x + 26, y, `${ok ? '✔' : '✘'} ${m.servono} × ${nome}  (ne hai ${m.hai})`, { ...STILE_TESTO, fontSize: '14px', color: ok ? VERDE : ROSSO })]);
    });
    const moneteOk = partita.monete >= costo.monete;
    this.contenuto.add(
      this.add.text(x + 26, alto + 226 + manca.materiali.length * 24, `${moneteOk ? '✔' : '✘'} ${costo.monete} monete per il lavoro di Bruno`, { ...STILE_TESTO, fontSize: '14px', color: moneteOk ? VERDE : ROSSO }),
    );
    const pulsante = new Pulsante(this, x + 80, alto + 370, { larghezza: 160, altezza: 40, testo: 'Potenzia', alClic: () => this.potenziaScelta() });
    pulsante.impostaAttivo(manca.ok);
    this.contenuto.add(pulsante);
  }

  private potenziaScelta(): void {
    const partita = leggiPartita(this);
    const a = this.armiDisponibili().find((x) => this.armaScelta && stessoPosto(x.dove, this.armaScelta));
    if (!a) return;
    const costo = costoPotenziamento(livelloDi(a.id).livello, this.dati.armi[a.id]!.rarita, this.dati.potenziamenti);
    if (!costo) return;
    const esito = potenzia(partita, a.dove, costo);
    if (!esito.ok) {
      this.esito.setText(esito.errore).setColor(ROSSO);
      return;
    }
    // L'arma resta nello stesso posto (stesso spazio dello zaino o in mano): la selezione non cambia.
    const nuovoLivello = livelloDi(esito.nuovoId).livello;
    const dNuovo = dannoBaseArma(this.dati.armi[esito.nuovoId]!, nuovoLivello);
    this.esito.setText(`Bruno tempra la lama… Ecco: ${this.dati.armi[esito.nuovoId]!.nome} (Liv. ${nuovoLivello + 1}, Danno ${dNuovo})!`).setColor('#ffe680');
    scriviPartita(this, esito.stato);
  }

  private chiudi(): void {
    this.scene.stop();
    this.scene.resume(SCENA_MONDO);
  }
}

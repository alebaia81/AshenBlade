// Modalità sviluppatore (design §14): pannello che si apre con l'icona
// dell'ingranaggio o con F8. Le voci si cliccano e chiamano i metodi
// pubblici della scena del mondo. "Dai oggetto…" apre un secondo elenco.
// (Dalla fase 4 niente tasti numerici: 1 e 2 sono le pozioni rapide.)

import * as Phaser from 'phaser';
import {
  CHIAVE_SVIL_AREE,
  CHIAVE_SVIL_INVULNERABILE,
  LARGHEZZA_SCHERMO,
  SCENA_MONDO,
  SCENA_SVILUPPATORE,
} from '../costanti';
import type { DatiGioco } from '../data/caricaDati';
import type { ScenaMondo } from './ScenaMondo';

const ALTEZZA_RIGA = 22;
const LARGHEZZA = 380;
const STILE = { fontFamily: 'monospace', fontSize: '15px', color: '#c8ffc8' };

interface Voce {
  etichetta: () => string;
  azione: () => void;
}

export class ScenaSviluppatore extends Phaser.Scene {
  /** Il contenuto del pannello: si svuota e si ricostruisce passando da un elenco all'altro. */
  private pannello!: Phaser.GameObjects.Container;
  private esito = '';
  private elenco: 'principale' | 'oggetti' | 'armi' | 'armature' | 'materiali' | 'nemici' = 'principale';

  constructor(private readonly dati: DatiGioco) {
    super(SCENA_SVILUPPATORE);
  }

  create(): void {
    this.elenco = 'principale';
    this.esito = '';
    this.pannello = this.add.container(0, 0);
    this.ridisegna();
  }

  private get mondo(): ScenaMondo {
    return this.scene.get(SCENA_MONDO) as ScenaMondo;
  }

  private vociPrincipali(): Voce[] {
    const mondo = () => this.mondo;
    return [
      {
        etichetta: () => `Aree di colpo e corpi: ${sìNo(this.registry.get(CHIAVE_SVIL_AREE))}`,
        azione: () => mondo().impostaAreeVisibili(this.registry.get(CHIAVE_SVIL_AREE) !== true),
      },
      {
        etichetta: () => `Invulnerabile: ${sìNo(this.registry.get(CHIAVE_SVIL_INVULNERABILE))}`,
        azione: () => mondo().impostaInvulnerabile(this.registry.get(CHIAVE_SVIL_INVULNERABILE) !== true),
      },
      { etichetta: () => 'Vita e mana pieni', azione: () => mondo().vitaPiena() },
      { etichetta: () => '+100 esperienza', azione: () => mondo().regalaEsperienza(100) },
      { etichetta: () => 'Sali di livello', azione: () => mondo().saliDiLivello() },
      { etichetta: () => 'Teletrasporto alla mappa successiva', azione: () => (this.esito = `Teletrasporto: ${mondo().teletrasporta()}`) },
      // Dalla fase 8a i nemici sono troppi per stare qui: hanno un elenco loro.
      { etichetta: () => 'Genera nemico…', azione: () => (this.elenco = 'nemici') },
      { etichetta: () => 'Dai oggetto…', azione: () => (this.elenco = 'oggetti') },
      { etichetta: () => 'Riempi lo zaino', azione: () => mondo().riempiZaino() },
      { etichetta: () => 'Dai arma…', azione: () => (this.elenco = 'armi') },
      { etichetta: () => 'Dai armatura…', azione: () => (this.elenco = 'armature') },
      { etichetta: () => '+100 monete', azione: () => mondo().regalaMonete(100) },
      { etichetta: () => 'Dai materiale o pergamena…', azione: () => (this.elenco = 'materiali') },
      { etichetta: () => 'Quest attive: completa i passi', azione: () => (this.esito = mondo().completaQuest()) },
    ];
  }

  /** Una voce per ogni nemico nei dati (boss compresi): aggiungendo un nemico al JSON compare qui. */
  private vociNemici(): Voce[] {
    const mondo = this.mondo;
    return [
      ...Object.entries(this.dati.nemici).map(([id, n]) => ({
        etichetta: () => `Genera: ${n.nome}`,
        azione: () => (this.esito = mondo.generaNemico(id) ? `Generato: ${n.nome}` : 'Davanti a te non c’è spazio'),
      })),
      { etichetta: () => '← Indietro', azione: () => (this.elenco = 'principale') },
    ];
  }

  /** Un elenco per tipo: tutti insieme non starebbero nello schermo. */
  private vociOggetti(tipi: readonly string[]): Voce[] {
    return [
      // Le varianti +1…+5 no: sarebbero 6 righe per arma. Si ottengono dalla fucina.
      ...Object.values(this.dati.oggetti).filter((o) => tipi.includes(o.tipo) && !this.dati.armi[o.id]?.potenziamento).map((o) => ({
        etichetta: () => `Dai: ${o.nome}`,
        azione: () => (this.esito = this.mondo.daiOggetto(o.id)),
      })),
      { etichetta: () => '← Indietro', azione: () => (this.elenco = 'principale') },
    ];
  }

  private ridisegna(): void {
    this.pannello.removeAll(true);
    const tipi = { principale: [], nemici: [], oggetti: ['pozione', 'borsa'], materiali: ['materiale', 'pergamena', 'missione'], armi: ['arma'], armature: ['armatura'] }[this.elenco];
    const voci = this.elenco === 'principale' ? this.vociPrincipali() : this.elenco === 'nemici' ? this.vociNemici() : this.vociOggetti(tipi);
    const destra = LARGHEZZA_SCHERMO - 12;
    const alto = 64;
    const sinistra = destra - LARGHEZZA + 12;
    const altezza = (voci.length + 3) * ALTEZZA_RIGA + 16;
    // Sfondo interattivo: un clic sul pannello non deve far camminare l'eroe.
    this.pannello.add(this.add.rectangle(destra, alto, LARGHEZZA, altezza, 0x000000, 0.82).setOrigin(1, 0).setInteractive());
    this.pannello.add(this.add.text(sinistra, alto + 8, 'MODALITÀ SVILUPPATORE', { ...STILE, fontStyle: 'bold' }));

    voci.forEach((voce, i) => {
      const testo = this.add.text(sinistra, alto + 8 + (i + 1) * ALTEZZA_RIGA, voce.etichetta(), STILE);
      // Tutta la riga è cliccabile, non solo le lettere: un'area rettangolare larga quanto il pannello.
      testo.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(0, 0, LARGHEZZA - 24, ALTEZZA_RIGA),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
        useHandCursor: true,
      });
      testo.on('pointerover', () => testo.setColor('#ffffff'));
      testo.on('pointerout', () => testo.setColor(STILE.color));
      testo.on('pointerdown', () => {
        this.esito = '';
        voce.azione();
        this.ridisegna();
      });
      this.pannello.add(testo);
    });

    const y = alto + 8 + (voci.length + 1) * ALTEZZA_RIGA;
    const chiudi = this.add.text(sinistra, y, 'Chiudi (F8)', STILE).setInteractive({ useHandCursor: true });
    chiudi.on('pointerdown', () => this.mondo.alternaSviluppatore());
    this.pannello.add(chiudi);
    this.pannello.add(this.add.text(sinistra, y + ALTEZZA_RIGA, this.esito, { ...STILE, color: '#ffe680' }));
  }
}

function sìNo(valore: unknown): string {
  return valore === true ? 'SÌ' : 'no';
}

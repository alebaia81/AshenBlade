// Modalità sviluppatore (design §14): pannello che si apre con l'icona
// dell'ingranaggio o con F8. Le voci si cliccano e chiamano i metodi
// pubblici della scena del mondo. Gli elenchi lunghi (armi, armature,
// materiali/pergamene, nemici) si scorrono con la rotellina del mouse,
// con le frecce Su/Giù o cliccando "▲ Scorri su" / "▼ Scorri giù".

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
const LARGHEZZA = 390;
const STILE = { fontFamily: 'monospace', fontSize: '15px', color: '#c8ffc8' };
/** Quante voci scorrevoli mostrare alla volta negli elenchi lunghi. */
const RIGHE_PAGINA = 14;

type NomeElenco = 'principale' | 'oggetti' | 'armi' | 'armature' | 'materiali' | 'nemici';

interface Voce {
  etichetta: () => string;
  azione: () => void;
}

export class ScenaSviluppatore extends Phaser.Scene {
  /** Il contenuto del pannello: si svuota e si ricostruisce passando da un elenco all'altro. */
  private pannello!: Phaser.GameObjects.Container;
  private esito = '';
  private elenco: NomeElenco = 'principale';
  private scorrimento = 0;

  constructor(private readonly dati: DatiGioco) {
    super(SCENA_SVILUPPATORE);
  }

  create(): void {
    this.elenco = 'principale';
    this.scorrimento = 0;
    this.esito = '';
    this.pannello = this.add.container(0, 0);

    // Rotellina del mouse e frecce della tastiera per scorrere gli elenchi lunghi.
    this.input.on('wheel', (_p: unknown, _go: unknown, _dx: number, dy: number) => {
      if (dy !== 0) this.scorri(dy > 0 ? 3 : -3);
    });
    this.input.keyboard?.on('keydown-UP', () => this.scorri(-1));
    this.input.keyboard?.on('keydown-DOWN', () => this.scorri(1));
    this.input.keyboard?.on('keydown-PAGE_UP', () => this.scorri(-RIGHE_PAGINA));
    this.input.keyboard?.on('keydown-PAGE_DOWN', () => this.scorri(RIGHE_PAGINA));

    this.ridisegna();
  }

  private get mondo(): ScenaMondo {
    return this.scene.get(SCENA_MONDO) as ScenaMondo;
  }

  private cambiaElenco(nuovo: NomeElenco): void {
    this.elenco = nuovo;
    this.scorrimento = 0;
  }

  private scorri(delta: number): void {
    const elementi = this.vociScorrevoli();
    if (elementi.length <= RIGHE_PAGINA) return;
    const massimo = Math.max(0, elementi.length - RIGHE_PAGINA);
    const nuovo = Math.max(0, Math.min(massimo, this.scorrimento + delta));
    if (nuovo !== this.scorrimento) {
      this.scorrimento = nuovo;
      this.ridisegna();
    }
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
      { etichetta: () => 'Genera nemico…', azione: () => this.cambiaElenco('nemici') },
      { etichetta: () => 'Dai oggetto…', azione: () => this.cambiaElenco('oggetti') },
      { etichetta: () => 'Riempi lo zaino', azione: () => mondo().riempiZaino() },
      { etichetta: () => 'Dai arma…', azione: () => this.cambiaElenco('armi') },
      { etichetta: () => 'Dai armatura…', azione: () => this.cambiaElenco('armature') },
      { etichetta: () => '+100 monete', azione: () => mondo().regalaMonete(100) },
      { etichetta: () => 'Dai materiale o pergamena…', azione: () => this.cambiaElenco('materiali') },
      { etichetta: () => 'Quest attive: completa i passi', azione: () => (this.esito = mondo().completaQuest()) },
    ];
  }

  /** Voci dell'elenco scelto (senza la riga fissa "← Indietro"). */
  private vociScorrevoli(): Voce[] {
    if (this.elenco === 'principale') return this.vociPrincipali();
    if (this.elenco === 'nemici') {
      const mondo = this.mondo;
      return Object.entries(this.dati.nemici).map(([id, n]) => ({
        etichetta: () => `Genera: ${n.nome}`,
        azione: () => (this.esito = mondo.generaNemico(id) ? `Generato: ${n.nome}` : 'Davanti a te non c’è spazio'),
      }));
    }
    const tipi = {
      oggetti: ['pozione', 'borsa'],
      materiali: ['materiale', 'pergamena', 'missione'],
      armi: ['arma'],
      armature: ['armatura'],
    }[this.elenco];
    return Object.values(this.dati.oggetti)
      .filter((o) => tipi.includes(o.tipo) && !this.dati.armi[o.id]?.potenziamento)
      .map((o) => ({
        etichetta: () => `Dai: ${o.nome}`,
        azione: () => (this.esito = this.mondo.daiOggetto(o.id)),
      }));
  }

  private ridisegna(): void {
    this.pannello.removeAll(true);
    const tutte = this.vociScorrevoli();
    const haScorrimento = this.elenco !== 'principale' && tutte.length > RIGHE_PAGINA;
    const massimo = Math.max(0, tutte.length - RIGHE_PAGINA);
    if (this.scorrimento > massimo) this.scorrimento = massimo;

    const visibili = haScorrimento ? tutte.slice(this.scorrimento, this.scorrimento + RIGHE_PAGINA) : tutte;
    const righeExtra = (this.elenco !== 'principale' ? 1 : 0) + (haScorrimento ? 1 : 0);
    const totaleRighe = visibili.length + righeExtra;

    const destra = LARGHEZZA_SCHERMO - 12;
    const alto = 64;
    const sinistra = destra - LARGHEZZA + 12;
    const altezza = (totaleRighe + 3) * ALTEZZA_RIGA + 16;

    // Sfondo interattivo: un clic sul pannello non deve far camminare l'eroe.
    this.pannello.add(this.add.rectangle(destra, alto, LARGHEZZA, altezza, 0x000000, 0.86).setOrigin(1, 0).setInteractive());
    const contatore = haScorrimento ? ` (${this.scorrimento + 1}–${this.scorrimento + visibili.length}/${tutte.length})` : '';
    this.pannello.add(this.add.text(sinistra, alto + 8, `MODALITÀ SVILUPPATORE${contatore}`, { ...STILE, fontStyle: 'bold' }));

    visibili.forEach((voce, i) => {
      const testo = this.add.text(sinistra, alto + 8 + (i + 1) * ALTEZZA_RIGA, voce.etichetta(), STILE);
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

    let rigaCorrente = visibili.length + 1;

    if (haScorrimento) {
      const yScorri = alto + 8 + rigaCorrente * ALTEZZA_RIGA;
      const puoSu = this.scorrimento > 0;
      const puoGiu = this.scorrimento < massimo;

      const btnSu = this.add
        .text(sinistra, yScorri, '▲ Scorri su', { ...STILE, color: puoSu ? '#8fe08f' : '#556655' })
        .setInteractive({ useHandCursor: puoSu });
      btnSu.on('pointerover', () => puoSu && btnSu.setColor('#ffffff'));
      btnSu.on('pointerout', () => btnSu.setColor(puoSu ? '#8fe08f' : '#556655'));
      btnSu.on('pointerdown', () => this.scorri(-RIGHE_PAGINA));

      const btnGiu = this.add
        .text(sinistra + 145, yScorri, '▼ Scorri giù (rotellina)', { ...STILE, color: puoGiu ? '#8fe08f' : '#556655' })
        .setInteractive({ useHandCursor: puoGiu });
      btnGiu.on('pointerover', () => puoGiu && btnGiu.setColor('#ffffff'));
      btnGiu.on('pointerout', () => btnGiu.setColor(puoGiu ? '#8fe08f' : '#556655'));
      btnGiu.on('pointerdown', () => this.scorri(RIGHE_PAGINA));

      this.pannello.add([btnSu, btnGiu]);
      rigaCorrente++;
    }

    if (this.elenco !== 'principale') {
      const yIndietro = alto + 8 + rigaCorrente * ALTEZZA_RIGA;
      const indietro = this.add.text(sinistra, yIndietro, '← Indietro', STILE).setInteractive({
        hitArea: new Phaser.Geom.Rectangle(0, 0, LARGHEZZA - 24, ALTEZZA_RIGA),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
        useHandCursor: true,
      });
      indietro.on('pointerover', () => indietro.setColor('#ffffff'));
      indietro.on('pointerout', () => indietro.setColor(STILE.color));
      indietro.on('pointerdown', () => {
        this.esito = '';
        this.cambiaElenco('principale');
        this.ridisegna();
      });
      this.pannello.add(indietro);
      rigaCorrente++;
    }

    const y = alto + 8 + rigaCorrente * ALTEZZA_RIGA;
    const chiudi = this.add.text(sinistra, y, 'Chiudi (F8)', STILE).setInteractive({ useHandCursor: true });
    chiudi.on('pointerdown', () => this.mondo.alternaSviluppatore());
    this.pannello.add(chiudi);
    this.pannello.add(this.add.text(sinistra, y + ALTEZZA_RIGA, this.esito, { ...STILE, color: '#ffe680' }));
  }
}

function sìNo(valore: unknown): string {
  return valore === true ? 'SÌ' : 'no';
}

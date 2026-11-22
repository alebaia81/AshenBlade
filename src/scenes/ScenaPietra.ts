// La Pietra di passaggio (fase 10c, espansione.md §5.6):
// - a sinistra: viaggio rapido verso le pietre già attivate nei villaggi/avamposti;
// - a destra: cambio rapido del compagno attivo (tra quelli già ingaggiati o uniti con la storia).

import * as Phaser from 'phaser';
import { ALTEZZA_SCHERMO, SCENA_MONDO, SCENA_PIETRA } from '../costanti';
import type { DatiGioco } from '../data/caricaDati';
import { cellePietra } from '../systems/mappa';
import { congeda, ingaggia } from '../systems/taverna';
import { Pulsante } from './interfaccia/Pulsante';
import { STILE_TESTO, STILE_TITOLO } from './interfaccia/testi';
import type { ScenaMondo } from './ScenaMondo';
import { leggiPartita, scriviPartita } from './statoCondiviso';

const PANNELLO = { larghezza: 760, altezza: 450 };

export class ScenaPietra extends Phaser.Scene {
  private mappaAttuale = '';
  private contenuto!: Phaser.GameObjects.Container;
  private esito!: Phaser.GameObjects.Text;
  private sinistra = 0;
  private alto = 0;

  constructor(private readonly dati: DatiGioco) {
    super(SCENA_PIETRA);
  }

  create(dati: { idMappa?: string } = {}): void {
    this.mappaAttuale = dati.idMappa ?? this.mondo.idMappaAttuale();
    const cx = this.scale.width / 2;
    const cy = ALTEZZA_SCHERMO / 2;
    this.sinistra = cx - PANNELLO.larghezza / 2;
    this.alto = cy - PANNELLO.altezza / 2;

    this.add.rectangle(cx, cy, this.scale.width, ALTEZZA_SCHERMO, 0x000000, 0.55).setInteractive();
    this.add.rectangle(cx, cy, PANNELLO.larghezza, PANNELLO.altezza, 0x16202e, 0.97).setStrokeStyle(2, 0x6ac8ff);
    this.add.text(this.sinistra + 24, this.alto + 16, 'Pietra di passaggio', { ...STILE_TITOLO, fontSize: '22px', color: '#d8f0ff' });
    this.add.text(
      this.sinistra + 24,
      this.alto + 44,
      'Viaggia tra le pietre che hai già risvegliato o cambia il compagno che viaggia con te.',
      { ...STILE_TESTO, fontSize: '13px', color: '#9ab4cc' },
    );

    this.esito = this.add.text(this.sinistra + 24, this.alto + PANNELLO.altezza - 38, '', {
      ...STILE_TESTO,
      fontSize: '14px',
      color: '#ffe680',
    });
    new Pulsante(this, this.sinistra + PANNELLO.larghezza - 90, this.alto + PANNELLO.altezza - 30, {
      larghezza: 150,
      altezza: 38,
      testo: 'Chiudi (Esc)',
      alClic: () => this.chiudi(),
    });

    this.contenuto = this.add.container(0, 0);
    this.input.keyboard?.on('keydown-ESC', () => this.chiudi());
    this.ridisegna();
  }

  private get mondo(): ScenaMondo {
    return this.scene.get(SCENA_MONDO) as ScenaMondo;
  }

  private ridisegna(): void {
    this.contenuto.removeAll(true);
    const partita = leggiPartita(this);
    const { sinistra, alto } = this;

    // ---- Colonna sinistra: Destinazioni (pietre attivate) ----
    this.contenuto.add(
      this.add.text(sinistra + 24, alto + 80, 'Pietre risvegliate', {
        ...STILE_TESTO,
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#8fd3ff',
      }),
    );

    const pietre = partita.pietre ?? [];
    pietre.forEach((idMappa, i) => {
      const mappa = this.dati.mappe[idMappa];
      if (!mappa) return;
      const nomePietra = cellePietra(mappa)[0]?.nome ?? mappa.nome;
      const qui = idMappa === this.mappaAttuale;
      const y = alto + 124 + i * 48;
      const sfondo = this.add
        .rectangle(sinistra + 24 + 165, y, 330, 42, qui ? 0x24384d : 0x101824)
        .setStrokeStyle(qui ? 2 : 1, qui ? 0x6ac8ff : 0x385068);
      this.contenuto.add([
        sfondo,
        this.add.text(sinistra + 38, y, nomePietra, {
          ...STILE_TESTO,
          fontSize: '15px',
          fontStyle: qui ? 'bold' : 'normal',
          color: qui ? '#ffffff' : '#d0e0f0',
        }).setOrigin(0, 0.5),
      ]);
      const btn = new Pulsante(this, sinistra + 300, y, {
        larghezza: 92,
        altezza: 28,
        testo: qui ? 'Sei qui' : 'Viaggia',
        dimensioneTesto: 13,
        alClic: () => this.viaggia(idMappa),
      });
      btn.impostaAttivo(!qui);
      this.contenuto.add(btn);
    });

    // ---- Colonna destra: Compagni disponibili ----
    const xDestra = sinistra + 390;
    this.contenuto.add(
      this.add.text(xDestra, alto + 80, 'Compagni disponibili', {
        ...STILE_TESTO,
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#ffe680',
      }),
    );

    const sbloccati = Object.values(this.dati.compagni).filter((c) => partita.compagni.ingaggiati.includes(c.id));
    if (sbloccati.length === 0) {
      this.contenuto.add(
        this.add.text(xDestra, alto + 120, 'Non hai ancora compagni disponibili.\nIncontrane uno lungo il viaggio o in taverna.', {
          ...STILE_TESTO,
          fontSize: '13px',
          color: '#8a99ad',
        }),
      );
      return;
    }

    sbloccati.forEach((c, i) => {
      const conTe = partita.compagni.attivo === c.id;
      const y = alto + 124 + i * 44;
      const sfondo = this.add
        .rectangle(xDestra + 170, y, 340, 38, conTe ? 0x263828 : 0x101824)
        .setStrokeStyle(conTe ? 2 : 1, conTe ? 0x5fd35f : 0x385068);
      this.contenuto.add([
        sfondo,
        this.add.text(xDestra + 14, y - 7, c.nome, { ...STILE_TESTO, fontSize: '14px', fontStyle: 'bold', color: c.colore }).setOrigin(0, 0.5),
        this.add.text(xDestra + 14, y + 9, `${c.abilita.nome} · ${c.bonus.descrizione}`, { ...STILE_TESTO, fontSize: '11px', color: '#9ab4cc' }).setOrigin(0, 0.5),
      ]);
      const btn = new Pulsante(this, xDestra + 288, y, {
        larghezza: 88,
        altezza: 26,
        testo: conTe ? 'Lascia' : 'Chiama',
        dimensioneTesto: 12,
        alClic: () => {
          if (conTe) {
            scriviPartita(this, congeda(leggiPartita(this)));
            this.esito.setText(`${c.nome} ti aspetterà alla prossima pietra.`);
          } else {
            const esito = ingaggia(leggiPartita(this), c.id, 0);
            if (esito.ok) {
              scriviPartita(this, esito.stato);
              this.esito.setText(`${c.nome} viaggia con te.`);
            }
          }
          this.ridisegna();
        },
      });
      this.contenuto.add(btn);
    });
  }

  private viaggia(idMappa: string): void {
    this.scene.stop();
    this.scene.resume(SCENA_MONDO);
    this.mondo.viaggiaAPietra(idMappa);
  }

  private chiudi(): void {
    this.scene.stop();
    this.scene.resume(SCENA_MONDO);
  }
}

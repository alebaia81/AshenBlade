// Il compagno nel mondo: segue l'eroe, combatte da solo, può finire al tappeto.
// Le decisioni le prende systems/ia/compagno.ts; vita e rialzo systems/compagno.ts;
// qui c'è il collegamento con Phaser: corpo fisico, movimento, disegno.

import * as Phaser from 'phaser';
import { TESSERA } from '../costanti';
import { aggiornaRialzo, creaStatoCompagno, subisciDanno, type StatoCompagno } from '../systems/compagno';
import { cellaDaPixel, centroCella } from '../systems/coordinate';
import { rettangoloDaCentro, type Rettangolo } from '../systems/geometria';
import { decidiCompagno } from '../systems/ia/compagno';
import { cellaRaggiungibilePiuVicina, liberoTra, lisciaPercorso, trovaPercorso, type Griglia } from '../systems/percorso';
import { seguiPercorso } from '../systems/seguiPercorso';
import type { DefinizioneCompagno, Vettore } from '../systems/tipi';
import type { Nemico } from './Nemico';
import { colore } from './colori';
import { Figura } from './Figura';
import type { AspettoRisolto } from '../systems/sprite';

const LATO = 11;
/** Più lontano di così dall'eroe (incastrato, rimasto indietro): ricompare accanto a lui. */
const DISTANZA_MASSIMA = 220;
/** Ogni quanto si ricalcola il percorso con A* quando la strada dritta è bloccata. */
const RICALCOLO_MS = 400;

export class Compagno {
  readonly forma: Phaser.GameObjects.Rectangle;
  private readonly corpo: Phaser.Physics.Arcade.Body;
  private readonly barra: Phaser.GameObjects.Graphics;
  private stato: StatoCompagno;
  private prontoAttacco = 0;
  private percorso: Vettore[] = [];
  private indicePercorso = 0;
  private prossimoRicalcolo = 0;
  private readonly figura: Figura | null;

  constructor(
    private readonly scena: Phaser.Scene,
    x: number,
    y: number,
    readonly definizione: DefinizioneCompagno,
    private readonly griglia: Griglia,
    /** Fase 9b: la figura in pixel art (null = quadrato colorato). */
    aspetto: AspettoRisolto | null = null,
  ) {
    this.forma = scena.add.rectangle(x, y, LATO, LATO, colore(definizione.colore)).setDepth(9).setStrokeStyle(1, 0xffffff, 0.6);
    scena.physics.add.existing(this.forma);
    this.figura = aspetto ? new Figura(scena, this.forma, aspetto, { profondita: 9, sollevamento: 2 }) : null;
    if (this.figura) this.forma.setVisible(false);
    this.corpo = this.forma.body as Phaser.Physics.Arcade.Body;
    this.barra = scena.add.graphics().setDepth(11);
    this.stato = creaStatoCompagno(definizione.vita);
    scena.events.on(Phaser.Scenes.Events.POST_UPDATE, this.disegnaBarra, this);
    scena.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scena.events.off(Phaser.Scenes.Events.POST_UPDATE, this.disegnaBarra, this));
  }

  /**
   * A ogni fotogramma. "attacca" è chiamata quando il compagno colpisce: la scena
   * sa come fare danno (mischia o dardo) con lo stesso Combattimento dell'eroe.
   */
  aggiorna(adesso: number, eroe: Vettore, nemici: readonly Nemico[], nemiciInVista: boolean, attacca: (n: Nemico) => void): void {
    this.stato = aggiornaRialzo(this.stato, nemiciInVista, adesso);
    this.forma.setAlpha(this.stato.alTappeto ? 0.35 : 1);
    if (this.stato.alTappeto) {
      this.corpo.setVelocity(0, 0);
      return;
    }
    if (Math.hypot(eroe.x - this.x, eroe.y - this.y) > DISTANZA_MASSIMA) {
      this.corpo.reset(eroe.x, eroe.y + 6);
      this.percorso = [];
      return;
    }
    const d = this.definizione;
    const decisione = decidiCompagno(
      { posizione: { x: this.x, y: this.y }, eroe, nemici: nemici.map((n) => ({ id: n.id, posizione: { x: n.forma.x, y: n.forma.y }, ingombro: n.definizione.dimensione / 2 })) },
      { raggioCaccia: 6 * TESSERA, distanzaSeguire: 2 * TESSERA, portata: d.portata },
    );
    switch (decisione.tipo) {
      case 'attacca': {
        this.corpo.setVelocity(0, 0);
        const nemico = nemici.find((n) => n.id === decisione.id);
        if (nemico && adesso >= this.prontoAttacco) {
          this.prontoAttacco = adesso + d.ricaricaMs;
          attacca(nemico);
        }
        break;
      }
      case 'avvicinati':
      case 'segui':
        this.muoviVerso(decisione.verso, adesso);
        break;
      case 'fermo':
        this.corpo.setVelocity(0, 0);
        this.percorso = [];
    }
  }

  /** In linea retta se si può; altrimenti con A*, come l'eroe quando clicchi lontano. */
  private muoviVerso(destinazione: Vettore, adesso: number): void {
    const qui = { x: this.x, y: this.y };
    const v = this.definizione.velocita;
    if (liberoTra(this.griglia, qui, destinazione, LATO / 2, TESSERA)) {
      this.percorso = [];
      const dist = Math.hypot(destinazione.x - qui.x, destinazione.y - qui.y) || 1;
      this.corpo.setVelocity(((destinazione.x - qui.x) / dist) * v, ((destinazione.y - qui.y) / dist) * v);
      return;
    }
    if (this.percorso.length === 0 || adesso >= this.prossimoRicalcolo) {
      this.prossimoRicalcolo = adesso + RICALCOLO_MS;
      const da = cellaDaPixel(qui.x, qui.y, TESSERA);
      let a = cellaDaPixel(destinazione.x, destinazione.y, TESSERA);
      // Un nemico può stare a cavallo di un albero: allora si punta alla cella libera più vicina.
      let celle = trovaPercorso(this.griglia, da, a);
      if (!celle) {
        a = cellaRaggiungibilePiuVicina(this.griglia, da, a) ?? da;
        celle = trovaPercorso(this.griglia, da, a) ?? [];
      }
      this.percorso = lisciaPercorso(this.griglia, qui, celle.map((c) => centroCella(c, TESSERA)), LATO / 2, TESSERA);
      this.indicePercorso = 0;
    }
    const passo = seguiPercorso(qui, this.percorso, this.indicePercorso, v);
    this.indicePercorso = passo.indice;
    this.corpo.setVelocity(passo.velocita.x, passo.velocita.y);
  }

  /** Colpito da un nemico. */
  subisci(danno: number): void {
    this.stato = subisciDanno(this.stato, danno);
    this.forma.setFillStyle(0xffffff);
    this.scena.time.delayedCall(70, () => this.forma.setFillStyle(colore(this.definizione.colore)));
    this.figura?.lampo();
    if (this.stato.alTappeto) this.corpo.setVelocity(0, 0);
  }

  /** Una piccola barra della vita sopra la testa. */
  private disegnaBarra(): void {
    const g = this.barra.clear();
    const { attuale, massima } = this.stato.vita;
    const x = this.x - 7;
    const y = this.y - 11;
    g.fillStyle(0x000000, 0.6).fillRect(x, y, 14, 2.5);
    g.fillStyle(this.stato.alTappeto ? 0x777777 : 0x5fd35f, 1).fillRect(x, y, (14 * attuale) / massima, 2.5);
  }

  rettangolo(): Rettangolo {
    return rettangoloDaCentro({ x: this.x, y: this.y }, LATO, LATO);
  }

  distruggi(): void {
    this.scena.events.off(Phaser.Scenes.Events.POST_UPDATE, this.disegnaBarra, this);
    this.barra.destroy();
    this.forma.destroy();
  }

  get alTappeto(): boolean {
    return this.stato.alTappeto;
  }
  get vita(): { attuale: number; massima: number } {
    return this.stato.vita;
  }
  get x(): number {
    return this.forma.x;
  }
  get y(): number {
    return this.forma.y;
  }
}

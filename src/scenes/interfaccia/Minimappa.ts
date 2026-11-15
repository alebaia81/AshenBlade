// Mappa della Valle e della Zona in sovrimpressione (HUD).
// Nascosta durante il gioco normale per lasciare la visuale completamente libera;
// si apre e si chiude cliccando l'icona Mappa in alto a destra o premendo M.

import * as Phaser from 'phaser';
import { TESSERA } from '../../costanti';
import type { ScenaMondo } from '../ScenaMondo';
import { STILE_TESTO, STILE_TITOLO } from './testi';
import { suoni } from '../../audio/Suoni';

interface NodoMondo {
  id: string;
  nomeCompleto: string;
  rx: number; // frazione 0..1
  ry: number;
  dyGrande?: number;
}

const NODI_MONDO: readonly NodoMondo[] = [
  { id: 'borgo', nomeCompleto: 'Borgo Quercia', rx: 0.14, ry: 0.52, dyGrande: 20 },
  { id: 'radura', nomeCompleto: 'Radura Verde', rx: 0.34, ry: 0.52 },
  { id: 'bosco', nomeCompleto: 'Bosco Cupo', rx: 0.5, ry: 0.24 },
  { id: 'cimitero', nomeCompleto: 'Cimitero', rx: 0.7, ry: 0.16 },
  { id: 'cripta_sale', nomeCompleto: 'Cripta (Sale)', rx: 0.89, ry: 0.12 },
  { id: 'cripta_tomba', nomeCompleto: 'Cripta (Tomba)', rx: 0.89, ry: 0.34 },
  { id: 'colline', nomeCompleto: 'Colline Grigie', rx: 0.5, ry: 0.76 },
  { id: 'miniera_gallerie', nomeCompleto: 'Miniera', rx: 0.67, ry: 0.56 },
  { id: 'miniera_tana', nomeCompleto: 'Tana del Troll', rx: 0.88, ry: 0.56 },
  { id: 'brughiera', nomeCompleto: 'Brughiera', rx: 0.68, ry: 0.88 },
  { id: 'torre_piani', nomeCompleto: 'Torre (Piani)', rx: 0.88, ry: 0.76 },
  { id: 'torre_cima', nomeCompleto: 'Cima della Torre', rx: 0.88, ry: 0.94 },
];

const COLLEGAMENTI_MONDO: readonly [string, string][] = [
  ['borgo', 'radura'],
  ['radura', 'bosco'],
  ['bosco', 'cimitero'],
  ['cimitero', 'cripta_sale'],
  ['cripta_sale', 'cripta_tomba'],
  ['radura', 'colline'],
  ['colline', 'miniera_gallerie'],
  ['miniera_gallerie', 'miniera_tana'],
  ['colline', 'brughiera'],
  ['brughiera', 'torre_piani'],
  ['torre_piani', 'torre_cima'],
];

export type ModalitaMappa = 'nascosta' | 'grande';

export class Minimappa {
  private readonly scena: Phaser.Scene;
  private readonly grafica: Phaser.GameObjects.Graphics;
  private readonly chiusuraGrande: Phaser.GameObjects.Rectangle;
  private readonly titoloGrande: Phaser.GameObjects.Text;
  private readonly sottotitoloValle: Phaser.GameObjects.Text;
  private readonly sottotitoloZona: Phaser.GameObjects.Text;
  private readonly piedeGrande: Phaser.GameObjects.Container;
  private readonly etichetteGrandi: Phaser.GameObjects.Text[] = [];
  private modalita: ModalitaMappa = 'nascosta';

  private get grandeX(): number {
    return Math.round((this.scena.scale.width - 700) / 2);
  }
  private get grandeArea() {
    return { x: this.grandeX, y: 74, larghezza: 700, altezza: 372 };
  }
  private get grandeValle() {
    return { x: this.grandeX + 18, y: 74 + 44, larghezza: 316, altezza: 280 };
  }
  private get grandeZona() {
    return { x: this.grandeX + 356, y: 74 + 44, larghezza: 326, altezza: 280 };
  }

  constructor(scena: Phaser.Scene) {
    this.scena = scena;
    this.grafica = scena.add.graphics().setDepth(15);
    const g = this.grandeArea;
    const gv = this.grandeValle;
    const gz = this.grandeZona;

    // Intestazione cliccabile della mappa per chiuderla col mouse.
    this.chiusuraGrande = scena.add
      .rectangle(g.x + g.larghezza / 2, g.y + 18, g.larghezza, 36, 0x243040, 0.01)
      .setDepth(16)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });
    this.chiusuraGrande.on('pointerdown', () => {
      suoni.effetto('clic');
      this.impostaModalita('nascosta');
    });

    this.titoloGrande = scena.add
      .text(g.x + g.larghezza / 2, g.y + 10, 'Mappa della Valle e della Zona  (clic qui o premi M per chiudere)', {
        ...STILE_TITOLO,
        fontSize: '16px',
        color: '#ffe680',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0)
      .setDepth(16)
      .setVisible(false);

    this.sottotitoloValle = scena.add
      .text(gv.x + gv.larghezza / 2, g.y + 30, 'Mondo (le 12 zone della Valle)', {
        ...STILE_TESTO,
        fontSize: '12px',
        color: '#cfd8e3',
      })
      .setOrigin(0.5, 0)
      .setDepth(16)
      .setVisible(false);

    this.sottotitoloZona = scena.add
      .text(gz.x + gz.larghezza / 2, g.y + 30, '', {
        ...STILE_TESTO,
        fontSize: '12px',
        color: '#cfd8e3',
      })
      .setOrigin(0.5, 0)
      .setDepth(16)
      .setVisible(false);

    this.piedeGrande = scena.add
      .container(g.x + g.larghezza / 2, g.y + g.altezza - 14)
      .setDepth(16)
      .setVisible(false);

    const vociLegenda = [
      { testo: '● Tu (oro)', colore: '#ffd23f' },
      { testo: '● Compagno (verde)', colore: '#5fd35f' },
      { testo: '● Abitanti (celeste)', colore: '#6ec6ff' },
      { testo: '● Nemici (rosso)', colore: '#ff5252' },
      { testo: '■ Forzieri (giallo)', colore: '#ffe680' },
      { testo: '■ Uscite (azzurro)', colore: '#63b3ed' },
    ];

    const testiLegenda: Phaser.GameObjects.Text[] = [];
    let larghezzaTotale = 0;
    const spaziatura = 14;

    for (const v of vociLegenda) {
      const t = scena.add
        .text(0, 0, v.testo, {
          ...STILE_TESTO,
          fontSize: '11px',
          color: v.colore,
          stroke: '#000000',
          strokeThickness: 2,
        })
        .setOrigin(0, 0.5);
      testiLegenda.push(t);
      this.piedeGrande.add(t);
      larghezzaTotale += t.width;
    }
    larghezzaTotale += spaziatura * (vociLegenda.length - 1);

    let cursoreX = -larghezzaTotale / 2;
    for (const t of testiLegenda) {
      t.setX(cursoreX);
      cursoreX += t.width + spaziatura;
    }

    for (const n of NODI_MONDO) {
      const gx = gv.x + n.rx * gv.larghezza;
      const gy = gv.y + n.ry * gv.altezza + (n.dyGrande ?? -8);
      const tg = scena.add
        .text(gx, gy, n.nomeCompleto, {
          ...STILE_TESTO,
          fontSize: '11px',
          color: '#cfd8e3',
          stroke: '#000000',
          strokeThickness: 3,
        })
        .setOrigin(0.5, 1)
        .setDepth(16)
        .setVisible(false);
      this.etichetteGrandi.push(tg);
    }

    scena.input.keyboard?.on('keydown-M', () => this.alternaModalita());
  }

  alternaModalita(): void {
    this.impostaModalita(this.modalita === 'nascosta' ? 'grande' : 'nascosta');
  }

  impostaModalita(nuova: ModalitaMappa): void {
    this.modalita = nuova;
    const inGrande = nuova === 'grande';
    if (inGrande) {
      const g = this.grandeArea;
      const gv = this.grandeValle;
      const gz = this.grandeZona;
      this.chiusuraGrande.setPosition(g.x + g.larghezza / 2, g.y + 18);
      this.titoloGrande.setPosition(g.x + g.larghezza / 2, g.y + 10);
      this.sottotitoloValle.setPosition(gv.x + gv.larghezza / 2, g.y + 30);
      this.sottotitoloZona.setPosition(gz.x + gz.larghezza / 2, g.y + 30);
      this.piedeGrande.setPosition(g.x + g.larghezza / 2, g.y + g.altezza - 14);

      NODI_MONDO.forEach((n, i) => {
        const tg = this.etichetteGrandi[i];
        if (tg) {
          const gx = gv.x + n.rx * gv.larghezza;
          const gy = gv.y + n.ry * gv.altezza + (n.dyGrande ?? -8);
          tg.setPosition(gx, gy);
        }
      });
    }
    this.chiusuraGrande.setVisible(inGrande);
    this.titoloGrande.setVisible(inGrande);
    this.sottotitoloValle.setVisible(inGrande);
    this.sottotitoloZona.setVisible(inGrande);
    this.piedeGrande.setVisible(inGrande);
    for (const t of this.etichetteGrandi) t.setVisible(inGrande);
    if (!inGrande) this.grafica.clear();
  }

  aggiorna(mondo: ScenaMondo, adesso: number): void {
    const g = this.grafica.clear();
    if (this.modalita !== 'grande') return;
    const dati = mondo.statoMinimappa();
    if (!dati) return;
    this.disegnaPannelloGrande(g, dati, adesso);
  }

  private disegnaPannelloGrande(
    g: Phaser.GameObjects.Graphics,
    dati: NonNullable<ReturnType<ScenaMondo['statoMinimappa']>>,
    adesso: number,
  ): void {
    const grande = this.grandeArea;
    g.fillStyle(0x0f1620, 0.92).fillRect(grande.x, grande.y, grande.larghezza, grande.altezza);
    g.fillStyle(0x1f2d3d, 0.96).fillRect(grande.x, grande.y, grande.larghezza, 28);
    g.lineStyle(2, 0xd8c290, 1).strokeRect(grande.x, grande.y, grande.larghezza, grande.altezza);
    g.lineStyle(1, 0x5a6d82, 0.8).lineBetween(
      grande.x + 344,
      grande.y + 32,
      grande.x + 344,
      grande.y + grande.altezza - 28,
    );

    this.sottotitoloZona.setText(`Zona attuale: ${dati.nomeMappa}`);
    this.disegnaMondo(g, this.grandeValle, this.etichetteGrandi, dati.idMappa, adesso);
    this.disegnaZona(g, this.grandeZona, dati, adesso);
  }

  private disegnaZona(
    g: Phaser.GameObjects.Graphics,
    area: { x: number; y: number; larghezza: number; altezza: number },
    dati: NonNullable<ReturnType<ScenaMondo['statoMinimappa']>>,
    adesso: number,
  ): void {
    const { larghezza, altezza, celle, eroe, compagno, nemici, forzieri, abitanti } = dati;
    const scala = Math.min(area.larghezza / larghezza, area.altezza / altezza);
    const w = larghezza * scala;
    const h = altezza * scala;
    const ox = area.x + (area.larghezza - w) / 2;
    const oy = area.y + (area.altezza - h) / 2;

    g.fillStyle(0x28382e, 0.95).fillRect(ox, oy, w, h);
    g.lineStyle(1, 0x5a6d82, 0.9).strokeRect(ox - 1, oy - 1, w + 2, h + 2);

    for (let r = 0; r < altezza; r++) {
      const riga = celle[r];
      if (!riga) continue;
      for (let c = 0; c < larghezza; c++) {
        const tipo = riga[c];
        if (tipo === 'muro') {
          g.fillStyle(0x6e8276, 0.95).fillRect(ox + c * scala, oy + r * scala, Math.ceil(scala), Math.ceil(scala));
        } else if (tipo === 'uscita') {
          g.fillStyle(0x4ad8ff, 1).fillRect(
            ox + c * scala - 0.5,
            oy + r * scala - 0.5,
            Math.max(4, scala + 1),
            Math.max(4, scala + 1),
          );
        }
      }
    }

    const punto = (p: { x: number; y: number }) => ({
      x: ox + (p.x / (larghezza * TESSERA)) * w,
      y: oy + (p.y / (altezza * TESSERA)) * h,
    });

    const fattore = 1.65;

    // Forzieri chiusi (oro).
    g.fillStyle(0xffd23f, 1);
    for (const f of forzieri) {
      const p = punto(f);
      const l = 2.6 * fattore;
      g.fillRect(p.x - l / 2, p.y - l / 2, l, l);
    }

    // Abitanti (celeste brillante).
    g.fillStyle(0x7ce0ff, 1);
    for (const a of abitanti) {
      const p = punto(a);
      g.fillCircle(p.x, p.y, 1.8 * fattore);
    }

    // Nemici vivi (rosso vivo, boss viola).
    for (const n of nemici) {
      const p = punto(n);
      g.fillStyle(n.boss ? 0xe066ff : 0xff5252, 0.95).fillCircle(p.x, p.y, (n.boss ? 2.8 : 1.6) * fattore);
    }

    // Compagno (verde brillante).
    if (compagno) {
      const p = punto(compagno);
      g.fillStyle(0x5fd35f, 1).fillCircle(p.x, p.y, 2 * fattore);
    }

    // Eroe (pallino giallo/bianco pulsante ben visibile).
    const pe = punto(eroe);
    const raggioEroe = (2.6 + 0.5 * Math.sin(adesso / 160)) * fattore;
    g.fillStyle(0xffe680, 1).fillCircle(pe.x, pe.y, raggioEroe);
    g.lineStyle(1.2, 0x000000, 1).strokeCircle(pe.x, pe.y, raggioEroe);
    g.fillStyle(0xffffff, 1).fillCircle(pe.x, pe.y, Math.max(1, raggioEroe * 0.45));
  }

  private disegnaMondo(
    g: Phaser.GameObjects.Graphics,
    area: { x: number; y: number; larghezza: number; altezza: number },
    etichette: Phaser.GameObjects.Text[],
    idAttuale: string,
    adesso: number,
  ): void {
    g.fillStyle(0x1b2634, 0.95).fillRect(area.x, area.y, area.larghezza, area.altezza);
    g.lineStyle(1, 0x5a6d82, 0.85).strokeRect(area.x, area.y, area.larghezza, area.altezza);

    const pos = (id: string) => {
      const n = NODI_MONDO.find((x) => x.id === id)!;
      return {
        x: area.x + n.rx * area.larghezza,
        y: area.y + n.ry * area.altezza,
      };
    };

    g.lineStyle(2, 0x8a9bb0, 0.9);
    for (const [da, a] of COLLEGAMENTI_MONDO) {
      const p1 = pos(da);
      const p2 = pos(a);
      g.lineBetween(p1.x, p1.y, p2.x, p2.y);
    }

    NODI_MONDO.forEach((n, i) => {
      const p = pos(n.id);
      const qui = n.id === idAttuale;
      const etichetta = etichette[i];
      if (etichetta) {
        etichetta.setColor(qui ? '#ffe680' : '#cfd8e3');
      }
      if (qui) {
        const r = 5.5 + 0.7 * Math.sin(adesso / 150);
        g.fillStyle(0xffe680, 1).fillCircle(p.x, p.y, r);
        g.lineStyle(1.5, 0x000000, 1).strokeCircle(p.x, p.y, r);
      } else {
        g.fillStyle(0x9aa7b8, 1).fillCircle(p.x, p.y, 3.6);
        g.lineStyle(1, 0x000000, 0.8).strokeCircle(p.x, p.y, 3.6);
      }
    });
  }
}

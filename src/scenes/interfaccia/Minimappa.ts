// Minimappa e Mappa della Valle in sovrimpressione (HUD).
// Sempre visibile in alto a destra sotto le icone (modalità 'zona' o 'mondo'),
// oppure espandibile al centro dello schermo (modalità 'grande' con Valle + Zona
// affiancate e legenda) cliccando l'intestazione, l'icona Mappa o premendo M.

import * as Phaser from 'phaser';
import { TESSERA } from '../../costanti';
import type { ScenaMondo } from '../ScenaMondo';
import { STILE_TESTO, STILE_TITOLO } from './testi';
import { suoni } from '../../audio/Suoni';

const RIQUADRO = { x: 768, y: 58, larghezza: 180, altezza: 136 };
const MAPPA_INTERNA = { x: RIQUADRO.x + 8, y: RIQUADRO.y + 22, larghezza: RIQUADRO.larghezza - 16, altezza: 94 };

const GRANDE = { x: 130, y: 74, larghezza: 700, altezza: 372 };
const GRANDE_VALLE = { x: GRANDE.x + 18, y: GRANDE.y + 44, larghezza: 316, altezza: 280 };
const GRANDE_ZONA = { x: GRANDE.x + 356, y: GRANDE.y + 44, larghezza: 326, altezza: 280 };

interface NodoMondo {
  id: string;
  etichetta: string;
  nomeCompleto: string;
  rx: number; // frazione 0..1
  ry: number;
  /** Spostamento verticale dell'etichetta nella vista compatta. */
  dyCompatta?: number;
  /** Spostamento verticale dell'etichetta nella vista grande. */
  dyGrande?: number;
}

const NODI_MONDO: readonly NodoMondo[] = [
  { id: 'borgo', etichetta: 'Borgo', nomeCompleto: 'Borgo Quercia', rx: 0.14, ry: 0.52, dyGrande: 20 },
  { id: 'radura', etichetta: 'Radura', nomeCompleto: 'Radura Verde', rx: 0.34, ry: 0.52 },
  { id: 'bosco', etichetta: 'Bosco', nomeCompleto: 'Bosco Cupo', rx: 0.5, ry: 0.24 },
  { id: 'cimitero', etichetta: 'Cimitero', nomeCompleto: 'Cimitero', rx: 0.7, ry: 0.16 },
  { id: 'cripta_sale', etichetta: 'Cripta', nomeCompleto: 'Cripta (Sale)', rx: 0.89, ry: 0.12 },
  { id: 'cripta_tomba', etichetta: 'Tomba', nomeCompleto: 'Cripta (Tomba)', rx: 0.89, ry: 0.34 },
  { id: 'colline', etichetta: 'Colline', nomeCompleto: 'Colline Grigie', rx: 0.5, ry: 0.76 },
  { id: 'miniera_gallerie', etichetta: 'Miniera', nomeCompleto: 'Miniera', rx: 0.67, ry: 0.56 },
  { id: 'miniera_tana', etichetta: 'Tana', nomeCompleto: 'Tana del Troll', rx: 0.88, ry: 0.56 },
  { id: 'brughiera', etichetta: 'Brughiera', nomeCompleto: 'Brughiera', rx: 0.68, ry: 0.88 },
  { id: 'torre_piani', etichetta: 'Torre', nomeCompleto: 'Torre (Piani)', rx: 0.88, ry: 0.76 },
  { id: 'torre_cima', etichetta: 'Cima', nomeCompleto: 'Cima della Torre', rx: 0.88, ry: 0.94, dyCompatta: 3 },
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

export type ModalitaMappa = 'zona' | 'mondo' | 'grande';

export class Minimappa {
  private readonly grafica: Phaser.GameObjects.Graphics;
  private readonly barraClic: Phaser.GameObjects.Rectangle;
  private readonly chiusuraGrande: Phaser.GameObjects.Rectangle;
  private readonly titolo: Phaser.GameObjects.Text;
  private readonly piede: Phaser.GameObjects.Text;
  private readonly titoloGrande: Phaser.GameObjects.Text;
  private readonly sottotitoloValle: Phaser.GameObjects.Text;
  private readonly sottotitoloZona: Phaser.GameObjects.Text;
  private readonly piedeGrande: Phaser.GameObjects.Text;
  private readonly etichetteCompatte: Phaser.GameObjects.Text[] = [];
  private readonly etichetteGrandi: Phaser.GameObjects.Text[] = [];
  private modalita: ModalitaMappa = 'zona';

  constructor(scena: Phaser.Scene) {
    this.grafica = scena.add.graphics().setDepth(6);

    // Intestazione cliccabile del riquadro compatto in alto a destra:
    // permette di cambiare vista col mouse senza far camminare l'eroe.
    this.barraClic = scena.add
      .rectangle(RIQUADRO.x + RIQUADRO.larghezza / 2, RIQUADRO.y + 11, RIQUADRO.larghezza, 22, 0x243040, 0.01)
      .setDepth(7)
      .setInteractive({ useHandCursor: true });
    this.barraClic.on('pointerdown', () => {
      suoni.effetto('clic');
      this.alternaModalita();
    });

    // Intestazione cliccabile della mappa grande per chiuderla col mouse.
    this.chiusuraGrande = scena.add
      .rectangle(GRANDE.x + GRANDE.larghezza / 2, GRANDE.y + 18, GRANDE.larghezza, 36, 0x243040, 0.01)
      .setDepth(16)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });
    this.chiusuraGrande.on('pointerdown', () => {
      suoni.effetto('clic');
      this.impostaModalita('zona');
    });

    this.titolo = scena.add
      .text(RIQUADRO.x + 8, RIQUADRO.y + 4, '🗺 Mappa Zona (M)', {
        ...STILE_TESTO,
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#ffe680',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setDepth(7);

    this.piede = scena.add
      .text(RIQUADRO.x + 8, RIQUADRO.y + RIQUADRO.altezza - 16, '', {
        ...STILE_TESTO,
        fontSize: '11px',
        color: '#e8d9b0',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setDepth(7);

    this.titoloGrande = scena.add
      .text(GRANDE.x + GRANDE.larghezza / 2, GRANDE.y + 10, 'Mappa della Valle e della Zona  (clic qui o premi M per ridurre)', {
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
      .text(GRANDE_VALLE.x + GRANDE_VALLE.larghezza / 2, GRANDE.y + 30, 'Mondo (le 12 zone della Valle)', {
        ...STILE_TESTO,
        fontSize: '12px',
        color: '#cfd8e3',
      })
      .setOrigin(0.5, 0)
      .setDepth(16)
      .setVisible(false);

    this.sottotitoloZona = scena.add
      .text(GRANDE_ZONA.x + GRANDE_ZONA.larghezza / 2, GRANDE.y + 30, '', {
        ...STILE_TESTO,
        fontSize: '12px',
        color: '#cfd8e3',
      })
      .setOrigin(0.5, 0)
      .setDepth(16)
      .setVisible(false);

    this.piedeGrande = scena.add
      .text(
        GRANDE.x + GRANDE.larghezza / 2,
        GRANDE.y + GRANDE.altezza - 22,
        '● Tu (oro)   ● Compagno (verde)   ● Abitanti (celeste)   ● Nemici (rosso)   ■ Forzieri (giallo)   ■ Uscite (azzurro)',
        {
          ...STILE_TESTO,
          fontSize: '11px',
          color: '#e8d9b0',
          stroke: '#000000',
          strokeThickness: 2,
        },
      )
      .setOrigin(0.5, 0)
      .setDepth(16)
      .setVisible(false);

    for (const n of NODI_MONDO) {
      const px = MAPPA_INTERNA.x + n.rx * MAPPA_INTERNA.larghezza;
      const py = MAPPA_INTERNA.y + n.ry * MAPPA_INTERNA.altezza + (n.dyCompatta ?? -6);
      const tc = scena.add
        .text(px, py, n.etichetta, {
          ...STILE_TESTO,
          fontSize: '9px',
          color: '#cfd8e3',
          stroke: '#000000',
          strokeThickness: 2,
        })
        .setOrigin(0.5, 1)
        .setDepth(7)
        .setVisible(false);
      this.etichetteCompatte.push(tc);

      const gx = GRANDE_VALLE.x + n.rx * GRANDE_VALLE.larghezza;
      const gy = GRANDE_VALLE.y + n.ry * GRANDE_VALLE.altezza + (n.dyGrande ?? -8);
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
    const ordine: ModalitaMappa[] = ['zona', 'mondo', 'grande'];
    const prossimo = ordine[(ordine.indexOf(this.modalita) + 1) % ordine.length]!;
    this.impostaModalita(prossimo);
  }

  impostaModalita(nuova: ModalitaMappa): void {
    this.modalita = nuova;
    if (nuova === 'zona') {
      this.titolo.setText('🗺 Mappa Zona (M)');
    } else if (nuova === 'mondo') {
      this.titolo.setText('🗺 Mappa Valle (M)');
    }
    const inGrande = nuova === 'grande';
    this.titolo.setVisible(!inGrande);
    this.piede.setVisible(!inGrande);
    this.barraClic.setVisible(!inGrande);
    for (const t of this.etichetteCompatte) t.setVisible(nuova === 'mondo');
    this.chiusuraGrande.setVisible(inGrande);
    this.titoloGrande.setVisible(inGrande);
    this.sottotitoloValle.setVisible(inGrande);
    this.sottotitoloZona.setVisible(inGrande);
    this.piedeGrande.setVisible(inGrande);
    for (const t of this.etichetteGrandi) t.setVisible(inGrande);
  }

  aggiorna(mondo: ScenaMondo, adesso: number): void {
    const dati = mondo.statoMinimappa();
    if (!dati) return;
    const g = this.grafica.clear();

    if (this.modalita === 'grande') {
      this.disegnaPannelloGrande(g, dati, adesso);
      return;
    }

    // Riquadro compatto in alto a destra (sempre visibile come riferimento rapido).
    g.fillStyle(0x141c26, 0.88).fillRect(RIQUADRO.x, RIQUADRO.y, RIQUADRO.larghezza, RIQUADRO.altezza);
    g.fillStyle(0x223042, 0.95).fillRect(RIQUADRO.x, RIQUADRO.y, RIQUADRO.larghezza, 20);
    g.lineStyle(2, 0xc9b88a, 0.95).strokeRect(RIQUADRO.x, RIQUADRO.y, RIQUADRO.larghezza, RIQUADRO.altezza);

    if (this.modalita === 'mondo') {
      this.disegnaMondo(g, MAPPA_INTERNA, this.etichetteCompatte, dati.idMappa, adesso, false);
      this.piede.setText(`Sei a: ${dati.nomeMappa}`);
    } else {
      this.disegnaZona(g, MAPPA_INTERNA, dati, adesso, false);
      this.piede.setText(`${dati.nomeMappa} · clic/M`);
    }
  }

  private disegnaPannelloGrande(
    g: Phaser.GameObjects.Graphics,
    dati: NonNullable<ReturnType<ScenaMondo['statoMinimappa']>>,
    adesso: number,
  ): void {
    g.fillStyle(0x0f1620, 0.92).fillRect(GRANDE.x, GRANDE.y, GRANDE.larghezza, GRANDE.altezza);
    g.fillStyle(0x1f2d3d, 0.96).fillRect(GRANDE.x, GRANDE.y, GRANDE.larghezza, 28);
    g.lineStyle(2, 0xd8c290, 1).strokeRect(GRANDE.x, GRANDE.y, GRANDE.larghezza, GRANDE.altezza);
    g.lineStyle(1, 0x5a6d82, 0.8).lineBetween(
      GRANDE.x + 344,
      GRANDE.y + 32,
      GRANDE.x + 344,
      GRANDE.y + GRANDE.altezza - 28,
    );

    this.sottotitoloZona.setText(`Zona attuale: ${dati.nomeMappa}`);
    this.disegnaMondo(g, GRANDE_VALLE, this.etichetteGrandi, dati.idMappa, adesso, true);
    this.disegnaZona(g, GRANDE_ZONA, dati, adesso, true);
  }

  private disegnaZona(
    g: Phaser.GameObjects.Graphics,
    area: { x: number; y: number; larghezza: number; altezza: number },
    dati: NonNullable<ReturnType<ScenaMondo['statoMinimappa']>>,
    adesso: number,
    grande: boolean,
  ): void {
    const { larghezza, altezza, celle, eroe, compagno, nemici, forzieri, abitanti } = dati;
    const scala = Math.min(area.larghezza / larghezza, area.altezza / altezza);
    const w = larghezza * scala;
    const h = altezza * scala;
    const ox = area.x + (area.larghezza - w) / 2;
    const oy = area.y + (area.altezza - h) / 2;

    // Fondo pavimento ad alto contrasto.
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
            Math.max(grande ? 4 : 2.5, scala + 1),
            Math.max(grande ? 4 : 2.5, scala + 1),
          );
        }
      }
    }

    const punto = (p: { x: number; y: number }) => ({
      x: ox + (p.x / (larghezza * TESSERA)) * w,
      y: oy + (p.y / (altezza * TESSERA)) * h,
    });

    const fattore = grande ? 1.65 : 1;

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
    grande: boolean,
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

    g.lineStyle(grande ? 2 : 1.4, 0x8a9bb0, 0.9);
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
        const r = (grande ? 5.5 : 3.8) + 0.7 * Math.sin(adesso / 150);
        g.fillStyle(0xffe680, 1).fillCircle(p.x, p.y, r);
        g.lineStyle(1.5, 0x000000, 1).strokeCircle(p.x, p.y, r);
      } else {
        g.fillStyle(0x9aa7b8, 1).fillCircle(p.x, p.y, grande ? 3.6 : 2.4);
        g.lineStyle(1, 0x000000, 0.8).strokeCircle(p.x, p.y, grande ? 3.6 : 2.4);
      }
    });
  }
}

// Icone degli oggetti, disegnate dal codice come le altre icone (fino alla fase 9).
// Disegnano dentro un quadrato di lato "lato" centrato in (0, 0): le usiamo sia
// nello zaino (lato 40) sia per gli oggetti a terra nel mondo (lato 10).
// Armi e armature hanno il colore della loro RARITÀ: si riconoscono a colpo d'occhio.

import type * as Phaser from 'phaser';
import type { DefinizioneOggetto } from '../../systems/oggetti';
import { iconaZaino } from './icone';

const numero = (colore: string) => parseInt(colore.replace('#', ''), 16);
const LEGNO = 0x8a5a2b;
const METALLO = 0xd8e4f0;

type Disegno = (g: Phaser.GameObjects.Graphics, u: number, colore: number) => void;

/** Una boccetta: collo, corpo tondo e il liquido del colore della pozione. */
const boccetta: Disegno = (g, u, colore) => {
  g.fillStyle(0xd8e4f0, 0.9);
  g.fillRect(-1.2 * u, -4.5 * u, 2.4 * u, 2.5 * u); // collo
  g.fillCircle(0, 1 * u, 3.6 * u); // vetro
  g.fillStyle(colore, 1);
  g.fillCircle(0, 1.4 * u, 3 * u); // liquido
  g.fillStyle(0x6a4a2a, 1);
  g.fillRect(-1.4 * u, -5 * u, 2.8 * u, 1.2 * u); // tappo
  g.fillStyle(0xffffff, 0.6);
  g.fillCircle(-1.2 * u, 0, 0.8 * u); // riflesso
};

// ---- armi: tutte in diagonale, dall'angolo in basso a sinistra ----

const spada: Disegno = (g, u, colore) => {
  g.lineStyle(1.6 * u, METALLO, 1).lineBetween(-1.5 * u, 1.5 * u, 4 * u, -4 * u); // lama
  g.lineStyle(1.2 * u, colore, 1).lineBetween(-3.5 * u, -0.5 * u, 0.5 * u, 3.5 * u); // elsa
  g.lineStyle(1.4 * u, LEGNO, 1).lineBetween(-4 * u, 4 * u, -2 * u, 2 * u); // impugnatura
};

const pugnale: Disegno = (g, u, colore) => {
  g.lineStyle(1.4 * u, METALLO, 1).lineBetween(-0.5 * u, 0.5 * u, 2.5 * u, -2.5 * u);
  g.lineStyle(1 * u, colore, 1).lineBetween(-2 * u, -0.5 * u, 0.5 * u, 2 * u);
  g.lineStyle(1.2 * u, LEGNO, 1).lineBetween(-2.5 * u, 2.5 * u, -1 * u, 1 * u);
};

const mazza: Disegno = (g, u, colore) => {
  g.lineStyle(1.3 * u, LEGNO, 1).lineBetween(-4 * u, 4 * u, 1.5 * u, -1.5 * u);
  g.fillStyle(colore, 1).fillCircle(2.2 * u, -2.2 * u, 2.2 * u);
};

const bastone: Disegno = (g, u, colore) => {
  g.lineStyle(1.2 * u, LEGNO, 1).lineBetween(-4 * u, 4 * u, 3 * u, -3 * u);
  g.fillStyle(colore, 1).fillCircle(3.3 * u, -3.3 * u, 1.5 * u);
};

const arco: Disegno = (g, u, colore) => {
  // Un quarto di cerchio dall'alto a destra, con la corda tesa in diagonale.
  g.lineStyle(1.4 * u, colore, 1).beginPath();
  g.arc(-3 * u, 3 * u, 6.5 * u, -Math.PI / 2, 0, false).strokePath();
  g.lineStyle(0.5 * u, 0xffffff, 0.9).lineBetween(-3 * u, -3.5 * u, 3.5 * u, 3 * u);
};

const balestra: Disegno = (g, u, colore) => {
  g.lineStyle(1.4 * u, LEGNO, 1).lineBetween(-3.5 * u, 3.5 * u, 2 * u, -2 * u); // fusto
  g.lineStyle(1.2 * u, colore, 1).lineBetween(-1 * u, -4 * u, 4 * u, 1 * u); // arco
};

const pugnaliLancio: Disegno = (g, u, colore) => {
  for (const d of [-1.5, 1.5]) {
    g.lineStyle(1 * u, METALLO, 1).lineBetween(-2 * u + d * u, 2 * u, 2 * u + d * u, -2 * u);
    g.fillStyle(colore, 1).fillCircle(-2 * u + d * u, 2 * u, 0.8 * u);
  }
};

const bacchetta: Disegno = (g, u, colore) => {
  g.lineStyle(0.9 * u, 0xf0e6d0, 1).lineBetween(-3.5 * u, 3.5 * u, 2.5 * u, -2.5 * u);
  g.fillStyle(colore, 1).fillCircle(3 * u, -3 * u, 1.2 * u);
  g.fillStyle(0xffffff, 0.8).fillCircle(3 * u, -3 * u, 0.5 * u);
};

// ---- armature ----

const elmo: Disegno = (g, u, colore) => {
  g.fillStyle(colore, 1).fillCircle(0, 0.5 * u, 3.6 * u);
  g.fillRect(-3.6 * u, 0.5 * u, 7.2 * u, 2.5 * u);
  g.fillStyle(0x10141c, 1).fillRect(-2.4 * u, 0.6 * u, 4.8 * u, 1 * u); // visiera
};

const corazza: Disegno = (g, u, colore) => {
  g.fillStyle(colore, 1);
  g.fillRect(-2.6 * u, -3.5 * u, 5.2 * u, 7.5 * u); // busto
  g.fillRect(-4.2 * u, -3.5 * u, 8.4 * u, 2.2 * u); // spalle
  g.fillStyle(0x000000, 0.25).fillRect(-0.3 * u, -2 * u, 0.6 * u, 5.5 * u);
};

const guanti: Disegno = (g, u, colore) => {
  g.fillStyle(colore, 1);
  g.fillRoundedRect(-2.5 * u, -2 * u, 5 * u, 5 * u, 1 * u); // palmo
  for (let i = 0; i < 3; i++) g.fillRect((-2.2 + i * 1.6) * u, -4 * u, 1.2 * u, 2.4 * u); // dita
  g.fillRect(2.5 * u, -0.5 * u, 1.5 * u, 2 * u); // pollice
};

const stivali: Disegno = (g, u, colore) => {
  g.fillStyle(colore, 1);
  g.fillRect(-2.5 * u, -4 * u, 3.2 * u, 6.5 * u); // gambale
  g.fillRect(-2.5 * u, 1.5 * u, 6 * u, 2.5 * u); // piede
};

// ---- materiali e pergamene ----

const minerale: Disegno = (g, u, colore) => {
  g.fillStyle(0x7a7a7a, 1).fillCircle(-1 * u, 1 * u, 3.4 * u).fillCircle(2 * u, -0.5 * u, 2.6 * u);
  g.fillStyle(colore, 1).fillCircle(-1.5 * u, 0.5 * u, 1.2 * u).fillCircle(2 * u, -1 * u, 0.9 * u).fillCircle(0.3 * u, 2.4 * u, 0.8 * u);
};

const pelle: Disegno = (g, u, colore) => {
  g.fillStyle(colore, 1).fillRoundedRect(-4 * u, -3 * u, 8 * u, 6 * u, 2 * u);
  g.fillStyle(0x000000, 0.25).fillRect(-3 * u, -0.4 * u, 6 * u, 0.8 * u);
};

const gelatina: Disegno = (g, u, colore) => {
  g.fillStyle(colore, 0.85).fillEllipse(0, 1 * u, 8 * u, 5.5 * u);
  g.fillStyle(0xffffff, 0.6).fillCircle(-1.5 * u, -0.2 * u, 0.9 * u);
};

const osso: Disegno = (g, u, colore) => {
  g.lineStyle(1.6 * u, colore, 1).lineBetween(-2.5 * u, 2.5 * u, 2.5 * u, -2.5 * u);
  g.fillStyle(colore, 1).fillCircle(-3 * u, 2 * u, 1.1 * u).fillCircle(-2 * u, 3 * u, 1.1 * u).fillCircle(3 * u, -2 * u, 1.1 * u).fillCircle(2 * u, -3 * u, 1.1 * u);
};

const cristallo: Disegno = (g, u, colore) => {
  g.fillStyle(colore, 1).fillTriangle(0, -4.5 * u, -2.5 * u, 0, 2.5 * u, 0).fillTriangle(-2.5 * u, 0, 2.5 * u, 0, 0, 4.5 * u);
  g.fillStyle(0xffffff, 0.6).fillTriangle(0, -4.5 * u, -1 * u, -0.5 * u, 0.5 * u, -0.5 * u);
};

const frammento: Disegno = (g, u, colore) => {
  g.fillStyle(colore, 1).fillTriangle(-4 * u, 2.5 * u, -2 * u, -3 * u, 0, 2.5 * u).fillTriangle(-1 * u, 2.5 * u, 1.5 * u, -2 * u, 3.5 * u, 2.5 * u);
  g.fillStyle(0xb8862a, 1).fillRect(-4 * u, 2 * u, 7.5 * u, 1.3 * u);
};

/** Un mazzetto di foglie: le erbe di frate Anselmo. */
const erba: Disegno = (g, u, colore) => {
  g.lineStyle(0.8 * u, 0x3a5a2a, 1).lineBetween(0, 4 * u, 0, -1 * u);
  g.fillStyle(colore, 1).fillEllipse(-2 * u, -1 * u, 3 * u, 6 * u).fillEllipse(2 * u, -1 * u, 3 * u, 6 * u).fillEllipse(0, -2.5 * u, 3 * u, 6 * u);
  g.fillStyle(0xffffff, 0.35).fillCircle(-0.5 * u, -3.5 * u, 0.7 * u);
};

// ---- oggetti delle quest (fase 7b) ----

/** Una busta chiusa con il sigillo di ceralacca. */
const lettera: Disegno = (g, u, colore) => {
  g.fillStyle(colore, 1).fillRect(-4 * u, -2.8 * u, 8 * u, 5.6 * u);
  g.lineStyle(0.6 * u, 0x8a7a5a, 1).lineBetween(-4 * u, -2.8 * u, 0, 0.6 * u).lineBetween(4 * u, -2.8 * u, 0, 0.6 * u);
  g.fillStyle(0xb02a2a, 1).fillCircle(0, 0.6 * u, 1 * u);
};

/** Una chiave antica: anello e dentini. */
const chiave: Disegno = (g, u, colore) => {
  g.lineStyle(1.2 * u, colore, 1).strokeCircle(-2.5 * u, -2.5 * u, 1.6 * u).lineBetween(-1.4 * u, -1.4 * u, 3.5 * u, 3.5 * u);
  g.lineBetween(2 * u, 2 * u, 3.2 * u, 0.8 * u).lineBetween(3 * u, 3 * u, 4.2 * u, 1.8 * u);
};

/** Una mappa piegata con una X rossa. */
const mappa: Disegno = (g, u, colore) => {
  g.fillStyle(colore, 1).fillRect(-4 * u, -3.5 * u, 8 * u, 7 * u);
  g.lineStyle(0.5 * u, 0x8a7a5a, 1).lineBetween(-1.3 * u, -3.5 * u, -1.3 * u, 3.5 * u).lineBetween(1.3 * u, -3.5 * u, 1.3 * u, 3.5 * u);
  g.lineStyle(0.5 * u, 0x6a8a5a, 1).lineBetween(-3.5 * u, 1.5 * u, -0.5 * u, -0.5 * u).lineBetween(-0.5 * u, -0.5 * u, 2 * u, 0.8 * u);
  g.lineStyle(0.9 * u, 0xc02a2a, 1).lineBetween(1.5 * u, -2.5 * u, 3.2 * u, -0.8 * u).lineBetween(3.2 * u, -2.5 * u, 1.5 * u, -0.8 * u);
};

/** Una pergamena arrotolata con un disegno d'arma (la ricetta). */
const pergamena: Disegno = (g, u, colore) => {
  g.fillStyle(colore, 1).fillRect(-3 * u, -3.5 * u, 6 * u, 7 * u);
  g.fillStyle(0xc9b88a, 1).fillRoundedRect(-4 * u, -4.5 * u, 8 * u, 1.6 * u, 0.8 * u).fillRoundedRect(-4 * u, 2.9 * u, 8 * u, 1.6 * u, 0.8 * u);
  g.lineStyle(0.7 * u, 0x6a4a2a, 1).lineBetween(-1.5 * u, 1.8 * u, 1.8 * u, -1.8 * u).lineBetween(-1.8 * u, 0.2 * u, 0 * u, 1.8 * u);
};

const PER_FORMA: Record<string, Disegno> = {
  minerale,
  pelle,
  gelatina,
  osso,
  cristallo,
  frammento,
  erba,
  lettera,
  chiave,
  mappa,
  spada,
  pugnale,
  mazza,
  bastone,
  arco,
  balestra,
  pugnale_lancio: pugnaliLancio,
  bacchetta,
  elmo,
  corazza,
  guanti,
  stivali,
};

export function disegnaOggetto(g: Phaser.GameObjects.Graphics, oggetto: DefinizioneOggetto, lato: number): void {
  const u = lato / 10;
  const colore = numero(oggetto.colore);
  switch (oggetto.tipo) {
    case 'pozione':
      boccetta(g, u, colore);
      break;
    case 'borsa':
      iconaZaino(g, lato);
      break;
    case 'monete':
      // Tre monete d'oro un po' sovrapposte, con il bordo più scuro.
      for (const [dx, dy] of [[-1.6, 1], [1.6, 1], [0, -1.4]] as const) {
        g.fillStyle(0xb8862a, 1).fillCircle(dx * u, dy * u, 2.6 * u);
        g.fillStyle(colore, 1).fillCircle(dx * u, dy * u, 2 * u);
      }
      break;
    case 'pergamena':
      // La mappa del tesoro è una "pergamena" che si usa, ma si vede come una mappa.
      (oggetto.forma === 'mappa' ? mappa : pergamena)(g, u, colore);
      break;
    case 'arma':
    case 'armatura':
    case 'materiale':
    case 'missione':
      // Una forma che non conosciamo ancora diventa un quadratino del colore della rarità.
      (PER_FORMA[oggetto.forma ?? ''] ?? ((gg, uu, c) => gg.fillStyle(c, 1).fillRect(-3 * uu, -3 * uu, 6 * uu, 6 * uu)))(g, u, colore);
      break;
  }
}

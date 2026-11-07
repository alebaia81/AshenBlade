// Icone disegnate dal codice con forme semplici (fino alla fase 9 niente immagini).
// Ogni funzione disegna dentro un quadrato di lato "lato" centrato in (0, 0).

import type * as Phaser from 'phaser';

export type DisegnaIcona = (g: Phaser.GameObjects.Graphics, lato: number) => void;

/** Ritratto: testa e spalle. Apre la scheda del personaggio. */
export const iconaRitratto: DisegnaIcona = (g, lato) => {
  const u = lato / 10;
  g.fillStyle(0xf0e6d0, 1);
  g.fillCircle(0, -1.5 * u, 2 * u); // testa
  g.fillRoundedRect(-3.5 * u, 1 * u, 7 * u, 3.5 * u, 1.5 * u); // spalle
};

/** Ingranaggio: modalità sviluppatore. */
export const iconaIngranaggio: DisegnaIcona = (g, lato) => {
  const u = lato / 10;
  g.fillStyle(0xc8c8c8, 1);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    g.fillCircle(Math.cos(a) * 3.2 * u, Math.sin(a) * 3.2 * u, 1.1 * u); // denti
  }
  g.fillCircle(0, 0, 3 * u);
  g.fillStyle(0x2a2a2a, 1);
  g.fillCircle(0, 0, 1.3 * u); // foro
};

/** Zaino: inventario (fase 4). */
export const iconaZaino: DisegnaIcona = (g, lato) => {
  const u = lato / 10;
  g.fillStyle(0x9a6b3c, 1);
  g.fillRoundedRect(-3.5 * u, -2.5 * u, 7 * u, 7 * u, 1.5 * u); // sacca
  g.fillStyle(0x7a5230, 1);
  g.fillRoundedRect(-3.5 * u, -2.5 * u, 7 * u, 3 * u, 1.2 * u); // patta
  g.lineStyle(1.2 * u, 0x7a5230, 1);
  g.strokeCircle(0, -3.5 * u, 1.5 * u); // maniglia
  g.fillStyle(0xd4a72c, 1);
  g.fillRect(-0.6 * u, 0, 1.2 * u, 1.2 * u); // fibbia
};

/** Pergamena: registro delle quest (fase 7). */
export const iconaPergamena: DisegnaIcona = (g, lato) => {
  const u = lato / 10;
  g.fillStyle(0xe8d9b0, 1);
  g.fillRect(-3 * u, -3.5 * u, 6 * u, 7 * u); // foglio
  g.fillStyle(0xc9b88a, 1);
  g.fillRoundedRect(-4 * u, -4.5 * u, 8 * u, 1.6 * u, 0.8 * u); // rotolo in alto
  g.fillRoundedRect(-4 * u, 2.9 * u, 8 * u, 1.6 * u, 0.8 * u); // rotolo in basso
  g.fillStyle(0x8a7a5a, 1);
  for (let i = 0; i < 3; i++) g.fillRect(-2 * u, (-1.8 + i * 1.5) * u, 4 * u, 0.5 * u); // righe di testo
};

/**
 * Un'icona da un disegno a caratteri (fase 9b): ogni carattere è un pixel, la
 * tavolozza dice il colore. Disegnata con rettangoli, quindi si ingrandisce
 * senza sfocare, alla misura del pulsante.
 */
export function iconaDaDisegno(disegno: readonly string[], tavolozza: Readonly<Record<string, string>>): DisegnaIcona {
  return (g, lato) => {
    const pixel = lato / disegno.length;
    const meta = lato / 2;
    disegno.forEach((riga, y) =>
      [...riga].forEach((c, x) => {
        const colore = tavolozza[c];
        if (!colore) return;
        g.fillStyle(parseInt(colore.slice(1), 16), 1).fillRect(-meta + x * pixel, -meta + y * pixel, pixel + 0.05, pixel + 0.05);
      }),
    );
  };
}

/** Tre righe orizzontali (l'icona "menu" delle app): il menu di pausa. */
export const iconaMenu: DisegnaIcona = (g, lato) => {
  const u = lato / 10;
  g.fillStyle(0xe8e8e8, 1);
  for (let i = -1; i <= 1; i++) g.fillRoundedRect(-3.5 * u, (i * 2.4 - 0.6) * u, 7 * u, 1.2 * u, 0.5 * u);
};

/** Dischetto da 3,5 pollici: salvataggio (fase 9). */
export const iconaDischetto: DisegnaIcona = (g, lato) => {
  const u = lato / 10;
  g.fillStyle(0x3a4a8a, 1);
  g.fillRect(-4 * u, -4 * u, 8 * u, 8 * u); // corpo
  g.fillStyle(0xb8c0c8, 1);
  g.fillRect(-2 * u, -4 * u, 4 * u, 2.6 * u); // sportellino metallico
  g.fillStyle(0x3a4a8a, 1);
  g.fillRect(0.5 * u, -3.6 * u, 0.9 * u, 1.8 * u); // finestrella
  g.fillStyle(0xf0f0f0, 1);
  g.fillRect(-3 * u, 0.5 * u, 6 * u, 3 * u); // etichetta
};

/** Capriola: una freccia che gira su se stessa. */
export const iconaCapriola: DisegnaIcona = (g, lato) => {
  const u = lato / 10;
  g.lineStyle(1.3 * u, 0x8fd3ff, 1).beginPath();
  g.arc(0, 0, 3.2 * u, Math.PI * 0.15, Math.PI * 1.75, false).strokePath();
  g.fillStyle(0x8fd3ff, 1).fillTriangle(2.4 * u, -3.6 * u, 4.6 * u, -1 * u, 1 * u, -0.6 * u); // punta
};

/** Abilità di classe: una stella. */
export const iconaAbilita: DisegnaIcona = (g, lato) => {
  const u = lato / 10;
  // Dieci punti alternando raggio grande (le punte) e piccolo (gli incavi).
  g.fillStyle(0xffc94a, 1).beginPath();
  for (let i = 0; i < 10; i++) {
    const r = (i % 2 === 0 ? 4.2 : 1.8) * u;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    if (i === 0) g.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  g.closePath().fillPath();
};

/** Compagno: due teste vicine (fase 5). */
export const iconaCompagno: DisegnaIcona = (g, lato) => {
  const u = lato / 10;
  g.fillStyle(0xc8c8c8, 1);
  g.fillCircle(-1.8 * u, -1.5 * u, 1.6 * u);
  g.fillCircle(2 * u, -1 * u, 1.4 * u);
  g.fillRoundedRect(-4.2 * u, 0.6 * u, 4.8 * u, 3 * u, 1.2 * u);
  g.fillRoundedRect(0.2 * u, 1 * u, 3.8 * u, 2.6 * u, 1 * u);
};

/** Spazio dell'arma secondaria vuoto: il contorno tratteggiato di un arco. */
export const iconaArmaAssente: DisegnaIcona = (g, lato) => {
  const u = lato / 10;
  g.lineStyle(0.8 * u, 0x6b7686, 1);
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 12;
    g.beginPath().arc(-3 * u, 3 * u, 6.5 * u, a, a + Math.PI / 24, false).strokePath();
  }
};

/** Mappa pieghevole con bussola/segnaposto: alterna le viste della mappa (M). */
export const iconaMappa: DisegnaIcona = (g, lato) => {
  const u = lato / 10;
  // Tre lembi di pergamena piegata
  g.fillStyle(0xe8d9b0, 1).fillRect(-3.8 * u, -3.2 * u, 2.5 * u, 6.4 * u);
  g.fillStyle(0xd4c294, 1).fillRect(-1.3 * u, -3.2 * u, 2.6 * u, 6.4 * u);
  g.fillStyle(0xe8d9b0, 1).fillRect(1.3 * u, -3.2 * u, 2.5 * u, 6.4 * u);
  g.lineStyle(0.6 * u, 0x7a5a3a, 1).strokeRect(-3.8 * u, -3.2 * u, 7.6 * u, 6.4 * u);
  // Sentiero tratteggiato e X rossa / segnaposto
  g.lineStyle(0.7 * u, 0x5a7a4a, 1).lineBetween(-2.8 * u, 1.6 * u, 0, -0.8 * u).lineBetween(0, -0.8 * u, 2.2 * u, 0.8 * u);
  g.fillStyle(0xd94a4a, 1).fillCircle(2.2 * u, -1.2 * u, 1.1 * u);
  g.fillStyle(0xffe680, 1).fillCircle(-2.4 * u, 1.5 * u, 0.9 * u);
};

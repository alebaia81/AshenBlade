// Ricerca del percorso con l'algoritmo A* ("A star").
//
// Il problema: l'eroe è in una cella, il giocatore ha cliccato un'altra cella,
// in mezzo ci sono alberi e acqua. Quale strada fare?
//
// L'idea di A*: esplorare le celle partendo da quelle che SEMBRANO più promettenti.
// Per ogni cella conosciamo:
//   g = quanto costa arrivarci dalla partenza (strada già fatta, certa);
//   h = una stima di quanto manca all'arrivo (in linea d'aria, ignorando i muri);
//   f = g + h, il costo totale stimato di un percorso che passa di lì.
// A ogni passo si espande la cella "aperta" con la f più bassa. Se la stima h
// non sopravvaluta mai la distanza vera, il primo percorso trovato è il più breve.
// È lo stesso principio di un navigatore stradale.

import type { Cella, Vettore } from './tipi';

/** Ciò che serve sapere della mappa: dimensioni e "qui si può camminare?". */
export interface Griglia {
  larghezza: number;
  altezza: number;
  calpestabile(col: number, riga: number): boolean;
}

const DIAGONALE = Math.SQRT2;
/** Le 8 celle vicine: 4 dritte e 4 in diagonale. */
const VICINI = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
] as const;

/**
 * Celle vicine raggiungibili con un passo. In diagonale si passa solo se sono
 * libere anche le due celle "di lato": niente scorciatoie attraverso lo spigolo
 * tra due muri (il corpo dell'eroe non ci passerebbe).
 */
function viciniRaggiungibili(g: Griglia, c: Cella): { cella: Cella; costo: number }[] {
  const risultato: { cella: Cella; costo: number }[] = [];
  for (const [dc, dr] of VICINI) {
    const col = c.col + dc;
    const riga = c.riga + dr;
    if (!g.calpestabile(col, riga)) continue;
    const diagonale = dc !== 0 && dr !== 0;
    if (diagonale && (!g.calpestabile(c.col + dc, c.riga) || !g.calpestabile(c.col, c.riga + dr))) continue;
    risultato.push({ cella: { col, riga }, costo: diagonale ? DIAGONALE : 1 });
  }
  return risultato;
}

/**
 * Stima della distanza con 8 direzioni ("distanza ottagonale"): i passi in
 * diagonale coprono entrambi gli assi insieme. Non sopravvaluta mai, quindi A*
 * trova il percorso più breve.
 */
function stima(a: Cella, b: Cella): number {
  const dx = Math.abs(a.col - b.col);
  const dy = Math.abs(a.riga - b.riga);
  return Math.max(dx, dy) + (DIAGONALE - 1) * Math.min(dx, dy);
}

/**
 * Percorso da "da" ad "a": l'elenco delle celle da attraversare, esclusa la
 * partenza e compreso l'arrivo. [] se si è già arrivati, null se non c'è strada.
 */
export function trovaPercorso(g: Griglia, da: Cella, a: Cella): Cella[] | null {
  if (!g.calpestabile(a.col, a.riga)) return null;
  if (da.col === a.col && da.riga === a.riga) return [];

  // Ogni cella diventa un numero (come l'indice di un array a una dimensione).
  const chiave = (c: Cella) => c.riga * g.larghezza + c.col;
  const costo = new Map<number, number>([[chiave(da), 0]]); // g
  const padre = new Map<number, Cella>(); // da dove si arriva, per ricostruire la strada
  const chiuse = new Set<number>();
  // Le celle "aperte": scoperte ma non ancora espanse. Per mappe piccole basta
  // cercare il minimo scorrendo l'elenco; con mappe grandi si userebbe una coda
  // con priorità (heap), molto più veloce.
  let aperte: { cella: Cella; f: number }[] = [{ cella: da, f: stima(da, a) }];

  while (aperte.length > 0) {
    let migliore = 0;
    for (let i = 1; i < aperte.length; i++) if (aperte[i]!.f < aperte[migliore]!.f) migliore = i;
    const { cella } = aperte[migliore]!;
    aperte.splice(migliore, 1);
    const k = chiave(cella);
    if (chiuse.has(k)) continue;
    chiuse.add(k);

    if (cella.col === a.col && cella.riga === a.riga) return ricostruisci(padre, chiave, cella, da);

    for (const vicino of viciniRaggiungibili(g, cella)) {
      const kv = chiave(vicino.cella);
      if (chiuse.has(kv)) continue;
      const nuovoCosto = costo.get(k)! + vicino.costo;
      if (nuovoCosto < (costo.get(kv) ?? Infinity)) {
        costo.set(kv, nuovoCosto);
        padre.set(kv, cella);
        aperte.push({ cella: vicino.cella, f: nuovoCosto + stima(vicino.cella, a) });
      }
    }
  }
  return null; // abbiamo esplorato tutto ciò che è raggiungibile: niente strada
}

/** Risale da arrivo a partenza seguendo i "padri", poi rovescia l'elenco. */
function ricostruisci(padre: Map<number, Cella>, chiave: (c: Cella) => number, arrivo: Cella, da: Cella): Cella[] {
  const percorso: Cella[] = [];
  let c: Cella | undefined = arrivo;
  while (c && !(c.col === da.col && c.riga === da.riga)) {
    percorso.push(c);
    c = padre.get(chiave(c));
  }
  return percorso.reverse();
}

/**
 * Se il giocatore clicca dentro un albero o un lago non c'è strada: invece di
 * non fare nulla scegliamo, tra le celle raggiungibili, quella più vicina al clic.
 * Visita "a macchia d'olio" (ricerca in ampiezza) tutto ciò che si può raggiungere.
 */
export function cellaRaggiungibilePiuVicina(g: Griglia, da: Cella, bersaglio: Cella): Cella | null {
  const chiave = (c: Cella) => c.riga * g.larghezza + c.col;
  const viste = new Set<number>([chiave(da)]);
  const coda: Cella[] = [da];
  let migliore: Cella | null = null;
  let distanzaMigliore = Infinity;
  while (coda.length > 0) {
    const c = coda.shift()!;
    const d = Math.hypot(c.col - bersaglio.col, c.riga - bersaglio.riga);
    if (d < distanzaMigliore) {
      migliore = c;
      distanzaMigliore = d;
    }
    for (const { cella } of viciniRaggiungibili(g, c)) {
      const k = chiave(cella);
      if (!viste.has(k)) {
        viste.add(k);
        coda.push(cella);
      }
    }
  }
  return migliore;
}

/**
 * Un corpo quadrato di mezzo lato "mezzoLato" può andare dritto da a a b senza
 * toccare muri? Si controllano gli angoli del corpo in tanti punti del tragitto,
 * ogni 2 pixel: la linea dei centri da sola non basta, l'eroe ha una larghezza.
 */
export function liberoTra(g: Griglia, a: Vettore, b: Vettore, mezzoLato: number, tessera: number): boolean {
  const distanza = Math.hypot(b.x - a.x, b.y - a.y);
  const passi = Math.max(1, Math.ceil(distanza / 2));
  // Un soffio di margine: un corpo appoggiato esattamente al bordo di un muro non lo tocca.
  const m = mezzoLato - 0.01;
  for (let i = 0; i <= passi; i++) {
    const x = a.x + ((b.x - a.x) * i) / passi;
    const y = a.y + ((b.y - a.y) * i) / passi;
    for (const [px, py] of [[x - m, y - m], [x + m, y - m], [x - m, y + m], [x + m, y + m]] as const) {
      if (!g.calpestabile(Math.floor(px / tessera), Math.floor(py / tessera))) return false;
    }
  }
  return true;
}

/**
 * Il percorso di A* va da centro a centro di cella: seguito alla lettera fa
 * camminare a zig-zag. Qui lo "tendiamo come un filo": da ogni punto si salta
 * dritti al punto più lontano raggiungibile in linea retta.
 */
export function lisciaPercorso(
  g: Griglia,
  inizio: Vettore,
  punti: readonly Vettore[],
  mezzoLato: number,
  tessera: number,
): Vettore[] {
  const risultato: Vettore[] = [];
  let ancora = inizio;
  let i = 0;
  while (i < punti.length) {
    let j = punti.length - 1;
    while (j > i && !liberoTra(g, ancora, punti[j]!, mezzoLato, tessera)) j--;
    risultato.push(punti[j]!);
    ancora = punti[j]!;
    i = j + 1;
  }
  return risultato;
}

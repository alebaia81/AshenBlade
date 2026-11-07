// La pixel art come DATI (fase 9b): data/sprite.json dice quale immagine usare
// per ogni cosa del gioco, e qui ci sono le regole per leggerlo e controllarlo.
// Nessun Phaser: "risolvere" un aspetto vuol dire trasformare un nome
// ("melma" con una tinta) in coordinate precise (foglio, numero della tessera,
// colore), che poi la scena sa disegnare.

/** I due pacchetti Kenney: stessa griglia, 12 × 11 tessere da 16 pixel. */
export const FOGLI = ['citta', 'dungeon'] as const;
export type Foglio = (typeof FOGLI)[number];
export const COLONNE_FOGLIO = 12;
export const TESSERE_PER_FOGLIO = 132;
/** Lato di un disegno scritto a mano, come le tessere. */
export const LATO_DISEGNO = 16;

/** Un'immagine: una tessera di un foglio, oppure un disegno a caratteri con la sua tavolozza. */
export type Immagine =
  | { foglio: Foglio; indice: number }
  | { disegno: string[]; tavolozza: Record<string, string> };

/** Come la si usa: solo il nome, oppure con una tinta (moltiplicata ai colori) e una trasparenza. */
export type Aspetto = string | { immagine: string; tinta?: string; alfa?: number };

/** Uno strato di una tessera della mappa: un aspetto oppure un colore pieno ("#3a6ea5"). */
export type Strato = Aspetto;

export interface DatiSprite {
  immagini: Record<string, Immagine>;
  classi: Record<string, Aspetto>;
  compagni: Record<string, Aspetto>;
  abitanti: Record<string, Aspetto>;
  nemici: Record<string, Aspetto>;
  oggetti: Record<string, Aspetto>;
  vene: Record<string, Aspetto>;
}

/**
 * Pronto per essere disegnato. "chiave" è il nome della texture in Phaser:
 * il foglio ("citta", "dungeon") oppure "disegno:<nome>"; "fotogramma" il
 * numero della tessera nel foglio (assente per i disegni).
 */
export interface AspettoRisolto {
  chiave: string;
  fotogramma?: number;
  /** Colore da moltiplicare (0xffffff = nessun cambiamento). */
  tinta: number;
  alfa: number;
}

export type StratoRisolto = AspettoRisolto | { colore: number };

export function chiaveDisegno(nome: string): string {
  return `disegno:${nome}`;
}

/** "#c8a0ff" → 0xc8a0ff */
function numeroColore(c: string): number {
  return parseInt(c.slice(1), 16);
}

const COLORE = /^#[0-9a-fA-F]{6}$/;

export function risolvi(aspetto: Aspetto, immagini: Readonly<Record<string, Immagine>>): AspettoRisolto {
  const { immagine: nome, tinta, alfa } = typeof aspetto === 'string' ? { immagine: aspetto } : aspetto;
  const img = immagini[nome];
  if (!img) throw new Error(`Immagine "${nome}" assente in sprite.json`);
  const base = 'foglio' in img ? { chiave: img.foglio, fotogramma: img.indice } : { chiave: chiaveDisegno(nome) };
  return { ...base, tinta: tinta ? numeroColore(tinta) : 0xffffff, alfa: alfa ?? 1 };
}

export function risolviStrato(s: Strato, immagini: Readonly<Record<string, Immagine>>): StratoRisolto {
  if (typeof s === 'string' && s.startsWith('#')) return { colore: numeroColore(s) };
  return risolvi(s, immagini);
}

/** Una tessera della mappa può avere uno strato o un elenco (dal basso: erba, poi l'albero sopra). */
export function stratiDi(tessera: Strato | Strato[], immagini: Readonly<Record<string, Immagine>>): StratoRisolto[] {
  return (Array.isArray(tessera) ? tessera : [tessera]).map((s) => risolviStrato(s, immagini));
}

// ---- animazione della camminata ----

/**
 * I pacchetti hanno una sola posa per figura: la camminata è "simulata" con un
 * saltello. Restituisce di quanto alzare la figura (pixel, ≤ 0) in questo istante:
 * mezzo seno ripetuto, come i passi.
 */
export function saltello(adesso: number, inMovimento: boolean, periodoMs = 320, altezza = 1.5): number {
  if (!inMovimento) return 0;
  const fase = (adesso % periodoMs) / periodoMs;
  return -Math.abs(Math.sin(fase * Math.PI)) * altezza;
}

/**
 * Le figure guardano a destra: andando a sinistra si ribaltano. Sotto la soglia
 * (fermo, o quasi in verticale) si tiene il verso di prima, così la figura non
 * "sfarfalla" mentre sale o scende.
 */
export function guardaASinistra(primaASinistra: boolean, velocitaX: number, soglia = 5): boolean {
  if (velocitaX < -soglia) return true;
  if (velocitaX > soglia) return false;
  return primaASinistra;
}

// ---- controlli ----

export interface Richiesti {
  classi: readonly string[];
  compagni: readonly string[];
  abitanti: readonly string[];
  nemici: readonly string[];
  vene: readonly string[];
  /** Le tessere scritte nelle legende delle mappe: "borgo/#" → strati. */
  tessere: Readonly<Record<string, Strato | Strato[] | undefined>>;
}

/** Come le altre validazioni dei dati: un elenco di frasi leggibili, vuoto se è tutto a posto. */
export function validaSprite(d: DatiSprite, r: Richiesti): string[] {
  const errori: string[] = [];
  for (const [nome, img] of Object.entries(d.immagini)) {
    if ('foglio' in img) {
      if (!FOGLI.includes(img.foglio)) errori.push(`immagine "${nome}": foglio "${img.foglio}" sconosciuto`);
      if (!Number.isInteger(img.indice) || img.indice < 0 || img.indice >= TESSERE_PER_FOGLIO) {
        errori.push(`immagine "${nome}": indice ${img.indice} fuori dal foglio (0–${TESSERE_PER_FOGLIO - 1})`);
      }
    } else {
      if (img.disegno.length !== LATO_DISEGNO || img.disegno.some((riga) => [...riga].length !== LATO_DISEGNO)) {
        errori.push(`disegno "${nome}": servono ${LATO_DISEGNO} righe da ${LATO_DISEGNO} caratteri`);
      }
      const ignoti = new Set([...img.disegno.join('')].filter((c) => c !== '.' && !img.tavolozza[c]));
      if (ignoti.size) errori.push(`disegno "${nome}": caratteri senza colore nella tavolozza: ${[...ignoti].join(' ')}`);
      for (const [c, col] of Object.entries(img.tavolozza)) if (!COLORE.test(col)) errori.push(`disegno "${nome}": colore "${col}" di "${c}" non valido`);
    }
  }
  const controllaAspetto = (dove: string, a: Aspetto) => {
    const nome = typeof a === 'string' ? a : a.immagine;
    if (!d.immagini[nome]) errori.push(`${dove}: l'immagine "${nome}" non esiste`);
    if (typeof a !== 'string') {
      if (a.tinta !== undefined && !COLORE.test(a.tinta)) errori.push(`${dove}: tinta "${a.tinta}" non valida`);
      if (a.alfa !== undefined && !(a.alfa > 0 && a.alfa <= 1)) errori.push(`${dove}: alfa ${a.alfa} fuori da (0, 1]`);
    }
  };
  const sezioni = [
    ['classi', d.classi, r.classi],
    ['compagni', d.compagni, r.compagni],
    ['abitanti', d.abitanti, r.abitanti],
    ['nemici', d.nemici, r.nemici],
    ['vene', d.vene, r.vene],
  ] as const;
  for (const [sezione, mappa, ids] of sezioni) {
    for (const id of ids) if (!mappa[id]) errori.push(`sprite.json: manca l'aspetto di ${sezione} "${id}"`);
    for (const [id, a] of Object.entries(mappa)) controllaAspetto(`${sezione} "${id}"`, a);
  }
  for (const [id, a] of Object.entries(d.oggetti)) controllaAspetto(`oggetti "${id}"`, a);
  for (const [dove, t] of Object.entries(r.tessere)) {
    if (t === undefined) {
      errori.push(`${dove}: manca "tessera"`);
      continue;
    }
    for (const s of Array.isArray(t) ? t : [t]) {
      if (typeof s === 'string' && s.startsWith('#')) {
        if (!COLORE.test(s)) errori.push(`${dove}: colore "${s}" non valido`);
      } else controllaAspetto(dove, s);
    }
  }
  return errori;
}

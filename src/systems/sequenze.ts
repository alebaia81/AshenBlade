// La musica come DATI (fase 9c): ogni brano è un tempo (bpm) e alcune "voci",
// ognuna una riga di note scritte come testo, "C4:1 E4:0.5 -:1 [G3:0.5 G4:0.5]*2".
// Qui le note diventano numeri (frequenze in Hz, inizi e durate in secondi);
// il sintetizzatore (src/audio/Suoni.ts) le suona. Nessun suono qui dentro:
// solo calcoli, quindi tutto si può testare.

/** Le forme d'onda dell'oscillatore del browser. Ognuna ha un "colore": square è il suono dei giochi anni '80. */
export const ONDE = ['square', 'triangle', 'sawtooth', 'sine'] as const;
export type Onda = (typeof ONDE)[number];

export interface Voce {
  onda: Onda;
  /** 0–1, prima del volume generale della musica. */
  volume: number;
  /** Le note: "C4:1" = Do della quarta ottava per un battito; "-:2" = pausa di due battiti. */
  note: string;
}

export interface Brano {
  /** Battiti al minuto. */
  bpm: number;
  voci: Voce[];
}

/** Un pezzo di effetto sonoro: un tono (o un rumore) che scivola da una frequenza all'altra. */
export interface PezzoEffetto {
  onda: Onda | 'rumore';
  da: number;
  a: number;
  /** Secondi. */
  durata: number;
  volume: number;
  /** Quanto aspettare dall'inizio dell'effetto (per gli arpeggi: din-din-din). */
  ritardo?: number;
}

export interface DatiMusica {
  brani: Record<string, Brano>;
  /** Quale brano per ogni mappa (più "menu" e, se serve, "boss"). */
  zone: Record<string, string>;
  effetti: Record<string, PezzoEffetto[]>;
}

/** Gli effetti che il codice suona: musica.json deve definirli tutti. */
export const EFFETTI_GIOCO = ['clic', 'colpo', 'sconfitto', 'ferito', 'sconfitta', 'capriola', 'magia', 'raccolta', 'forziere', 'porta', 'bip', 'livello', 'boss'] as const;
export type NomeEffetto = (typeof EFFETTI_GIOCO)[number];

// ---- dalle note alle frequenze ----

/** Distanza in semitoni dal Do, per ogni nome di nota. */
const SEMITONI: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/**
 * "A4" → 440 Hz. Ogni semitono moltiplica la frequenza per la radice dodicesima
 * di 2: dodici semitoni (un'ottava) la raddoppiano. È il "temperamento equabile"
 * di pianoforti e chitarre.
 */
export function frequenza(nota: string): number {
  const m = /^([A-G])(#?)(-?\d)$/.exec(nota);
  if (!m) throw new Error(`Nota "${nota}" non valida (esempi: C4, F#3, A2)`);
  const semitono = SEMITONI[m[1]!]! + (m[2] ? 1 : 0);
  const ottava = Number(m[3]);
  // Il La della quarta ottava (A4) è il riferimento: 440 Hz, 9 semitoni sopra il C4.
  const distanzaDaA4 = (ottava - 4) * 12 + (semitono - 9);
  return 440 * Math.pow(2, distanzaDaA4 / 12);
}

export interface EventoNota {
  nota: string;
  /** In battiti dall'inizio della voce. */
  inizio: number;
  durata: number;
}

/** Espande le ripetizioni "[ … ]*n" (anche una dentro l'altra) in testo semplice. */
function espandi(testo: string): string {
  let t = testo;
  const gruppo = /\[([^[\]]*)\]\*(\d+)/;
  while (gruppo.test(t)) t = t.replace(gruppo, (_, dentro: string, n: string) => Array(Number(n)).fill(dentro).join(' '));
  if (t.includes('[') || t.includes(']')) throw new Error(`Una parentesi quadra non è chiusa (o manca "*n"): "${testo.trim().slice(0, 40)}"`);
  return t;
}

/** "C4:1 -:1 E4:2" → le note con inizio e durata in battiti (le pause non compaiono, ma spostano le note dopo). */
export function leggiVoce(testo: string): EventoNota[] {
  const eventi: EventoNota[] = [];
  let tempo = 0;
  for (const pezzo of espandi(testo).split(/\s+/).filter(Boolean)) {
    const [nota, durataTesto] = pezzo.split(':');
    const durata = Number(durataTesto);
    if (!nota || !durataTesto || !(durata > 0)) throw new Error(`"${pezzo}": serve nota:durata, per esempio C4:1`);
    if (nota !== '-') {
      frequenza(nota); // controlla subito che la nota esista
      eventi.push({ nota, inizio: tempo, durata });
    }
    tempo += durata;
  }
  return eventi;
}

/** Battiti totali di una voce, pause comprese. */
function battiti(testo: string): number {
  return espandi(testo)
    .split(/\s+/)
    .filter(Boolean)
    .reduce((s, p) => s + Number(p.split(':')[1]), 0);
}

// ---- dal brano ai secondi ----

export interface NotaSuonata {
  voce: number;
  frequenza: number;
  /** Secondi dall'inizio del brano (o del giro, per noteNellIntervallo). */
  inizio: number;
  durata: number;
  onda: Onda;
  volume: number;
}

export interface BranoPronto {
  /** Durata di un giro, in secondi: poi si ricomincia. */
  durata: number;
  /** Tutte le note di un giro, in ordine di inizio. */
  note: NotaSuonata[];
}

/** Durata di un giro in secondi: quella della voce più lunga. */
export function durataBrano(b: Brano): number {
  return (Math.max(...b.voci.map((v) => battiti(v.note))) * 60) / b.bpm;
}

export function preparaBrano(b: Brano): BranoPronto {
  const secondiPerBattito = 60 / b.bpm;
  const note = b.voci
    .flatMap((v, voce) =>
      leggiVoce(v.note).map((e) => ({
        voce,
        frequenza: frequenza(e.nota),
        inizio: e.inizio * secondiPerBattito,
        durata: e.durata * secondiPerBattito,
        onda: v.onda,
        volume: v.volume,
      })),
    )
    .sort((x, y) => x.inizio - y.inizio || x.voce - y.voce);
  return { durata: durataBrano(b), note };
}

/**
 * Le note che INIZIANO nell'intervallo [da, a), in secondi dall'avvio del brano,
 * contando i giri: dopo l'ultima nota si ricomincia da capo.
 *
 * Serve al lettore, che ogni pochi millisecondi chiede "cosa devo suonare nei
 * prossimi istanti?" e prenota quelle note con l'orologio preciso dell'audio.
 * Intervalli consecutivi ([0, 0.1), [0.1, 0.2)…) non perdono e non ripetono note.
 */
export function noteNellIntervallo(b: BranoPronto, da: number, a: number): NotaSuonata[] {
  if (a <= da || b.durata <= 0) return [];
  const risultato: NotaSuonata[] = [];
  for (let giro = Math.floor(da / b.durata); giro * b.durata < a; giro++) {
    const base = giro * b.durata;
    for (const n of b.note) {
      const t = base + n.inizio;
      if (t >= da && t < a) risultato.push({ ...n, inizio: t });
    }
  }
  return risultato;
}

// ---- controlli ----

export function validaMusica(d: DatiMusica, mappe: readonly string[], effettiRichiesti: readonly string[]): string[] {
  const errori: string[] = [];
  for (const [nome, b] of Object.entries(d.brani)) {
    if (!(b.bpm > 0)) errori.push(`brano "${nome}": bpm deve essere un numero positivo`);
    b.voci.forEach((v, i) => {
      if (!ONDE.includes(v.onda)) errori.push(`brano "${nome}", voce ${i + 1}: onda "${v.onda}" sconosciuta (${ONDE.join(', ')})`);
      if (!(v.volume > 0 && v.volume <= 1)) errori.push(`brano "${nome}", voce ${i + 1}: volume tra 0 e 1`);
      try {
        leggiVoce(v.note);
      } catch (e) {
        errori.push(`brano "${nome}", voce ${i + 1}: ${(e as Error).message}`);
      }
    });
  }
  for (const [zona, brano] of Object.entries(d.zone)) {
    if (!d.brani[brano]) errori.push(`musica.json: la zona "${zona}" usa il brano "${brano}", che non esiste`);
  }
  for (const m of mappe) if (!d.zone[m]) errori.push(`musica.json: manca la musica della mappa "${m}"`);
  for (const e of effettiRichiesti) if (!d.effetti[e]) errori.push(`musica.json: manca l'effetto "${e}"`);
  for (const [nome, pezzi] of Object.entries(d.effetti)) {
    for (const p of pezzi) {
      if (p.onda !== 'rumore' && !ONDE.includes(p.onda)) errori.push(`effetto "${nome}": onda "${p.onda}" sconosciuta`);
      if (!(p.durata > 0 && p.durata <= 3)) errori.push(`effetto "${nome}": durata tra 0 e 3 secondi`);
      if (!(p.volume > 0 && p.volume <= 1)) errori.push(`effetto "${nome}": volume tra 0 e 1`);
      if (!(p.da > 0 && p.a > 0)) errori.push(`effetto "${nome}": frequenze "da" e "a" positive`);
    }
  }
  return errori;
}

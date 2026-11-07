// Salvataggio della partita nel browser (design §12): 3 slot nel localStorage.
//
// Tre idee da web developer:
// 1. Il localStorage conserva solo TESTO: la Partita diventa JSON e torna indietro.
// 2. Il testo si può modificare a mano (F12) o rovinare: quando si rilegge NON ci
//    si fida, come con il corpo di una richiesta HTTP. Si controlla la forma e,
//    se qualcosa non va, si restituisce un errore leggibile invece di un'eccezione.
// 3. Ogni salvataggio ha un numero di VERSIONE. Se un giorno la Partita cambia
//    forma, una "migrazione" aggiorna i salvataggi vecchi, come le migrazioni di
//    un database: niente "ricomincia da capo" dopo un aggiornamento.
//
// Questo file non conosce né Phaser né window.localStorage: riceve un "Archivio"
// con la stessa interfaccia. Nel gioco è il localStorage vero, nei test una Map.

import type { EffettoAttivo } from './effettiTemporanei';
import { guarisci, type Partita } from './partita';
import { creaStatoCompagni } from './taverna';

export const VERSIONE_SALVATAGGIO = 1;
export const NUMERO_SLOT = 3;
/** Prefisso delle chiavi nel localStorage: le distingue da quelle di altri siti/giochi aperti da file. */
const PREFISSO = 'quercia-slot-';

/** Le tre funzioni del localStorage che ci servono. */
export interface Archivio {
  getItem(chiave: string): string | null;
  setItem(chiave: string, valore: string): void;
  removeItem(chiave: string): void;
}

export interface Salvataggio {
  versione: number;
  /** Gli effetti a tempo sono salvati come "quanto manca" (vedi creaSalvataggio). */
  partita: Partita;
  /** Si riprende all'ingresso di questa mappa, come dopo una sconfitta (§12). */
  mappa: string;
  arrivo: string;
  /** Nome leggibile della zona, per il riepilogo dello slot. */
  zona: string;
  /** Quando è stato salvato, in formato ISO (si ordina anche come testo). */
  data: string;
}

export type EsitoLettura = { ok: true; salvataggio: Salvataggio } | { ok: false; errore: string };
export type EsitoScrittura = { ok: true } | { ok: false; errore: string };

export interface RiepilogoSlot {
  nome: string;
  classe: string;
  livello: number;
  zona: string;
  data: string;
}

export type StatoSlot =
  | { slot: number; stato: 'vuoto' }
  | { slot: number; stato: 'pieno'; riepilogo: RiepilogoSlot }
  | { slot: number; stato: 'rovinato'; errore: string };

// ---- creare e rileggere ----

export interface DatiSalvataggio {
  partita: Partita;
  mappa: string;
  arrivo: string;
  zona: string;
  /** L'ora del gioco (ms), per trasformare gli effetti a tempo in "quanto manca". */
  adesso: number;
  /** L'ora vera, per il riepilogo. */
  data: Date;
}

export function creaSalvataggio(d: DatiSalvataggio): Salvataggio {
  return {
    versione: VERSIONE_SALVATAGGIO,
    partita: { ...d.partita, effetti: effettiRelativi(d.partita.effetti, d.adesso) },
    mappa: d.mappa,
    arrivo: d.arrivo,
    zona: d.zona,
    data: d.data.toISOString(),
  };
}

/**
 * L'orologio del gioco riparte da zero a ogni caricamento della pagina, quindi
 * "fino alle 65000" non avrebbe senso domani: si salva "ancora 60000 ms".
 */
function effettiRelativi(effetti: readonly EffettoAttivo[], adesso: number): EffettoAttivo[] {
  return effetti
    .filter((e) => e.fino > adesso)
    .map((e) => ({ ...e, fino: e.fino - adesso, ...(e.prossimoColpo !== undefined ? { prossimoColpo: Math.max(0, e.prossimoColpo - adesso) } : {}) }));
}

/** La Partita pronta per giocare, appena letta da un salvataggio. */
export function dopoIlCaricamento(p: Partita, adesso: number): Partita {
  const effetti = p.effetti.map((e) => ({
    ...e,
    fino: e.fino + adesso,
    ...(e.prossimoColpo !== undefined ? { prossimoColpo: e.prossimoColpo + adesso } : {}),
  }));
  const ripresa = { ...p, effetti };
  // Salvata nell'istante della sconfitta? Si riparte come dopo una sconfitta: vita piena.
  return p.vita.attuale <= 0 ? guarisci(ripresa) : ripresa;
}

export function testoSalvataggio(s: Salvataggio): string {
  return JSON.stringify(s);
}

/** Da testo a Salvataggio, con tutti i controlli. Non lancia mai eccezioni. */
export function leggiSalvataggio(testo: string, migrazioni: Migrazioni = MIGRAZIONI): EsitoLettura {
  let dati: unknown;
  try {
    dati = JSON.parse(testo);
  } catch {
    return { ok: false, errore: 'Il file non è un salvataggio (testo non leggibile)' };
  }
  if (!èOggetto(dati)) return { ok: false, errore: 'Il file non è un salvataggio' };
  if (typeof dati['versione'] !== 'number') return { ok: false, errore: 'Salvataggio senza versione' };
  if (dati['versione'] > VERSIONE_SALVATAGGIO) {
    return { ok: false, errore: 'Salvataggio di una versione più recente del gioco' };
  }
  const aggiornato = aggiorna(dati as DatiGrezzi, migrazioni, VERSIONE_SALVATAGGIO);
  if (!aggiornato.ok) return aggiornato;
  return controllaForma(aggiornato.dati);
}

// ---- migrazioni ----

/** Dati appena letti, di cui conosciamo solo la versione. */
export interface DatiGrezzi {
  versione: number;
  [campo: string]: unknown;
}

/** migrazioni[n] trasforma un salvataggio della versione n in uno della versione n+1. */
export type Migrazioni = Readonly<Record<number, (dati: DatiGrezzi) => DatiGrezzi>>;

/**
 * Le migrazioni vere. Oggi è vuota: esiste solo la versione 1. Quando la Partita
 * cambierà forma, si alza VERSIONE_SALVATAGGIO e si aggiunge qui il passaggio,
 * per esempio: 1: (d) => ({ ...d, versione: 2, partita: { ...d.partita, reputazione: 0 } }).
 */
const MIGRAZIONI: Migrazioni = {};

/** Applica in ordine le migrazioni dalla versione del salvataggio fino a "versione". */
export function aggiorna(
  dati: DatiGrezzi,
  migrazioni: Migrazioni,
  versione: number,
): { ok: true; dati: DatiGrezzi } | { ok: false; errore: string } {
  let attuale = dati;
  while (attuale.versione < versione) {
    const passo = migrazioni[attuale.versione];
    if (!passo) return { ok: false, errore: `Salvataggio troppo vecchio (versione ${attuale.versione})` };
    attuale = passo(attuale);
  }
  return { ok: true, dati: attuale };
}

// ---- controlli ----

function èOggetto(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

const ROVINATO = 'Salvataggio rovinato';

/**
 * I campi senza i quali non si può giocare: se mancano, il salvataggio è rovinato.
 * Gli elenchi (forzieri aperti, ricette…) invece, se mancano, partono vuoti:
 * così un salvataggio un po' più vecchio della Partita attuale si carica lo stesso.
 */
function controllaForma(d: DatiGrezzi): EsitoLettura {
  const p = d['partita'];
  if (!èOggetto(p)) return { ok: false, errore: ROVINATO };
  const pers = p['personaggio'];
  const ok =
    èOggetto(pers) &&
    typeof pers['nome'] === 'string' &&
    typeof pers['classe'] === 'string' &&
    typeof pers['livello'] === 'number' &&
    èOggetto(pers['caratteristiche']) &&
    èRisorsa(p['vita']) &&
    èRisorsa(p['mana']) &&
    èOggetto(p['inventario']) &&
    Array.isArray(p['inventario']['spazi']) &&
    èOggetto(p['equipaggiamento']) &&
    Array.isArray(p['preferiti']) &&
    typeof p['esperienza'] === 'number' &&
    typeof d['mappa'] === 'string' &&
    typeof d['arrivo'] === 'string';
  if (!ok) return { ok: false, errore: ROVINATO };

  const partita = {
    puntiDaAssegnare: 0,
    monete: 0,
    effetti: [],
    forzieriAperti: [],
    muriAperti: [],
    compagni: creaStatoCompagni(),
    ricette: [],
    quest: {},
    porteAperte: [],
    bossSconfitti: [],
    ...p,
  } as unknown as Partita;
  return {
    ok: true,
    salvataggio: {
      versione: d.versione,
      partita,
      mappa: d['mappa'] as string,
      arrivo: d['arrivo'] as string,
      zona: typeof d['zona'] === 'string' ? d['zona'] : '',
      data: typeof d['data'] === 'string' ? d['data'] : '',
    },
  };
}

function èRisorsa(x: unknown): boolean {
  return èOggetto(x) && typeof x['attuale'] === 'number' && typeof x['massima'] === 'number';
}

// ---- gli slot ----

function chiaveSlot(slot: number): string {
  // Uno slot sbagliato è un errore nel codice, non nei dati: meglio accorgersene subito.
  if (!Number.isInteger(slot) || slot < 1 || slot > NUMERO_SLOT) throw new Error(`Slot ${slot} inesistente`);
  return PREFISSO + slot;
}

export function scriviSlot(archivio: Archivio, slot: number, s: Salvataggio): EsitoScrittura {
  const chiave = chiaveSlot(slot);
  try {
    archivio.setItem(chiave, testoSalvataggio(s));
    return { ok: true };
  } catch {
    // Spazio finito, oppure un browser che non permette di scrivere (alcune modalità private).
    return { ok: false, errore: 'Il browser non ha permesso di salvare' };
  }
}

export function leggiSlot(archivio: Archivio, slot: number): EsitoLettura {
  const testo = archivio.getItem(chiaveSlot(slot));
  if (testo === null) return { ok: false, errore: 'Slot vuoto' };
  return leggiSalvataggio(testo);
}

export function eliminaSlot(archivio: Archivio, slot: number): void {
  archivio.removeItem(chiaveSlot(slot));
}

export function elencoSlot(archivio: Archivio): StatoSlot[] {
  return Array.from({ length: NUMERO_SLOT }, (_, i): StatoSlot => {
    const slot = i + 1;
    if (archivio.getItem(chiaveSlot(slot)) === null) return { slot, stato: 'vuoto' };
    const letto = leggiSlot(archivio, slot);
    if (!letto.ok) return { slot, stato: 'rovinato', errore: letto.errore };
    const { partita, zona, data } = letto.salvataggio;
    const { nome, classe, livello } = partita.personaggio;
    return { slot, stato: 'pieno', riepilogo: { nome, classe, livello, zona, data } };
  });
}

/** Lo slot salvato più di recente (per "Continua"), o null se non ce n'è nessuno. */
export function ultimoSlot(archivio: Archivio): number | null {
  let migliore: { slot: number; data: string } | null = null;
  for (const s of elencoSlot(archivio)) {
    // Le date ISO si confrontano anche come testo: "2026-11-05…" > "2026-11-01…".
    if (s.stato === 'pieno' && (!migliore || s.riepilogo.data > migliore.data)) migliore = { slot: s.slot, data: s.riepilogo.data };
  }
  return migliore?.slot ?? null;
}

/** "Sir Àle/Primo", livello 1 → "quercia-sir-ale-primo-liv1.json". */
export function nomeFileEsportazione(s: Salvataggio): string {
  const nome = s.partita.personaggio.nome
    .normalize('NFD') // "À" diventa "A" + accento separato…
    .replace(/[̀-ͯ]/g, '') // …e l'accento si toglie
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `quercia-${nome || 'eroe'}-liv${s.partita.personaggio.livello}.json`;
}

// I dialoghi con i personaggi (design §3, fase 5).
// Un dialogo è un piccolo GRAFO: ogni nodo è una "schermata" di testo con delle
// risposte; ogni risposta porta a un altro nodo, apre qualcosa (il negozio, la
// taverna) oppure chiude. Come pagine di un sito collegate da link.
// I testi stanno in data/dialoghi.json: scrivere nuove frasi non richiede codice.

export const COSE_APRIBILI = ['negozio', 'taverna', 'fucina'] as const;
export type CosaApribile = (typeof COSE_APRIBILI)[number];

/** Fase 7: una risposta può comparire solo se una quest è in un certo stato. */
export interface Condizione {
  quest: string;
  /** Uno stato o più stati (vedi systems/quest.ts: disponibile, attiva, pronta, conclusa…). */
  stato: string | string[];
}

/** Fase 7: cosa fa una risposta oltre a portare altrove. */
export type AzioneDialogo = { accetta: string } | { concludi: string };

export interface Risposta {
  testo: string;
  se?: Condizione;
  azione?: AzioneDialogo;
  /** Id del nodo successivo. */
  va?: string;
  /** Apre una schermata (il negozio di Gemma, la taverna di Tobia). */
  apri?: CosaApribile;
  // Senza "va" né "apri" la risposta chiude il dialogo.
}

export interface NodoDialogo {
  testo: string;
  risposte: Risposta[];
}

export interface Dialogo {
  inizio: string;
  nodi: Record<string, NodoDialogo>;
}

export type EsitoRisposta = ({ tipo: 'nodo'; id: string } | { tipo: 'apri'; cosa: CosaApribile } | { tipo: 'chiudi' }) & { azione?: AzioneDialogo };

export function nodoIniziale(d: Dialogo): string {
  return d.inizio;
}

/** Cosa succede scegliendo la risposta "indice" del nodo "id". */
export function scegli(d: Dialogo, id: string, indice: number): EsitoRisposta {
  const risposta = d.nodi[id]?.risposte[indice];
  return risposta ? esitoRisposta(risposta) : { tipo: 'chiudi' };
}

/** Dove porta una risposta, e l'eventuale azione sulle quest da eseguire prima. */
export function esitoRisposta(r: Risposta): EsitoRisposta {
  const azione = r.azione ? { azione: r.azione } : {};
  if (r.va) return { tipo: 'nodo', id: r.va, ...azione };
  if (r.apri) return { tipo: 'apri', cosa: r.apri, ...azione };
  return { tipo: 'chiudi', ...azione };
}

/**
 * Le risposte da mostrare: quelle senza condizione e quelle la cui condizione è
 * vera. Come un "v-if" su ogni riga: la scena chiede, la regola sta qui.
 */
export function risposteVisibili(nodo: NodoDialogo, vale: (c: Condizione) => boolean): Risposta[] {
  return nodo.risposte.filter((r) => !r.se || vale(r.se));
}

/**
 * Controlla un dialogo e restituisce TUTTI gli errori: link verso nodi che non
 * esistono, nodi senza risposte (il giocatore resterebbe bloccato), nodi che
 * nessuna risposta raggiunge (testo scritto ma mai visto).
 */
export function validaDialogo(chi: string, d: Dialogo, quest: readonly string[] = []): string[] {
  const errori: string[] = [];
  const prefisso = `Dialogo "${chi}"`;
  if (!d.nodi[d.inizio]) errori.push(`${prefisso}: il nodo di inizio "${d.inizio}" non esiste`);
  for (const [id, nodo] of Object.entries(d.nodi)) {
    if (nodo.risposte.length === 0) errori.push(`${prefisso}: il nodo "${id}" non ha nessuna risposta`);
    // Se tutte le risposte avessero una condizione, in certi momenti non se ne vedrebbe nessuna.
    else if (nodo.risposte.every((r) => r.se)) errori.push(`${prefisso}: il nodo "${id}" deve avere almeno una risposta senza condizione`);
    for (const r of nodo.risposte) {
      if (r.va && !d.nodi[r.va]) errori.push(`${prefisso}, nodo "${id}": la risposta "${r.testo}" porta a "${r.va}", che non esiste`);
      const citate = [r.se?.quest, r.azione && ('accetta' in r.azione ? r.azione.accetta : r.azione.concludi)];
      for (const q of citate) if (q && !quest.includes(q)) errori.push(`${prefisso}, nodo "${id}": la quest "${q}" non esiste`);
      if (r.apri && !(COSE_APRIBILI as readonly string[]).includes(r.apri)) {
        errori.push(`${prefisso}, nodo "${id}": "${r.apri}" non si può aprire`);
      }
    }
  }
  // Visita a partire dall'inizio: chi non viene toccato è irraggiungibile.
  if (d.nodi[d.inizio]) {
    const visti = new Set([d.inizio]);
    const daVisitare = [d.inizio];
    while (daVisitare.length > 0) {
      for (const r of d.nodi[daVisitare.pop()!]!.risposte) {
        if (r.va && d.nodi[r.va] && !visti.has(r.va)) {
          visti.add(r.va);
          daVisitare.push(r.va);
        }
      }
    }
    for (const id of Object.keys(d.nodi)) if (!visti.has(id)) errori.push(`${prefisso}: il nodo "${id}" non si raggiunge da "${d.inizio}"`);
  }
  return errori;
}

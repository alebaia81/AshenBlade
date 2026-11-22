// La taverna (design §10): si ingaggia un compagno alla volta.
// Ogni compagno si paga UNA volta: poi tornare da lui è gratis (scelta della fase 5).

import { spendiMonete } from './monete';

export interface StatoCompagni {
  /** Chi è già stato pagato almeno una volta. */
  ingaggiati: string[];
  /** Chi è con te adesso (uno solo, oppure nessuno). */
  attivo: string | null;
}

export function creaStatoCompagni(): StatoCompagni {
  return { ingaggiati: [], attivo: null };
}

interface ConCompagni {
  monete: number;
  compagni: StatoCompagni;
}

export type EsitoTaverna<T> = { ok: true; stato: T; pagato: number } | { ok: false; errore: string };

export function ingaggia<T extends ConCompagni>(s: T, id: string, prezzo: number): EsitoTaverna<T> {
  if (s.compagni.attivo === id) return { ok: false, errore: 'È già con te' };
  if (s.compagni.ingaggiati.includes(id)) {
    return { ok: true, stato: { ...s, compagni: { ...s.compagni, attivo: id } }, pagato: 0 };
  }
  const pagato = spendiMonete(s, prezzo);
  if (!pagato) return { ok: false, errore: `Non hai abbastanza monete (ne servono ${prezzo})` };
  return { ok: true, stato: { ...pagato, compagni: { ingaggiati: [...s.compagni.ingaggiati, id], attivo: id } }, pagato: prezzo };
}

/** Il compagno resta in taverna: si può riprendere gratis quando vuoi. */
export function congeda<T extends ConCompagni>(s: T): T {
  return { ...s, compagni: { ...s.compagni, attivo: null } };
}

/**
 * Fase 10b: un compagno di viaggio si unisce gratis con la storia e diventa
 * subito il compagno attivo (quello precedente torna disponibile in taverna/pietra).
 */
export function unisciCompagno<T extends { compagni: StatoCompagni }>(s: T, id: string): T {
  const ingaggiati = s.compagni.ingaggiati.includes(id) ? s.compagni.ingaggiati : [...s.compagni.ingaggiati, id];
  return { ...s, compagni: { ingaggiati, attivo: id } };
}

/**
 * Fase 10b: controlla se il compagno attivo ha un commento per la mappa in cui
 * si entra che non è ancora stato visto.
 */
export function commentoAllIngresso(
  idCompagno: string | null,
  commenti: readonly { mappa: string; testo: string }[] | undefined,
  idMappa: string,
  commentiVisti: readonly string[],
): { chiave: string; testo: string } | null {
  if (!idCompagno || !commenti) return null;
  const chiave = `${idCompagno}:${idMappa}`;
  if (commentiVisti.includes(chiave)) return null;
  const trovato = commenti.find((c) => c.mappa === idMappa);
  return trovato ? { chiave, testo: trovato.testo } : null;
}

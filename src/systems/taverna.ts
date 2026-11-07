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

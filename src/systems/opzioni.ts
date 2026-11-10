// Le opzioni del gioco, ricordate nel browser (una chiave del localStorage a parte,
// così cancellare un salvataggio non le tocca). Stessa idea del salvataggio:
// ciò che si rilegge non è affidabile, quindi si tiene solo ciò che ha senso
// e per il resto valgono i valori predefiniti.

import type { Archivio } from './salvataggio';

export interface Opzioni {
  /** Salvataggio automatico entrando nel villaggio (§12). */
  salvataggioAutomatico: boolean;
  /** Il testo introduttivo all'inizio di una nuova partita. */
  mostraIntroduzione: boolean;
  /** Fase 9c: volume della musica e degli effetti, da 0 (muto) a 1. */
  volumeMusica: number;
  volumeEffetti: number;
  /** Scuotimento della telecamera su colpi critici ed eventi boss. */
  scuotimentoSchermo: boolean;
  /** Mostra levetta virtuale e pulsanti touch per smartphone e tablet. */
  controlliTouch: boolean;
}

export const OPZIONI_PREDEFINITE: Readonly<Opzioni> = {
  salvataggioAutomatico: true,
  mostraIntroduzione: true,
  volumeMusica: 0.5,
  volumeEffetti: 0.7,
  scuotimentoSchermo: true,
  controlliTouch: true,
};

const CHIAVE = 'quercia-opzioni';

export function leggiOpzioni(archivio: Archivio): Opzioni {
  let dati: unknown;
  try {
    dati = JSON.parse(archivio.getItem(CHIAVE) ?? '{}');
  } catch {
    dati = {};
  }
  const risultato: Opzioni = { ...OPZIONI_PREDEFINITE };
  if (typeof dati === 'object' && dati !== null) {
    for (const chiave of Object.keys(OPZIONI_PREDEFINITE) as (keyof Opzioni)[]) {
      const valore = (dati as Record<string, unknown>)[chiave];
      // Solo valori dello stesso tipo del predefinito: "salvataggioAutomatico": "forse" non passa.
      if (typeof valore !== typeof OPZIONI_PREDEFINITE[chiave]) continue;
      // I numeri (i volumi) restano tra 0 e 1, anche se qualcuno scrive 7 a mano.
      risultato[chiave] = (typeof valore === 'number' ? (Number.isFinite(valore) ? Math.min(1, Math.max(0, valore)) : OPZIONI_PREDEFINITE[chiave]) : valore) as never;
    }
  }
  return risultato;
}

/** Restituisce false se il browser non ha permesso di scrivere: le opzioni valgono comunque per questa sessione. */
export function scriviOpzioni(archivio: Archivio, opzioni: Opzioni): boolean {
  try {
    archivio.setItem(CHIAVE, JSON.stringify(opzioni));
    return true;
  } catch {
    return false;
  }
}

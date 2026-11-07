// Celle che cambiano con la storia (fase 8b): la frana sulla strada della
// miniera sparisce dopo l'Atto I, la Quercia Antica appare ferita dopo il troll.
// Nella legenda una voce dice "quando succede questo, al mio posto metti
// quest'altro simbolo". Prima di disegnare la mappa la scena applica le
// condizioni: il resto del gioco vede solo una mappa normale.

import type { Mappa } from './tipi';

export interface CondizioneCella {
  /** Una quest in uno (o più) di questi stati: disponibile, attiva, pronta, conclusa… */
  quest?: string;
  stato?: string | string[];
  /** Oppure: un boss sconfitto. */
  boss?: string;
}

/** Restituisce la mappa con i simboli sostituiti. Se nulla cambia, la stessa mappa. */
export function applicaCondizioni(m: Mappa, vale: (c: CondizioneCella) => boolean): Mappa {
  const sostituti = new Map<string, string>();
  for (const [simbolo, voce] of Object.entries(m.legenda)) {
    if (voce.cambiaCon && voce.diventa && vale(voce.cambiaCon)) sostituti.set(simbolo, voce.diventa);
  }
  if (sostituti.size === 0) return m;
  return { ...m, simboli: m.simboli.map((riga) => riga.map((s) => sostituti.get(s) ?? s)) };
}

export function validaCondizioni(m: Mappa): string[] {
  const errori: string[] = [];
  for (const [simbolo, voce] of Object.entries(m.legenda)) {
    if (!voce.cambiaCon) continue;
    const p = `Mappa "${m.id}", simbolo "${simbolo}"`;
    if (!voce.diventa || !m.legenda[voce.diventa]) errori.push(`${p}: "diventa" deve essere un simbolo della legenda ("${voce.diventa ?? ''}")`);
    if (!voce.cambiaCon.quest && !voce.cambiaCon.boss) errori.push(`${p}: "cambiaCon" deve indicare una quest o un boss`);
  }
  return errori;
}

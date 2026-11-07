// "Mente" del nemico inseguitore.
//
// L'intelligenza artificiale di un nemico semplice è solo una funzione:
// riceve ciò che il nemico "percepisce" (dove si trova, dov'è casa, dov'è l'eroe)
// e restituisce una decisione (la velocità). Anche questa è una piccola macchina
// a stati: riposo → insegue → ritorno → riposo.

import type { Vettore } from '../tipi';

export type ModalitaInseguitore = 'riposo' | 'insegue' | 'ritorno';

export interface Percezione {
  posizione: Vettore;
  /** Punto in cui il nemico è nato e a cui torna. */
  casa: Vettore;
  /** Posizione dell'eroe, o null se non c'è nulla da inseguire (eroe sconfitto). */
  bersaglio: Vettore | null;
  /** Fase 8b: il tempo, per le menti che aspettano (ricariche, mira). */
  adesso?: number;
  /** Fase 8b: tra nemico e bersaglio non ci sono muri (per i tiratori). */
  lineaLibera?: boolean;
}

export interface ParametriInseguitore {
  velocita: number;
  /** Entro questa distanza si accorge dell'eroe. */
  raggioVista: number;
  /** Oltre questa distanza rinuncia. Più grande della vista, così non "sfarfalla" al confine. */
  raggioAbbandono: number;
}

export interface Decisione {
  modalita: ModalitaInseguitore;
  velocita: Vettore;
}

/** Sotto questa distanza da casa il nemico si considera arrivato. */
const TOLLERANZA_CASA = 2;
const FERMO: Vettore = { x: 0, y: 0 };

export function decidiInseguitore(
  modalita: ModalitaInseguitore,
  p: Percezione,
  par: ParametriInseguitore,
): Decisione {
  const distanzaEroe = p.bersaglio ? distanza(p.posizione, p.bersaglio) : Infinity;

  let nuova: ModalitaInseguitore = modalita;
  if (distanzaEroe <= par.raggioVista) nuova = 'insegue';
  else if (modalita === 'insegue' && distanzaEroe > par.raggioAbbandono) nuova = 'ritorno';

  if (nuova === 'insegue' && p.bersaglio) {
    return { modalita: nuova, velocita: verso(p.posizione, p.bersaglio, par.velocita) };
  }
  if (nuova === 'ritorno') {
    if (distanza(p.posizione, p.casa) <= TOLLERANZA_CASA) return { modalita: 'riposo', velocita: FERMO };
    return { modalita: nuova, velocita: verso(p.posizione, p.casa, par.velocita) };
  }
  return { modalita: 'riposo', velocita: FERMO };
}

/**
 * Crea una mente con memoria: una closure che ricorda la modalità tra un
 * fotogramma e l'altro. Il nemico la chiama a ogni fotogramma.
 */
export function creaMenteInseguitore(par: ParametriInseguitore): (p: Percezione) => Vettore {
  let modalita: ModalitaInseguitore = 'riposo';
  return (p) => {
    const d = decidiInseguitore(modalita, p, par);
    modalita = d.modalita;
    return d.velocita;
  };
}

function distanza(a: Vettore, b: Vettore): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Velocità per andare da "da" verso "a" con la velocità indicata. */
function verso(da: Vettore, a: Vettore, velocita: number): Vettore {
  const d = distanza(da, a);
  if (d === 0) return FERMO;
  return { x: ((a.x - da.x) / d) * velocita, y: ((a.y - da.y) / d) * velocita };
}

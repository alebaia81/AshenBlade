// La "mente" del compagno: è quella dei nemici con il bersaglio invertito (§10).
// Un nemico insegue l'eroe se lo vede; il compagno insegue il nemico più vicino
// ALL'EROE (così difende lui, invece di correre dietro a chi passa lontano),
// altrimenti segue l'eroe a qualche passo di distanza.

import type { Vettore } from '../tipi';

export interface ParametriCompagno {
  /** Il compagno si occupa dei nemici entro questa distanza dall'eroe. */
  raggioCaccia: number;
  /** Senza nemici si ferma a questa distanza dall'eroe. */
  distanzaSeguire: number;
  /** Da questa distanza dal BORDO del nemico può colpire (mischia corta, dardi lunghi). */
  portata: number;
}

export interface PercezioneCompagno {
  posizione: Vettore;
  eroe: Vettore;
  /** ingombro = metà del lato del nemico: i corpi si toccano prima che i centri si avvicinino. */
  nemici: readonly { id: number; posizione: Vettore; ingombro?: number }[];
}

export type DecisioneCompagno =
  | { tipo: 'attacca'; id: number; verso: Vettore }
  | { tipo: 'avvicinati'; id: number; verso: Vettore }
  | { tipo: 'segui'; verso: Vettore }
  | { tipo: 'fermo' };

const distanza = (a: Vettore, b: Vettore) => Math.hypot(a.x - b.x, a.y - b.y);

export function bersaglioCompagno(eroe: Vettore, nemici: PercezioneCompagno['nemici'], raggio: number): number | null {
  let migliore: number | null = null;
  let d = raggio;
  for (const n of nemici) {
    const qui = distanza(n.posizione, eroe);
    if (qui <= d) {
      migliore = n.id;
      d = qui;
    }
  }
  return migliore;
}

export function decidiCompagno(p: PercezioneCompagno, par: ParametriCompagno): DecisioneCompagno {
  const id = bersaglioCompagno(p.eroe, p.nemici, par.raggioCaccia);
  const nemico = p.nemici.find((n) => n.id === id);
  if (nemico) {
    const tipo = distanza(p.posizione, nemico.posizione) - (nemico.ingombro ?? 0) <= par.portata ? 'attacca' : 'avvicinati';
    return { tipo, id: nemico.id, verso: nemico.posizione };
  }
  if (distanza(p.posizione, p.eroe) > par.distanzaSeguire) return { tipo: 'segui', verso: p.eroe };
  return { tipo: 'fermo' };
}

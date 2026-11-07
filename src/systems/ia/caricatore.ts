// "Mente" del caricatore (design §7): i ragni della miniera.
// Si avvicina piano; a distanza di carica si FERMA e mira (si vede: lampeggia),
// poi SCATTA in linea retta nella direzione scelta, senza correggerla: per
// questo la capriola al momento giusto lo evita. Dopo lo scatto resta stanco.

import type { Vettore } from '../tipi';
import { decidiInseguitore, type ModalitaInseguitore, type ParametriInseguitore, type Percezione } from './inseguitore';
import type { AzioneNemico } from './tiratore';

export interface ParametriCarica {
  /** Da questa distanza comincia a mirare. */
  distanza: number;
  miraMs: number;
  scattoMs: number;
  velocita: number;
  stancoMs: number;
}

export interface ParametriCaricatore extends ParametriInseguitore {
  carica: ParametriCarica;
}

export type StatoCaricatore =
  | { fase: ModalitaInseguitore }
  | { fase: 'mira' | 'scatto' | 'stanco'; fino: number; direzione: Vettore };

export const creaStatoCaricatore = (): StatoCaricatore => ({ fase: 'riposo' });
const FERMO: Vettore = { x: 0, y: 0 };

export function decidiCaricatore(s: StatoCaricatore, p: Percezione, par: ParametriCaricatore): { stato: StatoCaricatore; azione: AzioneNemico } {
  const adesso = p.adesso ?? 0;
  if (s.fase === 'mira') {
    if (adesso < s.fino) return { stato: s, azione: { velocita: FERMO, stato: 'mira' } };
    // La direzione si decide ADESSO, alla fine della mira, e poi non cambia più.
    const direzione = p.bersaglio ? unitario(p.posizione, p.bersaglio) : s.direzione;
    return decidiCaricatore({ fase: 'scatto', fino: adesso + par.carica.scattoMs, direzione }, p, par);
  }
  if (s.fase === 'scatto') {
    if (adesso < s.fino) return { stato: s, azione: { velocita: { x: s.direzione.x * par.carica.velocita, y: s.direzione.y * par.carica.velocita }, stato: 'scatto' } };
    return { stato: { fase: 'stanco', fino: adesso + par.carica.stancoMs, direzione: s.direzione }, azione: { velocita: FERMO, stato: 'stanco' } };
  }
  if (s.fase === 'stanco') {
    if (adesso < s.fino) return { stato: s, azione: { velocita: FERMO, stato: 'stanco' } };
    return decidiCaricatore({ fase: 'insegue' }, p, par);
  }
  const base = decidiInseguitore(s.fase, p, par);
  if (base.modalita === 'insegue' && p.bersaglio && p.lineaLibera !== false && Math.hypot(p.bersaglio.x - p.posizione.x, p.bersaglio.y - p.posizione.y) <= par.carica.distanza) {
    return { stato: { fase: 'mira', fino: adesso + par.carica.miraMs, direzione: unitario(p.posizione, p.bersaglio) }, azione: { velocita: FERMO, stato: 'mira' } };
  }
  return { stato: { fase: base.modalita }, azione: { velocita: base.velocita, stato: base.modalita } };
}

function unitario(da: Vettore, a: Vettore): Vettore {
  const d = Math.hypot(a.x - da.x, a.y - da.y) || 1;
  return { x: (a.x - da.x) / d, y: (a.y - da.y) / d };
}

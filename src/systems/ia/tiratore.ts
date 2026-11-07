// "Mente" del tiratore (design §7): goblin arcieri, cultisti.
// Si tiene a distanza: se l'eroe è troppo vicino si allontana, se è troppo
// lontano (o c'è un muro in mezzo) si avvicina, alla distanza giusta si ferma e
// tira. Come l'inseguitore è una funzione pura: stato + percezione → decisione.

import type { Vettore } from '../tipi';
import { decidiInseguitore, type ModalitaInseguitore, type ParametriInseguitore, type Percezione } from './inseguitore';

export interface ParametriTiro {
  distanzaMin: number;
  distanzaMax: number;
  ricaricaMs: number;
}

export interface ParametriTiratore extends ParametriInseguitore {
  tiro: ParametriTiro;
}

export interface StatoTiratore {
  modalita: ModalitaInseguitore;
  prontoDa: number;
}

/** Cosa fa un nemico in questo fotogramma: come si muove, ed eventualmente dove tira. */
export interface AzioneNemico {
  velocita: Vettore;
  /** Direzione (lunghezza 1) di un tiro, se tira adesso. */
  tira?: Vettore;
  /** Per il disegno: "mira" fa lampeggiare il ragno prima dello scatto. */
  stato?: string;
}

export const creaStatoTiratore = (): StatoTiratore => ({ modalita: 'riposo', prontoDa: 0 });
const FERMO: Vettore = { x: 0, y: 0 };

export function decidiTiratore(s: StatoTiratore, p: Percezione, par: ParametriTiratore): { stato: StatoTiratore; azione: AzioneNemico } {
  // Riposo, inseguimento e ritorno a casa: identici all'inseguitore.
  const base = decidiInseguitore(s.modalita, p, par);
  if (base.modalita !== 'insegue' || !p.bersaglio) return { stato: { ...s, modalita: base.modalita }, azione: { velocita: base.velocita } };

  const dx = p.bersaglio.x - p.posizione.x;
  const dy = p.bersaglio.y - p.posizione.y;
  const d = Math.hypot(dx, dy) || 1;
  const verso = { x: dx / d, y: dy / d };
  const libera = p.lineaLibera !== false;
  const stato = { ...s, modalita: base.modalita };
  if (!libera || d > par.tiro.distanzaMax) return { stato, azione: { velocita: base.velocita } };
  if (d < par.tiro.distanzaMin) return { stato, azione: { velocita: { x: -verso.x * par.velocita, y: -verso.y * par.velocita } } };
  const adesso = p.adesso ?? 0;
  if (adesso < s.prontoDa) return { stato, azione: { velocita: FERMO } };
  return { stato: { ...stato, prontoDa: adesso + par.tiro.ricaricaMs }, azione: { velocita: FERMO, tira: verso } };
}

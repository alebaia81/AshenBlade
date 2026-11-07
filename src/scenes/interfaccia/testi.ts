// Testi dell'interfaccia legati alle caratteristiche, usati da creazione e scheda.

import type { NomeCaratteristica } from '../../systems/caratteristiche';

export const DESCRIZIONE_CARATTERISTICA: Record<NomeCaratteristica, { nome: string; effetto: string }> = {
  FOR: { nome: 'Forza', effetto: 'danni con le armi pesanti' },
  DES: { nome: 'Destrezza', effetto: 'armi leggere, critico, capriola' },
  COS: { nome: 'Costituzione', effetto: 'punti vita' },
  INT: { nome: 'Intelligenza', effetto: 'incantesimi e mana' },
  SAG: { nome: 'Saggezza', effetto: 'cure e rigenerazione del mana' },
  CAR: { nome: 'Carisma', effetto: 'prezzi e compagni (dalla fase 5)' },
};

/** +2, +0, −1 (con il segno meno tipografico, più leggibile del trattino). */
export function conSegno(n: number): string {
  return n < 0 ? `−${-n}` : `+${n}`;
}

export const STILE_TESTO = { fontFamily: 'sans-serif', fontSize: '16px', color: '#e8e8e8' };
export const STILE_TITOLO = { fontFamily: 'sans-serif', fontSize: '28px', color: '#ffffff', fontStyle: 'bold' };

/** Nomi per il giocatore degli effetti speciali di armi e armature. */
export const NOMI_EFFETTI_SPECIALI: Record<string, string> = {
  risucchio_vita: 'Risucchio di vita (20% del danno)',
  colpo_critico_doppio: 'Critico triplo',
  rallentamento: 'Rallenta il nemico (2 s)',
  fuoco: 'Fuoco: il nemico brucia (3 s)',
  rimbalzo: 'Rimbalza su 2 nemici vicini',
  invisibile_dopo_uccisione: 'Invisibile dopo un’uccisione (2 s)',
  doppia_capriola: 'Due capriole di fila',
  spine: 'Spine: rimanda il 30% del danno',
  veggente: 'Fa brillare i muri segreti vicini',
  predatore: 'I critici curano 2 punti vita',
};

export const NOMI_SPAZI: Record<string, string> = {
  primaria: 'Arma primaria',
  secondaria: 'Arma secondaria',
  elmo: 'Elmo',
  corazza: 'Corazza',
  guanti: 'Guanti',
  stivali: 'Stivali',
};

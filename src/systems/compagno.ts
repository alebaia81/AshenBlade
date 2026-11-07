// Il compagno (design §10): vita, "al tappeto" e rialzo, e le protezioni che
// può dare all'eroe (la parata di Corrado, lo scudo di Elisa).
// Funzioni pure, con il tempo passato da fuori come per la macchina a stati dell'eroe.

import { consuma, creaRisorsa, èEsaurita, type Risorsa } from './risorsa';

/** Quanto deve durare la calma (nessun nemico in vista) perché il compagno si rialzi. */
export const RIALZO_MS = 3000;

export interface StatoCompagno {
  vita: Risorsa;
  alTappeto: boolean;
  /** Da quando nessun nemico è in vista, mentre è al tappeto (null = c'è ancora pericolo). */
  tranquilloDa: number | null;
}

export function creaStatoCompagno(vitaMassima: number): StatoCompagno {
  return { vita: creaRisorsa(vitaMassima), alTappeto: false, tranquilloDa: null };
}

export function subisciDanno(s: StatoCompagno, danno: number): StatoCompagno {
  if (s.alTappeto) return s;
  const vita = consuma(s.vita, danno);
  return { ...s, vita, alTappeto: èEsaurita(vita), tranquilloDa: null };
}

/**
 * Il compagno al tappeto "si rialza a fine combattimento" (§10): quando nessun
 * nemico ti vede da RIALZO_MS, torna in piedi con metà vita.
 */
export function aggiornaRialzo(s: StatoCompagno, nemiciInVista: boolean, adesso: number): StatoCompagno {
  if (!s.alTappeto) return s;
  if (nemiciInVista) return s.tranquilloDa === null ? s : { ...s, tranquilloDa: null };
  if (s.tranquilloDa === null) return { ...s, tranquilloDa: adesso };
  if (adesso - s.tranquilloDa < RIALZO_MS) return s;
  return { vita: { attuale: Math.ceil(s.vita.massima / 2), massima: s.vita.massima }, alTappeto: false, tranquilloDa: null };
}

/** Una protezione sull'eroe: la parata di Corrado (un colpo) o lo scudo di Elisa (punti, a tempo). */
export type Protezione = { tipo: 'parata' } | { tipo: 'scudo'; resto: number; fino: number } | null;

export interface EsitoAssorbi {
  /** Danno che arriva comunque all'eroe. */
  danno: number;
  assorbito: number;
  /** La protezione che resta dopo il colpo (null = finita). */
  protezione: Protezione;
}

export function assorbiDanno(p: Protezione, danno: number, adesso: number): EsitoAssorbi {
  if (!p) return { danno, assorbito: 0, protezione: null };
  if (p.tipo === 'parata') return { danno: 0, assorbito: danno, protezione: null };
  if (adesso >= p.fino) return { danno, assorbito: 0, protezione: null };
  const assorbito = Math.min(p.resto, danno);
  const resto = p.resto - assorbito;
  return { danno: danno - assorbito, assorbito, protezione: resto > 0 ? { ...p, resto } : null };
}

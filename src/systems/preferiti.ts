// La barra dei preferiti (design §8): 6 spazi in fondo allo schermo, tasti 1–6,
// per pozioni e armi. Ogni spazio contiene un COLLEGAMENTO (l'id dell'oggetto),
// non l'oggetto: è come un segnalibro del browser, che punta a una pagina
// senza spostarla. Se le pozioni finiscono lo spazio resta, con "0".

import { conta, type Inventario } from './inventario';
import type { Equipaggiamento } from './equipaggiamento';

export const NUMERO_PREFERITI = 6;

/** Lunga sempre NUMERO_PREFERITI: null = spazio vuoto. */
export type Preferiti = readonly (string | null)[];

/** Che tipo di oggetto è un id (pozione, arma, armatura…): lo sa il catalogo. */
export type TipoDi = (id: string) => string | undefined;

export function creaPreferiti(iniziali: readonly (string | null)[]): Preferiti {
  return Array.from({ length: NUMERO_PREFERITI }, (_, i) => iniziali[i] ?? null);
}

export type EsitoPreferiti = { ok: true; preferiti: Preferiti } | { ok: false; errore: string };

/** Mette un collegamento nello spazio "indice". Se l'oggetto era già in un altro spazio, si sposta. */
export function assegnaPreferito(p: Preferiti, indice: number, id: string, tipoDi: TipoDi): EsitoPreferiti {
  if (indice < 0 || indice >= NUMERO_PREFERITI) return { ok: false, errore: 'Spazio inesistente' };
  const tipo = tipoDi(id);
  if (tipo === 'armatura') return { ok: false, errore: 'Le armature si cambiano dalla scheda del personaggio' };
  if (tipo !== 'pozione' && tipo !== 'arma') return { ok: false, errore: 'Nella barra vanno solo pozioni e armi' };
  const preferiti = p.map((x) => (x === id ? null : x));
  preferiti[indice] = id;
  return { ok: true, preferiti };
}

export function svuotaPreferito(p: Preferiti, indice: number): Preferiti {
  if (indice < 0 || indice >= NUMERO_PREFERITI || p[indice] === null) return p;
  return p.map((x, i) => (i === indice ? null : x));
}

/** Cosa farebbe un clic sullo spazio: serve sia a disegnarlo sia a usarlo. */
export type AzionePreferito =
  | { tipo: 'vuoto' }
  | { tipo: 'pozione'; id: string; quantita: number }
  /** indiceZaino −1: l'arma non è nello zaino (già in mano, oppure gettata). */
  | { tipo: 'arma'; id: string; inMano: boolean; indiceZaino: number };

export function cosaFa(p: Preferiti, indice: number, inventario: Inventario, equip: Equipaggiamento, tipoDi: TipoDi): AzionePreferito {
  const id = p[indice];
  if (!id) return { tipo: 'vuoto' };
  if (tipoDi(id) === 'arma') {
    const inMano = equip.primaria === id || equip.secondaria === id;
    return { tipo: 'arma', id, inMano, indiceZaino: inventario.spazi.findIndex((s) => s?.id === id) };
  }
  return { tipo: 'pozione', id, quantita: conta(inventario, id) };
}

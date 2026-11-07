// Il negozio (design §9): prezzi, Carisma, comprare e vendere.
// Funzioni pure sul "portafoglio + zaino": la scena del negozio mostra e chiama,
// le regole stanno qui e sono testate.

import { aggiungiMonete, spendiMonete } from './monete';
import { aggiungi, togli, type Inventario } from './inventario';
import type { Rarita } from './oggetti';

/** Ogni punto di modificatore CAR vale il 5% (in meglio o in peggio). */
const PER_PUNTO_CAR = 0.05;
/** Il Carisma aiuta al massimo del 25%: oltre, comprare e rivendere darebbe guadagno. */
const MASSIMO_CAR = 0.25;

export function effettoCarisma(modificatoreCAR: number): number {
  return Math.min(MASSIMO_CAR, Math.max(-MASSIMO_CAR, modificatoreCAR * PER_PUNTO_CAR));
}

/** Quanto costa comprare: prezzo pieno, meno lo sconto del Carisma. */
export function prezzoAcquisto(base: number, modificatoreCAR: number): number {
  return Math.max(1, Math.round(base * (1 - effettoCarisma(modificatoreCAR))));
}

/** Quanto ti dà il mercante: metà prezzo (§9), più il bonus del Carisma. */
export function prezzoVendita(base: number, modificatoreCAR: number): number {
  return Math.max(1, Math.round((base / 2) * (1 + effettoCarisma(modificatoreCAR))));
}

/** Ciò che il negozio deve sapere di un oggetto. */
export interface Merce {
  pila: number;
  prezzo: number;
  rarita: Rarita;
}

/** Il portafoglio e lo zaino cambiano insieme: monete in cambio di oggetti. */
export interface Portafoglio {
  monete: number;
  inventario: Inventario;
}

export type EsitoNegozio<T extends Portafoglio> = { ok: true; stato: T } | { ok: false; errore: string };

export function compra<T extends Portafoglio>(s: T, id: string, prezzo: number, catalogo: Readonly<Record<string, Merce>>): EsitoNegozio<T> {
  const merce = catalogo[id];
  if (!merce) return { ok: false, errore: 'Questo oggetto non esiste' };
  const pagato = spendiMonete(s, prezzo);
  if (!pagato) return { ok: false, errore: `Non hai abbastanza monete (ne servono ${prezzo})` };
  const esito = aggiungi(s.inventario, id, 1, merce.pila);
  if (esito.rimasti > 0) return { ok: false, errore: 'Zaino pieno: vendi o getta qualcosa' };
  return { ok: true, stato: { ...pagato, inventario: esito.inventario } };
}

/** Vende UN oggetto dello spazio "indice" (da una pila di pozioni, una sola). */
export function vendi<T extends Portafoglio>(s: T, indice: number, prezzo: number): EsitoNegozio<T> {
  if (!s.inventario.spazi[indice]) return { ok: false, errore: 'Niente da vendere' };
  return { ok: true, stato: { ...aggiungiMonete(s, prezzo), inventario: togli(s.inventario, indice, 1) } };
}

/** Controlli sui dati: cosa vende un mercante. */
export function validaNegozio(chi: string, merce: readonly string[], catalogo: Readonly<Record<string, Merce>>): string[] {
  const errori: string[] = [];
  for (const id of merce) {
    const m = catalogo[id];
    if (!m) errori.push(`Negozio "${chi}": "${id}" non esiste`);
    else if (!(m.prezzo > 0)) errori.push(`Negozio "${chi}": "${id}" non ha un prezzo`);
    else if (m.rarita === 'leggendaria' || m.rarita === 'esotica') {
      errori.push(`Negozio "${chi}": "${id}" è ${m.rarita === 'esotica' ? 'esotico' : 'leggendario'}, si trova solo nei dungeon (§8)`);
    }
  }
  return errori;
}

// L'inventario: una griglia di spazi, ognuno vuoto o con una "pila" di oggetti
// uguali. Come sempre nei systems, ogni funzione restituisce un inventario
// NUOVO e non tocca quello ricevuto.

export interface Pila {
  id: string;
  quantita: number;
}

export interface Inventario {
  capacita: number;
  /** Lungo esattamente "capacita": null = spazio vuoto. */
  spazi: (Pila | null)[];
}

export function creaInventario(capacita: number): Inventario {
  return { capacita, spazi: Array.from({ length: capacita }, () => null) };
}

export interface EsitoAggiunta {
  inventario: Inventario;
  /** Quanti non sono entrati (0 = tutti dentro). */
  rimasti: number;
}

/**
 * Aggiunge "quantita" oggetti: prima completa le pile già presenti dello
 * stesso oggetto, poi usa gli spazi vuoti. Quello che non entra torna indietro.
 */
export function aggiungi(inv: Inventario, id: string, quantita: number, pilaMassima: number): EsitoAggiunta {
  const spazi = inv.spazi.map((s) => (s ? { ...s } : null));
  let restano = quantita;
  // 1. Le pile esistenti.
  for (const s of spazi) {
    if (restano === 0) break;
    if (s && s.id === id && s.quantita < pilaMassima) {
      const entra = Math.min(pilaMassima - s.quantita, restano);
      s.quantita += entra;
      restano -= entra;
    }
  }
  // 2. Gli spazi vuoti.
  for (let i = 0; i < spazi.length && restano > 0; i++) {
    if (spazi[i] === null) {
      const entra = Math.min(pilaMassima, restano);
      spazi[i] = { id, quantita: entra };
      restano -= entra;
    }
  }
  // Se non è entrato niente restituiamo l'inventario originale: chi chiama
  // può capire con un semplice === che non è cambiato nulla.
  if (restano === quantita) return { inventario: inv, rimasti: quantita };
  return { inventario: { ...inv, spazi }, rimasti: restano };
}

/** Toglie "quantita" oggetti dallo spazio indicato. */
export function togli(inv: Inventario, indice: number, quantita: number): Inventario {
  const spazi = [...inv.spazi];
  const s = spazi[indice];
  if (!s) return inv;
  spazi[indice] = s.quantita > quantita ? { ...s, quantita: s.quantita - quantita } : null;
  return { ...inv, spazi };
}

/** Toglie oggetti di un tipo, dalle pile in ordine. Null se non ce ne sono abbastanza. */
export function togliPerId(inv: Inventario, id: string, quantita: number): Inventario | null {
  if (conta(inv, id) < quantita) return null;
  let risultato = inv;
  let restano = quantita;
  for (let i = 0; i < inv.spazi.length && restano > 0; i++) {
    const s = risultato.spazi[i];
    if (s && s.id === id) {
      const via = Math.min(s.quantita, restano);
      risultato = togli(risultato, i, via);
      restano -= via;
    }
  }
  return risultato;
}

export function conta(inv: Inventario, id: string): number {
  return inv.spazi.reduce((totale, s) => totale + (s && s.id === id ? s.quantita : 0), 0);
}

export function spaziLiberi(inv: Inventario): number {
  return inv.spazi.filter((s) => s === null).length;
}

/** Borse e zaini più grandi: aggiunge spazi vuoti in fondo. */
export function amplia(inv: Inventario, nuovaCapacita: number): Inventario {
  if (nuovaCapacita < inv.capacita) throw new Error('Non si può ridurre la capacità dello zaino');
  const extra = Array.from({ length: nuovaCapacita - inv.capacita }, () => null);
  return { capacita: nuovaCapacita, spazi: [...inv.spazi, ...extra] };
}

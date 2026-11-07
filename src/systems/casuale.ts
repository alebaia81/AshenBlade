// I numeri casuali vengono "passati dentro" alle funzioni invece di chiamare
// Math.random() direttamente. È la stessa idea della dependency injection:
// nel gioco passiamo il caso vero, nei test una sequenza decisa da noi,
// così possiamo verificare cosa succede con un critico o con il tiro minimo.

/** Una funzione che restituisce un numero tra 0 (incluso) e 1 (escluso). */
export type Casuale = () => number;

export const casualeVero: Casuale = Math.random;

/** Restituisce i valori indicati in ordine, ricominciando quando finiscono. Solo per i test. */
export function casualeFisso(valori: number[]): Casuale {
  let i = 0;
  return () => {
    const v = valori[i % valori.length]!;
    i++;
    return v;
  };
}

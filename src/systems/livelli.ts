// Esperienza e livelli. Le soglie stanno in data/livelli.json:
// soglie[0] è il livello 1 (0 esperienza), soglie[1] il livello 2, e così via.

/** La curva del design §5: esperienza totale per raggiungere il livello L. */
export function sogliaDellaCurva(livello: number): number {
  return 25 * livello * (livello - 1);
}

/** Livello corrispondente a un'esperienza totale. */
export function livelloDa(esperienza: number, soglie: readonly number[]): number {
  let livello = 1;
  // Si sale finché la soglia del livello successivo è stata raggiunta.
  while (livello < soglie.length && esperienza >= soglie[livello]!) livello++;
  return livello;
}

export interface Avanzamento {
  livello: number;
  /** Esperienza accumulata dall'inizio del livello attuale. */
  nelLivello: number;
  /** Esperienza che serve in tutto per passare al prossimo (0 al livello massimo). */
  perIlProssimo: number;
}

/** Per disegnare la barra: quanto manca al prossimo livello. */
export function avanzamento(esperienza: number, soglie: readonly number[]): Avanzamento {
  const livello = livelloDa(esperienza, soglie);
  if (livello >= soglie.length) return { livello, nelLivello: 0, perIlProssimo: 0 };
  const inizio = soglie[livello - 1]!;
  return { livello, nelLivello: esperienza - inizio, perIlProssimo: soglie[livello]! - inizio };
}

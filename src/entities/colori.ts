/** "#e8d9b0" → 0xe8d9b0: Phaser vuole i colori come numeri. */
export function colore(esadecimale: string): number {
  return parseInt(esadecimale.replace('#', ''), 16);
}

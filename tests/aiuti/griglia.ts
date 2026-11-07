// Griglia di prova scritta come una piccola mappa: '#' muro, tutto il resto libero.
import type { Griglia } from '../../src/systems/percorso';

export function grigliaDa(righe: string[]): Griglia {
  return {
    larghezza: righe[0]!.length,
    altezza: righe.length,
    calpestabile: (col, riga) => righe[riga]?.[col] !== undefined && righe[riga]![col] !== '#',
  };
}

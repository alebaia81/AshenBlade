import { describe, expect, it } from 'vitest';
import { tiraBottino } from '../src/systems/bottino';
import { casualeFisso } from '../src/systems/casuale';

const tabella = [
  { oggetto: 'pozione_vita', probabilita: 0.2 },
  { oggetto: 'pozione_forza', probabilita: 0.05, quantita: 2 },
];

describe('tiraBottino', () => {
  it('ogni voce si tira a parte: cade se il casuale è sotto la probabilità', () => {
    expect(tiraBottino(tabella, casualeFisso([0.1, 0.9]))).toEqual([{ id: 'pozione_vita', quantita: 1 }]);
    expect(tiraBottino(tabella, casualeFisso([0.5, 0.01]))).toEqual([{ id: 'pozione_forza', quantita: 2 }]);
    expect(tiraBottino(tabella, casualeFisso([0.1, 0.01]))).toHaveLength(2);
  });

  it('esattamente sulla probabilità non cade', () => {
    expect(tiraBottino(tabella, casualeFisso([0.2, 0.05]))).toEqual([]);
  });

  it('tabella vuota: niente', () => {
    expect(tiraBottino([], casualeFisso([0]))).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import { casualeFisso } from '../src/systems/casuale';
import { aggiungiMonete, moneteDelNemico, spendiMonete } from '../src/systems/monete';

describe('monete', () => {
  it('un nemico lascia un numero di monete nel suo intervallo (estremi compresi)', () => {
    expect(moneteDelNemico([2, 5], casualeFisso([0]))).toBe(2);
    expect(moneteDelNemico([2, 5], casualeFisso([0.999]))).toBe(5);
    expect(moneteDelNemico([2, 5], casualeFisso([0.5]))).toBe(4);
    expect(moneteDelNemico(undefined, casualeFisso([0.5]))).toBe(0);
  });

  it('aggiungere e spendere restituiscono un oggetto nuovo', () => {
    const p = { monete: 10, altro: 'x' };
    expect(aggiungiMonete(p, 5)).toEqual({ monete: 15, altro: 'x' });
    expect(spendiMonete(p, 4)).toEqual({ monete: 6, altro: 'x' });
    expect(p.monete).toBe(10);
  });

  it('non si spende più di quanto si ha: null, e nulla cambia', () => {
    expect(spendiMonete({ monete: 3 }, 4)).toBeNull();
    expect(spendiMonete({ monete: 3 }, 3)).toEqual({ monete: 0 });
  });

  it('quantità negative o non intere non sono ammesse', () => {
    expect(() => aggiungiMonete({ monete: 3 }, -1)).toThrow();
    expect(() => spendiMonete({ monete: 3 }, 1.5)).toThrow();
  });
});

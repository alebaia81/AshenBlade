import { describe, expect, it } from 'vitest';
import { casualeFisso } from '../src/systems/casuale';
import { leggiDado, tiraDado } from '../src/systems/dadi';

describe('leggiDado', () => {
  it('legge "1d6"', () => {
    expect(leggiDado('1d6')).toEqual({ quantita: 1, facce: 6, bonus: 0 });
  });

  it('legge un bonus positivo o negativo', () => {
    expect(leggiDado('2d4+1')).toEqual({ quantita: 2, facce: 4, bonus: 1 });
    expect(leggiDado('1d8-2')).toEqual({ quantita: 1, facce: 8, bonus: -2 });
  });

  it('dà un errore leggibile per i formati sbagliati', () => {
    expect(() => leggiDado('1d')).toThrow(/"1d"/);
    expect(() => leggiDado('d6')).toThrow(/"d6"/);
    expect(() => leggiDado('0d6')).toThrow(/"0d6"/);
    expect(() => leggiDado('1d0')).toThrow(/"1d0"/);
  });
});

describe('tiraDado', () => {
  it('con il casuale più basso esce 1', () => {
    expect(tiraDado(leggiDado('1d6'), casualeFisso([0]))).toBe(1);
  });

  it('con il casuale più alto esce il numero di facce', () => {
    expect(tiraDado(leggiDado('1d6'), casualeFisso([0.9999]))).toBe(6);
  });

  it('somma più dadi e il bonus', () => {
    // 2d4+1: minimo 3, massimo 9
    expect(tiraDado(leggiDado('2d4+1'), casualeFisso([0, 0]))).toBe(3);
    expect(tiraDado(leggiDado('2d4+1'), casualeFisso([0.9999, 0.9999]))).toBe(9);
  });
});

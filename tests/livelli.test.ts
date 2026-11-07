import { describe, expect, it } from 'vitest';
import datiLivelli from '../src/data/livelli.json';
import { avanzamento, livelloDa, sogliaDellaCurva } from '../src/systems/livelli';

const soglie = datiLivelli.soglie;

describe('curva dell’esperienza (design §5)', () => {
  it('25 × L × (L − 1)', () => {
    expect(sogliaDellaCurva(1)).toBe(0);
    expect(sogliaDellaCurva(2)).toBe(50);
    expect(sogliaDellaCurva(5)).toBe(500);
    expect(sogliaDellaCurva(20)).toBe(9500);
  });

  it('il file dei dati ha 20 soglie crescenti che seguono la curva', () => {
    expect(soglie).toHaveLength(20);
    soglie.forEach((s, i) => expect(s).toBe(sogliaDellaCurva(i + 1)));
  });
});

describe('livelloDa', () => {
  it('trova il livello dall’esperienza totale', () => {
    expect(livelloDa(0, soglie)).toBe(1);
    expect(livelloDa(49, soglie)).toBe(1);
    expect(livelloDa(50, soglie)).toBe(2);
    expect(livelloDa(149, soglie)).toBe(2);
    expect(livelloDa(9500, soglie)).toBe(20);
  });

  it('oltre l’ultima soglia resta al massimo', () => {
    expect(livelloDa(999999, soglie)).toBe(20);
  });
});

describe('avanzamento (per la barra dell’esperienza)', () => {
  it('quanto si è fatto del livello attuale', () => {
    // livello 2 va da 50 a 150: con 100 si è a metà
    expect(avanzamento(100, soglie)).toEqual({ livello: 2, nelLivello: 50, perIlProssimo: 100 });
  });

  it('al livello massimo non c’è un prossimo', () => {
    expect(avanzamento(9600, soglie)).toEqual({ livello: 20, nelLivello: 0, perIlProssimo: 0 });
  });
});

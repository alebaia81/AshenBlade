import { describe, expect, it } from 'vitest';
import { RARITA, colorePerRarita, confrontaRarita, posizioniCaduta } from '../src/systems/oggetti';

describe('rarità (design §8)', () => {
  it('cinque rarità in ordine crescente', () => {
    expect(RARITA).toEqual(['comune', 'non_comune', 'rara', 'leggendaria', 'esotica']);
    expect(confrontaRarita('rara', 'non_comune')).toBeGreaterThan(0);
    expect(confrontaRarita('comune', 'esotica')).toBeLessThan(0);
  });

  it('i colori del design: verde, blu, viola, oro', () => {
    expect(colorePerRarita('non_comune')).toMatch(/^#/);
    const colori = RARITA.map(colorePerRarita);
    expect(new Set(colori).size).toBe(5); // tutti diversi
  });
});

describe('posizioniCaduta (drop dei forzieri e dei nemici)', () => {
  it('distanzia gli oggetti dal forziere, non li sovrappone tra loro ed evita gli ostacoli', () => {
    const forziere = { x: 100, y: 100 };
    const eroe = { x: 100, y: 120 };
    // Un albero a destra del forziere (x >= 112).
    const libero = (p: { x: number; y: number }) => p.x < 112 && Math.hypot(p.x - forziere.x, p.y - forziere.y) >= 14;
    const punti = posizioniCaduta(3, { origine: forziere, verso: eroe, distanzaMinima: 15, libero });
    expect(punti).toHaveLength(3);
    for (const p of punti) {
      expect(libero(p)).toBe(true);
      expect(Math.hypot(p.x - forziere.x, p.y - forziere.y)).toBeGreaterThanOrEqual(15 - 1);
    }
    expect(Math.hypot(punti[0]!.x - punti[1]!.x, punti[0]!.y - punti[1]!.y)).toBeGreaterThanOrEqual(10);
  });
});

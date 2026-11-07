import { describe, expect, it } from 'vitest';
import { avanza, creaProiettile, finito, nelRaggio } from '../src/systems/proiettili';

describe('proiettili', () => {
  const p = creaProiettile({ x: 0, y: 0 }, { x: 1, y: 0 }, 100, 50);

  it('avanza nella sua direzione alla sua velocità', () => {
    const dopo = avanza(p, 200); // 0,2 s a 100 px/s
    expect(dopo.posizione.x).toBeCloseTo(20);
    expect(dopo.posizione.y).toBeCloseTo(0);
    expect(dopo.percorso).toBeCloseTo(20);
  });

  it('la direzione viene normalizzata', () => {
    const obliquo = avanza(creaProiettile({ x: 0, y: 0 }, { x: 3, y: 4 }, 100, 50), 100);
    expect(obliquo.posizione.x).toBeCloseTo(6);
    expect(obliquo.posizione.y).toBeCloseTo(8);
  });

  it('finisce quando ha percorso la gittata', () => {
    expect(finito(avanza(p, 400))).toBe(false);
    expect(finito(avanza(p, 500))).toBe(true);
  });
});

describe('nelRaggio (esplosione della palla di fuoco)', () => {
  const bersagli = [
    { id: 'dentro', rettangolo: { x: 10, y: -5, larghezza: 10, altezza: 10 } }, // il bordo più vicino è a 10
    { id: 'bordo', rettangolo: { x: 24, y: -5, larghezza: 10, altezza: 10 } }, // esattamente a 24
    { id: 'fuori', rettangolo: { x: 40, y: -5, larghezza: 10, altezza: 10 } },
    { id: 'centrato', rettangolo: { x: -5, y: -5, larghezza: 10, altezza: 10 } }, // contiene il centro
  ];

  it('colpisce i rettangoli che entrano nel cerchio, non quelli sul bordo o fuori', () => {
    expect(nelRaggio({ x: 0, y: 0 }, 24, bersagli).sort()).toEqual(['centrato', 'dentro']);
  });

  it('conta la distanza dal punto più vicino del rettangolo, non dal suo centro', () => {
    // centro a 34 px, ma il bordo sinistro è a 22: dentro un raggio di 24
    expect(nelRaggio({ x: 0, y: 0 }, 24, [{ id: 'grande', rettangolo: { x: 22, y: -10, larghezza: 24, altezza: 20 } }])).toEqual(['grande']);
  });
});

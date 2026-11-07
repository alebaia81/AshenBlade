import { describe, expect, it } from 'vitest';
import { seguiPercorso } from '../src/systems/seguiPercorso';

const punti = [
  { x: 100, y: 0 },
  { x: 100, y: 100 },
];

describe('seguiPercorso', () => {
  it('va verso il punto attuale alla velocità indicata', () => {
    const r = seguiPercorso({ x: 0, y: 0 }, punti, 0, 80);
    expect(r.indice).toBe(0);
    expect(r.arrivato).toBe(false);
    expect(r.velocita.x).toBeCloseTo(80);
    expect(r.velocita.y).toBeCloseTo(0);
  });

  it('vicino al punto passa a quello successivo', () => {
    const r = seguiPercorso({ x: 99, y: 0 }, punti, 0, 80);
    expect(r.indice).toBe(1);
    expect(r.velocita.y).toBeCloseTo(80);
  });

  it('a fine percorso si ferma', () => {
    const r = seguiPercorso({ x: 100, y: 99.5 }, punti, 1, 80);
    expect(r.arrivato).toBe(true);
    expect(r.velocita).toEqual({ x: 0, y: 0 });
  });

  it('un percorso vuoto è già arrivato', () => {
    expect(seguiPercorso({ x: 5, y: 5 }, [], 0, 80).arrivato).toBe(true);
  });
});

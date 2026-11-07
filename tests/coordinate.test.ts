import { describe, expect, it } from 'vitest';
import { cellaDaPixel, centroCella } from '../src/systems/coordinate';

describe('coordinate', () => {
  it('il centro della cella (0,0) è a metà tessera', () => {
    expect(centroCella({ col: 0, riga: 0 }, 16)).toEqual({ x: 8, y: 8 });
  });

  it('il centro della cella (3,2) tiene conto di colonna e riga', () => {
    expect(centroCella({ col: 3, riga: 2 }, 16)).toEqual({ x: 56, y: 40 });
  });

  it('un pixel dentro una cella restituisce quella cella', () => {
    expect(cellaDaPixel(20, 37, 16)).toEqual({ col: 1, riga: 2 });
  });

  it('il bordo appartiene alla cella successiva', () => {
    expect(cellaDaPixel(16, 15.99, 16)).toEqual({ col: 1, riga: 0 });
  });

  it('coordinate negative danno celle negative (fuori mappa)', () => {
    expect(cellaDaPixel(-1, -1, 16)).toEqual({ col: -1, riga: -1 });
  });
});

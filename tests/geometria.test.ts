import { describe, expect, it } from 'vitest';
import {
  alleSpalle,
  areaDiColpo,
  arrivaDavanti,
  COS_50_GRADI,
  direzioneDa,
  intersecano,
  nelCono,
  nuoviColpiti,
  rettangoloDaCentro,
} from '../src/systems/geometria';

describe('intersecano (AABB)', () => {
  const a = { x: 0, y: 0, larghezza: 10, altezza: 10 };

  it('rettangoli sovrapposti', () => {
    expect(intersecano(a, { x: 5, y: 5, larghezza: 10, altezza: 10 })).toBe(true);
  });

  it('rettangoli lontani', () => {
    expect(intersecano(a, { x: 20, y: 0, larghezza: 5, altezza: 5 })).toBe(false);
    expect(intersecano(a, { x: 0, y: 11, larghezza: 5, altezza: 5 })).toBe(false);
  });

  it('rettangoli che si sfiorano sul bordo non contano', () => {
    expect(intersecano(a, { x: 10, y: 0, larghezza: 5, altezza: 5 })).toBe(false);
  });

  it('un rettangolo dentro l’altro', () => {
    expect(intersecano(a, { x: 2, y: 2, larghezza: 2, altezza: 2 })).toBe(true);
  });
});

describe('rettangoloDaCentro', () => {
  it('converte da centro a angolo in alto a sinistra', () => {
    expect(rettangoloDaCentro({ x: 20, y: 30 }, 10, 4)).toEqual({ x: 15, y: 28, larghezza: 10, altezza: 4 });
  });
});

describe('areaDiColpo', () => {
  // Eroe al centro (100,100), lato 12: i suoi bordi sono a 94 e 106.
  const centro = { x: 100, y: 100 };
  const arma = { portata: 14, larghezza: 18 };

  it('a destra parte dal bordo destro dell’eroe', () => {
    expect(areaDiColpo(centro, 12, 'destra', arma)).toEqual({ x: 106, y: 91, larghezza: 14, altezza: 18 });
  });

  it('a sinistra finisce sul bordo sinistro', () => {
    expect(areaDiColpo(centro, 12, 'sinistra', arma)).toEqual({ x: 80, y: 91, larghezza: 14, altezza: 18 });
  });

  it('in alto e in basso è ruotata', () => {
    expect(areaDiColpo(centro, 12, 'su', arma)).toEqual({ x: 91, y: 80, larghezza: 18, altezza: 14 });
    expect(areaDiColpo(centro, 12, 'giu', arma)).toEqual({ x: 91, y: 106, larghezza: 18, altezza: 14 });
  });
});

describe('nuoviColpiti', () => {
  const area = { x: 0, y: 0, larghezza: 20, altezza: 20 };
  const bersagli = [
    { id: 1, rettangolo: { x: 5, y: 5, larghezza: 5, altezza: 5 } },
    { id: 2, rettangolo: { x: 50, y: 50, larghezza: 5, altezza: 5 } },
    { id: 3, rettangolo: { x: 15, y: 15, larghezza: 10, altezza: 10 } },
  ];

  it('restituisce chi è toccato dall’area', () => {
    expect(nuoviColpiti(area, bersagli, new Set())).toEqual([1, 3]);
  });

  it('chi è già stato colpito in questo fendente non viene colpito di nuovo', () => {
    expect(nuoviColpiti(area, bersagli, new Set([1]))).toEqual([3]);
  });
});

describe('direzioneDa', () => {
  it('punta dal primo punto verso il secondo, con lunghezza 1', () => {
    expect(direzioneDa({ x: 0, y: 0 }, { x: 10, y: 0 })).toEqual({ x: 1, y: 0 });
    const d = direzioneDa({ x: 0, y: 0 }, { x: -3, y: 4 });
    expect(d.x).toBeCloseTo(-0.6);
    expect(d.y).toBeCloseTo(0.8);
  });

  it('se i punti coincidono punta in giù invece di dividere per zero', () => {
    expect(direzioneDa({ x: 5, y: 5 }, { x: 5, y: 5 })).toEqual({ x: 0, y: 1 });
  });
});

describe('alleSpalle (danno doppio del Ladro)', () => {
  // Il nemico è in (100,100) e guarda a destra (si muove verso destra).
  const guarda = { x: 1, y: 0 };
  const nemico = { x: 100, y: 100 };

  it('colpito da dietro (da sinistra): sì', () => {
    expect(alleSpalle(guarda, nemico, { x: 80, y: 100 })).toBe(true);
    expect(alleSpalle(guarda, nemico, { x: 80, y: 108 })).toBe(true); // un po' di sbieco
  });

  it('colpito di lato o di fronte: no', () => {
    expect(alleSpalle(guarda, nemico, { x: 100, y: 80 })).toBe(false);
    expect(alleSpalle(guarda, nemico, { x: 120, y: 100 })).toBe(false);
  });
});

describe('arrivaDavanti (parata del Guerriero)', () => {
  const eroe = { x: 100, y: 100 };

  it('un nemico davanti, anche un po’ di lato, è parato', () => {
    expect(arrivaDavanti('destra', eroe, { x: 115, y: 100 })).toBe(true);
    expect(arrivaDavanti('destra', eroe, { x: 115, y: 108 })).toBe(true);
  });

  it('di lato o da dietro no', () => {
    expect(arrivaDavanti('destra', eroe, { x: 100, y: 115 })).toBe(false);
    expect(arrivaDavanti('destra', eroe, { x: 85, y: 100 })).toBe(false);
  });

  it('funziona in tutte le direzioni', () => {
    expect(arrivaDavanti('su', eroe, { x: 100, y: 85 })).toBe(true);
    expect(arrivaDavanti('giu', eroe, { x: 100, y: 85 })).toBe(false);
  });
});

describe('nelCono (Cleave ad arco 100°)', () => {
  const centro = { x: 100, y: 100 };
  const versoDestra = { x: 1, y: 0 };
  const raggio = 32;

  it('nemico perfettamente frontale entro il raggio', () => {
    expect(nelCono(centro, versoDestra, raggio, COS_50_GRADI, { x: 120, y: 100 })).toBe(true);
  });

  it('nemico a circa 40 gradi (entro il semi-angolo di 50°)', () => {
    // A 40 gradi, dist 20px: dx = 20 * cos(40°) ~ 15.3, dy = 20 * sin(40°) ~ 12.8
    expect(nelCono(centro, versoDestra, raggio, COS_50_GRADI, { x: 115.3, y: 112.8 })).toBe(true);
  });

  it('nemico a circa 60 gradi (fuori dal cono di 100°)', () => {
    // A 60 gradi: cos(60°) = 0.5 < cos(50°) (~0.6428)
    expect(nelCono(centro, versoDestra, raggio, COS_50_GRADI, { x: 110, y: 117.3 })).toBe(false);
  });

  it('nemico alle spalle', () => {
    expect(nelCono(centro, versoDestra, raggio, COS_50_GRADI, { x: 80, y: 100 })).toBe(false);
  });

  it('nemico frontale ma oltre il raggio massimo', () => {
    expect(nelCono(centro, versoDestra, raggio, COS_50_GRADI, { x: 135, y: 100 })).toBe(false);
  });

  it('bersaglio sovrapposto all’origine (distanza 0)', () => {
    expect(nelCono(centro, versoDestra, raggio, COS_50_GRADI, { x: 100, y: 100 })).toBe(true);
  });
});

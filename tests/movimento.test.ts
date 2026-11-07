import { describe, expect, it } from 'vitest';
import { aggiornaDirezione, aggiornaDirezioneDaVettore, calcolaVelocita } from '../src/systems/movimento';
import type { TastiPremuti } from '../src/systems/tipi';

const nessuno: TastiPremuti = { su: false, giu: false, sinistra: false, destra: false };
const tasti = (parziali: Partial<TastiPremuti>): TastiPremuti => ({ ...nessuno, ...parziali });

describe('calcolaVelocita', () => {
  it('senza tasti l’eroe è fermo', () => {
    const v = calcolaVelocita(nessuno, 80);
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
  });

  it('destra dà velocità piena verso destra', () => {
    expect(calcolaVelocita(tasti({ destra: true }), 80)).toEqual({ x: 80, y: 0 });
  });

  it('su dà velocità negativa sull’asse y (in alto lo schermo ha y piccola)', () => {
    expect(calcolaVelocita(tasti({ su: true }), 80)).toEqual({ x: 0, y: -80 });
  });

  it('in diagonale la velocità totale resta la stessa', () => {
    const v = calcolaVelocita(tasti({ giu: true, destra: true }), 80);
    expect(v.x).toBeCloseTo(80 / Math.SQRT2);
    expect(v.y).toBeCloseTo(80 / Math.SQRT2);
    expect(Math.hypot(v.x, v.y)).toBeCloseTo(80);
  });

  it('tasti opposti si annullano', () => {
    const v = calcolaVelocita(tasti({ sinistra: true, destra: true, su: true }), 80);
    expect(v.x).toBeCloseTo(0);
    expect(v.y).toBe(-80);
  });
});

describe('aggiornaDirezione', () => {
  it('fermo: lo sguardo resta sull’ultima direzione', () => {
    expect(aggiornaDirezione('sinistra', nessuno)).toBe('sinistra');
  });

  it('un solo tasto: guarda in quella direzione', () => {
    expect(aggiornaDirezione('giu', tasti({ destra: true }))).toBe('destra');
  });

  it('in diagonale mantiene lo sguardo se è una delle due direzioni', () => {
    expect(aggiornaDirezione('su', tasti({ su: true, destra: true }))).toBe('su');
  });

  it('in diagonale da un’altra direzione preferisce quella orizzontale', () => {
    expect(aggiornaDirezione('giu', tasti({ su: true, sinistra: true }))).toBe('sinistra');
  });

  it('tasti opposti non contano come movimento su quell’asse', () => {
    expect(aggiornaDirezione('giu', tasti({ sinistra: true, destra: true }))).toBe('giu');
  });
});

describe('aggiornaDirezioneDaVettore (movimento col mouse)', () => {
  it('fermo: lo sguardo non cambia', () => {
    expect(aggiornaDirezioneDaVettore('su', { x: 0, y: 0 })).toBe('su');
  });

  it('segue l’asse dominante', () => {
    expect(aggiornaDirezioneDaVettore('su', { x: 0.9, y: 0.2 })).toBe('destra');
    expect(aggiornaDirezioneDaVettore('su', { x: -0.1, y: 0.95 })).toBe('giu');
  });

  it('in diagonale tiene lo sguardo se è una delle due direzioni (niente sfarfallio)', () => {
    expect(aggiornaDirezioneDaVettore('giu', { x: 0.7, y: 0.71 })).toBe('giu');
    expect(aggiornaDirezioneDaVettore('destra', { x: 0.71, y: 0.7 })).toBe('destra');
  });
});

import { describe, expect, it } from 'vitest';
import { casualeFisso } from '../src/systems/casuale';
import { calcolaDanno } from '../src/systems/combattimento';
import {
  manaMassimo,
  rigenerazioneMana,
  modificatoreArma,
  probabilitaCriticoDi,
  ricaricaSchivata,
  vitaMassima,
} from '../src/systems/personaggio';
import { guerrieroDiProva, magoDiProva } from './aiuti/classi';

const car = guerrieroDiProva.caratteristiche; // COS 14 → +2

describe('vitaMassima (design §6)', () => {
  it('livello 1: base + modificatore COS', () => {
    expect(vitaMassima(guerrieroDiProva, car, 1)).toBe(14 + 2);
  });

  it('livello 3: base + crescita × 2 + modificatore COS × 3', () => {
    expect(vitaMassima(guerrieroDiProva, car, 3)).toBe(14 + 2 * 6 + 3 * 2);
  });

  it('mai sotto 1, anche con COS bassissima', () => {
    expect(vitaMassima(magoDiProva, { ...magoDiProva.caratteristiche, COS: 1 }, 1)).toBeGreaterThanOrEqual(1);
  });
});

describe('manaMassimo', () => {
  it('il Guerriero non ha mana', () => {
    expect(manaMassimo(guerrieroDiProva, car)).toBe(0);
  });

  it('il Mago: base + 2 × modificatore INT', () => {
    expect(manaMassimo(magoDiProva, magoDiProva.caratteristiche)).toBe(10 + 2 * 2);
  });
});

describe('ricaricaSchivata', () => {
  it('con DES 10 resta quella base', () => {
    expect(ricaricaSchivata(600, { ...car, DES: 10 })).toBe(600);
  });

  it('più breve con DES alta (−5% per punto di modificatore)', () => {
    expect(ricaricaSchivata(600, { ...car, DES: 16 })).toBeCloseTo(600 * 0.85);
  });

  it('mai sotto la metà', () => {
    expect(ricaricaSchivata(600, { ...car, DES: 40 })).toBe(300);
  });

  it('più lunga con DES bassa', () => {
    expect(ricaricaSchivata(600, { ...car, DES: 8 })).toBeCloseTo(600 * 1.05);
  });
});

describe('arma e critico', () => {
  it('il modificatore dipende dalla caratteristica dell’arma', () => {
    expect(modificatoreArma({ caratteristica: 'FOR' }, car)).toBe(2);
    expect(modificatoreArma({ caratteristica: 'DES' }, car)).toBe(1);
    expect(modificatoreArma({ caratteristica: 'INT' }, car)).toBe(-1);
  });

  it('il critico è 5% + 1% per punto di DES + bonus dell’arma', () => {
    expect(probabilitaCriticoDi({ bonusCritico: 0.05 }, { ...car, DES: 15 })).toBeCloseTo(0.12);
  });

  it('il danno usa il modificatore FOR dell’arma pesante', () => {
    const esito = calcolaDanno(
      { dado: '1d8', modificatore: modificatoreArma({ caratteristica: 'FOR' }, car), bonus: 0, armatura: 0, probabilitaCritico: 0 },
      casualeFisso([0.99, 0]), // niente critico, dado al minimo
    );
    expect(esito.danno).toBe(1 + 2);
  });
});

describe('rigenerazioneMana (al secondo)', () => {
  it('1 + 0,25 × modificatore SAG', () => {
    expect(rigenerazioneMana({ ...car, SAG: 10 })).toBe(1);
    expect(rigenerazioneMana({ ...car, SAG: 15 })).toBe(1.5);
  });

  it('mai sotto 0,25', () => {
    expect(rigenerazioneMana({ ...car, SAG: 1 })).toBe(0.25);
  });
});

import { describe, expect, it } from 'vitest';
import {
  assegnaPunto,
  conPuntiLiberi,
  modificatore,
  puòAggiungereLibero,
  type Caratteristiche,
} from '../src/systems/caratteristiche';

const guerriero: Caratteristiche = { FOR: 15, DES: 12, COS: 14, INT: 8, SAG: 10, CAR: 10 };

describe('modificatore (design §5)', () => {
  it('arrotonda per difetto (valore − 10) / 2', () => {
    expect(modificatore(8)).toBe(-1);
    expect(modificatore(9)).toBe(-1);
    expect(modificatore(10)).toBe(0);
    expect(modificatore(11)).toBe(0);
    expect(modificatore(15)).toBe(2);
    expect(modificatore(20)).toBe(5);
  });
});

describe('punti liberi alla creazione', () => {
  it('2 punti su caratteristiche diverse', () => {
    const c = conPuntiLiberi(guerriero, ['FOR', 'COS']);
    expect(c.FOR).toBe(16);
    expect(c.COS).toBe(15);
    expect(c.DES).toBe(12);
  });

  it('non modifica i valori della classe', () => {
    conPuntiLiberi(guerriero, ['FOR', 'COS']);
    expect(guerriero.FOR).toBe(15);
  });

  it('servono esattamente 2 punti', () => {
    expect(() => conPuntiLiberi(guerriero, ['FOR'])).toThrow(/2 punti/);
    expect(() => conPuntiLiberi(guerriero, ['FOR', 'DES', 'COS'])).toThrow(/2 punti/);
  });

  it('al massimo 1 punto per caratteristica', () => {
    expect(() => conPuntiLiberi(guerriero, ['COS', 'COS'])).toThrow(/stessa caratteristica/);
  });

  it('nessun valore oltre 16', () => {
    const forte = { ...guerriero, FOR: 16 };
    expect(() => conPuntiLiberi(forte, ['FOR', 'COS'])).toThrow(/16/);
  });

  it('puòAggiungereLibero dice se il pulsante "+" va acceso', () => {
    expect(puòAggiungereLibero(guerriero, [], 'FOR')).toBe(true);
    expect(puòAggiungereLibero(guerriero, ['FOR'], 'FOR')).toBe(false); // già scelto
    expect(puòAggiungereLibero(guerriero, ['FOR', 'DES'], 'COS')).toBe(false); // punti finiti
    expect(puòAggiungereLibero({ ...guerriero, INT: 16 }, [], 'INT')).toBe(false); // oltre 16
  });
});

describe('assegnaPunto (salendo di livello)', () => {
  it('aggiunge 1 alla caratteristica scelta', () => {
    expect(assegnaPunto(guerriero, 'DES').DES).toBe(13);
  });

  it('dopo la creazione il limite di 16 non vale più', () => {
    expect(assegnaPunto({ ...guerriero, FOR: 16 }, 'FOR').FOR).toBe(17);
  });
});

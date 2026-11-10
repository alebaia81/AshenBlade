import { describe, expect, it } from 'vitest';
import { casualeFisso } from '../src/systems/casuale';
import { calcolaDanno, dannoBaseArma, probabilitaCritico } from '../src/systems/combattimento';

// calcolaDanno usa i numeri casuali in quest'ordine:
// 1) uno per decidere il critico, 2) uno per ogni dado.
const NO_CRITICO = 0.99;
const CRITICO = 0;

describe('probabilitaCritico', () => {
  it('5% di base', () => {
    expect(probabilitaCritico(0, 0)).toBeCloseTo(0.05);
  });

  it('+1% per punto di modificatore DES e + il bonus dell’arma', () => {
    expect(probabilitaCritico(3, 0)).toBeCloseTo(0.08);
    expect(probabilitaCritico(2, 0.05)).toBeCloseTo(0.12);
  });

  it('un modificatore negativo la riduce, ma mai sotto 0', () => {
    expect(probabilitaCritico(-1, 0)).toBeCloseTo(0.04);
    expect(probabilitaCritico(-10, 0)).toBe(0);
  });
});

describe('calcolaDanno', () => {
  const base = { dado: '1d6', modificatore: 0, bonus: 0, armatura: 0, probabilitaCritico: 0.05 };

  it('danno = dado + modificatore + bonus', () => {
    const r = calcolaDanno({ ...base, modificatore: 2, bonus: 1 }, casualeFisso([NO_CRITICO, 0.5]));
    expect(r).toEqual({ danno: 4 + 2 + 1, critico: false }); // 0.5 su 1d6 → 4
  });

  it('l’armatura riduce il danno', () => {
    const r = calcolaDanno({ ...base, armatura: 2 }, casualeFisso([NO_CRITICO, 0.9999]));
    expect(r.danno).toBe(6 - 2);
  });

  it('almeno 1 danno anche contro armature alte', () => {
    const r = calcolaDanno({ ...base, armatura: 50 }, casualeFisso([NO_CRITICO, 0]));
    expect(r.danno).toBe(1);
  });

  it('il critico raddoppia il danno (prima dell’armatura)', () => {
    const r = calcolaDanno({ ...base, modificatore: 1, armatura: 1 }, casualeFisso([CRITICO, 0.5]));
    expect(r).toEqual({ danno: (4 + 1) * 2 - 1, critico: true });
  });

  it('il critico esce solo se il casuale è sotto la probabilità', () => {
    expect(calcolaDanno(base, casualeFisso([0.049, 0])).critico).toBe(true);
    expect(calcolaDanno(base, casualeFisso([0.05, 0])).critico).toBe(false);
  });

  it('dadi aggiuntivi (es. +1d6 del Chierico contro i non morti) si sommano al danno', () => {
    // casuali: critico no, 1d6 dell'arma al massimo (6), 1d6 aggiuntivo al minimo (1)
    const r = calcolaDanno({ ...base, dadiAggiuntivi: ['1d6'] }, casualeFisso([NO_CRITICO, 0.9999, 0]));
    expect(r.danno).toBe(6 + 1);
  });

  it('il moltiplicatore (colpo alle spalle del Ladro) raddoppia, e si somma al critico', () => {
    const normale = calcolaDanno({ ...base, moltiplicatore: 2 }, casualeFisso([NO_CRITICO, 0.5]));
    expect(normale.danno).toBe(4 * 2);
    const critico = calcolaDanno({ ...base, moltiplicatore: 2 }, casualeFisso([CRITICO, 0.5]));
    expect(critico.danno).toBe(4 * 2 * 2);
  });
});

describe('dannoBaseArma e progressione deterministica a livelli (Liv. 1 - 5)', () => {
  it('progressione Spada (Tabella 5.2): 10, 12, 15, 17, 20', () => {
    const spada = { tipo: 'spada' };
    expect(dannoBaseArma(spada, 0)).toBe(10); // Livello 1 (base)
    expect(dannoBaseArma(spada, 1)).toBe(12); // Livello 2 (rinforzata)
    expect(dannoBaseArma(spada, 2)).toBe(15); // Livello 3 (affilata)
    expect(dannoBaseArma(spada, 3)).toBe(17); // Livello 4 (magistrale)
    expect(dannoBaseArma(spada, 4)).toBe(20); // Livello 5 (maxata)
  });

  it('progressione Arco (Tabella 5.2): 8, 10, 13, 15, 18', () => {
    const arco = { tipo: 'arco' };
    expect(dannoBaseArma(arco, 0)).toBe(8);  // Livello 1
    expect(dannoBaseArma(arco, 1)).toBe(10); // Livello 2
    expect(dannoBaseArma(arco, 2)).toBe(13); // Livello 3
    expect(dannoBaseArma(arco, 3)).toBe(15); // Livello 4
    expect(dannoBaseArma(arco, 4)).toBe(18); // Livello 5
  });
});

describe('calcolaDanno deterministico (§5 combat_design_spec)', () => {
  const colpoDeterministico = {
    dannoBase: 10, // Spada Livello 1
    dado: '1d8',
    modificatore: 2, // FOR +2
    bonus: 0,
    armatura: 0,
    probabilitaCritico: 0.05,
  };

  it('danno = dannoBase + modificatore (senza dadi)', () => {
    const r = calcolaDanno(colpoDeterministico, casualeFisso([NO_CRITICO]));
    expect(r.danno).toBe(10 + 2);
    expect(r.critico).toBe(false);
  });

  it('cleave splash damage (70% al bersaglio secondario)', () => {
    const splash = calcolaDanno({ ...colpoDeterministico, moltiplicatore: 0.7 }, casualeFisso([NO_CRITICO]));
    // (10 + 2) * 0.7 = 8.4 -> 8
    expect(splash.danno).toBe(8);
  });

  it('critico con danno deterministico (raddoppio base)', () => {
    const crit = calcolaDanno(colpoDeterministico, casualeFisso([CRITICO]));
    expect(crit.danno).toBe((10 + 2) * 2);
    expect(crit.critico).toBe(true);
  });

  it('riduzione dell’armatura con minimo garantito di 1', () => {
    const conArmatura = calcolaDanno({ ...colpoDeterministico, armatura: 4 }, casualeFisso([NO_CRITICO]));
    expect(conArmatura.danno).toBe(12 - 4);

    const corazzato = calcolaDanno({ ...colpoDeterministico, armatura: 99 }, casualeFisso([NO_CRITICO]));
    expect(corazzato.danno).toBe(1);
  });
});

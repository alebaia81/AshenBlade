import { describe, expect, it } from 'vitest';
import { calcolaDanno } from '../src/systems/combattimento';
import { casualeFisso } from '../src/systems/casuale';
import { bersagliEsplosione, danniRimandati, direzioniDardoDiviso, moltiplicatoreCritico, prossimoRimbalzo, vitaRisucchiata } from '../src/systems/effettiArmi';

describe('effetti delle armi e delle armature', () => {
  it('risucchio: il 20% del danno inflitto, almeno 1', () => {
    expect(vitaRisucchiata(10)).toBe(2);
    expect(vitaRisucchiata(3)).toBe(1);
    expect(vitaRisucchiata(0)).toBe(0);
  });

  it('spine: il 30% del danno subito torna a chi colpisce, almeno 1', () => {
    expect(danniRimandati(10)).toBe(3);
    expect(danniRimandati(1)).toBe(1);
  });

  it('colpo critico doppio: il critico fa ×3 invece di ×2', () => {
    expect(moltiplicatoreCritico([])).toBe(2);
    expect(moltiplicatoreCritico(['colpo_critico_doppio'])).toBe(3);
    // Con casuali fissi: 0 = critico sicuro; 0.5 su 1d6 = 4.
    const dati = { dado: '1d6', modificatore: 0, bonus: 0, armatura: 0, probabilitaCritico: 1 };
    expect(calcolaDanno(dati, casualeFisso([0, 0.5])).danno).toBe(8);
    expect(calcolaDanno({ ...dati, moltiplicatoreCritico: 3 }, casualeFisso([0, 0.5])).danno).toBe(12);
  });

  it('rimbalzo: il nemico più vicino non ancora colpito, entro il raggio', () => {
    const candidati = [
      { id: 1, posizione: { x: 0, y: 0 } }, // quello appena colpito
      { id: 2, posizione: { x: 50, y: 0 } },
      { id: 3, posizione: { x: 30, y: 0 } },
      { id: 4, posizione: { x: 200, y: 0 } }, // troppo lontano
    ];
    expect(prossimoRimbalzo({ x: 0, y: 0 }, candidati, new Set([1]), 80)).toBe(3);
    expect(prossimoRimbalzo({ x: 0, y: 0 }, candidati, new Set([1, 3]), 80)).toBe(2);
    expect(prossimoRimbalzo({ x: 0, y: 0 }, candidati, new Set([1, 2, 3]), 80)).toBeNull();
  });

  it('dardo_diviso (Bastone della melma, fase 11b): divide il tiro in due direzioni simmetriche', () => {
    const [d1, d2] = direzioniDardoDiviso({ x: 1, y: 0 }, 20);
    expect(d1.x).toBeCloseTo(d2.x);
    expect(d1.y).toBeCloseTo(-d2.y);
    expect(d2.y).toBeGreaterThan(0);
  });

  it('esplosione (Balestra di zolfo, fase 12a): trova i nemici vicini al punto d’impatto escludendo il bersaglio diretto', () => {
    const candidati = [
      { id: 1, posizione: { x: 100, y: 100 } },
      { id: 2, posizione: { x: 120, y: 110 } },
      { id: 3, posizione: { x: 200, y: 200 } },
    ];
    expect(bersagliEsplosione({ x: 100, y: 100 }, candidati, 1, 36)).toEqual([2]);
  });
});

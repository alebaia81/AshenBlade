import { describe, expect, it } from 'vitest';
import { aggiornaRialzo, assorbiDanno, creaStatoCompagno, RIALZO_MS, subisciDanno } from '../src/systems/compagno';

describe('compagno: vita, al tappeto e rialzo', () => {
  it('perde vita e a zero va al tappeto', () => {
    let s = creaStatoCompagno(10);
    s = subisciDanno(s, 4);
    expect(s.vita.attuale).toBe(6);
    expect(s.alTappeto).toBe(false);
    s = subisciDanno(s, 9);
    expect(s.vita.attuale).toBe(0);
    expect(s.alTappeto).toBe(true);
  });

  it('al tappeto non subisce altro', () => {
    const s = subisciDanno(creaStatoCompagno(5), 5);
    expect(subisciDanno(s, 3)).toBe(s);
  });

  it('si rialza con metà vita dopo 3 secondi senza nemici in vista', () => {
    let s = subisciDanno(creaStatoCompagno(11), 11);
    s = aggiornaRialzo(s, false, 1000); // comincia a contare
    s = aggiornaRialzo(s, false, 1000 + RIALZO_MS - 1);
    expect(s.alTappeto).toBe(true);
    s = aggiornaRialzo(s, false, 1000 + RIALZO_MS);
    expect(s.alTappeto).toBe(false);
    expect(s.vita).toEqual({ attuale: 6, massima: 11 });
  });

  it('se un nemico torna in vista il conto riparte da capo', () => {
    let s = subisciDanno(creaStatoCompagno(10), 10);
    s = aggiornaRialzo(s, false, 0);
    s = aggiornaRialzo(s, true, 2000);
    s = aggiornaRialzo(s, false, 2500);
    s = aggiornaRialzo(s, false, 2500 + RIALZO_MS - 1);
    expect(s.alTappeto).toBe(true);
  });

  it('in piedi, il rialzo non cambia nulla', () => {
    const s = creaStatoCompagno(10);
    expect(aggiornaRialzo(s, false, 99999)).toBe(s);
  });
});

describe('protezioni dell’eroe (Corrado ed Elisa)', () => {
  it('parata di Corrado: il prossimo colpo non fa danno, poi la parata è finita', () => {
    expect(assorbiDanno({ tipo: 'parata' }, 7, 0)).toEqual({ danno: 0, assorbito: 7, protezione: null });
  });

  it('scudo di Elisa: assorbe fino a esaurirsi', () => {
    const scudo = { tipo: 'scudo' as const, resto: 10, fino: 8000 };
    expect(assorbiDanno(scudo, 4, 100)).toEqual({ danno: 0, assorbito: 4, protezione: { ...scudo, resto: 6 } });
    expect(assorbiDanno({ ...scudo, resto: 3 }, 5, 100)).toEqual({ danno: 2, assorbito: 3, protezione: null });
  });

  it('scudo scaduto: non assorbe più', () => {
    expect(assorbiDanno({ tipo: 'scudo', resto: 10, fino: 8000 }, 5, 8000)).toEqual({ danno: 5, assorbito: 0, protezione: null });
  });

  it('senza protezione il danno passa intero', () => {
    expect(assorbiDanno(null, 5, 0)).toEqual({ danno: 5, assorbito: 0, protezione: null });
  });
});

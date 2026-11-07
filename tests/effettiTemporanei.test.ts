import { describe, expect, it } from 'vitest';
import { aggiungiEffetto, attivi, bonus, danniDaTick, rimanente } from '../src/systems/effettiTemporanei';

describe('effetti a tempo', () => {
  it('un effetto dura il tempo previsto', () => {
    const e = aggiungiEffetto([], 'forza', 2, 60000, 1000);
    expect(bonus(e, 'forza', 1000)).toBe(2);
    expect(bonus(e, 'forza', 60999)).toBe(2);
    expect(bonus(e, 'forza', 61000)).toBe(0);
    expect(attivi(e, 61000)).toEqual([]);
  });

  it('lo stesso effetto non si somma: rinnova la durata e tiene il valore più alto', () => {
    let e = aggiungiEffetto([], 'forza', 2, 60000, 0);
    e = aggiungiEffetto(e, 'forza', 1, 60000, 30000);
    expect(e).toHaveLength(1);
    expect(bonus(e, 'forza', 80000)).toBe(2);
    expect(rimanente(e[0]!, 30000)).toBe(60000);
  });

  it('effetti diversi convivono', () => {
    let e = aggiungiEffetto([], 'forza', 2, 1000, 0);
    e = aggiungiEffetto(e, 'resistenza', 2, 1000, 0);
    expect(bonus(e, 'forza', 10)).toBe(2);
    expect(bonus(e, 'resistenza', 10)).toBe(2);
  });

  it('il fuoco fa danno una volta al secondo', () => {
    let e = aggiungiEffetto([], 'fuoco', 1, 3000, 0);
    let r = danniDaTick(e, 'fuoco', 500);
    expect(r.danni).toBe(0);
    r = danniDaTick(r.effetti, 'fuoco', 1000);
    expect(r.danni).toBe(1);
    r = danniDaTick(r.effetti, 'fuoco', 1500);
    expect(r.danni).toBe(0);
    // Un fotogramma lento che salta due secondi conta due colpi.
    r = danniDaTick(r.effetti, 'fuoco', 3000);
    expect(r.danni).toBe(2);
    e = r.effetti;
    expect(danniDaTick(e, 'fuoco', 9000).danni).toBe(0); // scaduto
  });
});

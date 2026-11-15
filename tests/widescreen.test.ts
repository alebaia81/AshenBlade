import { describe, expect, it } from 'vitest';
import { ALTEZZA_SCHERMO, LARGHEZZA_SCHERMO, calcolaLarghezzaGioco } from '../src/costanti';

describe('Widescreen Dinamico', () => {
  it('mantiene la larghezza base 960 per schermi 16:9 standard', () => {
    expect(calcolaLarghezzaGioco(1920, 1080)).toBe(LARGHEZZA_SCHERMO);
    expect(calcolaLarghezzaGioco(1280, 720)).toBe(LARGHEZZA_SCHERMO);
    expect(calcolaLarghezzaGioco(960, 540)).toBe(LARGHEZZA_SCHERMO);
  });

  it('mantiene la larghezza base per schermi 4:3 o portrait', () => {
    expect(calcolaLarghezzaGioco(1024, 768)).toBe(LARGHEZZA_SCHERMO);
    expect(calcolaLarghezzaGioco(390, 844)).toBe(LARGHEZZA_SCHERMO);
  });

  it('espande la larghezza proporzionalmente per smartphone widescreen 19.5:9 o 20:9', () => {
    // iPhone 13 / 14 / 15: 844 x 390 (landscape) -> aspect ~2.164
    const wIPhone = calcolaLarghezzaGioco(844, 390);
    expect(wIPhone).toBeGreaterThan(960);
    expect(wIPhone).toBe(Math.round(ALTEZZA_SCHERMO * (844 / 390))); // ~1169

    // Samsung Galaxy / modern Android: 2400 x 1080 (20:9 -> ~2.222)
    const wAndroid = calcolaLarghezzaGioco(2400, 1080);
    expect(wAndroid).toBeGreaterThan(1100);
    expect(wAndroid).toBe(1200); // 540 * (20/9) = 1200
  });

  it('limita la larghezza massima a 1350 per evitare visuali eccessivamente panoramiche', () => {
    const wUltra = calcolaLarghezzaGioco(3440, 1080); // 32:9 ultra-ultrawide
    expect(wUltra).toBe(1350);
  });
});


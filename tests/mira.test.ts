import { describe, expect, it } from 'vitest';
import { aPortata, aTiro, bersaglioProssimita, bersaglioSotto, direzioneVerso } from '../src/systems/mira';
import { grigliaDa } from './aiuti/griglia';

describe('direzioneVerso (4 direzioni)', () => {
  const da = { x: 100, y: 100 };

  it('sceglie l’asse dominante', () => {
    expect(direzioneVerso(da, { x: 150, y: 110 })).toBe('destra');
    expect(direzioneVerso(da, { x: 40, y: 90 })).toBe('sinistra');
    expect(direzioneVerso(da, { x: 110, y: 30 })).toBe('su');
    expect(direzioneVerso(da, { x: 95, y: 160 })).toBe('giu');
  });

  it('a 45° esatti vince l’orizzontale', () => {
    expect(direzioneVerso(da, { x: 130, y: 130 })).toBe('destra');
    expect(direzioneVerso(da, { x: 70, y: 70 })).toBe('sinistra');
  });

  it('stesso punto: giù', () => {
    expect(direzioneVerso(da, da)).toBe('giu');
  });
});

describe('aPortata', () => {
  const arma = { portata: 14, larghezza: 18 };
  // Eroe al centro (100,100), lato 12. A destra l'area va da x 106 a 120.

  it('un nemico appena oltre il bordo dell’area è a portata', () => {
    expect(aPortata({ x: 100, y: 100 }, 12, arma, { x: 115, y: 95, larghezza: 10, altezza: 10 })).toBe(true);
  });

  it('un nemico più lontano no', () => {
    expect(aPortata({ x: 100, y: 100 }, 12, arma, { x: 125, y: 95, larghezza: 10, altezza: 10 })).toBe(false);
  });

  it('funziona in tutte le direzioni', () => {
    expect(aPortata({ x: 100, y: 100 }, 12, arma, { x: 95, y: 75, larghezza: 10, altezza: 10 })).toBe(true); // sopra
    expect(aPortata({ x: 100, y: 100 }, 12, arma, { x: 80, y: 95, larghezza: 10, altezza: 10 })).toBe(true); // sinistra
  });
});

describe('bersaglioSotto (cosa c’è sotto il clic?)', () => {
  const bersagli = [
    { id: 1, rettangolo: { x: 0, y: 0, larghezza: 10, altezza: 10 } },
    { id: 2, rettangolo: { x: 50, y: 50, larghezza: 10, altezza: 10 } },
  ];

  it('trova il bersaglio cliccato', () => {
    expect(bersaglioSotto({ x: 55, y: 55 }, bersagli, 0)).toBe(2);
  });

  it('con un margine si può cliccare anche un po’ fuori (i nemici sono piccoli e si muovono)', () => {
    expect(bersaglioSotto({ x: 13, y: 5 }, bersagli, 4)).toBe(1);
    expect(bersaglioSotto({ x: 13, y: 5 }, bersagli, 0)).toBeNull();
  });

  it('niente sotto il clic: null', () => {
    expect(bersaglioSotto({ x: 30, y: 30 }, bersagli, 4)).toBeNull();
  });

  it('se due si sovrappongono vince quello col centro più vicino', () => {
    const vicini = [
      { id: 'a', rettangolo: { x: 0, y: 0, larghezza: 20, altezza: 20 } },
      { id: 'b', rettangolo: { x: 10, y: 0, larghezza: 20, altezza: 20 } },
    ];
    expect(bersaglioSotto({ x: 18, y: 10 }, vicini, 0)).toBe('b');
  });
});

describe('aTiro (armi a distanza)', () => {
  const g = grigliaDa([
    '..........',
    '....#.....',
    '..........',
  ]);

  it('entro la gittata e con la linea libera: sì', () => {
    expect(aTiro(g, { x: 8, y: 8 }, { x: 120, y: 8 }, 150, 16)).toBe(true);
  });

  it('troppo lontano: no (si tiene un margine del 15%)', () => {
    expect(aTiro(g, { x: 8, y: 8 }, { x: 140, y: 8 }, 150, 16)).toBe(false);
  });

  it('con un muro in mezzo: no', () => {
    expect(aTiro(g, { x: 8, y: 24 }, { x: 120, y: 24 }, 150, 16)).toBe(false);
  });

  it('calcola esattamente la soglia utile di gittata (85%)', () => {
    // Gittata 100 -> soglia utile = 85 px
    expect(aTiro(g, { x: 8, y: 8 }, { x: 8 + 84, y: 8 }, 100, 16)).toBe(true);
    expect(aTiro(g, { x: 8, y: 8 }, { x: 8 + 86, y: 8 }, 100, 16)).toBe(false);
  });

  it('in diagonale verifica sia distanza euclidea che linea di vista', () => {
    // Distanza ~70.7 px <= 85 px
    expect(aTiro(g, { x: 8, y: 8 }, { x: 8 + 50, y: 8 + 20 }, 100, 16)).toBe(true);
    // Distanza ~108 px > 85 px
    expect(aTiro(g, { x: 8, y: 8 }, { x: 8 + 80, y: 8 + 70 }, 100, 16)).toBe(false);
  });
});

describe('bersaglioProssimita (Smart Proximity Targeting r <= 2.0)', () => {
  const eroe = { x: 100, y: 100 };
  const bersagli = [
    { id: 'nemico_A', posizione: { x: 120, y: 100 } }, // a 20 px a destra
    { id: 'nemico_B', posizione: { x: 100, y: 125 } }, // a 25 px in basso
    { id: 'nemico_Lontano', posizione: { x: 180, y: 100 } }, // a 80 px (fuori raggio)
  ];

  it('se il clic è entro raggio 2 tessere (32 px) aggancia il nemico più vicino al punto cliccato', () => {
    // Clic a terra vicino a nemico A: aggancia nemico A
    expect(bersaglioProssimita(eroe, { x: 115, y: 105 }, 32, 40, bersagli)).toBe('nemico_A');
    // Clic a terra vicino a nemico B: aggancia nemico B
    expect(bersaglioProssimita(eroe, { x: 105, y: 120 }, 32, 40, bersagli)).toBe('nemico_B');
  });

  it('se il clic è oltre il raggio di prossimità (> 32 px) non aggancia (movimento a terra)', () => {
    expect(bersaglioProssimita(eroe, { x: 140, y: 100 }, 32, 40, bersagli)).toBeNull();
  });

  it('ignora i nemici fuori dalla portata massima dall’eroe', () => {
    const soliLontani = [{ id: 'nemico_Lontano', posizione: { x: 180, y: 100 } }];
    expect(bersaglioProssimita(eroe, { x: 120, y: 100 }, 32, 40, soliLontani)).toBeNull();
  });
});

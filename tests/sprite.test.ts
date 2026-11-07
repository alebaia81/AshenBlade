import { describe, expect, it } from 'vitest';
import {
  guardaASinistra,
  risolvi,
  risolviStrato,
  saltello,
  stratiDi,
  validaSprite,
  type DatiSprite,
  type Immagine,
  type Richiesti,
} from '../src/systems/sprite';

const riga = (c: string) => c.repeat(16);
const immagini: Record<string, Immagine> = {
  erba: { foglio: 'citta', indice: 0 },
  melma: { foglio: 'dungeon', indice: 108 },
  quadrato: { disegno: Array.from({ length: 16 }, () => riga('x')), tavolozza: { x: '#ff0000' } },
};

describe('risolvi', () => {
  it('un nome diventa foglio + numero della tessera, senza tinta', () => {
    expect(risolvi('melma', immagini)).toEqual({ chiave: 'dungeon', fotogramma: 108, tinta: 0xffffff, alfa: 1 });
  });

  it('con tinta e trasparenza', () => {
    expect(risolvi({ immagine: 'melma', tinta: '#6060a0', alfa: 0.5 }, immagini)).toEqual({ chiave: 'dungeon', fotogramma: 108, tinta: 0x6060a0, alfa: 0.5 });
  });

  it('un disegno a caratteri ha una texture tutta sua', () => {
    expect(risolvi('quadrato', immagini)).toEqual({ chiave: 'disegno:quadrato', tinta: 0xffffff, alfa: 1 });
  });

  it('un nome sconosciuto è un errore chiaro', () => {
    expect(() => risolvi('drago', immagini)).toThrow(/drago/);
  });
});

describe('strati delle tessere', () => {
  it('"#3a6ea5" è un colore pieno, il resto un\'immagine', () => {
    expect(risolviStrato('#3a6ea5', immagini)).toEqual({ colore: 0x3a6ea5 });
    expect(risolviStrato('erba', immagini)).toMatchObject({ chiave: 'citta', fotogramma: 0 });
  });

  it('uno strato solo o un elenco, dal basso verso l\'alto', () => {
    expect(stratiDi('erba', immagini)).toHaveLength(1);
    expect(stratiDi(['erba', 'melma'], immagini).map((s) => ('chiave' in s ? s.chiave : '?'))).toEqual(['citta', 'dungeon']);
  });
});

describe('camminata simulata', () => {
  it('ferma: nessun saltello', () => {
    expect(saltello(1234, false)).toBe(0);
  });

  it('in movimento: si alza e torna giù a ogni passo, mai sotto zero', () => {
    const valori = Array.from({ length: 33 }, (_, i) => saltello(i * 10, true, 320, 1.5));
    expect(Math.min(...valori)).toBeCloseTo(-1.5, 1);
    expect(Math.max(...valori)).toBeLessThanOrEqual(0);
    expect(saltello(0, true, 320, 1.5)).toBeCloseTo(0);
    expect(saltello(160, true, 320, 1.5)).toBeCloseTo(-1.5);
  });

  it('a sinistra si ribalta, a destra no; fermo tiene il verso di prima', () => {
    expect(guardaASinistra(false, -40)).toBe(true);
    expect(guardaASinistra(true, 40)).toBe(false);
    expect(guardaASinistra(true, 0)).toBe(true);
    expect(guardaASinistra(false, 2)).toBe(false);
  });
});

describe('validaSprite', () => {
  const base: DatiSprite = {
    immagini,
    classi: { guerriero: 'erba' },
    compagni: {},
    abitanti: {},
    nemici: { slime: 'melma' },
    oggetti: {},
    vene: {},
  };
  const richiesti: Richiesti = { classi: ['guerriero'], compagni: [], abitanti: [], nemici: ['slime'], vene: [], tessere: { 'borgo/.': 'erba' } };

  it('dati coerenti: nessun errore', () => {
    expect(validaSprite(base, richiesti)).toEqual([]);
  });

  it('un nemico senza aspetto', () => {
    expect(validaSprite(base, { ...richiesti, nemici: ['slime', 'drago'] })).toEqual([`sprite.json: manca l'aspetto di nemici "drago"`]);
  });

  it('un aspetto che cita un\'immagine inesistente', () => {
    expect(validaSprite({ ...base, nemici: { slime: 'gelatina' } }, richiesti)[0]).toMatch(/gelatina/);
  });

  it('indice fuori dal foglio', () => {
    expect(validaSprite({ ...base, immagini: { ...immagini, troppo: { foglio: 'citta', indice: 132 } } }, richiesti)[0]).toMatch(/fuori dal foglio/);
  });

  it('disegno della misura sbagliata o con caratteri senza colore', () => {
    const storto = { disegno: ['xx'], tavolozza: { x: '#ffffff' } };
    const senzaColore = { disegno: Array.from({ length: 16 }, () => riga('y')), tavolozza: {} };
    const errori = validaSprite({ ...base, immagini: { ...immagini, storto, senzaColore } }, richiesti);
    expect(errori.some((e) => /16 righe/.test(e))).toBe(true);
    expect(errori.some((e) => /senza colore/.test(e))).toBe(true);
  });

  it('una cella della mappa senza tessera, o con un colore sbagliato', () => {
    const errori = validaSprite(base, { ...richiesti, tessere: { 'borgo/#': undefined, 'borgo/~': ['#zzzzzz'] } });
    expect(errori).toEqual(['borgo/#: manca "tessera"', 'borgo/~: colore "#zzzzzz" non valido']);
  });

  it('tinta non valida', () => {
    expect(validaSprite({ ...base, nemici: { slime: { immagine: 'melma', tinta: 'blu' } } }, richiesti)[0]).toMatch(/tinta/);
  });
});

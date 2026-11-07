import { describe, expect, it } from 'vitest';
import { caricaDati } from '../src/data/caricaDati';
import { grigliaDellaMappa } from '../src/systems/mappa';
import {
  cellaRaggiungibilePiuVicina,
  liberoTra,
  lisciaPercorso,
  trovaPercorso,
  type Griglia,
} from '../src/systems/percorso';
import type { Cella } from '../src/systems/tipi';
import { grigliaDa } from './aiuti/griglia';

/** Ogni passo del percorso è verso una cella vicina (anche in diagonale) e calpestabile. */
function passiValidi(g: Griglia, da: Cella, percorso: Cella[]): boolean {
  let prima = da;
  for (const c of percorso) {
    if (!g.calpestabile(c.col, c.riga)) return false;
    if (Math.max(Math.abs(c.col - prima.col), Math.abs(c.riga - prima.riga)) !== 1) return false;
    prima = c;
  }
  return true;
}

describe('trovaPercorso (A*)', () => {
  it('in campo aperto va dritto', () => {
    const g = grigliaDa(['.......', '.......', '.......']);
    const p = trovaPercorso(g, { col: 1, riga: 1 }, { col: 5, riga: 1 })!;
    expect(p).toEqual([2, 3, 4, 5].map((col) => ({ col, riga: 1 })));
  });

  it('partenza e arrivo uguali: percorso vuoto', () => {
    const g = grigliaDa(['...']);
    expect(trovaPercorso(g, { col: 1, riga: 0 }, { col: 1, riga: 0 })).toEqual([]);
  });

  it('aggira un muro passando dal varco', () => {
    const g = grigliaDa([
      '...#...',
      '...#...',
      '...#...',
      '.......', // varco nella riga 3
    ]);
    const da = { col: 1, riga: 0 };
    const p = trovaPercorso(g, da, { col: 5, riga: 0 })!;
    expect(passiValidi(g, da, p)).toBe(true);
    expect(p).toContainEqual({ col: 3, riga: 3 });
    expect(p.at(-1)).toEqual({ col: 5, riga: 0 });
  });

  it('usa le diagonali quando conviene', () => {
    const g = grigliaDa(['.....', '.....', '.....', '.....', '.....']);
    expect(trovaPercorso(g, { col: 0, riga: 0 }, { col: 4, riga: 4 })).toHaveLength(4);
  });

  it('non taglia gli angoli tra due muri', () => {
    const g = grigliaDa([
      '....',
      '..#.',
      '.#..',
      '....',
    ]);
    const da = { col: 1, riga: 1 };
    const p = trovaPercorso(g, da, { col: 2, riga: 2 })!;
    // In diagonale si passerebbe "nella fessura" tra (2,1) e (1,2): non è permesso.
    expect(p.length).toBeGreaterThan(1);
    let prima = da;
    for (const c of p) {
      const diagonale = c.col !== prima.col && c.riga !== prima.riga;
      if (diagonale) {
        expect(g.calpestabile(c.col, prima.riga) && g.calpestabile(prima.col, c.riga)).toBe(true);
      }
      prima = c;
    }
  });

  it('restituisce null se la destinazione è chiusa', () => {
    const g = grigliaDa([
      '.....',
      '..#..',
      '.#.#.',
      '..#..',
    ]);
    expect(trovaPercorso(g, { col: 0, riga: 0 }, { col: 2, riga: 2 })).toBeNull();
  });

  it('restituisce null se la destinazione è un muro', () => {
    const g = grigliaDa(['..#..']);
    expect(trovaPercorso(g, { col: 0, riga: 0 }, { col: 2, riga: 0 })).toBeNull();
  });
});

describe('cellaRaggiungibilePiuVicina', () => {
  it('un clic dentro un muro porta alla cella libera più vicina', () => {
    const g = grigliaDa([
      '.......',
      '..###..',
      '..###..',
      '..###..',
    ]);
    expect(cellaRaggiungibilePiuVicina(g, { col: 0, riga: 0 }, { col: 3, riga: 1 })).toEqual({ col: 3, riga: 0 });
  });

  it('una zona chiusa non è raggiungibile: si sceglie il punto più vicino fuori', () => {
    const g = grigliaDa([
      '.....',
      '.###.',
      '.#.#.',
      '.###.',
    ]);
    const c = cellaRaggiungibilePiuVicina(g, { col: 0, riga: 0 }, { col: 2, riga: 2 })!;
    expect(g.calpestabile(c.col, c.riga)).toBe(true);
    expect(c).not.toEqual({ col: 2, riga: 2 }); // dentro il recinto non si arriva
  });

  it('se la destinazione è già raggiungibile la restituisce', () => {
    const g = grigliaDa(['....']);
    expect(cellaRaggiungibilePiuVicina(g, { col: 0, riga: 0 }, { col: 3, riga: 0 })).toEqual({ col: 3, riga: 0 });
  });
});

describe('liberoTra (c’è spazio per passare dritti?)', () => {
  // Tessere da 16 px, eroe largo 12: mezzo lato 6.
  const g = grigliaDa([
    '......',
    '..#...',
    '......',
  ]);

  it('in campo aperto sì', () => {
    expect(liberoTra(g, { x: 8, y: 8 }, { x: 88, y: 8 }, 6, 16)).toBe(true);
  });

  it('attraverso un muro no', () => {
    expect(liberoTra(g, { x: 8, y: 24 }, { x: 88, y: 24 }, 6, 16)).toBe(false);
  });

  it('rasente a un muro no, perché l’eroe ha una larghezza', () => {
    // Il muro occupa y 16–32. La linea dei centri (y = 12) passa fuori dal muro,
    // ma il corpo dell'eroe va da y 6 a y 18 e lo toccherebbe.
    expect(liberoTra(g, { x: 8, y: 12 }, { x: 88, y: 12 }, 6, 16)).toBe(false);
    // Due pixel più in alto il corpo (y 4–16) passa giusto giusto.
    expect(liberoTra(g, { x: 8, y: 10 }, { x: 88, y: 10 }, 6, 16)).toBe(true);
  });
});

describe('lisciaPercorso', () => {
  it('in campo aperto un percorso a gomito diventa una linea sola', () => {
    const g = grigliaDa(['......', '......', '......']);
    const punti = [
      { x: 24, y: 8 },
      { x: 40, y: 8 },
      { x: 40, y: 24 },
      { x: 40, y: 40 },
    ];
    expect(lisciaPercorso(g, { x: 8, y: 8 }, punti, 6, 16)).toEqual([{ x: 40, y: 40 }]);
  });

  it('attorno a un muro tiene il punto d’angolo', () => {
    const g = grigliaDa([
      '..#...',
      '..#...',
      '......',
    ]);
    const da = { col: 0, riga: 0 };
    const celle = trovaPercorso(g, da, { col: 4, riga: 0 })!;
    const punti = celle.map((c) => ({ x: c.col * 16 + 8, y: c.riga * 16 + 8 }));
    const lisciato = lisciaPercorso(g, { x: 8, y: 8 }, punti, 6, 16);
    expect(lisciato.length).toBeGreaterThan(1);
    expect(lisciato.length).toBeLessThan(punti.length);
    expect(lisciato.at(-1)).toEqual({ x: 4 * 16 + 8, y: 8 });
    // Ogni tratto del percorso lisciato è percorribile.
    let prima = { x: 8, y: 8 };
    for (const p of lisciato) {
      expect(liberoTra(g, prima, p, 6, 16)).toBe(true);
      prima = p;
    }
  });
});

describe('sulle mappe vere', () => {
  const { mappe } = caricaDati();

  it('dalla partenza della Radura all’uscita passando dal varco del muro di pietra', () => {
    const g = grigliaDellaMappa(mappe['radura']!);
    const p = trovaPercorso(g, { col: 4, riga: 4 }, { col: 38, riga: 12 })!;
    expect(p).not.toBeNull();
    expect(p).toContainEqual({ col: 26, riga: 12 }); // il varco
  });

  it('cento percorsi casuali si calcolano in fretta', () => {
    const g = grigliaDellaMappa(mappe['bosco']!);
    const libere: Cella[] = [];
    for (let riga = 0; riga < g.altezza; riga++) {
      for (let col = 0; col < g.larghezza; col++) if (g.calpestabile(col, riga)) libere.push({ col, riga });
    }
    let seme = 7;
    const caso = () => libere[(seme = (seme * 9301 + 49297) % 233280) % libere.length]!;
    const inizio = performance.now();
    for (let i = 0; i < 100; i++) trovaPercorso(g, caso(), caso());
    expect(performance.now() - inizio).toBeLessThan(1000);
  });
});

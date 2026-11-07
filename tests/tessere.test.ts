import { describe, expect, it } from 'vitest';
import { analizzaMappa } from '../src/systems/mappa';
import { preparaTessere } from '../src/systems/tessere';

const mappa = analizzaMappa({
  id: 'prova',
  nome: 'Prova',
  legenda: {
    '#': { tipo: 'muro', colore: '#112233' },
    '.': { tipo: 'pavimento', colore: '#00ff00' },
    '@': { tipo: 'partenza' },
    '1': { tipo: 'uscita', verso: 'altra', arrivo: 'a' },
  },
  griglia: ['####', '#@.1', '####'],
});

describe('preparaTessere', () => {
  const tessere = preparaTessere(mappa);

  // Comodo nei test: il numero di tessera di un simbolo.
  const n = (simbolo: string) => tessere.simboli.indexOf(simbolo);

  it('assegna un indice diverso a ogni simbolo della legenda', () => {
    expect([...tessere.simboli].sort()).toEqual(['#', '.', '1', '@']);
  });

  it('la griglia di indici ha le stesse dimensioni della mappa', () => {
    expect(tessere.indici).toHaveLength(3);
    expect(tessere.indici.every((riga) => riga.length === 4)).toBe(true);
  });

  it('ogni cella contiene l’indice del suo simbolo', () => {
    expect(tessere.indici[0]).toEqual([n('#'), n('#'), n('#'), n('#')]);
    expect(tessere.indici[1]).toEqual([n('#'), n('@'), n('.'), n('1')]);
  });

  it('solo i muri sono solidi', () => {
    expect(tessere.solide).toEqual([n('#')]);
  });

  it('usa i colori della legenda, o quelli predefiniti se mancano', () => {
    expect(tessere.colori[n('#')]).toBe('#112233');
    expect(tessere.colori[n('.')]).toBe('#00ff00');
    expect(tessere.colori[n('@')]).toMatch(/^#[0-9a-f]{6}$/i); // partenza senza colore
    expect(tessere.colori).toHaveLength(4);
  });
});

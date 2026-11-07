import { describe, expect, it } from 'vitest';
import { analizzaMappa } from '../src/systems/mappa';
import { validaMondo } from '../src/systems/mondo';
import type { Mappa } from '../src/systems/tipi';

// Due mappe collegate: l'uscita 1 di "nord" porta all'arrivo "a" di "sud"
// e l'uscita 2 di "sud" porta all'arrivo "b" di "nord".
function creaMondo(): Record<string, Mappa> {
  const nord = analizzaMappa({
    id: 'nord',
    nome: 'Nord',
    legenda: {
      '#': { tipo: 'muro' },
      '.': { tipo: 'pavimento' },
      '@': { tipo: 'partenza' },
      b: { tipo: 'arrivo' },
      '1': { tipo: 'uscita', verso: 'sud', arrivo: 'a' },
      S: { tipo: 'nemico', nemico: 'slime' },
    },
    griglia: ['######', '#@b1S#', '######'],
  });
  const sud = analizzaMappa({
    id: 'sud',
    nome: 'Sud',
    legenda: {
      '#': { tipo: 'muro' },
      '.': { tipo: 'pavimento' },
      a: { tipo: 'arrivo' },
      '2': { tipo: 'uscita', verso: 'nord', arrivo: 'b' },
    },
    griglia: ['#####', '#2a.#', '#####'],
  });
  return { nord, sud };
}

describe('validaMondo', () => {
  it('un mondo corretto non ha errori', () => {
    expect(validaMondo(creaMondo(), 'nord', ['slime'], ['pozione_vita'])).toEqual([]);
  });

  it('segnala una mappa iniziale inesistente', () => {
    const errori = validaMondo(creaMondo(), 'ovest', ['slime'], []);
    expect(errori.join('\n')).toMatch(/ovest/);
  });

  it('segnala una mappa iniziale senza partenza', () => {
    const errori = validaMondo(creaMondo(), 'sud', ['slime'], []);
    expect(errori.join('\n')).toMatch(/partenza/);
  });

  it('segnala un’uscita verso una mappa inesistente', () => {
    const mondo = creaMondo();
    delete mondo['sud'];
    const errori = validaMondo(mondo, 'nord', ['slime'], []);
    expect(errori.join('\n')).toMatch(/"sud"/);
  });

  it('segnala un arrivo mancante nella mappa di destinazione', () => {
    const mondo = creaMondo();
    const nord = mondo['nord']!;
    nord.legenda['1'] = { tipo: 'uscita', verso: 'sud', arrivo: 'z' };
    const errori = validaMondo(mondo, 'nord', ['slime'], []);
    expect(errori.join('\n')).toMatch(/arrivo "z"/);
  });

  it('segnala un arrivo che nella destinazione non è di tipo arrivo', () => {
    const mondo = creaMondo();
    mondo['nord']!.legenda['1'] = { tipo: 'uscita', verso: 'sud', arrivo: '2' };
    const errori = validaMondo(mondo, 'nord', ['slime'], []);
    expect(errori.join('\n')).toMatch(/non è un punto d'arrivo/);
  });

  it('segnala un nemico che non esiste nei dati dei nemici', () => {
    const errori = validaMondo(creaMondo(), 'nord', ['lupo'], []);
    expect(errori.join('\n')).toMatch(/nemico "slime"/);
  });

  it('segnala un oggetto nel forziere che non esiste nei dati', () => {
    const mondo = creaMondo();
    const nord = mondo['nord']!;
    nord.legenda['X'] = { tipo: 'forziere', contenuto: ['spada_inventata'] };
    nord.simboli[1]![2] = 'X';
    const errori = validaMondo(mondo, 'nord', ['slime'], ['pozione_vita']);
    expect(errori.join('\n')).toMatch(/"spada_inventata"/);
  });
});

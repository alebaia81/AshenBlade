import { describe, expect, it } from 'vitest';
import { applicaCondizioni, validaCondizioni } from '../src/systems/condizioniMappa';
import { analizzaMappa } from '../src/systems/mappa';

const colline = analizzaMappa({
  id: 'colline',
  nome: 'Colline',
  legenda: {
    '.': { tipo: 'pavimento' },
    F: { tipo: 'cartello', aspetto: 'frana', testo: 'Una frana.', cambiaCon: { quest: 'atto1', stato: 'conclusa' }, diventa: '.' },
    Q: { tipo: 'muro', colore: '#2f5a24', cambiaCon: { boss: 'troll' }, diventa: 'q' },
    q: { tipo: 'muro', colore: '#4a4a2a' },
  },
  griglia: ['.F.Q'],
});

describe('celle che cambiano con la storia (fase 8b)', () => {
  it('finché la condizione è falsa la mappa resta com’è (lo stesso oggetto)', () => {
    expect(applicaCondizioni(colline, () => false)).toBe(colline);
  });

  it('quando è vera, il simbolo diventa un altro: la frana sparisce, la quercia cambia colore', () => {
    const dopo = applicaCondizioni(colline, (c) => c.quest === 'atto1' || c.boss === 'troll');
    expect(dopo.simboli[0]!.join('')).toBe('...q');
    expect(colline.simboli[0]!.join('')).toBe('.F.Q'); // l'originale non si tocca
    const soloFrana = applicaCondizioni(colline, (c) => c.quest === 'atto1');
    expect(soloFrana.simboli[0]!.join('')).toBe('...Q');
  });

  it('validazione: "diventa" deve esistere in legenda, e serve una quest o un boss', () => {
    expect(validaCondizioni(colline)).toEqual([]);
    const rotta = analizzaMappa({
      id: 'x',
      nome: 'x',
      legenda: { '.': { tipo: 'pavimento' }, F: { tipo: 'muro', cambiaCon: {}, diventa: 'Z' } },
      griglia: ['.F'],
    });
    const errori = validaCondizioni(rotta).join('\n');
    expect(errori).toContain('"Z"');
    expect(errori).toContain('quest');
  });
});

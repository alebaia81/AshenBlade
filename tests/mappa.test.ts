import { describe, expect, it } from 'vitest';
import {
  analizzaMappa,
  celleAbitante,
  celleCartello,
  celleForziere,
  celleNemico,
  celleSegrete,
  èCalpestabile,
  grigliaDellaMappa,
  puntoIngressoPredefinito,
  trovaPunto,
  uscitaIn,
} from '../src/systems/mappa';
import type { DefinizioneMappa } from '../src/systems/tipi';

// Una mappa minuscola, scritta qui per i test: così il test non dipende
// dai dati veri del gioco, che cambieranno spesso.
const definizione = (griglia: string[]): DefinizioneMappa => ({
  id: 'prova',
  nome: 'Mappa di prova',
  legenda: {
    '#': { tipo: 'muro', colore: '#000000' },
    '.': { tipo: 'pavimento', colore: '#00ff00' },
    '@': { tipo: 'partenza' },
    a: { tipo: 'arrivo' },
    '1': { tipo: 'uscita', verso: 'altra', arrivo: 'b' },
    S: { tipo: 'nemico', nemico: 'slime' },
    X: { tipo: 'forziere', contenuto: ['pozione_vita'] },
  },
  griglia,
});

const base = ['#####', '#@.a#', '#.S1#', '#####'];

describe('analizzaMappa', () => {
  it('calcola larghezza e altezza', () => {
    const mappa = analizzaMappa(definizione(base));
    expect(mappa.larghezza).toBe(5);
    expect(mappa.altezza).toBe(4);
    expect(mappa.id).toBe('prova');
    expect(mappa.nome).toBe('Mappa di prova');
  });

  it('segnala righe di lunghezza diversa indicando la riga', () => {
    expect(() => analizzaMappa(definizione(['#####', '#..#', '#####']))).toThrow(/riga 2/);
  });

  it('segnala un simbolo assente dalla legenda con riga e colonna', () => {
    expect(() => analizzaMappa(definizione(['###', '#Q#', '###']))).toThrow(
      /"Q".*riga 2, colonna 2/,
    );
  });

  it('segnala una griglia vuota', () => {
    expect(() => analizzaMappa(definizione([]))).toThrow(/vuota/);
  });

  it('segnala più di una partenza', () => {
    expect(() => analizzaMappa(definizione(['####', '#@@#', '####']))).toThrow(/partenza/);
  });

  it('segnala un’uscita senza destinazione', () => {
    const def = definizione(base);
    def.legenda['1'] = { tipo: 'uscita' };
    expect(() => analizzaMappa(def)).toThrow(/uscita "1"/);
  });

  it('segnala un nemico senza id', () => {
    const def = definizione(base);
    def.legenda['S'] = { tipo: 'nemico' };
    expect(() => analizzaMappa(def)).toThrow(/nemico "S"/);
  });

  it('segnala un forziere senza contenuto', () => {
    const def = definizione(base);
    def.legenda['X'] = { tipo: 'forziere' };
    expect(() => analizzaMappa(def)).toThrow(/forziere "X"/);
  });

  it('segnala un tipo sconosciuto in legenda', () => {
    const def = definizione(base);
    // Simuliamo un errore di battitura nel JSON.
    def.legenda['.'] = { tipo: 'pavimeto' as never };
    expect(() => analizzaMappa(def)).toThrow(/pavimeto/);
  });
});

describe('domande sulla griglia', () => {
  const mappa = analizzaMappa(definizione(base));

  it('i muri non sono calpestabili', () => {
    expect(èCalpestabile(mappa, 0, 0)).toBe(false);
  });

  it('pavimento, partenza, arrivo e uscita sono calpestabili', () => {
    expect(èCalpestabile(mappa, 2, 1)).toBe(true); // pavimento
    expect(èCalpestabile(mappa, 1, 1)).toBe(true); // partenza
    expect(èCalpestabile(mappa, 3, 1)).toBe(true); // arrivo
    expect(èCalpestabile(mappa, 3, 2)).toBe(true); // uscita
    expect(èCalpestabile(mappa, 2, 2)).toBe(true); // nemico (sotto c'è pavimento)
  });

  it('fuori dalla mappa non si cammina', () => {
    expect(èCalpestabile(mappa, -1, 0)).toBe(false);
    expect(èCalpestabile(mappa, 5, 0)).toBe(false);
    expect(èCalpestabile(mappa, 0, 4)).toBe(false);
  });

  it('trovaPunto trova partenza e arrivi', () => {
    expect(trovaPunto(mappa, '@')).toEqual({ col: 1, riga: 1 });
    expect(trovaPunto(mappa, 'a')).toEqual({ col: 3, riga: 1 });
    expect(trovaPunto(mappa, 'z')).toBeUndefined();
  });

  it('uscitaIn restituisce la destinazione solo sulle uscite', () => {
    expect(uscitaIn(mappa, 3, 2)).toEqual({ verso: 'altra', arrivo: 'b' });
    expect(uscitaIn(mappa, 2, 1)).toBeUndefined();
    expect(uscitaIn(mappa, 99, 99)).toBeUndefined();
  });

  it('celleNemico elenca dove nascono i nemici e quali', () => {
    expect(celleNemico(mappa)).toEqual([{ cella: { col: 2, riga: 2 }, idNemico: 'slime' }]);
  });

  it('il punto di ingresso predefinito è la partenza, se c’è', () => {
    expect(puntoIngressoPredefinito(mappa)).toBe('@');
  });

  it('senza partenza è il primo punto d’arrivo', () => {
    const senza = analizzaMappa(definizione(['#####', '#.a.#', '#####']));
    expect(puntoIngressoPredefinito(senza)).toBe('a');
  });

  it('i forzieri non si attraversano e si trovano con il loro contenuto', () => {
    const m = analizzaMappa(definizione(['#####', '#@X.#', '#####']));
    expect(èCalpestabile(m, 2, 1)).toBe(false);
    expect(celleForziere(m)).toEqual([{ cella: { col: 2, riga: 1 }, contenuto: ['pozione_vita'], monete: 0 }]);
  });
});

describe('muri segreti', () => {
  const mappa = analizzaMappa({
    id: 'segreti',
    nome: 'Segreti',
    legenda: {
      '#': { tipo: 'muro' },
      '.': { tipo: 'pavimento' },
      M: { tipo: 'segreto' },
    },
    griglia: ['#####', '#.M.#', '#####'],
  });

  it('si trovano e, chiusi, non si attraversano', () => {
    expect(celleSegrete(mappa)).toEqual([{ col: 2, riga: 1 }]);
    expect(èCalpestabile(mappa, 2, 1)).toBe(false);
  });

  it('la griglia del percorso li considera aperti se la scena lo dice', () => {
    expect(grigliaDellaMappa(mappa).calpestabile(2, 1)).toBe(false);
    expect(grigliaDellaMappa(mappa, (c, r) => c === 2 && r === 1).calpestabile(2, 1)).toBe(true);
  });
});

describe('abitanti e monete nei forzieri', () => {
  const mappa = analizzaMappa({
    id: 'villaggio',
    nome: 'Villaggio',
    legenda: {
      '#': { tipo: 'muro' },
      '.': { tipo: 'pavimento' },
      G: { tipo: 'abitante', abitante: 'gemma' },
      X: { tipo: 'forziere', contenuto: [], monete: 25 },
    },
    griglia: ['#####', '#.GX#', '#####'],
  });

  it('le persone si trovano e non si attraversano', () => {
    expect(celleAbitante(mappa)).toEqual([{ cella: { col: 2, riga: 1 }, idAbitante: 'gemma' }]);
    expect(èCalpestabile(mappa, 2, 1)).toBe(false);
  });

  it('un forziere può contenere monete', () => {
    expect(celleForziere(mappa)[0]!.monete).toBe(25);
  });

  it('un abitante senza "abitante" in legenda è un errore chiaro', () => {
    expect(() =>
      analizzaMappa({ id: 'x', nome: 'x', legenda: { '.': { tipo: 'pavimento' }, G: { tipo: 'abitante' } }, griglia: ['.G'] }),
    ).toThrow(/deve indicare chi è/);
  });
});

describe('cartelli, cancelli e frane (fase 7b)', () => {
  const mappa = analizzaMappa({
    id: 'colle',
    nome: 'Colle',
    legenda: {
      '.': { tipo: 'pavimento' },
      C: { tipo: 'cartello', aspetto: 'cancello', testo: 'Sbarrato.', oggetto: 'chiave', testoConOggetto: 'La chiave gira, ma…' },
      F: { tipo: 'cartello', aspetto: 'frana', testo: 'Una frana.' },
    },
    griglia: ['.C.F'],
  });

  it('si trovano, con il testo e l’oggetto che cambia il testo; non si attraversano', () => {
    expect(celleCartello(mappa)).toEqual([
      { cella: { col: 1, riga: 0 }, aspetto: 'cancello', testo: 'Sbarrato.', oggetto: 'chiave', testoConOggetto: 'La chiave gira, ma…' },
      { cella: { col: 3, riga: 0 }, aspetto: 'frana', testo: 'Una frana.' },
    ]);
    expect(èCalpestabile(mappa, 1, 0)).toBe(false);
  });

  it('un cartello senza testo o con un aspetto sconosciuto è un errore chiaro', () => {
    expect(() => analizzaMappa({ id: 'x', nome: 'x', legenda: { C: { tipo: 'cartello', aspetto: 'cartello' } }, griglia: ['C'] })).toThrow(/testo/);
    expect(() => analizzaMappa({ id: 'x', nome: 'x', legenda: { C: { tipo: 'cartello', aspetto: 'roccia', testo: 'x' } }, griglia: ['C'] })).toThrow(/aspetto/);
  });
});

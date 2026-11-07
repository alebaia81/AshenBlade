import { describe, expect, it } from 'vitest';
import { creaEquipaggiamento } from '../src/systems/equipaggiamento';
import { creaInventario, type Inventario } from '../src/systems/inventario';
import { creaPreferiti } from '../src/systems/preferiti';
import { costoPotenziamento, idPotenziato, livelloDi, MASSIMO_POTENZIAMENTO, potenzia, type TabellaPotenziamenti } from '../src/systems/potenziamento';

const tabella: TabellaPotenziamenti = {
  livelli: [
    { livello: 1, materiali: { ferro: 1 }, monete: 10 },
    { livello: 2, materiali: { ferro: 2, carbone: 1 }, monete: 20 },
    { livello: 3, materiali: { ferro: 3 }, monete: 40 },
    { livello: 4, materiali: { cristallo: 1 }, monete: 80 },
    { livello: 5, materiali: { cristallo: 2 }, monete: 160 },
  ],
  moltiplicatoreRarita: { comune: 1, non_comune: 1.5, rara: 2, leggendaria: 3, esotica: 4 },
};

function zaino(...pile: [string, number][]): Inventario {
  const inv = creaInventario(6);
  pile.forEach(([id, quantita], i) => (inv.spazi[i] = { id, quantita }));
  return inv;
}

describe('id delle armi potenziate', () => {
  it('da "spada" a "spada+1" … "spada+5", e ritorno', () => {
    expect(idPotenziato('spada', 0)).toBe('spada');
    expect(idPotenziato('spada', 3)).toBe('spada+3');
    expect(livelloDi('spada')).toEqual({ base: 'spada', livello: 0 });
    expect(livelloDi('spada_lunga+4')).toEqual({ base: 'spada_lunga', livello: 4 });
    expect(MASSIMO_POTENZIAMENTO).toBe(5);
  });
});

describe('costo', () => {
  it('cresce con il livello; le monete crescono anche con la rarità', () => {
    expect(costoPotenziamento(0, 'comune', tabella)).toEqual({ materiali: { ferro: 1 }, monete: 10 });
    expect(costoPotenziamento(1, 'rara', tabella)).toEqual({ materiali: { ferro: 2, carbone: 1 }, monete: 40 });
    expect(costoPotenziamento(2, 'non_comune', tabella)).toEqual({ materiali: { ferro: 3 }, monete: 60 });
  });

  it('al massimo non c’è un livello successivo', () => {
    expect(costoPotenziamento(5, 'comune', tabella)).toBeNull();
  });
});

describe('potenziare', () => {
  const base = () => ({
    monete: 100,
    inventario: zaino(['spada', 1], ['ferro', 5], ['carbone', 1]),
    equipaggiamento: { ...creaEquipaggiamento('mazza'), secondaria: 'arco+2' },
    preferiti: creaPreferiti(['pozione', 'spada', 'mazza', 'arco+2']),
  });

  it('un’arma nello zaino: stesso spazio, nuovo id; materiali e monete scendono; la barra segue', () => {
    const esito = potenzia(base(), { zaino: 0 }, { materiali: { ferro: 1 }, monete: 10 });
    expect(esito.ok).toBe(true);
    if (esito.ok) {
      expect(esito.stato.inventario.spazi[0]).toEqual({ id: 'spada+1', quantita: 1 });
      expect(esito.stato.inventario.spazi[1]).toEqual({ id: 'ferro', quantita: 4 });
      expect(esito.stato.monete).toBe(90);
      expect(esito.stato.preferiti[1]).toBe('spada+1');
      expect(esito.nuovoId).toBe('spada+1');
    }
  });

  it('l’arma in mano: cambia l’equipaggiamento e il collegamento nei preferiti', () => {
    const esito = potenzia(base(), { spazio: 'secondaria' }, { materiali: { ferro: 3 }, monete: 40 });
    expect(esito.ok).toBe(true);
    if (esito.ok) {
      expect(esito.stato.equipaggiamento.secondaria).toBe('arco+3');
      expect(esito.stato.preferiti[3]).toBe('arco+3');
      expect(esito.stato.equipaggiamento.primaria).toBe('mazza');
    }
  });

  it('i materiali consumati non spostano l’arma (anche se uno spazio si svuota)', () => {
    const esito = potenzia(base(), { zaino: 0 }, { materiali: { carbone: 1 }, monete: 0 });
    expect(esito.ok && esito.stato.inventario.spazi[0]).toEqual({ id: 'spada+1', quantita: 1 });
    expect(esito.ok && esito.stato.inventario.spazi[2]).toBeNull();
  });

  it('materiali o monete insufficienti: rifiutato e nulla cambia', () => {
    const s = base();
    expect(potenzia(s, { zaino: 0 }, { materiali: { ferro: 9 }, monete: 10 }).ok).toBe(false);
    expect(potenzia(s, { zaino: 0 }, { materiali: { ferro: 1 }, monete: 999 }).ok).toBe(false);
    expect(s.inventario.spazi[0]).toEqual({ id: 'spada', quantita: 1 });
  });

  it('oltre +5: rifiutato', () => {
    const s = { ...base(), inventario: zaino(['spada+5', 1], ['ferro', 9]) };
    const esito = potenzia(s, { zaino: 0 }, { materiali: {}, monete: 0 });
    expect(esito.ok).toBe(false);
    if (!esito.ok) expect(esito.errore).toMatch(/massimo/);
  });

  it('spazio vuoto: niente da potenziare', () => {
    expect(potenzia(base(), { zaino: 5 }, { materiali: {}, monete: 0 }).ok).toBe(false);
  });
});

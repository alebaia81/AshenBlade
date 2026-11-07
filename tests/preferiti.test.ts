import { describe, expect, it } from 'vitest';
import { creaEquipaggiamento } from '../src/systems/equipaggiamento';
import { creaInventario, type Inventario } from '../src/systems/inventario';
import { assegnaPreferito, cosaFa, creaPreferiti, NUMERO_PREFERITI, svuotaPreferito } from '../src/systems/preferiti';

// Il tipo di ogni oggetto usato nei test (nel gioco viene dal catalogo).
const tipi: Record<string, string> = {
  pozione_vita: 'pozione',
  pozione_mana: 'pozione',
  mazza: 'arma',
  arco: 'arma',
  spada: 'arma',
  elmo_ferro: 'armatura',
  borsa: 'borsa',
};
const tipoDi = (id: string) => tipi[id];

function zaino(...pile: [string, number][]): Inventario {
  const inv = creaInventario(6);
  pile.forEach(([id, quantita], i) => (inv.spazi[i] = { id, quantita }));
  return inv;
}

describe('barra dei preferiti', () => {
  it('6 spazi; si parte con le pozioni indicate e il resto vuoto', () => {
    const p = creaPreferiti(['pozione_vita', 'pozione_mana']);
    expect(p).toHaveLength(NUMERO_PREFERITI);
    expect(p).toEqual(['pozione_vita', 'pozione_mana', null, null, null, null]);
  });

  it('pozioni e armi sì', () => {
    const p = creaPreferiti([]);
    const a = assegnaPreferito(p, 2, 'mazza', tipoDi);
    expect(a.ok && a.preferiti[2]).toBe('mazza');
    const b = assegnaPreferito(p, 0, 'pozione_vita', tipoDi);
    expect(b.ok && b.preferiti[0]).toBe('pozione_vita');
  });

  it('armature no: si cambiano dalla scheda', () => {
    const esito = assegnaPreferito(creaPreferiti([]), 0, 'elmo_ferro', tipoDi);
    expect(esito.ok).toBe(false);
    if (!esito.ok) expect(esito.errore).toMatch(/scheda/);
    expect(assegnaPreferito(creaPreferiti([]), 0, 'borsa', tipoDi).ok).toBe(false);
  });

  it('lo stesso oggetto in un altro spazio si SPOSTA (non si duplica)', () => {
    const p = creaPreferiti(['pozione_vita']);
    const esito = assegnaPreferito(p, 4, 'pozione_vita', tipoDi);
    expect(esito.ok && esito.preferiti).toEqual([null, null, null, null, 'pozione_vita', null]);
  });

  it('svuotare uno spazio; indici fuori dalla barra non cambiano nulla', () => {
    const p = creaPreferiti(['pozione_vita', 'pozione_mana']);
    expect(svuotaPreferito(p, 0)).toEqual([null, 'pozione_mana', null, null, null, null]);
    expect(svuotaPreferito(p, 9)).toBe(p);
    expect(assegnaPreferito(p, 6, 'mazza', tipoDi).ok).toBe(false);
  });

  it('non modifica la barra ricevuta', () => {
    const p = creaPreferiti(['pozione_vita']);
    assegnaPreferito(p, 1, 'mazza', tipoDi);
    svuotaPreferito(p, 0);
    expect(p[0]).toBe('pozione_vita');
    expect(p[1]).toBeNull();
  });
});

describe('cosaFa: cosa succede cliccando uno spazio', () => {
  const equip = { ...creaEquipaggiamento('spada'), secondaria: 'arco' };

  it('spazio vuoto', () => {
    expect(cosaFa(creaPreferiti([]), 0, zaino(), equip, tipoDi)).toEqual({ tipo: 'vuoto' });
  });

  it('pozione: quante ce ne sono in tutto lo zaino (anche zero: lo spazio resta)', () => {
    const p = creaPreferiti(['pozione_vita']);
    expect(cosaFa(p, 0, zaino(['pozione_vita', 3], ['mazza', 1], ['pozione_vita', 2]), equip, tipoDi)).toEqual({ tipo: 'pozione', id: 'pozione_vita', quantita: 5 });
    expect(cosaFa(p, 0, zaino(), equip, tipoDi)).toEqual({ tipo: 'pozione', id: 'pozione_vita', quantita: 0 });
  });

  it('arma nello zaino: si può impugnare, e dice dove sta', () => {
    const p = creaPreferiti([null, null, 'mazza']);
    expect(cosaFa(p, 2, zaino(['pozione_vita', 1], ['mazza', 1]), equip, tipoDi)).toEqual({ tipo: 'arma', id: 'mazza', inMano: false, indiceZaino: 1 });
  });

  it('arma già in mano (primaria o secondaria)', () => {
    const p = creaPreferiti(['spada', 'arco']);
    expect(cosaFa(p, 0, zaino(), equip, tipoDi)).toEqual({ tipo: 'arma', id: 'spada', inMano: true, indiceZaino: -1 });
    expect(cosaFa(p, 1, zaino(), equip, tipoDi)).toMatchObject({ inMano: true });
  });

  it('arma né in mano né nello zaino (gettata): lo spazio resta, ma non fa nulla', () => {
    const p = creaPreferiti(['mazza']);
    expect(cosaFa(p, 0, zaino(), equip, tipoDi)).toEqual({ tipo: 'arma', id: 'mazza', inMano: false, indiceZaino: -1 });
  });
});

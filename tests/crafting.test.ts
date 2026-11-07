import { describe, expect, it } from 'vitest';
import { cosaManca, crea, impara, ricetteConosciute, type Ricetta } from '../src/systems/crafting';
import { creaInventario, type Inventario } from '../src/systems/inventario';

const spada: Ricetta = { id: 'spada_lunga', risultato: 'spada_lunga', materiali: { ferro: 3, carbone: 1 }, monete: 20, conosciutaDallInizio: true };
const arco: Ricetta = { id: 'arco_cacciatore', risultato: 'arco_cacciatore', materiali: { pelle: 2 }, monete: 40, conosciutaDallInizio: false };
const pile = { ferro: 20, carbone: 20, pelle: 20, spada_lunga: 1, arco_cacciatore: 1 };

function zaino(capacita: number, ...contenuto: [string, number][]): Inventario {
  const inv = creaInventario(capacita);
  contenuto.forEach(([id, quantita], i) => (inv.spazi[i] = { id, quantita }));
  return inv;
}

describe('ricette conosciute', () => {
  it('quelle di base più quelle imparate', () => {
    expect(ricetteConosciute([spada, arco], []).map((r) => r.id)).toEqual(['spada_lunga']);
    expect(ricetteConosciute([spada, arco], ['arco_cacciatore']).map((r) => r.id)).toEqual(['spada_lunga', 'arco_cacciatore']);
  });

  it('imparare una ricetta nuova; la seconda volta non cambia nulla', () => {
    const prima = impara([], 'arco_cacciatore');
    expect(prima).toEqual({ ricette: ['arco_cacciatore'], nuova: true });
    expect(impara(prima.ricette, 'arco_cacciatore').nuova).toBe(false);
  });
});

describe('cosa manca', () => {
  it('per ogni materiale: quanti servono e quanti ne hai (anche in più pile)', () => {
    const m = cosaManca(zaino(4, ['ferro', 2], ['carbone', 1], ['ferro', 1]), 10, spada);
    expect(m.materiali).toEqual([
      { id: 'ferro', servono: 3, hai: 3 },
      { id: 'carbone', servono: 1, hai: 1 },
    ]);
    expect(m.monete).toEqual({ servono: 20, hai: 10 });
    expect(m.ok).toBe(false); // mancano le monete
  });
});

describe('creare', () => {
  const conosciute = ['spada_lunga'];

  it('con tutto: materiali e monete scendono, l’arma entra nello zaino', () => {
    const esito = crea({ monete: 50, inventario: zaino(4, ['ferro', 5], ['carbone', 1]) }, spada, conosciute, pile);
    expect(esito.ok).toBe(true);
    if (esito.ok) {
      expect(esito.stato.monete).toBe(30);
      expect(esito.stato.inventario.spazi).toEqual([{ id: 'ferro', quantita: 2 }, { id: 'spada_lunga', quantita: 1 }, null, null]);
    }
  });

  it('i materiali consumati liberano spazio: si crea anche con lo zaino pieno', () => {
    const esito = crea({ monete: 50, inventario: zaino(2, ['ferro', 3], ['carbone', 1]) }, spada, conosciute, pile);
    expect(esito.ok).toBe(true);
  });

  it('materiali o monete insufficienti: rifiutato e nulla cambia', () => {
    const stato = { monete: 50, inventario: zaino(4, ['ferro', 2], ['carbone', 1]) };
    const esito = crea(stato, spada, conosciute, pile);
    expect(esito.ok).toBe(false);
    if (!esito.ok) expect(esito.errore).toMatch(/ferro/);
    expect(crea({ ...stato, monete: 5, inventario: zaino(4, ['ferro', 3], ['carbone', 1]) }, spada, conosciute, pile).ok).toBe(false);
    expect(stato.inventario.spazi[0]).toEqual({ id: 'ferro', quantita: 2 });
  });

  it('zaino pieno anche dopo aver usato i materiali: rifiutato', () => {
    const esito = crea({ monete: 50, inventario: zaino(3, ['ferro', 4], ['carbone', 2], ['pelle', 1]) }, spada, conosciute, pile);
    expect(esito.ok).toBe(false);
    if (!esito.ok) expect(esito.errore).toMatch(/[Zz]aino pieno/);
  });

  it('una ricetta non conosciuta non si crea', () => {
    const esito = crea({ monete: 100, inventario: zaino(4, ['pelle', 5]) }, arco, conosciute, pile);
    expect(esito.ok).toBe(false);
    if (!esito.ok) expect(esito.errore).toMatch(/conosci/);
  });
});

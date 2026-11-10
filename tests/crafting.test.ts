import { describe, expect, it } from 'vitest';
import {
  cosaManca,
  crea,
  impara,
  materialiDaSmontaggio,
  ricetteConosciute,
  smontaOggettoDaInventario,
  type DatiSmontaggio,
  type Ricetta,
} from '../src/systems/crafting';
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

describe('smontaggio armi e armature', () => {
  const datiMock: DatiSmontaggio = {
    oggetti: {
      spada_lunga: { id: 'spada_lunga', nome: 'Spada lunga', tipo: 'arma', rarita: 'comune', pila: 1, prezzo: 30, descrizione: '', colore: '#ffffff' },
      pugnali: { id: 'pugnali', nome: 'Pugnali', tipo: 'arma', rarita: 'comune', pila: 1, prezzo: 20, descrizione: '', colore: '#ffffff' },
      pozione_cura: { id: 'pozione_cura', nome: 'Pozione di cura', tipo: 'pozione', rarita: 'comune', pila: 5, prezzo: 10, descrizione: '', colore: '#ffffff' },
      elmo_ferro: { id: 'elmo_ferro', nome: 'Elmo di ferro', tipo: 'armatura', rarita: 'comune', pila: 1, prezzo: 25, descrizione: '', colore: '#ffffff' },
      minerale_ferro: { id: 'minerale_ferro', nome: 'Minerale di ferro', tipo: 'materiale', rarita: 'comune', pila: 20, prezzo: 4, descrizione: '', colore: '#ffffff' },
      carbone: { id: 'carbone', nome: 'Carbone', tipo: 'materiale', rarita: 'comune', pila: 20, prezzo: 3, descrizione: '', colore: '#ffffff' },
      pelle_lupo: { id: 'pelle_lupo', nome: 'Pelle di lupo', tipo: 'materiale', rarita: 'comune', pila: 20, prezzo: 5, descrizione: '', colore: '#ffffff' },
    },
    armi: {
      spada_lunga: { id: 'spada_lunga', nome: 'Spada lunga', tipo: 'spada', slot: 'primaria', rarita: 'comune', prezzo: 30, effetti: [], dado: '1d8', caratteristica: 'FOR', portata: 14, larghezzaColpo: 18, durataMs: 180, ricaricaMs: 180, bonusCritico: 0, respinta: 100, descrizione: '' },
      pugnali: { id: 'pugnali', nome: 'Pugnali', tipo: 'pugnale', slot: 'primaria', rarita: 'comune', prezzo: 20, effetti: [], dado: '1d4', caratteristica: 'DES', portata: 12, larghezzaColpo: 12, durataMs: 140, ricaricaMs: 140, bonusCritico: 0.1, respinta: 80, descrizione: '' },
    },
    armature: {
      elmo_ferro: { id: 'elmo_ferro', nome: 'Elmo di ferro', pezzo: 'elmo', rarita: 'comune', armatura: 1, bonus: {}, effetti: [], descrizione: '', prezzo: 25 },
    },
    ricette: {
      spada_lunga: { id: 'spada_lunga', risultato: 'spada_lunga', materiali: { minerale_ferro: 3, carbone: 1 }, monete: 20, conosciutaDallInizio: true },
    },
  };

  it('calcola i materiali da smontaggio da una ricetta esistente', () => {
    const mat = materialiDaSmontaggio('spada_lunga', datiMock);
    expect(mat.minerale_ferro).toBeGreaterThanOrEqual(2);
    expect(mat.carbone).toBeGreaterThanOrEqual(1);
  });

  it('calcola i materiali da una tipologia generica di arma', () => {
    const mat = materialiDaSmontaggio('pugnali', datiMock);
    expect(mat.minerale_ferro).toBe(1);
    expect(mat.pelle_lupo).toBe(1);
  });

  it('smontare una pozione o oggetto non smontabile fallisce', () => {
    const inv = zaino(2, ['pozione_cura', 1]);
    const esito = smontaOggettoDaInventario(inv, 0, datiMock);
    expect(esito.ok).toBe(false);
  });

  it('smonta un’arma dallo zaino: libera lo spazio e aggiunge i materiali', () => {
    const inv = zaino(3, ['spada_lunga', 1]);
    const esito = smontaOggettoDaInventario(inv, 0, datiMock);
    expect(esito.ok).toBe(true);
    if (esito.ok && esito.inventario) {
      // Lo slot 0 non contiene più la spada lunga
      expect(esito.inventario.spazi.some((s) => s?.id === 'spada_lunga')).toBe(false);
      // I materiali recuperati sono presenti nello zaino
      expect(esito.inventario.spazi.some((s) => s?.id === 'minerale_ferro')).toBe(true);
      expect(esito.inventario.spazi.some((s) => s?.id === 'carbone')).toBe(true);
      expect(esito.materialiRecuperati?.length).toBeGreaterThan(0);
    }
  });

  it('smonta un’armatura dallo zaino recuperando materiali', () => {
    const inv = zaino(2, ['elmo_ferro', 1]);
    const esito = smontaOggettoDaInventario(inv, 0, datiMock);
    expect(esito.ok).toBe(true);
    if (esito.ok && esito.inventario) {
      expect(esito.inventario.spazi.some((s) => s?.id === 'minerale_ferro')).toBe(true);
    }
  });
});

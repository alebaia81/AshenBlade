import { describe, expect, it } from 'vitest';
import { creaInventario, type Inventario } from '../src/systems/inventario';
import { compra, prezzoAcquisto, prezzoVendita, vendi, validaNegozio } from '../src/systems/negozio';

// Catalogo minimo: quanto si impila e quanto costa ogni oggetto.
const catalogo = {
  pozione_vita: { pila: 10, prezzo: 15, rarita: 'comune' },
  spada: { pila: 1, prezzo: 30, rarita: 'comune' },
  lama: { pila: 1, prezzo: 800, rarita: 'esotica' },
} as const;

function zaino(capacita: number, ...pile: [string, number][]): Inventario {
  const inv = creaInventario(capacita);
  pile.forEach(([id, quantita], i) => (inv.spazi[i] = { id, quantita }));
  return inv;
}

describe('prezzi e Carisma', () => {
  it('CAR 10 (+0): prezzo pieno per comprare, metà per vendere', () => {
    expect(prezzoAcquisto(100, 0)).toBe(100);
    expect(prezzoVendita(100, 0)).toBe(50);
  });

  it('ogni punto di modificatore: −5% comprando, +5% vendendo', () => {
    expect(prezzoAcquisto(100, 2)).toBe(90); // CAR 14
    expect(prezzoVendita(100, 2)).toBe(55);
    expect(prezzoAcquisto(100, -2)).toBe(110); // CAR 6
    expect(prezzoVendita(100, -2)).toBe(45);
  });

  it('al massimo ±25%: la vendita non supera mai l’acquisto', () => {
    expect(prezzoAcquisto(100, 9)).toBe(75);
    expect(prezzoVendita(100, 9)).toBe(63);
    expect(prezzoAcquisto(100, -9)).toBe(125);
    expect(prezzoVendita(100, -9)).toBe(38);
  });

  it('niente costa meno di 1 moneta', () => {
    expect(prezzoAcquisto(1, 5)).toBe(1);
    expect(prezzoVendita(1, -5)).toBe(1);
  });
});

describe('comprare', () => {
  it('le monete scendono e l’oggetto entra nello zaino (le pozioni si impilano)', () => {
    const esito = compra({ monete: 40, inventario: zaino(4, ['pozione_vita', 2]) }, 'pozione_vita', 15, catalogo);
    expect(esito.ok).toBe(true);
    if (esito.ok) {
      expect(esito.stato.monete).toBe(25);
      expect(esito.stato.inventario.spazi[0]).toEqual({ id: 'pozione_vita', quantita: 3 });
    }
  });

  it('senza monete sufficienti: rifiutato e nulla cambia', () => {
    const stato = { monete: 10, inventario: zaino(4) };
    const esito = compra(stato, 'spada', 30, catalogo);
    expect(esito.ok).toBe(false);
    if (!esito.ok) expect(esito.errore).toMatch(/monete/);
    expect(stato.monete).toBe(10);
  });

  it('zaino pieno: rifiutato (anche con le monete)', () => {
    const esito = compra({ monete: 100, inventario: zaino(1, ['pozione_vita', 10]) }, 'spada', 30, catalogo);
    expect(esito.ok).toBe(false);
    if (!esito.ok) expect(esito.errore).toMatch(/[Zz]aino pieno/);
  });
});

describe('vendere', () => {
  it('una pozione alla volta da una pila', () => {
    const esito = vendi({ monete: 0, inventario: zaino(4, ['pozione_vita', 3]) }, 0, 7);
    expect(esito.ok).toBe(true);
    if (esito.ok) {
      expect(esito.stato.monete).toBe(7);
      expect(esito.stato.inventario.spazi[0]).toEqual({ id: 'pozione_vita', quantita: 2 });
    }
  });

  it('l’ultimo oggetto della pila libera lo spazio', () => {
    const esito = vendi({ monete: 5, inventario: zaino(4, ['spada', 1]) }, 0, 15);
    expect(esito.ok && esito.stato.inventario.spazi[0]).toBeNull();
    expect(esito.ok && esito.stato.monete).toBe(20);
  });

  it('spazio vuoto: niente da vendere', () => {
    expect(vendi({ monete: 0, inventario: zaino(4) }, 2, 10).ok).toBe(false);
  });
});

describe('validazione del negozio', () => {
  it('tutto ciò che si vende esiste, ha un prezzo e non è leggendario né esotico', () => {
    expect(validaNegozio('gemma', ['pozione_vita', 'spada'], catalogo)).toEqual([]);
    const errori = validaNegozio('gemma', ['pozione_vita', 'lama', 'boh'], catalogo).join('\n');
    expect(errori).toMatch(/"lama".*esotic/);
    expect(errori).toMatch(/"boh" non esiste/);
  });
});

describe('oggetti di missione (fase 7b)', () => {
  it('lettere e chiavi delle quest non si vendono (né si gettano)', async () => {
    const { èDiMissione } = await import('../src/systems/oggetti');
    expect(èDiMissione({ tipo: 'missione' })).toBe(true);
    expect(èDiMissione({ tipo: 'materiale' })).toBe(false);
    expect(èDiMissione(undefined)).toBe(false);
  });
});

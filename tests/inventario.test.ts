import { describe, expect, it } from 'vitest';
import { aggiungi, amplia, conta, creaInventario, spaziLiberi, togli, togliPerId } from '../src/systems/inventario';

describe('inventario', () => {
  it('si parte con tutti gli spazi vuoti', () => {
    const inv = creaInventario(12);
    expect(inv.capacita).toBe(12);
    expect(spaziLiberi(inv)).toBe(12);
  });

  it('aggiungere mette l’oggetto nel primo spazio libero', () => {
    const { inventario, rimasti } = aggiungi(creaInventario(4), 'spada', 1, 1);
    expect(rimasti).toBe(0);
    expect(inventario.spazi[0]).toEqual({ id: 'spada', quantita: 1 });
  });

  it('le pozioni si impilano fino al massimo, poi occupano un nuovo spazio', () => {
    let inv = aggiungi(creaInventario(4), 'pozione', 4, 5).inventario;
    inv = aggiungi(inv, 'pozione', 3, 5).inventario;
    expect(inv.spazi[0]).toEqual({ id: 'pozione', quantita: 5 });
    expect(inv.spazi[1]).toEqual({ id: 'pozione', quantita: 2 });
    expect(conta(inv, 'pozione')).toBe(7);
  });

  it('oggetti non impilabili (pila 1) occupano uno spazio ciascuno', () => {
    const inv = aggiungi(creaInventario(4), 'spada', 2, 1).inventario;
    expect(spaziLiberi(inv)).toBe(2);
  });

  it('zaino pieno: quello che non entra viene restituito', () => {
    const pieno = aggiungi(creaInventario(2), 'spada', 2, 1).inventario;
    const r = aggiungi(pieno, 'pozione', 3, 5);
    expect(r.rimasti).toBe(3);
    expect(r.inventario).toEqual(pieno);
  });

  it('se entra solo una parte, il resto viene restituito', () => {
    const quasi = aggiungi(creaInventario(1), 'pozione', 4, 5).inventario;
    const r = aggiungi(quasi, 'pozione', 3, 5);
    expect(r.rimasti).toBe(2);
    expect(conta(r.inventario, 'pozione')).toBe(5);
  });

  it('togliere da una pila; a zero lo spazio si libera', () => {
    const inv = aggiungi(creaInventario(2), 'pozione', 2, 5).inventario;
    expect(togli(inv, 0, 1).spazi[0]).toEqual({ id: 'pozione', quantita: 1 });
    expect(togli(inv, 0, 2).spazi[0]).toBeNull();
  });

  it('togliPerId usa le pile in ordine e rifiuta se non bastano', () => {
    let inv = aggiungi(creaInventario(3), 'pozione', 7, 5).inventario; // 5 + 2
    inv = togliPerId(inv, 'pozione', 6)!;
    expect(conta(inv, 'pozione')).toBe(1);
    expect(togliPerId(inv, 'pozione', 2)).toBeNull();
  });

  it('ampliare aggiunge spazi e mantiene gli oggetti', () => {
    const inv = amplia(aggiungi(creaInventario(2), 'spada', 1, 1).inventario, 4);
    expect(inv.capacita).toBe(4);
    expect(inv.spazi).toHaveLength(4);
    expect(inv.spazi[0]).toEqual({ id: 'spada', quantita: 1 });
  });

  it('non si può ridurre la capacità', () => {
    expect(() => amplia(creaInventario(4), 2)).toThrow(/ridurre/);
  });

  it('non modifica l’inventario originale', () => {
    const inv = creaInventario(2);
    aggiungi(inv, 'spada', 1, 1);
    expect(spaziLiberi(inv)).toBe(2);
  });
});

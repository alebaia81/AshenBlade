import { describe, expect, it } from 'vitest';
import { commentoAllIngresso, congeda, creaStatoCompagni, ingaggia, unisciCompagno } from '../src/systems/taverna';

const iniziale = () => ({ monete: 200, compagni: creaStatoCompagni() });

describe('taverna', () => {
  it('si parte senza compagni', () => {
    expect(creaStatoCompagni()).toEqual({ ingaggiati: [], attivo: null });
  });

  it('il primo ingaggio si paga e il compagno diventa quello attivo', () => {
    const esito = ingaggia(iniziale(), 'corrado', 80);
    expect(esito.ok).toBe(true);
    if (esito.ok) {
      expect(esito.stato.monete).toBe(120);
      expect(esito.stato.compagni).toEqual({ ingaggiati: ['corrado'], attivo: 'corrado' });
      expect(esito.pagato).toBe(80);
    }
  });

  it('uno solo alla volta; tornare da uno già pagato è gratis', () => {
    let s = iniziale();
    for (const [id, prezzo] of [['corrado', 80], ['elisa', 100]] as const) {
      const e = ingaggia(s, id, prezzo);
      if (!e.ok) throw new Error(e.errore);
      s = e.stato;
    }
    expect(s.monete).toBe(20);
    expect(s.compagni.attivo).toBe('elisa');
    const ritorno = ingaggia(s, 'corrado', 80);
    expect(ritorno.ok && ritorno.stato.monete).toBe(20);
    expect(ritorno.ok && ritorno.pagato).toBe(0);
    expect(ritorno.ok && ritorno.stato.compagni.attivo).toBe('corrado');
  });

  it('senza monete sufficienti: rifiutato', () => {
    const esito = ingaggia({ monete: 50, compagni: creaStatoCompagni() }, 'volpe', 100);
    expect(esito.ok).toBe(false);
    if (!esito.ok) expect(esito.errore).toMatch(/monete/);
  });

  it('chi è già con te non si ingaggia di nuovo', () => {
    const e = ingaggia(iniziale(), 'agata', 80);
    if (!e.ok) throw new Error(e.errore);
    expect(ingaggia(e.stato, 'agata', 80).ok).toBe(false);
  });

  it('congedare: nessun compagno attivo, ma resta "già pagato"', () => {
    const e = ingaggia(iniziale(), 'agata', 80);
    if (!e.ok) throw new Error(e.errore);
    expect(congeda(e.stato).compagni).toEqual({ ingaggiati: ['agata'], attivo: null });
  });

  it('unisciCompagno (fase 10b): unisce gratis un compagno di viaggio e lo rende attivo senza duplicati', () => {
    const s0 = iniziale();
    const s1 = unisciCompagno(s0, 'tessa');
    expect(s1.monete).toBe(200);
    expect(s1.compagni).toEqual({ ingaggiati: ['tessa'], attivo: 'tessa' });
    const s2 = unisciCompagno(s1, 'tessa');
    expect(s2.compagni.ingaggiati).toEqual(['tessa']);
  });

  it('commentoAllIngresso (fase 10b): mostra il commento legato alla mappa una sola volta', () => {
    const commenti = [
      { mappa: 'bosco', testo: 'Qui mio padre tagliava la legna.' },
      { mappa: 'cimitero', testo: 'Brina ringhia…' },
    ];
    const primo = commentoAllIngresso('tessa', commenti, 'bosco', []);
    expect(primo).toEqual({ chiave: 'tessa:bosco', testo: 'Qui mio padre tagliava la legna.' });
    expect(commentoAllIngresso('tessa', commenti, 'bosco', ['tessa:bosco'])).toBeNull();
    expect(commentoAllIngresso('tessa', commenti, 'radura', [])).toBeNull();
  });
});

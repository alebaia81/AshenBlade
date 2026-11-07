import { describe, expect, it } from 'vitest';
import datiLivelli from '../src/data/livelli.json';
import {
  aggiungiEsperienza,
  apriForziere,
  assegnaPuntoPartita,
  caratteristicheTotali,
  creaPartita,
  forziereAperto,
  guarisci,
  indossa,
  togliIndossato,
  usaOggetto,
} from '../src/systems/partita';
import { aggiungi, conta } from '../src/systems/inventario';
import { bonus } from '../src/systems/effettiTemporanei';
import type { DefinizioneOggetto } from '../src/systems/oggetti';
import { consuma } from '../src/systems/risorsa';
import { guerrieroDiProva, magoDiProva } from './aiuti/classi';

const soglie = datiLivelli.soglie;

describe('creaPartita', () => {
  const p = creaPartita('Ale', guerrieroDiProva, ['FOR', 'COS']);

  it('parte dal livello 1 con le caratteristiche della classe + i punti liberi', () => {
    expect(p.personaggio).toMatchObject({ nome: 'Ale', classe: 'guerriero', livello: 1 });
    expect(p.personaggio.caratteristiche.COS).toBe(15);
    expect(p.esperienza).toBe(0);
    expect(p.puntiDaAssegnare).toBe(0);
  });

  it('vita piena: 14 + modificatore di COS 15 (+2)', () => {
    expect(p.vita).toEqual({ attuale: 16, massima: 16 });
  });

  it('nome vuoto → "Viandante"', () => {
    expect(creaPartita('  ', guerrieroDiProva, ['FOR', 'COS']).personaggio.nome).toBe('Viandante');
  });
});

describe('aggiungiEsperienza', () => {
  const p = creaPartita('Ale', guerrieroDiProva, ['FOR', 'COS']);

  it('senza cambiare livello', () => {
    const r = aggiungiEsperienza(p, 30, guerrieroDiProva, soglie);
    expect(r.partita.esperienza).toBe(30);
    expect(r.livelliGuadagnati).toBe(0);
  });

  it('salendo di 2 livelli in un colpo solo: 2 punti e vita più alta', () => {
    const ferito = { ...p, vita: consuma(p.vita, 6) }; // 10/16
    const r = aggiungiEsperienza(ferito, 160, guerrieroDiProva, soglie);
    expect(r.livelliGuadagnati).toBe(2);
    expect(r.partita.personaggio.livello).toBe(3);
    expect(r.partita.puntiDaAssegnare).toBe(2);
    // livello 3: 14 + 2 × 6 + 3 × 2 = 32 → +16 sul massimo e anche sull'attuale
    expect(r.partita.vita).toEqual({ attuale: 26, massima: 32 });
  });

  it('non modifica la partita originale', () => {
    aggiungiEsperienza(p, 500, guerrieroDiProva, soglie);
    expect(p.esperienza).toBe(0);
  });
});

describe('assegnaPuntoPartita', () => {
  // COS 14 (+2), livello 2
  const salito = aggiungiEsperienza(creaPartita('Ale', guerrieroDiProva, ['FOR', 'DES']), 50, guerrieroDiProva, soglie).partita;

  it('usa un punto e aumenta la caratteristica', () => {
    const p = assegnaPuntoPartita(salito, 'DES', guerrieroDiProva);
    expect(p.personaggio.caratteristiche.DES).toBe(14);
    expect(p.puntiDaAssegnare).toBe(0);
  });

  it('un punto in COS che cambia il modificatore aumenta subito la vita', () => {
    // COS 14 → 15: il modificatore resta +2, la vita non cambia
    const p1 = assegnaPuntoPartita(salito, 'COS', guerrieroDiProva);
    expect(p1.vita.massima).toBe(salito.vita.massima);
    // COS 15 → 16: modificatore +3, cioè +1 × livello 2 = +2 di vita
    const p2 = assegnaPuntoPartita({ ...p1, puntiDaAssegnare: 1 }, 'COS', guerrieroDiProva);
    expect(p2.vita.massima).toBe(salito.vita.massima + 2);
    expect(p2.vita.attuale).toBe(salito.vita.attuale + 2);
  });

  it('senza punti disponibili dà errore', () => {
    const p = assegnaPuntoPartita(salito, 'DES', guerrieroDiProva);
    expect(() => assegnaPuntoPartita(p, 'FOR', guerrieroDiProva)).toThrow(/punti/);
  });
});

describe('guarisci', () => {
  it('riporta la vita al massimo (ricomparsa dopo una sconfitta)', () => {
    const p = creaPartita('Ale', guerrieroDiProva, ['FOR', 'COS']);
    expect(guarisci({ ...p, vita: consuma(p.vita, 10) }).vita.attuale).toBe(16);
  });
});

describe('mana nella partita', () => {
  it('il Guerriero non ha mana, il Mago parte col mana pieno', () => {
    expect(creaPartita('A', guerrieroDiProva, ['FOR', 'COS']).mana).toEqual({ attuale: 0, massima: 0 });
    // INT 15 + 1 = 16 (+3): 10 + 2 × 3 = 16
    expect(creaPartita('M', magoDiProva, ['INT', 'COS']).mana).toEqual({ attuale: 16, massima: 16 });
  });

  it('un punto in INT che cambia il modificatore aumenta subito il mana', () => {
    const p = creaPartita('M', magoDiProva, ['COS', 'DES']); // INT 15 (+2): mana 14
    const salito = aggiungiEsperienza(p, 50, magoDiProva, soglie).partita;
    const con16 = assegnaPuntoPartita(salito, 'INT', magoDiProva); // INT 16 (+3)
    expect(con16.mana).toEqual({ attuale: 16, massima: 16 });
  });

  it('guarisci riempie anche il mana', () => {
    const p = creaPartita('M', magoDiProva, ['INT', 'COS']);
    expect(guarisci({ ...p, mana: consuma(p.mana, 10) }).mana.attuale).toBe(16);
  });
});

const catalogo: Record<string, DefinizioneOggetto> = {
  pozione_vita: { id: 'pozione_vita', nome: 'Pozione di vita', descrizione: '', tipo: 'pozione', rarita: 'comune', pila: 10, prezzo: 10, colore: '#e04848', effetto: { tipo: 'cura', quantita: 12 } },
  pozione_mana: { id: 'pozione_mana', nome: 'Pozione di mana', descrizione: '', tipo: 'pozione', rarita: 'comune', pila: 10, prezzo: 10, colore: '#4870e0', effetto: { tipo: 'mana', quantita: 10 } },
  pozione_forza: { id: 'pozione_forza', nome: 'Pozione di forza', descrizione: '', tipo: 'pozione', rarita: 'non_comune', pila: 5, prezzo: 10, colore: '#e09048', effetto: { tipo: 'temporaneo', effetto: 'forza', valore: 2, durataMs: 60000 } },
  borsa: { id: 'borsa', nome: 'Borsa di cuoio', descrizione: '', tipo: 'borsa', rarita: 'non_comune', pila: 1, prezzo: 10, colore: '#9a6b3c', effetto: { tipo: 'capacita', spazi: 16 } },
};

describe('inventario nella partita', () => {
  it('si parte con 12 spazi e 2 pozioni di vita (più 2 di mana per chi usa il mana)', () => {
    const g = creaPartita('A', guerrieroDiProva, ['FOR', 'COS']);
    expect(g.inventario.capacita).toBe(12);
    expect(conta(g.inventario, 'pozione_vita')).toBe(2);
    expect(conta(g.inventario, 'pozione_mana')).toBe(0);
    expect(conta(creaPartita('M', magoDiProva, ['INT', 'COS']).inventario, 'pozione_mana')).toBe(2);
  });

  it('pozione di vita: cura, consuma una pozione', () => {
    const p = creaPartita('A', guerrieroDiProva, ['FOR', 'COS']); // vita 16
    const ferito = { ...p, vita: consuma(p.vita, 14) };
    const r = usaOggetto(ferito, 0, catalogo, 0);
    expect(r.partita.vita.attuale).toBe(14);
    expect(conta(r.partita.inventario, 'pozione_vita')).toBe(1);
    expect(r.messaggio).toBe('+12 vita');
  });

  it('a vita piena la pozione non si spreca', () => {
    const p = creaPartita('A', guerrieroDiProva, ['FOR', 'COS']);
    const r = usaOggetto(p, 0, catalogo, 0);
    expect(r.partita).toBe(p);
    expect(r.messaggio).toBe('Vita già piena');
  });

  it('la pozione di mana non serve a chi non ha mana', () => {
    const p = creaPartita('A', guerrieroDiProva, ['FOR', 'COS']);
    const conMana = { ...p, inventario: aggiungi(p.inventario, 'pozione_mana', 1, 10).inventario };
    const r = usaOggetto(conMana, 1, catalogo, 0);
    expect(r.partita).toBe(conMana);
    expect(r.messaggio).toBe('Non usi il mana');
  });

  it('pozione di forza: effetto a tempo nella partita', () => {
    const p = creaPartita('A', guerrieroDiProva, ['FOR', 'COS']);
    const conForza = { ...p, inventario: aggiungi(p.inventario, 'pozione_forza', 1, 5).inventario };
    const r = usaOggetto(conForza, 1, catalogo, 1000);
    expect(bonus(r.partita.effetti, 'forza', 30000)).toBe(2);
    expect(bonus(r.partita.effetti, 'forza', 61000)).toBe(0);
  });

  it('la borsa amplia lo zaino e sparisce; una seconda borsa uguale non serve', () => {
    const p = creaPartita('A', guerrieroDiProva, ['FOR', 'COS']);
    const conBorsa = { ...p, inventario: aggiungi(p.inventario, 'borsa', 2, 1).inventario };
    const r = usaOggetto(conBorsa, 1, catalogo, 0);
    expect(r.partita.inventario.capacita).toBe(16);
    expect(conta(r.partita.inventario, 'borsa')).toBe(1);
    const seconda = usaOggetto(r.partita, 2, catalogo, 0); // la seconda borsa è rimasta nello spazio 2
    expect(seconda.partita).toBe(r.partita);
    expect(seconda.messaggio).toMatch(/già/);
  });

  it('uno spazio vuoto non fa nulla', () => {
    const p = creaPartita('A', guerrieroDiProva, ['FOR', 'COS']);
    expect(usaOggetto(p, 5, catalogo, 0).partita).toBe(p);
  });
});

describe('forzieri aperti', () => {
  it('un forziere aperto resta aperto', () => {
    const p = creaPartita('A', guerrieroDiProva, ['FOR', 'COS']);
    expect(forziereAperto(p, 'radura:5:5')).toBe(false);
    const aperto = apriForziere(p, 'radura:5:5');
    expect(forziereAperto(aperto, 'radura:5:5')).toBe(true);
    expect(forziereAperto(aperto, 'radura:6:5')).toBe(false);
  });

  it('la sconfitta non toglie nulla: inventario e forzieri restano (§12)', () => {
    const p = apriForziere(creaPartita('A', guerrieroDiProva, ['FOR', 'COS']), 'radura:5:5');
    const g = guarisci(p);
    expect(g.inventario).toBe(p.inventario);
    expect(forziereAperto(g, 'radura:5:5')).toBe(true);
  });
});

describe('equipaggiamento nella partita', () => {
  const catalogo = {
    elmo_corona: { categoria: 'armatura', spazio: 'elmo', rarita: 'leggendaria', armatura: 2, bonus: { COS: 1 }, effetti: [], usaMana: false },
    bastone: { categoria: 'arma', spazio: 'primaria', rarita: 'comune', armatura: 0, effetti: [], usaMana: true },
  } as const;
  // COS 15 → con +1 diventa 16: il modificatore sale da +2 a +3.
  const p = creaPartita('Ale', guerrieroDiProva, ['FOR', 'COS']);
  const conElmo = { ...p, inventario: aggiungi(p.inventario, 'elmo_corona', 1, 1).inventario };
  const indice = conElmo.inventario.spazi.findIndex((s) => s?.id === 'elmo_corona');

  it('si parte con l’arma della classe in mano', () => {
    expect(p.equipaggiamento.primaria).toBe('spada_e_scudo');
    expect(p.equipaggiamento.elmo).toBeNull();
  });

  it('un pezzo leggendario con +1 COS alza la vita massima (e quella attuale)', () => {
    const esito = indossa(conElmo, indice, catalogo, guerrieroDiProva);
    expect(esito.messaggio).toBeNull(); // il messaggio con il nome lo compone la scena
    expect(esito.partita.equipaggiamento.elmo).toBe('elmo_corona');
    expect(caratteristicheTotali(esito.partita, catalogo).COS).toBe(16);
    expect(esito.partita.personaggio.caratteristiche.COS).toBe(15); // la base non cambia
    expect(esito.partita.vita).toEqual({ attuale: 17, massima: 17 });
  });

  it('togliendolo la vita massima torna com’era', () => {
    const indossato = indossa(conElmo, indice, catalogo, guerrieroDiProva).partita;
    const esito = togliIndossato(indossato, 'elmo', catalogo, guerrieroDiProva);
    expect(esito.partita.equipaggiamento.elmo).toBeNull();
    expect(esito.partita.vita).toEqual({ attuale: 16, massima: 16 });
  });

  it('il Guerriero non può impugnare il bastone (usa il mana)', () => {
    const conBastone = { ...p, inventario: aggiungi(p.inventario, 'bastone', 1, 1).inventario };
    const i = conBastone.inventario.spazi.findIndex((s) => s?.id === 'bastone');
    const esito = indossa(conBastone, i, catalogo, guerrieroDiProva);
    expect(esito.partita).toBe(conBastone);
    expect(esito.messaggio).toMatch(/mana/);
  });

  it('salire di livello tiene conto del bonus dell’equipaggiamento', () => {
    const indossato = indossa(conElmo, indice, catalogo, guerrieroDiProva).partita;
    const r = aggiungiEsperienza(indossato, 50, guerrieroDiProva, soglie, { COS: 1 });
    // livello 2: 14 + 6 + 2 × 3 = 26
    expect(r.partita.vita.massima).toBe(26);
  });
});

describe('preferiti nella partita', () => {
  it('si parte con la pozione di vita nello spazio 1 (e di mana nel 2 per chi usa il mana)', () => {
    expect(creaPartita('A', guerrieroDiProva, ['FOR', 'COS']).preferiti).toEqual(['pozione_vita', null, null, null, null, null]);
    expect(creaPartita('A', magoDiProva, ['INT', 'COS']).preferiti).toEqual(['pozione_vita', 'pozione_mana', null, null, null, null]);
  });
});

describe('pergamene', () => {
  const pergamena: DefinizioneOggetto = {
    id: 'pergamena_arco', nome: 'Pergamena: Arco del cacciatore', descrizione: '', tipo: 'pergamena', rarita: 'rara', pila: 5, prezzo: 100, colore: '#e8d9b0',
    effetto: { tipo: 'ricetta', ricetta: 'arco_cacciatore' },
  };
  const cat = { pergamena_arco: pergamena };
  it('usarla insegna la ricetta e la consuma; la seconda resta nello zaino', () => {
    const base = creaPartita('A', guerrieroDiProva, ['FOR', 'COS']);
    const p = { ...base, inventario: aggiungi(base.inventario, 'pergamena_arco', 2, 5).inventario };
    const i = p.inventario.spazi.findIndex((s) => s?.id === 'pergamena_arco');
    const uno = usaOggetto(p, i, cat, 0);
    expect(uno.partita.ricette).toEqual(['arco_cacciatore']);
    expect(uno.messaggio).toMatch(/Arco del cacciatore/);
    expect(conta(uno.partita.inventario, 'pergamena_arco')).toBe(1);
    const due = usaOggetto(uno.partita, i, cat, 0);
    expect(due.partita).toBe(uno.partita);
    expect(due.messaggio).toMatch(/già/);
  });
});

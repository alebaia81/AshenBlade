import { beforeEach, describe, expect, it } from 'vitest';
import {
  aggiorna,
  creaSalvataggio,
  dopoIlCaricamento,
  elencoSlot,
  eliminaSlot,
  leggiSalvataggio,
  leggiSlot,
  nomeFileEsportazione,
  NUMERO_SLOT,
  scriviSlot,
  testoSalvataggio,
  ultimoSlot,
  VERSIONE_SALVATAGGIO,
  type Archivio,
  type Migrazioni,
} from '../src/systems/salvataggio';
import { creaPartita, type Partita } from '../src/systems/partita';
import { aggiungiEffetto } from '../src/systems/effettiTemporanei';
import { guerrieroDiProva, magoDiProva } from './aiuti/classi';

/** Un localStorage finto: una Map dietro la stessa interfaccia. */
function archivioFinto(): Archivio & { dati: Map<string, string> } {
  const dati = new Map<string, string>();
  return {
    dati,
    getItem: (k) => dati.get(k) ?? null,
    setItem: (k, v) => void dati.set(k, v),
    removeItem: (k) => void dati.delete(k),
  };
}

const DATA = new Date('2026-11-06T10:30:00Z');

function partitaDiProva(): Partita {
  const p = creaPartita('Ale', guerrieroDiProva, ['FOR', 'COS']);
  return { ...p, monete: 37, forzieriAperti: ['borgo:3:4'], quest: { lupi_dario: { stato: 'attiva', passo: 0, conteggio: 2 } } };
}

function salvataggioDiProva(partita = partitaDiProva()) {
  return creaSalvataggio({ partita, mappa: 'bosco', arrivo: 'A', zona: 'Bosco Nero', adesso: 5000, data: DATA });
}

describe('creaSalvataggio e leggiSalvataggio', () => {
  it('salvare e rileggere restituisce la stessa partita, mappa e punto di arrivo', () => {
    const s = salvataggioDiProva();
    const letto = leggiSalvataggio(testoSalvataggio(s));
    expect(letto.ok).toBe(true);
    if (!letto.ok) return;
    expect(letto.salvataggio.partita).toEqual(s.partita);
    expect(letto.salvataggio).toMatchObject({ mappa: 'bosco', arrivo: 'A', zona: 'Bosco Nero', versione: VERSIONE_SALVATAGGIO });
    expect(letto.salvataggio.data).toBe(DATA.toISOString());
  });

  it('gli effetti a tempo si salvano come "quanto manca", non come un orario', () => {
    // L'orologio del gioco riparte da zero quando si ricarica la pagina:
    // "fino a 65000" non avrebbe più senso, "ancora 60 secondi" sì.
    const p = { ...partitaDiProva(), effetti: aggiungiEffetto([], 'forza', 2, 60000, 5000) };
    const s = salvataggioDiProva(p);
    expect(s.partita.effetti[0]!.fino).toBe(60000);
    const ripresa = dopoIlCaricamento(s.partita, 100);
    expect(ripresa.effetti[0]!.fino).toBe(60100);
  });

  it('gli effetti già finiti non si salvano', () => {
    const p = { ...partitaDiProva(), effetti: aggiungiEffetto([], 'forza', 2, 1000, 0) };
    expect(salvataggioDiProva(p).partita.effetti).toEqual([]);
  });

  it('chi salva nell\'istante della sconfitta riparte con la vita piena (§12: nessuna penalità)', () => {
    const p = partitaDiProva();
    const morta = { ...p, vita: { ...p.vita, attuale: 0 } };
    const ripresa = dopoIlCaricamento(salvataggioDiProva(morta).partita, 0);
    expect(ripresa.vita.attuale).toBe(ripresa.vita.massima);
  });

  it('una vita non piena resta com\'era', () => {
    const p = partitaDiProva();
    const ferita = { ...p, vita: { ...p.vita, attuale: 3 } };
    expect(dopoIlCaricamento(salvataggioDiProva(ferita).partita, 0).vita.attuale).toBe(3);
  });
});

describe('leggiSalvataggio: non fidarsi di ciò che arriva', () => {
  const casi: [string, string, RegExp][] = [
    ['testo che non è JSON', 'ciao{', /non è un salvataggio/i],
    ['JSON che non è un oggetto', '[1,2]', /non è un salvataggio/i],
    ['oggetto senza versione', '{"partita":{}}', /versione/i],
    ['versione dal futuro', JSON.stringify({ ...salvataggioDiProva(), versione: VERSIONE_SALVATAGGIO + 1 }), /più recente/i],
    ['senza partita', JSON.stringify({ ...salvataggioDiProva(), partita: null }), /rovinato/i],
    ['partita senza personaggio', JSON.stringify({ ...salvataggioDiProva(), partita: { monete: 3 } }), /rovinato/i],
    ['mappa mancante', JSON.stringify({ ...salvataggioDiProva(), mappa: 7 }), /rovinato/i],
  ];
  for (const [descrizione, testo, errore] of casi) {
    it(`${descrizione}: errore chiaro, nessuna eccezione`, () => {
      const letto = leggiSalvataggio(testo);
      expect(letto.ok).toBe(false);
      if (!letto.ok) expect(letto.errore).toMatch(errore);
    });
  }
});

describe('aggiorna: i salvataggi vecchi si aggiornano, come le migrazioni di un database', () => {
  // Una tabella finta: dalla versione 1 alla 2 è arrivato il campo "reputazione",
  // dalla 2 alla 3 le monete sono diventate "oro".
  const migrazioni: Migrazioni = {
    1: (d) => ({ ...d, versione: 2, partita: { ...(d.partita as object), reputazione: 0 } }),
    2: (d) => {
      const { monete, ...resto } = d.partita as { monete: number };
      return { ...d, versione: 3, partita: { ...resto, oro: monete } };
    },
  };

  it('applica in ordine tutte le migrazioni che servono', () => {
    const vecchio = { versione: 1, partita: { monete: 5 } };
    expect(aggiorna(vecchio, migrazioni, 3)).toEqual({ ok: true, dati: { versione: 3, partita: { reputazione: 0, oro: 5 } } });
  });

  it('un salvataggio già aggiornato non cambia', () => {
    const attuale = { versione: 3, partita: { oro: 1 } };
    expect(aggiorna(attuale, migrazioni, 3)).toEqual({ ok: true, dati: attuale });
  });

  it('se manca un passaggio lo dice, invece di caricare a metà', () => {
    const r = aggiorna({ versione: 0, partita: {} }, migrazioni, 3);
    expect(r.ok).toBe(false);
  });

  it('i campi aggiunti alla Partita dopo la creazione di un salvataggio vengono completati', () => {
    // Robustezza "gratis": se a un salvataggio della stessa versione manca un
    // elenco (es. porteAperte), si parte da vuoto invece di rompersi.
    const s = salvataggioDiProva();
    const { porteAperte: _tolto, ...senza } = s.partita;
    const letto = leggiSalvataggio(JSON.stringify({ ...s, partita: senza }));
    expect(letto.ok && letto.salvataggio.partita.porteAperte).toEqual([]);
  });
});

describe('gli slot nel browser', () => {
  let archivio: ReturnType<typeof archivioFinto>;
  beforeEach(() => {
    archivio = archivioFinto();
  });

  it('ci sono 3 slot, all\'inizio tutti vuoti', () => {
    expect(NUMERO_SLOT).toBe(3);
    expect(elencoSlot(archivio).map((s) => s.stato)).toEqual(['vuoto', 'vuoto', 'vuoto']);
  });

  it('gli slot sono indipendenti', () => {
    scriviSlot(archivio, 1, salvataggioDiProva());
    const mago = creaPartita('Merlino', magoDiProva, ['INT', 'SAG']);
    scriviSlot(archivio, 3, creaSalvataggio({ partita: mago, mappa: 'borgo', arrivo: '@', zona: 'Borgo Quercia', adesso: 0, data: DATA }));
    const elenco = elencoSlot(archivio);
    expect(elenco.map((s) => s.stato)).toEqual(['pieno', 'vuoto', 'pieno']);
    const uno = leggiSlot(archivio, 1);
    const tre = leggiSlot(archivio, 3);
    expect(uno.ok && uno.salvataggio.partita.personaggio.nome).toBe('Ale');
    expect(tre.ok && tre.salvataggio.partita.personaggio.nome).toBe('Merlino');
  });

  it('il riepilogo dice nome, classe, livello, zona e data', () => {
    scriviSlot(archivio, 2, salvataggioDiProva());
    expect(elencoSlot(archivio)[1]).toEqual({
      slot: 2,
      stato: 'pieno',
      riepilogo: { nome: 'Ale', classe: 'guerriero', livello: 1, zona: 'Bosco Nero', data: DATA.toISOString() },
    });
  });

  it('uno slot rovinato si vede come tale (e si può sovrascrivere)', () => {
    archivio.setItem('quercia-slot-2', '{rotto');
    expect(elencoSlot(archivio)[1]).toMatchObject({ slot: 2, stato: 'rovinato' });
    expect(scriviSlot(archivio, 2, salvataggioDiProva())).toEqual({ ok: true });
    expect(elencoSlot(archivio)[1]!.stato).toBe('pieno');
  });

  it('leggere uno slot vuoto dà un errore, non un\'eccezione', () => {
    const r = leggiSlot(archivio, 1);
    expect(r.ok).toBe(false);
  });

  it('eliminare libera lo slot', () => {
    scriviSlot(archivio, 1, salvataggioDiProva());
    eliminaSlot(archivio, 1);
    expect(elencoSlot(archivio)[0]!.stato).toBe('vuoto');
  });

  it('se il browser rifiuta di scrivere (spazio finito, modalità privata) lo dice', () => {
    const pieno: Archivio = { ...archivio, setItem: () => { throw new Error('QuotaExceededError'); } };
    const r = scriviSlot(pieno, 1, salvataggioDiProva());
    expect(r.ok).toBe(false);
  });

  it('uno slot fuori da 1–3 è un errore di programmazione', () => {
    expect(() => scriviSlot(archivio, 4, salvataggioDiProva())).toThrow();
  });

  it('"Continua" sceglie lo slot salvato più di recente', () => {
    expect(ultimoSlot(archivio)).toBeNull();
    const prima = new Date('2026-11-01T10:00:00Z');
    const dopo = new Date('2026-11-05T10:00:00Z');
    const p = partitaDiProva();
    scriviSlot(archivio, 1, creaSalvataggio({ partita: p, mappa: 'borgo', arrivo: '@', zona: 'Borgo', adesso: 0, data: dopo }));
    scriviSlot(archivio, 2, creaSalvataggio({ partita: p, mappa: 'borgo', arrivo: '@', zona: 'Borgo', adesso: 0, data: prima }));
    archivio.setItem('quercia-slot-3', 'rovinato');
    expect(ultimoSlot(archivio)).toBe(1);
  });
});

describe('esportazione', () => {
  it('il nome del file dice chi e a che livello, senza caratteri strani', () => {
    const p = creaPartita('Sir Àle/Primo', guerrieroDiProva, ['FOR', 'COS']);
    expect(nomeFileEsportazione(creaSalvataggio({ partita: p, mappa: 'borgo', arrivo: '@', zona: 'Borgo', adesso: 0, data: DATA })))
      .toBe('quercia-sir-ale-primo-liv1.json');
  });
});

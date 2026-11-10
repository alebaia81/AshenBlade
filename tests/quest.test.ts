import { describe, expect, it } from 'vitest';
import { creaInventario, type Inventario } from '../src/systems/inventario';
import {
  accetta,
  concludi,
  progresso,
  registraEvento,
  segnoSopra,
  statoDi,
  validaQuest,
  automatichePronte,
  type CatalogoQuest,
  type Quests,
} from '../src/systems/quest';

const catalogo: CatalogoQuest = {
  lupi: {
    id: 'lupi', nome: 'I lupi di Dario', tipo: 'secondaria', daChi: 'dario', descrizione: '',
    passi: [{ descrizione: 'Sconfiggi 3 lupi', obiettivo: { tipo: 'elimina', nemico: 'lupo', quantita: 3 } }],
    ricompensa: { monete: 40, esperienza: 60, oggetti: [{ id: 'pozione_forza', quantita: 1 }] },
  },
  erbe: {
    id: 'erbe', nome: 'Le erbe', tipo: 'secondaria', daChi: 'anselmo', descrizione: '',
    passi: [{ descrizione: 'Raccogli 5 erbe', obiettivo: { tipo: 'raccogli', oggetto: 'erba', quantita: 5 } }],
    ricompensa: { monete: 20, esperienza: 30 },
  },
  lettera: {
    id: 'lettera', nome: 'La lettera', tipo: 'secondaria', daChi: 'bruno', descrizione: '', richiede: ['lupi'],
    passi: [
      { descrizione: 'Porta la lettera a Ugo', obiettivo: { tipo: 'consegna', oggetto: 'lettera', a: 'ugo' } },
      { descrizione: 'Vai al cimitero', obiettivo: { tipo: 'raggiungi', mappa: 'cimitero' } },
      { descrizione: 'Apri il forziere', obiettivo: { tipo: 'trova', forziere: 'colline:3:4' } },
      { descrizione: 'Parla con Berta', obiettivo: { tipo: 'parla', a: 'berta' } },
    ],
    ricompensa: { monete: 10, esperienza: 10 },
    concludeDa: 'ugo',
  },
};

function zaino(...pile: [string, number][]): Inventario {
  const inv = creaInventario(4);
  pile.forEach(([id, quantita], i) => (inv.spazi[i] = { id, quantita }));
  return inv;
}
const diario = (quest: Quests = {}, inventario = zaino(), monete = 0) => ({ quest, inventario, monete });

describe('ciclo di vita', () => {
  it('disponibile → attiva; una quest che ne richiede un’altra aspetta che sia conclusa', () => {
    const inv = zaino();
    expect(statoDi('lupi', {}, catalogo, inv)).toBe('disponibile');
    expect(statoDi('lettera', {}, catalogo, inv)).toBe('non_disponibile');
    const q = accetta({}, 'lupi', catalogo);
    expect(statoDi('lupi', q, catalogo, inv)).toBe('attiva');
    expect(accetta(q, 'lupi', catalogo)).toBe(q); // due volte: nulla cambia
    expect(accetta({}, 'lettera', catalogo)).toEqual({}); // non ancora disponibile
    expect(statoDi('lettera', { lupi: { stato: 'conclusa', passo: 1, conteggio: 0 } }, catalogo, inv)).toBe('disponibile');
  });
});

describe('elimina', () => {
  it('contano solo i nemici giusti, e solo dopo aver accettato; al numero giusto è pronta', () => {
    let s = diario();
    s = registraEvento(s, { tipo: 'sconfitto', nemico: 'lupo' }, catalogo).stato; // prima di accettare
    s = { ...s, quest: accetta(s.quest, 'lupi', catalogo) };
    expect(s.quest['lupi']!.conteggio).toBe(0);
    s = registraEvento(s, { tipo: 'sconfitto', nemico: 'slime' }, catalogo).stato;
    const uno = registraEvento(s, { tipo: 'sconfitto', nemico: 'lupo' }, catalogo);
    expect(uno.avvisi).toEqual(['Sconfiggi 3 lupi: 1 / 3']);
    s = registraEvento(uno.stato, { tipo: 'sconfitto', nemico: 'lupo' }, catalogo).stato;
    const fine = registraEvento(s, { tipo: 'sconfitto', nemico: 'lupo' }, catalogo, (id) => (id === 'dario' ? 'Dario' : id));
    expect(statoDi('lupi', fine.stato.quest, catalogo, s.inventario)).toBe('pronta');
    expect(fine.avvisi.at(-1)).toMatch(/Torna da Dario/);
  });
});

describe('raccogli', () => {
  it('il progresso segue lo zaino; alla consegna gli oggetti vengono tolti', () => {
    const q = accetta({}, 'erbe', catalogo);
    expect(progresso(catalogo['erbe']!, q['erbe']!, zaino(['erba', 3]))).toEqual({ fatti: 3, servono: 5 });
    expect(statoDi('erbe', q, catalogo, zaino(['erba', 3]))).toBe('attiva');
    expect(statoDi('erbe', q, catalogo, zaino(['erba', 4], ['erba', 2]))).toBe('pronta');
    // Senza abbastanza erbe la consegna è rifiutata e nulla cambia.
    const poche = diario(q, zaino(['erba', 2]));
    expect(concludi(poche, 'erbe', catalogo, 0).ok).toBe(false);
    const esito = concludi(diario(q, zaino(['erba', 7])), 'erbe', catalogo, 0);
    expect(esito.ok).toBe(true);
    if (esito.ok) {
      expect(esito.stato.inventario.spazi[0]).toEqual({ id: 'erba', quantita: 2 });
      expect(esito.stato.quest['erbe']!.stato).toBe('conclusa');
      expect(esito.stato.monete).toBe(20);
      expect(esito.esperienza).toBe(30);
    }
  });
});

describe('quest a più passi: consegna, raggiungi, trova, parla', () => {
  const pronta = { lupi: { stato: 'conclusa' as const, passo: 1, conteggio: 0 } };
  it('avanza un passo alla volta, solo con l’evento giusto', () => {
    let s = diario(accetta(pronta, 'lettera', catalogo), zaino(['lettera', 1]));
    const passo = () => s.quest['lettera']!.passo;
    s = registraEvento(s, { tipo: 'raggiunto', mappa: 'cimitero' }, catalogo).stato; // non è ancora il suo turno
    expect(passo()).toBe(0);
    s = registraEvento(s, { tipo: 'parlato', abitante: 'berta' }, catalogo).stato;
    expect(passo()).toBe(0);
    s = registraEvento(s, { tipo: 'parlato', abitante: 'ugo' }, catalogo).stato; // consegna
    expect(passo()).toBe(1);
    expect(s.inventario.spazi[0]).toBeNull();
    s = registraEvento(s, { tipo: 'raggiunto', mappa: 'bosco' }, catalogo).stato;
    expect(passo()).toBe(1);
    s = registraEvento(s, { tipo: 'raggiunto', mappa: 'cimitero' }, catalogo).stato;
    s = registraEvento(s, { tipo: 'aperto', forziere: 'colline:9:9' }, catalogo).stato;
    expect(passo()).toBe(2);
    s = registraEvento(s, { tipo: 'aperto', forziere: 'colline:3:4' }, catalogo).stato;
    s = registraEvento(s, { tipo: 'parlato', abitante: 'berta' }, catalogo).stato;
    expect(statoDi('lettera', s.quest, catalogo, s.inventario)).toBe('pronta');
  });

  it('consegna senza l’oggetto: il passo non avanza', () => {
    const s = diario(accetta(pronta, 'lettera', catalogo), zaino());
    expect(registraEvento(s, { tipo: 'parlato', abitante: 'ugo' }, catalogo).stato.quest['lettera']!.passo).toBe(0);
  });
});

describe('ricompensa', () => {
  const lupiPronta: Quests = { lupi: { stato: 'attiva', passo: 1, conteggio: 0 } };
  it('le monete crescono del 5% per punto di CAR, al massimo del 25% (e calano col CAR negativo)', () => {
    const conMod = (m: number) => {
      const e = concludi(diario(lupiPronta), 'lupi', catalogo, m);
      return e.ok ? e.stato.monete : -1;
    };
    expect(conMod(0)).toBe(40);
    expect(conMod(2)).toBe(44);
    expect(conMod(9)).toBe(50);
    expect(conMod(-1)).toBe(38);
  });

  it('gli oggetti tornano al chiamante (zaino o terra); una quest non pronta non si conclude', () => {
    const e = concludi(diario(lupiPronta), 'lupi', catalogo, 0);
    expect(e.ok && e.oggetti).toEqual([{ id: 'pozione_forza', quantita: 1 }]);
    expect(concludi(diario(accetta({}, 'lupi', catalogo)), 'lupi', catalogo, 0).ok).toBe(false);
    expect(concludi(diario(), 'lupi', catalogo, 0).ok).toBe(false);
  });
});

describe('il segno sopra le persone', () => {
  const inv = zaino();
  it('! = ha una quest per te; ? giallo = pronta; ? grigio = attiva non finita; niente altrimenti', () => {
    expect(segnoSopra('dario', {}, catalogo, inv)).toBe('!');
    expect(segnoSopra('berta', {}, catalogo, inv)).toBeNull();
    const attiva = accetta({}, 'lupi', catalogo);
    expect(segnoSopra('dario', attiva, catalogo, inv)).toBe('?attiva');
    expect(segnoSopra('dario', { lupi: { stato: 'attiva', passo: 1, conteggio: 0 } }, catalogo, inv)).toBe('?');
    expect(segnoSopra('dario', { lupi: { stato: 'conclusa', passo: 1, conteggio: 0 } }, catalogo, inv)).toBeNull();
    // La lettera si conclude da Ugo, non da Bruno che la affida.
    const lettera = { lupi: { stato: 'conclusa' as const, passo: 1, conteggio: 0 }, lettera: { stato: 'attiva' as const, passo: 4, conteggio: 0 } };
    expect(segnoSopra('ugo', lettera, catalogo, inv)).toBe('?');
    expect(segnoSopra('bruno', lettera, catalogo, inv)).toBeNull();
  });
});

describe('validazione', () => {
  const conosce = { nemici: ['lupo'], oggetti: ['erba', 'lettera', 'pozione_forza'], abitanti: ['dario', 'anselmo', 'bruno', 'ugo', 'berta'], mappe: ['cimitero', 'colline'] };
  it('i dati di prova sono validi', () => {
    expect(validaQuest(catalogo, conosce)).toEqual([]);
  });
  it('trova anche forzieri e oggetti "di avvio" che non esistono', () => {
    const conForzieri = { ...conosce, forzieri: ['colline:9:9'] };
    expect(validaQuest(catalogo, conForzieri).join('\n')).toContain('colline:3:4');
    const conMappa: CatalogoQuest = { t: { ...catalogo['lupi']!, id: 't', siAccettaCon: 'mappa_finta', oggettiAllInizio: [{ id: 'lettera_finta', quantita: 1 }] } };
    const errori = validaQuest(conMappa, conosce).join('\n');
    expect(errori).toContain('mappa_finta');
    expect(errori).toContain('lettera_finta');
  });

  it('trova nemici, oggetti, persone e requisiti che non esistono; "raccogli" solo come ultimo passo', () => {
    const rotto: CatalogoQuest = {
      x: {
        ...catalogo['lettera']!, id: 'x', daChi: 'nessuno', richiede: ['boh'],
        passi: [
          { descrizione: '', obiettivo: { tipo: 'raccogli', oggetto: 'erba', quantita: 1 } },
          { descrizione: '', obiettivo: { tipo: 'elimina', nemico: 'drago', quantita: 1 } },
        ],
        ricompensa: { monete: 0, esperienza: 0, oggetti: [{ id: 'spada_finta', quantita: 1 }] },
      },
    };
    const errori = validaQuest(rotto, conosce).join('\n');
    for (const parola of ['nessuno', 'boh', 'drago', 'spada_finta', 'ultimo']) expect(errori).toContain(parola);
  });
});

describe('quest della mappa del tesoro (fase 7b)', () => {
  const tesoro: CatalogoQuest = {
    tesoro: {
      id: 'tesoro', nome: 'La mappa', tipo: 'secondaria', daChi: 'gemma', descrizione: '', siAccettaCon: 'mappa', automatica: true,
      passi: [{ descrizione: 'Trova il tesoro', obiettivo: { tipo: 'trova', forziere: 'colline:3:4' } }],
      ricompensa: { monete: 0, esperienza: 50 },
    },
  };
  const inv = creaInventario(2);
  it('niente segni sopra chi l’ha venduta: si accetta usando la mappa e si chiude da sola', () => {
    expect(segnoSopra('gemma', {}, tesoro, inv)).toBeNull();
    const q = accetta({}, 'tesoro', tesoro);
    expect(segnoSopra('gemma', q, tesoro, inv)).toBeNull();
    expect(automatichePronte(q, tesoro, inv)).toEqual([]);
    const trovato = registraEvento(diario(q, inv), { tipo: 'aperto', forziere: 'colline:3:4' }, tesoro).stato;
    expect(automatichePronte(trovato.quest, tesoro, inv)).toEqual(['tesoro']);
    expect(segnoSopra('gemma', trovato.quest, tesoro, inv)).toBeNull();
  });
});

describe('tascaMissioni con le quest', () => {
  it('consegna un oggetto presente in tascaMissioni parlando con l’abitante', () => {
    const qAttiva: Quests = { lettera: { stato: 'attiva', passo: 0, conteggio: 0 } };
    const statoIniziale = {
      quest: qAttiva,
      inventario: creaInventario(4),
      monete: 0,
      tascaMissioni: [{ id: 'lettera', quantita: 1 }],
    };

    const res = registraEvento(statoIniziale, { tipo: 'parlato', abitante: 'ugo' }, catalogo);
    expect(res.stato.quest['lettera']?.passo).toBe(1);
    expect(res.stato.tascaMissioni).toEqual([]);
  });

  it('riconosce lo stato pronta e conclude usando oggetti in tascaMissioni', () => {
    const qAttiva: Quests = { erbe: { stato: 'attiva', passo: 0, conteggio: 0 } };
    const stato = {
      quest: qAttiva,
      inventario: creaInventario(4),
      monete: 0,
      tascaMissioni: [{ id: 'erba', quantita: 5 }],
    };

    expect(statoDi('erbe', qAttiva, catalogo, stato.inventario, stato.tascaMissioni)).toBe('pronta');
    const esito = concludi(stato, 'erbe', catalogo, 0);
    expect(esito.ok).toBe(true);
    if (esito.ok) {
      expect(esito.stato.quest['erbe']?.stato).toBe('conclusa');
      expect(esito.stato.tascaMissioni).toEqual([]);
    }
  });
});

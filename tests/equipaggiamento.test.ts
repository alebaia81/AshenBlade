import { describe, expect, it } from 'vitest';
import {
  armaturaTotale,
  bonusCaratteristiche,
  conBonus,
  confrontaConAttuale,
  creaEquipaggiamento,
  effettiEquipaggiati,
  equipaggia,
  scambiaArmi,
  togliDa,
  type CatalogoIndossabili,
  type StatoZaino,
} from '../src/systems/equipaggiamento';
import { creaInventario, type Inventario } from '../src/systems/inventario';

// Un piccolo catalogo scritto qui: i test non dipendono dai numeri veri dei JSON.
const catalogo: CatalogoIndossabili = {
  spada: { categoria: 'arma', spazio: 'primaria', rarita: 'comune', armatura: 0, effetti: [], usaMana: false },
  lama_vuoto: { categoria: 'arma', spazio: 'primaria', rarita: 'esotica', armatura: 0, effetti: ['risucchio_vita'], usaMana: false },
  bastone: { categoria: 'arma', spazio: 'primaria', rarita: 'comune', armatura: 0, effetti: [], usaMana: true },
  arco: { categoria: 'arma', spazio: 'secondaria', rarita: 'comune', armatura: 0, effetti: [], usaMana: false },
  arco_rimbalzo: { categoria: 'arma', spazio: 'secondaria', rarita: 'esotica', armatura: 0, effetti: ['rimbalzo'], usaMana: false },
  elmo_ferro: { categoria: 'armatura', spazio: 'elmo', rarita: 'non_comune', armatura: 1, effetti: [], usaMana: false },
  elmo_corona: { categoria: 'armatura', spazio: 'elmo', rarita: 'leggendaria', armatura: 2, bonus: { COS: 1 }, effetti: [], usaMana: false },
  corazza_maglia: { categoria: 'armatura', spazio: 'corazza', rarita: 'rara', armatura: 3, effetti: [], usaMana: false },
  corazza_spine: { categoria: 'armatura', spazio: 'corazza', rarita: 'esotica', armatura: 2, effetti: ['spine'], usaMana: false },
  stivali_vento: { categoria: 'armatura', spazio: 'stivali', rarita: 'esotica', armatura: 1, effetti: ['doppia_capriola'], usaMana: false },
  guanti_titano: { categoria: 'armatura', spazio: 'guanti', rarita: 'leggendaria', armatura: 2, bonus: { FOR: 1 }, effetti: [], usaMana: false },
};

/** Zaino con questi oggetti (uno per spazio) e la spada in mano. */
function stato(ids: string[], capacita = 4): StatoZaino {
  const inventario: Inventario = creaInventario(capacita);
  ids.forEach((id, i) => (inventario.spazi[i] = { id, quantita: 1 }));
  return { inventario, equipaggiamento: creaEquipaggiamento('spada') };
}

function riuscito(esito: ReturnType<typeof equipaggia>): StatoZaino {
  if (!esito.ok) throw new Error(`atteso ok, errore: ${esito.errore}`);
  return esito.stato;
}

describe('equipaggia', () => {
  it('si parte con l’arma della classe e il resto vuoto', () => {
    expect(creaEquipaggiamento('spada')).toEqual({
      primaria: 'spada', secondaria: null, elmo: null, corazza: null, guanti: null, stivali: null,
    });
  });

  it('un’arma nuova va in mano e la vecchia torna nello stesso spazio dello zaino', () => {
    const s = riuscito(equipaggia(stato(['lama_vuoto']), 0, catalogo, { haMana: false }));
    expect(s.equipaggiamento.primaria).toBe('lama_vuoto');
    expect(s.inventario.spazi[0]).toEqual({ id: 'spada', quantita: 1 });
  });

  it('un pezzo nello spazio vuoto lascia libero lo spazio dello zaino', () => {
    const s = riuscito(equipaggia(stato(['elmo_ferro']), 0, catalogo, { haMana: false }));
    expect(s.equipaggiamento.elmo).toBe('elmo_ferro');
    expect(s.inventario.spazi[0]).toBeNull();
  });

  it('ogni oggetto va nel suo spazio: l’arco nella secondaria, la corazza nella corazza', () => {
    let s = riuscito(equipaggia(stato(['arco', 'corazza_maglia']), 0, catalogo, { haMana: false }));
    s = riuscito(equipaggia(s, 1, catalogo, { haMana: false }));
    expect(s.equipaggiamento).toMatchObject({ primaria: 'spada', secondaria: 'arco', corazza: 'corazza_maglia', elmo: null });
  });

  it('una seconda arma esotica viene rifiutata', () => {
    let s = riuscito(equipaggia(stato(['lama_vuoto', 'arco_rimbalzo']), 0, catalogo, { haMana: false }));
    const esito = equipaggia(s, 1, catalogo, { haMana: false });
    expect(esito.ok).toBe(false);
    if (!esito.ok) expect(esito.errore).toMatch(/una sola arma esotica/);
    // Ma un’arma esotica e un’armatura esotica insieme vanno bene.
    s = { ...s, inventario: { ...s.inventario, spazi: [...s.inventario.spazi] } };
    s.inventario.spazi[1] = { id: 'stivali_vento', quantita: 1 };
    expect(equipaggia(s, 1, catalogo, { haMana: false }).ok).toBe(true);
  });

  it('un secondo pezzo d’armatura esotico viene rifiutato', () => {
    const s = riuscito(equipaggia(stato(['corazza_spine', 'stivali_vento']), 0, catalogo, { haMana: false }));
    const esito = equipaggia(s, 1, catalogo, { haMana: false });
    expect(esito.ok).toBe(false);
    if (!esito.ok) expect(esito.errore).toMatch(/un solo pezzo d’armatura esotico/);
  });

  it('si può SOSTITUIRE l’esotica indossata con un’altra dello stesso spazio', () => {
    const catalogoBis: CatalogoIndossabili = { ...catalogo, corazza_drago: { ...catalogo.corazza_spine!, effetti: [] } };
    const s = riuscito(equipaggia(stato(['corazza_spine', 'corazza_drago']), 0, catalogoBis, { haMana: false }));
    const dopo = riuscito(equipaggia(s, 1, catalogoBis, { haMana: false }));
    expect(dopo.equipaggiamento.corazza).toBe('corazza_drago');
    expect(dopo.inventario.spazi[1]).toEqual({ id: 'corazza_spine', quantita: 1 });
  });

  it('un’arma che usa il mana non va a chi non ne ha', () => {
    expect(equipaggia(stato(['bastone']), 0, catalogo, { haMana: false }).ok).toBe(false);
    expect(equipaggia(stato(['bastone']), 0, catalogo, { haMana: true }).ok).toBe(true);
  });

  it('spazio vuoto o oggetto non indossabile: errore e nulla cambia', () => {
    expect(equipaggia(stato([]), 0, catalogo, { haMana: false }).ok).toBe(false);
    expect(equipaggia(stato(['pozione_vita']), 0, catalogo, { haMana: false }).ok).toBe(false);
  });

  it('non modifica lo stato ricevuto', () => {
    const prima = stato(['elmo_ferro']);
    equipaggia(prima, 0, catalogo, { haMana: false });
    expect(prima.equipaggiamento.elmo).toBeNull();
    expect(prima.inventario.spazi[0]).toEqual({ id: 'elmo_ferro', quantita: 1 });
  });

  it('si può scegliere di mettere un arco come arma primaria o una spada come secondaria', () => {
    const conArcoPrimario = riuscito(equipaggia(stato(['arco']), 0, catalogo, { haMana: false }, 'primaria'));
    expect(conArcoPrimario.equipaggiamento.primaria).toBe('arco');
    expect(conArcoPrimario.inventario.spazi[0]).toEqual({ id: 'spada', quantita: 1 });

    const conSpadaSecondaria = riuscito(equipaggia(conArcoPrimario, 0, catalogo, { haMana: false }, 'secondaria'));
    expect(conSpadaSecondaria.equipaggiamento).toMatchObject({ primaria: 'arco', secondaria: 'spada' });
  });

  it('scambiaArmi inverte primaria e secondaria se c’è una secondaria', () => {
    const conUnaSola = scambiaArmi(stato([]));
    expect(conUnaSola.ok).toBe(false);
    const conDue = riuscito(equipaggia(stato(['arco']), 0, catalogo, { haMana: false }));
    const scambiato = riuscito(scambiaArmi(conDue));
    expect(scambiato.equipaggiamento).toMatchObject({ primaria: 'arco', secondaria: 'spada' });
  });
});

describe('togliDa', () => {
  it('rimette il pezzo nel primo spazio libero dello zaino', () => {
    const s = riuscito(equipaggia(stato(['arco', 'elmo_ferro']), 1, catalogo, { haMana: false }));
    const esito = togliDa(s, 'elmo');
    expect(esito.ok).toBe(true);
    if (esito.ok) {
      expect(esito.stato.equipaggiamento.elmo).toBeNull();
      expect(esito.stato.inventario.spazi[1]).toEqual({ id: 'elmo_ferro', quantita: 1 });
    }
  });

  it('zaino pieno: non si può togliere', () => {
    const s = riuscito(equipaggia(stato(['elmo_ferro', 'arco'], 2), 0, catalogo, { haMana: false }));
    const pieno = { ...s, inventario: { ...s.inventario, spazi: [{ id: 'arco', quantita: 1 }, { id: 'arco', quantita: 1 }] } };
    const esito = togliDa(pieno, 'elmo');
    expect(esito.ok).toBe(false);
    if (!esito.ok) expect(esito.errore).toMatch(/[Zz]aino pieno/);
  });

  it('l’arma primaria non si toglie: serve sempre qualcosa in mano', () => {
    expect(togliDa(stato([]), 'primaria').ok).toBe(false);
  });

  it('spazio già vuoto: errore', () => {
    expect(togliDa(stato([]), 'guanti').ok).toBe(false);
  });
});

describe('numeri dell’equipaggiamento', () => {
  const pieno = {
    ...creaEquipaggiamento('lama_vuoto'),
    secondaria: 'arco_rimbalzo',
    elmo: 'elmo_corona',
    corazza: 'corazza_maglia',
    guanti: 'guanti_titano',
    stivali: 'stivali_vento',
  };

  it('armatura totale = somma dei pezzi (le armi non contano)', () => {
    expect(armaturaTotale(pieno, catalogo)).toBe(2 + 3 + 2 + 1);
    expect(armaturaTotale(creaEquipaggiamento('spada'), catalogo)).toBe(0);
  });

  it('i pezzi leggendari aggiungono punti alle caratteristiche', () => {
    expect(bonusCaratteristiche(pieno, catalogo)).toEqual({ COS: 1, FOR: 1 });
    const base = { FOR: 10, DES: 10, COS: 10, INT: 10, SAG: 10, CAR: 10 };
    expect(conBonus(base, { COS: 1, FOR: 1 })).toEqual({ ...base, FOR: 11, COS: 11 });
  });

  it('effetti: per categoria (armi o armature)', () => {
    expect(effettiEquipaggiati(pieno, catalogo, 'armatura')).toEqual(['doppia_capriola']);
    expect(effettiEquipaggiati(pieno, catalogo, 'arma').sort()).toEqual(['rimbalzo', 'risucchio_vita']);
  });
});

describe('confrontaConAttuale', () => {
  const armi = {
    spada_ferro: {
      id: 'spada_ferro', nome: 'Spada di ferro', slot: 'primaria', tipo: 'spada',
      caratteristica: 'FOR', bonusCritico: 0,
    },
    spadone_acciaio: {
      id: 'spadone_acciaio', nome: 'Spadone d’acciaio', slot: 'primaria', tipo: 'ascia',
      caratteristica: 'FOR', bonusCritico: 0.05,
    },
  } as unknown as Record<string, any>;

  const armature = {
    elmo_ferro: { id: 'elmo_ferro', nome: 'Elmo di ferro', pezzo: 'elmo', armatura: 1, bonus: {} },
    elmo_corona: { id: 'elmo_corona', nome: 'Corona d’oro', pezzo: 'elmo', armatura: 2, bonus: { FOR: 1, COS: 2 } },
  } as unknown as Record<string, any>;

  const car = { FOR: 12, DES: 10, COS: 10, INT: 10, SAG: 10, CAR: 10 };
  const equip = { ...creaEquipaggiamento('spada_ferro'), elmo: 'elmo_ferro' };

  it('confronta arma con l’arma attualmente impugnata', () => {
    const diff = confrontaConAttuale('spadone_acciaio', equip, armi, armature, car);
    expect(diff).not.toBeNull();
    if (diff && diff.tipo === 'arma') {
      expect(diff.nomeAttuale).toBe('Spada di ferro');
      expect(diff.deltaDanno).toBeGreaterThan(0);
      expect(diff.deltaCritico).toBe(5); // 0.05 = 5%
    }
  });

  it('confronta armatura con il pezzo attualmente indossato', () => {
    const diff = confrontaConAttuale('elmo_corona', equip, armi, armature, car);
    expect(diff).not.toBeNull();
    if (diff && diff.tipo === 'armatura') {
      expect(diff.nomeAttuale).toBe('Elmo di ferro');
      expect(diff.deltaArmatura).toBe(1); // 2 - 1 = 1
      expect(diff.deltaBonus).toEqual({ FOR: 1, COS: 2 });
    }
  });

  it('confronta arma con lo slot specifico (es. secondaria)', () => {
    const equipConSecondaria = { ...equip, secondaria: 'spadone_acciaio' };
    const diff = confrontaConAttuale('spada_ferro', equipConSecondaria, armi, armature, car, 'secondaria');
    expect(diff).not.toBeNull();
    if (diff && diff.tipo === 'arma') {
      expect(diff.spazio).toBe('secondaria');
      expect(diff.nomeAttuale).toBe('Spadone d’acciaio');
      expect(diff.deltaDanno).toBeLessThan(0);
    }
  });

  it('restituisce null se l’oggetto non è né arma né armatura', () => {
    expect(confrontaConAttuale('pozione_cura', equip, armi, armature, car)).toBeNull();
  });
});

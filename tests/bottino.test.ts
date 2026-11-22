import { describe, expect, it } from 'vitest';
import { bottinoBoss, ESOTICI_ERRANTI, possiedeOggetto, tiraBottino } from '../src/systems/bottino';
import { casualeFisso } from '../src/systems/casuale';
import { creaPartita } from '../src/systems/partita';
import { aggiungi } from '../src/systems/inventario';
import { guerrieroDiProva } from './aiuti/classi';

const tabella = [
  { oggetto: 'pozione_vita', probabilita: 0.2 },
  { oggetto: 'pozione_forza', probabilita: 0.05, quantita: 2 },
];

describe('tiraBottino', () => {
  it('ogni voce si tira a parte: cade se il casuale è sotto la probabilità', () => {
    expect(tiraBottino(tabella, casualeFisso([0.1, 0.9]))).toEqual([{ id: 'pozione_vita', quantita: 1 }]);
    expect(tiraBottino(tabella, casualeFisso([0.5, 0.01]))).toEqual([{ id: 'pozione_forza', quantita: 2 }]);
    expect(tiraBottino(tabella, casualeFisso([0.1, 0.01]))).toHaveLength(2);
  });

  it('esattamente sulla probabilità non cade', () => {
    expect(tiraBottino(tabella, casualeFisso([0.2, 0.05]))).toEqual([]);
  });

  it('tabella vuota: niente', () => {
    expect(tiraBottino([], casualeFisso([0]))).toEqual([]);
  });
});

describe('bottinoBoss (fase 10a)', () => {
  const boss = {
    id: 're_scheletro',
    bottino: [
      { oggetto: 'frammento_corona', probabilita: 1 },
      { oggetto: 'pagina_diario', probabilita: 1 },
    ],
    leggendari: ['elmo_corona', 'stivali_re_sepolto'],
    esoticoFirma: 'lama_vuoto',
  };

  it('prima sconfitta normale: 1 leggendario garantito, 1 frammento_eco e 25% di probabilità dell’esotico firma', () => {
    const p = creaPartita('Ale', guerrieroDiProva, ['FOR', 'COS']);
    // casuale: 0, 0 per il bottino normale; 0.1 per il leggendario (indice 0 = elmo_corona); 0.30 (>= 0.25, niente esotico)
    const senzaEsotico = bottinoBoss(boss, p, casualeFisso([0, 0, 0.1, 0.3]), false);
    expect(senzaEsotico).toEqual([
      { id: 'frammento_corona', quantita: 1 },
      { id: 'pagina_diario', quantita: 1 },
      { id: 'elmo_corona', quantita: 1 },
      { id: 'frammento_eco', quantita: 1 },
    ]);

    // casuale: 0, 0 per il bottino normale; 0.8 per il leggendario (indice 1 = stivali_re_sepolto); 0.24 (< 0.25, esce esotico firma)
    const conEsotico = bottinoBoss(boss, p, casualeFisso([0, 0, 0.8, 0.24]), false);
    expect(conEsotico).toEqual([
      { id: 'frammento_corona', quantita: 1 },
      { id: 'pagina_diario', quantita: 1 },
      { id: 'stivali_re_sepolto', quantita: 1 },
      { id: 'lama_vuoto', quantita: 1 },
      { id: 'frammento_eco', quantita: 1 },
    ]);
  });

  it('non lascia mai un secondo esotico firma se l’eroe lo possiede già (anche potenziato +2 o indossato)', () => {
    const p = creaPartita('Ale', guerrieroDiProva, ['FOR', 'COS']);
    const conArmaPotenziata = { ...p, equipaggiamento: { ...p.equipaggiamento, primaria: 'lama_vuoto+2' } };
    expect(possiedeOggetto(conArmaPotenziata, 'lama_vuoto')).toBe(true);
    // Anche con casuale 0.01 (< 0.25), lama_vuoto non cade di nuovo.
    const bottino = bottinoBoss(boss, conArmaPotenziata, casualeFisso([0, 0, 0.1, 0.01]), false);
    expect(bottino.map((b) => b.id)).not.toContain('lama_vuoto');
  });

  it('prima vittoria contro l’Eco: garantisce l’esotico firma se non posseduto', () => {
    const p = creaPartita('Ale', guerrieroDiProva, ['FOR', 'COS']);
    const bottino = bottinoBoss(boss, p, casualeFisso([0.5]), true);
    expect(bottino).toEqual([{ id: 'lama_vuoto', quantita: 1 }]);
  });

  it('prima vittoria contro l’Eco: se possiedi già l’esotico firma, dà un esotico errante non posseduto', () => {
    let p = creaPartita('Ale', guerrieroDiProva, ['FOR', 'COS']);
    p = { ...p, inventario: aggiungi(p.inventario, 'lama_vuoto', 1, 1).inventario };
    p = { ...p, inventario: aggiungi(p.inventario, 'spada_brace', 1, 1).inventario };
    const bottino = bottinoBoss(boss, p, casualeFisso([0]), true);
    expect(bottino).toHaveLength(1);
    expect(bottino[0]!.id).not.toBe('lama_vuoto');
    expect(bottino[0]!.id).not.toBe('spada_brace');
    expect(ESOTICI_ERRANTI).toContain(bottino[0]!.id);
  });

  it('prima vittoria contro l’Eco: se possiedi già l’esotico firma e tutti gli erranti, dà 2 frammenti d’eco', () => {
    let p = creaPartita('Ale', guerrieroDiProva, ['FOR', 'COS']);
    for (const id of ['lama_vuoto', ...ESOTICI_ERRANTI]) {
      p = { ...p, inventario: aggiungi(p.inventario, id, 1, 1).inventario };
    }
    const bottino = bottinoBoss(boss, p, casualeFisso([0]), true);
    expect(bottino).toEqual([{ id: 'frammento_eco', quantita: 2 }]);
  });

  it('vittorie Eco successive: danno un leggendario della lista e mai l’esotico', () => {
    const p = { ...creaPartita('Ale', guerrieroDiProva, ['FOR', 'COS']), ecoSconfitti: ['re_scheletro'] };
    const bottino = bottinoBoss(boss, p, casualeFisso([0.9]), true);
    expect(bottino).toEqual([{ id: 'stivali_re_sepolto', quantita: 1 }]);
  });
});

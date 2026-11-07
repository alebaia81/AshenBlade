import { describe, expect, it } from 'vitest';
import { bersaglioCompagno, decidiCompagno } from '../../src/systems/ia/compagno';

const par = { raggioCaccia: 100, distanzaSeguire: 28, portata: 16 };

describe('mente del compagno', () => {
  it('sceglie il nemico più vicino all’EROE (non a sé) entro il raggio', () => {
    const eroe = { x: 0, y: 0 };
    const nemici = [
      { id: 1, posizione: { x: 90, y: 0 } },
      { id: 2, posizione: { x: -40, y: 0 } },
      { id: 3, posizione: { x: 300, y: 0 } },
    ];
    expect(bersaglioCompagno(eroe, nemici, 100)).toBe(2);
    expect(bersaglioCompagno(eroe, [nemici[2]!], 100)).toBeNull();
  });

  it('con un bersaglio a portata attacca, altrimenti gli si avvicina', () => {
    const nemici = [{ id: 7, posizione: { x: 50, y: 0 } }];
    expect(decidiCompagno({ posizione: { x: 40, y: 0 }, eroe: { x: 0, y: 0 }, nemici }, par)).toEqual({ tipo: 'attacca', id: 7, verso: { x: 50, y: 0 } });
    expect(decidiCompagno({ posizione: { x: -30, y: 0 }, eroe: { x: 0, y: 0 }, nemici }, par)).toEqual({ tipo: 'avvicinati', id: 7, verso: { x: 50, y: 0 } });
  });

  it('la portata si misura dal bordo del nemico: in diagonale i corpi si toccano già prima', () => {
    // Bug trovato dalla prova nel browser: Corrado (portata 14) si fermava contro
    // uno slime in diagonale a 14,6 px di centro-centro e non colpiva mai.
    const nemici = [{ id: 3, posizione: { x: 14, y: 4 }, ingombro: 5 }];
    const qui = { posizione: { x: 0, y: 0 }, eroe: { x: 0, y: 0 }, nemici };
    expect(decidiCompagno(qui, { ...par, portata: 14 }).tipo).toBe('attacca');
    expect(decidiCompagno({ ...qui, nemici: [{ ...nemici[0]!, ingombro: 0 }] }, { ...par, portata: 14 }).tipo).toBe('avvicinati');
  });

  it('senza nemici segue l’eroe, ma si ferma a due tessere da lui', () => {
    const lontano = decidiCompagno({ posizione: { x: 100, y: 0 }, eroe: { x: 0, y: 0 }, nemici: [] }, par);
    expect(lontano).toEqual({ tipo: 'segui', verso: { x: 0, y: 0 } });
    expect(decidiCompagno({ posizione: { x: 20, y: 0 }, eroe: { x: 0, y: 0 }, nemici: [] }, par)).toEqual({ tipo: 'fermo' });
  });
});

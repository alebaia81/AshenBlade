import { describe, expect, it } from 'vitest';
import { creaInventario, type Inventario } from '../src/systems/inventario';
import { apriConChiave, apriPorta, portaAperta } from '../src/systems/porte';

function zaino(...pile: [string, number][]): Inventario {
  const inv = creaInventario(4);
  pile.forEach(([id, quantita], i) => (inv.spazi[i] = { id, quantita }));
  return inv;
}

describe('serrature', () => {
  it('senza la chiave resta chiusa, e dice quale chiave serve', () => {
    const esito = apriConChiave(zaino(['pozione_vita', 1]), { chiave: 'chiave_ossa', consuma: false });
    expect(esito.ok).toBe(false);
    if (!esito.ok) expect(esito.manca).toBe('chiave_ossa');
  });

  it('una porta si apre con la sua chiave, che resta nello zaino', () => {
    const inv = zaino(['chiave_ossa', 1]);
    const esito = apriConChiave(inv, { chiave: 'chiave_ossa', consuma: false });
    expect(esito.ok && esito.come).toBe('chiave');
    expect(esito.ok && esito.inventario).toBe(inv);
  });

  it('un forziere chiuso consuma una chiave piccola', () => {
    const esito = apriConChiave(zaino(['chiave_piccola', 2]), { chiave: 'chiave_piccola', consuma: true });
    expect(esito.ok && esito.inventario.spazi[0]).toEqual({ id: 'chiave_piccola', quantita: 1 });
  });

  it('Volpe apre i forzieri chiusi anche senza chiave (e la chiave non si consuma)', () => {
    const inv = zaino(['chiave_piccola', 1]);
    const esito = apriConChiave(inv, { chiave: 'chiave_piccola', consuma: true }, { scassinatore: true });
    expect(esito.ok && esito.come).toBe('volpe');
    expect(esito.ok && esito.inventario).toBe(inv);
  });
});

describe('porte aperte per sempre', () => {
  it('una volta aperta resta aperta (anche cambiando mappa: sta nella Partita)', () => {
    const p = { porteAperte: [] as string[] };
    const dopo = apriPorta(p, 'cimitero:12:12');
    expect(portaAperta(dopo, 'cimitero:12:12')).toBe(true);
    expect(portaAperta(p, 'cimitero:12:12')).toBe(false);
    expect(apriPorta(dopo, 'cimitero:12:12')).toBe(dopo);
  });
});

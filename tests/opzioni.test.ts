import { describe, expect, it } from 'vitest';
import { leggiOpzioni, OPZIONI_PREDEFINITE, scriviOpzioni } from '../src/systems/opzioni';
import type { Archivio } from '../src/systems/salvataggio';

function archivioFinto(): Archivio {
  const dati = new Map<string, string>();
  return { getItem: (k) => dati.get(k) ?? null, setItem: (k, v) => void dati.set(k, v), removeItem: (k) => void dati.delete(k) };
}

describe('opzioni', () => {
  it('la prima volta valgono quelle predefinite', () => {
    expect(leggiOpzioni(archivioFinto())).toEqual(OPZIONI_PREDEFINITE);
  });

  it('si ricordano', () => {
    const a = archivioFinto();
    scriviOpzioni(a, { ...OPZIONI_PREDEFINITE, salvataggioAutomatico: false });
    expect(leggiOpzioni(a).salvataggioAutomatico).toBe(false);
  });

  it('testo rovinato o valori del tipo sbagliato: si usano i predefiniti', () => {
    const a = archivioFinto();
    a.setItem('quercia-opzioni', '{rotto');
    expect(leggiOpzioni(a)).toEqual(OPZIONI_PREDEFINITE);
    a.setItem('quercia-opzioni', JSON.stringify({ salvataggioAutomatico: 'forse', mostraIntroduzione: false, sconosciuta: 1 }));
    expect(leggiOpzioni(a)).toEqual({ ...OPZIONI_PREDEFINITE, salvataggioAutomatico: true, mostraIntroduzione: false });
  });

  it('i volumi restano tra 0 e 1', () => {
    const a = archivioFinto();
    a.setItem('quercia-opzioni', JSON.stringify({ volumeMusica: 7, volumeEffetti: -2 }));
    expect(leggiOpzioni(a)).toMatchObject({ volumeMusica: 1, volumeEffetti: 0 });
    a.setItem('quercia-opzioni', JSON.stringify({ volumeMusica: 0.3 }));
    expect(leggiOpzioni(a).volumeMusica).toBe(0.3);
  });

  it('se il browser non lascia scrivere lo dice, senza eccezioni', () => {
    const a: Archivio = { ...archivioFinto(), setItem: () => { throw new Error('quota'); } };
    expect(scriviOpzioni(a, OPZIONI_PREDEFINITE)).toBe(false);
  });
});

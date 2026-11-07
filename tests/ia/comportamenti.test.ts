import { describe, expect, it } from 'vitest';
import { comportamentoEsiste, creaMente } from '../../src/systems/ia/comportamenti';

describe('registro dei comportamenti', () => {
  const parametri = { velocita: 50, raggioVista: 80, raggioAbbandono: 150 };

  it('conosce l’inseguitore', () => {
    expect(comportamentoEsiste('inseguitore')).toBe(true);
    const mente = creaMente('inseguitore', parametri);
    expect(typeof mente).toBe('function');
  });

  it('dalla fase 8b conosce anche il tiratore e il caricatore', () => {
    expect(comportamentoEsiste('tiratore')).toBe(true);
    expect(comportamentoEsiste('caricatore')).toBe(true);
    const tiratore = creaMente('tiratore', { ...parametri, tiro: { distanzaMin: 10, distanzaMax: 60, ricaricaMs: 500 } });
    expect(tiratore({ posizione: { x: 0, y: 0 }, casa: { x: 0, y: 0 }, bersaglio: { x: 40, y: 0 }, adesso: 0 }).tira).toEqual({ x: 1, y: 0 });
  });

  it('un nome sconosciuto dà un errore che lo cita', () => {
    expect(comportamentoEsiste('volante')).toBe(false);
    expect(() => creaMente('volante', parametri)).toThrow(/"volante"/);
  });
});

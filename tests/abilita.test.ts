import { describe, expect, it } from 'vitest';
import { creaStatoAbilita, frazioneRicarica, puòUsare, usa } from '../src/systems/abilita';
import { creaRisorsa, consuma } from '../src/systems/risorsa';

const palla = { ricaricaMs: 2000, costoMana: 6 };
const parata = { ricaricaMs: 3000, costoMana: 0 };

describe('abilità di classe: ricarica e costo', () => {
  it('all’inizio è pronta', () => {
    expect(puòUsare(creaStatoAbilita(), palla, 0, creaRisorsa(10))).toBe('pronta');
    expect(frazioneRicarica(creaStatoAbilita(), palla, 0)).toBe(0);
  });

  it('dopo l’uso serve la ricarica', () => {
    const s = usa(creaStatoAbilita(), palla, 1000);
    expect(puòUsare(s, palla, 2999, creaRisorsa(10))).toBe('in ricarica');
    expect(puòUsare(s, palla, 3000, creaRisorsa(10))).toBe('pronta');
  });

  it('la frazione di ricarica scende da 1 a 0', () => {
    const s = usa(creaStatoAbilita(), palla, 1000);
    expect(frazioneRicarica(s, palla, 1000)).toBe(1);
    expect(frazioneRicarica(s, palla, 2000)).toBe(0.5);
    expect(frazioneRicarica(s, palla, 5000)).toBe(0);
  });

  it('senza mana sufficiente non si usa', () => {
    expect(puòUsare(creaStatoAbilita(), palla, 0, consuma(creaRisorsa(10), 5))).toBe('mana insufficiente');
  });

  it('le abilità senza costo non guardano il mana (il Guerriero ha mana 0)', () => {
    expect(puòUsare(creaStatoAbilita(), parata, 0, creaRisorsa(0))).toBe('pronta');
  });
});

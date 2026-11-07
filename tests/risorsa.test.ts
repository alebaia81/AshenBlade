import { describe, expect, it } from 'vitest';
import { basta, consuma, creaRisorsa, èEsaurita, recupera } from '../src/systems/risorsa';

// Una "risorsa" è qualcosa che si consuma e si recupera fino a un massimo:
// la vita e (dalla fase 3c) il mana.
describe('risorsa', () => {
  it('si parte piena', () => {
    expect(creaRisorsa(20)).toEqual({ attuale: 20, massima: 20 });
  });

  it('consumare toglie, senza scendere sotto 0', () => {
    expect(consuma(creaRisorsa(20), 6).attuale).toBe(14);
    expect(consuma(creaRisorsa(5), 9).attuale).toBe(0);
  });

  it('a 0 è esaurita, sopra no', () => {
    expect(èEsaurita(consuma(creaRisorsa(5), 5))).toBe(true);
    expect(èEsaurita(consuma(creaRisorsa(5), 4))).toBe(false);
  });

  it('recuperare non supera il massimo', () => {
    expect(recupera(consuma(creaRisorsa(20), 3), 10).attuale).toBe(20);
    expect(recupera(consuma(creaRisorsa(20), 10), 4).attuale).toBe(14);
  });

  it('basta per una certa quantità?', () => {
    expect(basta(creaRisorsa(5), 5)).toBe(true);
    expect(basta(consuma(creaRisorsa(5), 1), 5)).toBe(false);
  });

  it('non modifica l’oggetto originale', () => {
    const r = creaRisorsa(10);
    consuma(r, 3);
    expect(r.attuale).toBe(10);
  });
});

import { describe, expect, it } from 'vitest';
import { creaStatoTiratore, decidiTiratore, type ParametriTiratore } from '../../src/systems/ia/tiratore';

const par: ParametriTiratore = { velocita: 40, raggioVista: 120, raggioAbbandono: 200, tiro: { distanzaMin: 50, distanzaMax: 100, ricaricaMs: 1000 } };
const qui = { x: 0, y: 0 };
const percezione = (bx: number, adesso = 0, lineaLibera = true) => ({ posizione: qui, casa: qui, bersaglio: { x: bx, y: 0 }, adesso, lineaLibera });

describe('tiratore', () => {
  it('lontano dall’eroe (oltre la vista) resta a riposo', () => {
    const { azione } = decidiTiratore(creaStatoTiratore(), percezione(300), par);
    expect(azione.velocita).toEqual({ x: 0, y: 0 });
    expect(azione.tira).toBeUndefined();
  });

  it('troppo vicino si allontana; troppo lontano si avvicina', () => {
    expect(decidiTiratore(creaStatoTiratore(), percezione(30), par).azione.velocita.x).toBeLessThan(0);
    expect(decidiTiratore(creaStatoTiratore(), percezione(115), par).azione.velocita.x).toBeGreaterThan(0);
  });

  it('alla distanza giusta si ferma e tira verso l’eroe, poi aspetta la ricarica', () => {
    const primo = decidiTiratore(creaStatoTiratore(), percezione(80, 0), par);
    expect(primo.azione.velocita).toEqual({ x: 0, y: 0 });
    expect(primo.azione.tira).toEqual({ x: 1, y: 0 });
    expect(decidiTiratore(primo.stato, percezione(80, 500), par).azione.tira).toBeUndefined();
    expect(decidiTiratore(primo.stato, percezione(80, 1000), par).azione.tira).toBeDefined();
  });

  it('senza linea di tiro (un muro in mezzo) non tira: si sposta verso l’eroe', () => {
    const { azione } = decidiTiratore(creaStatoTiratore(), percezione(80, 0, false), par);
    expect(azione.tira).toBeUndefined();
    expect(azione.velocita.x).toBeGreaterThan(0);
  });
});

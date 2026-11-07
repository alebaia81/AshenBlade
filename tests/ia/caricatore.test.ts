import { describe, expect, it } from 'vitest';
import { creaStatoCaricatore, decidiCaricatore, type ParametriCaricatore } from '../../src/systems/ia/caricatore';

const par: ParametriCaricatore = { velocita: 30, raggioVista: 120, raggioAbbandono: 200, carica: { distanza: 80, miraMs: 500, scattoMs: 300, velocita: 200, stancoMs: 600 } };
const qui = { x: 0, y: 0 };
const p = (bx: number, adesso: number) => ({ posizione: qui, casa: qui, bersaglio: { x: bx, y: 0 }, adesso, lineaLibera: true });

describe('caricatore', () => {
  it('lontano si avvicina piano; a distanza di carica si ferma e mira', () => {
    expect(decidiCaricatore(creaStatoCaricatore(), p(110, 0), par).azione.velocita.x).toBe(30);
    const mira = decidiCaricatore(creaStatoCaricatore(), p(70, 0), par);
    expect(mira.azione.velocita).toEqual({ x: 0, y: 0 });
    expect(mira.azione.stato).toBe('mira');
  });

  it('dopo la mira scatta in linea retta, poi resta stanco, poi riparte', () => {
    let s = decidiCaricatore(creaStatoCaricatore(), p(70, 0), par).stato;
    const scatto = decidiCaricatore(s, p(70, 500), par);
    expect(scatto.azione.velocita).toEqual({ x: 200, y: 0 });
    s = scatto.stato;
    // Durante lo scatto la direzione non cambia anche se l'eroe si sposta (si schiva!).
    expect(decidiCaricatore(s, p(-70, 600), par).azione.velocita).toEqual({ x: 200, y: 0 });
    const stanco = decidiCaricatore(s, p(70, 800), par);
    expect(stanco.azione.velocita).toEqual({ x: 0, y: 0 });
    expect(stanco.azione.stato).toBe('stanco');
    expect(decidiCaricatore(stanco.stato, p(110, 1400), par).azione.stato).toBe('insegue');
  });
});

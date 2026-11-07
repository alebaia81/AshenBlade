import { describe, expect, it } from 'vitest';
import { creaMenteInseguitore, decidiInseguitore } from '../../src/systems/ia/inseguitore';

const parametri = { velocita: 50, raggioVista: 80, raggioAbbandono: 150 };
const casa = { x: 100, y: 100 };

describe('decidiInseguitore', () => {
  it('a riposo, eroe lontano: resta fermo', () => {
    const d = decidiInseguitore('riposo', { posizione: casa, casa, bersaglio: { x: 300, y: 100 } }, parametri);
    expect(d).toEqual({ modalita: 'riposo', velocita: { x: 0, y: 0 } });
  });

  it('eroe nel raggio di vista: insegue verso di lui a velocità piena', () => {
    const d = decidiInseguitore('riposo', { posizione: casa, casa, bersaglio: { x: 160, y: 100 } }, parametri);
    expect(d.modalita).toBe('insegue');
    expect(d.velocita.x).toBeCloseTo(50);
    expect(d.velocita.y).toBeCloseTo(0);
  });

  it('in diagonale la velocità totale non cambia', () => {
    const d = decidiInseguitore('insegue', { posizione: casa, casa, bersaglio: { x: 140, y: 140 } }, parametri);
    expect(Math.hypot(d.velocita.x, d.velocita.y)).toBeCloseTo(50);
  });

  it('eroe oltre il raggio di abbandono: torna verso casa', () => {
    const lontano = { x: 400, y: 100 };
    const d = decidiInseguitore('insegue', { posizione: { x: 200, y: 100 }, casa, bersaglio: lontano }, parametri);
    expect(d.modalita).toBe('ritorno');
    expect(d.velocita.x).toBeCloseTo(-50);
  });

  it('tra vista e abbandono continua a inseguire', () => {
    const d = decidiInseguitore('insegue', { posizione: casa, casa, bersaglio: { x: 220, y: 100 } }, parametri);
    expect(d.modalita).toBe('insegue');
  });

  it('arrivato a casa si ferma e torna a riposo', () => {
    const d = decidiInseguitore('ritorno', { posizione: { x: 101, y: 100 }, casa, bersaglio: { x: 500, y: 500 } }, parametri);
    expect(d).toEqual({ modalita: 'riposo', velocita: { x: 0, y: 0 } });
  });

  it('senza bersaglio (eroe sconfitto) torna a casa', () => {
    const d = decidiInseguitore('insegue', { posizione: { x: 150, y: 100 }, casa, bersaglio: null }, parametri);
    expect(d.modalita).toBe('ritorno');
  });
});

describe('creaMenteInseguitore', () => {
  it('ricorda la modalità tra un fotogramma e l’altro', () => {
    const mente = creaMenteInseguitore(parametri);
    mente({ posizione: casa, casa, bersaglio: { x: 160, y: 100 } });
    // Ora l'eroe è a 120 px: fuori dalla vista ma dentro l'abbandono → continua a inseguire
    const v = mente({ posizione: casa, casa, bersaglio: { x: 220, y: 100 } });
    expect(v.x).toBeCloseTo(50);
  });
});

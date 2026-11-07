import { describe, expect, it } from 'vitest';
import {
  durataBrano,
  frequenza,
  leggiVoce,
  noteNellIntervallo,
  preparaBrano,
  validaMusica,
  type DatiMusica,
} from '../src/systems/sequenze';

describe('frequenza', () => {
  it('il La centrale (A4) è 440 Hz', () => {
    expect(frequenza('A4')).toBeCloseTo(440);
  });

  it('un\'ottava sopra raddoppia, una sotto dimezza', () => {
    expect(frequenza('A5')).toBeCloseTo(880);
    expect(frequenza('A3')).toBeCloseTo(220);
  });

  it('il Do centrale (C4) e i diesis', () => {
    expect(frequenza('C4')).toBeCloseTo(261.63, 1);
    expect(frequenza('C#4')).toBeCloseTo(277.18, 1);
    expect(frequenza('F#2')).toBeCloseTo(92.5, 1);
  });

  it('una nota scritta male è un errore chiaro', () => {
    expect(() => frequenza('H4')).toThrow(/H4/);
    expect(() => frequenza('C')).toThrow();
  });
});

describe('leggiVoce', () => {
  it('nota:durata in battiti, una dopo l\'altra', () => {
    expect(leggiVoce('C4:1 E4:0.5 G4:2.5')).toEqual([
      { nota: 'C4', inizio: 0, durata: 1 },
      { nota: 'E4', inizio: 1, durata: 0.5 },
      { nota: 'G4', inizio: 1.5, durata: 2.5 },
    ]);
  });

  it('"-" è una pausa: fa passare il tempo ma non suona', () => {
    expect(leggiVoce('C4:1 -:2 E4:1')).toEqual([
      { nota: 'C4', inizio: 0, durata: 1 },
      { nota: 'E4', inizio: 3, durata: 1 },
    ]);
  });

  it('[ … ]*n ripete un gruppo, come un ritornello', () => {
    expect(leggiVoce('[C3:0.5 C4:0.5]*2 G3:1').map((e) => `${e.nota}@${e.inizio}`)).toEqual(['C3@0', 'C4@0.5', 'C3@1', 'C4@1.5', 'G3@2']);
  });

  it('spazi e a capo in più non contano', () => {
    expect(leggiVoce('  C4:1\n   D4:1  ')).toHaveLength(2);
  });

  it('errori leggibili: durata mancante, nota sbagliata, parentesi aperta', () => {
    expect(() => leggiVoce('C4')).toThrow(/C4/);
    expect(() => leggiVoce('X4:1')).toThrow(/X4/);
    expect(() => leggiVoce('[C4:1')).toThrow(/parentesi/);
  });
});

const brano = { bpm: 120, voci: [{ onda: 'square' as const, volume: 0.2, note: 'C4:1 -:1 E4:2' }, { onda: 'triangle' as const, volume: 0.3, note: 'C2:4' }] };

describe('preparaBrano', () => {
  it('a 120 battiti al minuto un battito dura mezzo secondo', () => {
    const p = preparaBrano(brano);
    expect(p.durata).toBe(2); // 4 battiti
    expect(p.note.filter((n) => n.voce === 0).map((n) => [n.inizio, n.durata])).toEqual([
      [0, 0.5],
      [1, 1],
    ]);
    expect(p.note.find((n) => n.voce === 1)).toMatchObject({ frequenza: expect.closeTo(65.4, 1), durata: 2, onda: 'triangle', volume: 0.3 });
  });

  it('la durata del brano è quella della voce più lunga', () => {
    expect(durataBrano({ bpm: 60, voci: [{ onda: 'sine', volume: 1, note: 'C4:1' }, { onda: 'sine', volume: 1, note: 'C4:3' }] })).toBe(3);
  });
});

describe('noteNellIntervallo: cosa suonare nei prossimi istanti', () => {
  const p = preparaBrano(brano); // durata 2 s: note a 0 (C4, C2) e a 1 (E4)

  it('solo le note che cominciano nell\'intervallo [da, a)', () => {
    expect(noteNellIntervallo(p, 0, 0.5).map((n) => n.inizio)).toEqual([0, 0]);
    expect(noteNellIntervallo(p, 0.5, 1.5).map((n) => n.inizio)).toEqual([1]);
    expect(noteNellIntervallo(p, 1, 1)).toEqual([]);
  });

  it('il brano ricomincia da capo: dopo 2 s le note tornano, spostate di 2 s', () => {
    expect(noteNellIntervallo(p, 1.5, 3.2).map((n) => n.inizio)).toEqual([2, 2, 3]);
    expect(noteNellIntervallo(p, 10, 10.1).map((n) => n.inizio)).toEqual([10, 10]);
  });

  it('intervalli consecutivi non ripetono e non perdono note', () => {
    let tutte = 0;
    // 0.125 si scrive esatto in binario: 64 pezzi coprono [0, 8) senza arrotondamenti.
    for (let i = 0; i < 64; i++) tutte += noteNellIntervallo(p, i * 0.125, (i + 1) * 0.125).length;
    expect(tutte).toBe(12); // 3 note per giro, 4 giri in 8 secondi
  });
});

describe('validaMusica', () => {
  const dati: DatiMusica = {
    brani: { villaggio: brano },
    zone: { menu: 'villaggio', borgo: 'villaggio' },
    effetti: { bip: [{ onda: 'square', da: 1000, a: 1000, durata: 0.1, volume: 0.2 }] },
  };

  it('dati coerenti: nessun errore', () => {
    expect(validaMusica(dati, ['borgo'], ['bip'])).toEqual([]);
  });

  it('una mappa senza musica, un brano inesistente, un effetto mancante', () => {
    const errori = validaMusica({ ...dati, zone: { ...dati.zone, radura: 'bosco' } }, ['borgo', 'radura', 'cripta'], ['bip', 'colpo']);
    expect(errori).toEqual([
      'musica.json: la zona "radura" usa il brano "bosco", che non esiste',
      'musica.json: manca la musica della mappa "cripta"',
      'musica.json: manca l\'effetto "colpo"',
    ]);
  });

  it('note scritte male e onde sconosciute', () => {
    const rotto: DatiMusica = { ...dati, brani: { villaggio: { bpm: 0, voci: [{ onda: 'flauto' as never, volume: 0.2, note: 'C4:1 Z9:1' }] } } };
    const errori = validaMusica(rotto, ['borgo'], ['bip']);
    expect(errori.some((e) => /bpm/.test(e))).toBe(true);
    expect(errori.some((e) => /flauto/.test(e))).toBe(true);
    expect(errori.some((e) => /Z9/.test(e))).toBe(true);
  });

  it('effetti: durata e volume sensati', () => {
    const errori = validaMusica({ ...dati, effetti: { bip: [{ onda: 'square', da: 1000, a: 1000, durata: 0, volume: 3 }] } }, ['borgo'], ['bip']);
    expect(errori).toHaveLength(2);
  });
});

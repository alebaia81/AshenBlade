import { describe, expect, it } from 'vitest';
import { esitoRisposta, nodoIniziale, risposteVisibili, scegli, validaDialogo, type Dialogo } from '../src/systems/dialoghi';

// Un dialogo piccolo scritto qui: i test non cambiano quando cambiano i testi veri.
const dialogo: Dialogo = {
  inizio: 'saluto',
  nodi: {
    saluto: {
      testo: 'Benvenuto!',
      risposte: [
        { testo: 'Chi sei?', va: 'presentazione' },
        { testo: 'Cosa vendi?', apri: 'negozio' },
        { testo: 'Arrivederci' },
      ],
    },
    presentazione: { testo: 'Sono Gemma.', risposte: [{ testo: 'Torniamo a prima', va: 'saluto' }, { testo: 'Ciao' }] },
  },
};

describe('dialoghi', () => {
  it('si parte dal nodo iniziale', () => {
    expect(nodoIniziale(dialogo)).toBe('saluto');
  });

  it('una risposta può portare a un altro nodo, aprire qualcosa o chiudere', () => {
    expect(scegli(dialogo, 'saluto', 0)).toEqual({ tipo: 'nodo', id: 'presentazione' });
    expect(scegli(dialogo, 'saluto', 1)).toEqual({ tipo: 'apri', cosa: 'negozio' });
    expect(scegli(dialogo, 'saluto', 2)).toEqual({ tipo: 'chiudi' });
    expect(scegli(dialogo, 'presentazione', 0)).toEqual({ tipo: 'nodo', id: 'saluto' });
  });

  it('nodo o risposta inesistenti: si chiude, senza errori', () => {
    expect(scegli(dialogo, 'boh', 0)).toEqual({ tipo: 'chiudi' });
    expect(scegli(dialogo, 'saluto', 9)).toEqual({ tipo: 'chiudi' });
  });

  it('un dialogo corretto non ha errori', () => {
    expect(validaDialogo('gemma', dialogo)).toEqual([]);
  });

  it('la validazione trova i link rotti, i nodi irraggiungibili e i vicoli ciechi', () => {
    const rotto: Dialogo = {
      inizio: 'manca',
      nodi: {
        a: { testo: 'A', risposte: [{ testo: 'vai', va: 'non_esiste' }] },
        b: { testo: 'B', risposte: [] },
        c: { testo: 'C', risposte: [{ testo: 'x', apri: 'astronave' as never }] },
      },
    };
    const errori = validaDialogo('prova', rotto).join('\n');
    expect(errori).toMatch(/inizio "manca"/);
    expect(errori).toMatch(/"non_esiste"/);
    expect(errori).toMatch(/nodo "b".*nessuna risposta/);
    expect(errori).toMatch(/"astronave"/);
    // Con l'inizio sbagliato tutti i nodi risultano irraggiungibili.
    const irraggiungibile: Dialogo = { inizio: 'a', nodi: { a: { testo: 'A', risposte: [{ testo: 'fine' }] }, b: { testo: 'B', risposte: [{ testo: 'fine' }] } } };
    expect(validaDialogo('prova', irraggiungibile).join('\n')).toMatch(/nodo "b" non si raggiunge/);
  });
});

describe('dialoghi con le quest (fase 7)', () => {
  const conQuest: Dialogo = {
    inizio: 'saluto',
    nodi: {
      saluto: {
        testo: 'Ciao',
        risposte: [
          { testo: 'Hai un lavoro?', va: 'offerta', se: { quest: 'lupi', stato: 'disponibile' } },
          { testo: 'Fatto!', va: 'grazie', se: { quest: 'lupi', stato: 'pronta' }, azione: { concludi: 'lupi' } },
          { testo: 'Ci sto lavorando', se: { quest: 'lupi', stato: ['attiva'] } },
          { testo: 'Arrivederci' },
        ],
      },
      offerta: { testo: 'I lupi!', risposte: [{ testo: 'Accetto', azione: { accetta: 'lupi' } }, { testo: 'Non ora' }] },
      grazie: { testo: 'Grazie!', risposte: [{ testo: 'Di nulla' }] },
    },
  };
  const statoLupi = (s: string) => (c: { quest: string; stato: string | string[] }) => ([] as string[]).concat(c.stato).includes(s);

  it('compaiono solo le risposte la cui condizione è vera', () => {
    const testi = (s: string) => risposteVisibili(conQuest.nodi['saluto']!, statoLupi(s)).map((r) => r.testo);
    expect(testi('disponibile')).toEqual(['Hai un lavoro?', 'Arrivederci']);
    expect(testi('attiva')).toEqual(['Ci sto lavorando', 'Arrivederci']);
    expect(testi('pronta')).toEqual(['Fatto!', 'Arrivederci']);
  });

  it('una risposta con azione la restituisce insieme a dove porta', () => {
    expect(esitoRisposta(conQuest.nodi['offerta']!.risposte[0]!)).toEqual({ tipo: 'chiudi', azione: { accetta: 'lupi' } });
    expect(esitoRisposta(conQuest.nodi['saluto']!.risposte[1]!)).toEqual({ tipo: 'nodo', id: 'grazie', azione: { concludi: 'lupi' } });
  });

  it('validazione: quest che non esistono e nodi con solo risposte condizionate', () => {
    expect(validaDialogo('dario', conQuest, ['lupi'])).toEqual([]);
    const errori = validaDialogo('dario', conQuest, ['erbe']).join('\n');
    expect(errori).toContain('"lupi"');
    const bloccato: Dialogo = { inizio: 'a', nodi: { a: { testo: '', risposte: [{ testo: 'x', se: { quest: 'lupi', stato: 'pronta' } }] } } };
    expect(validaDialogo('dario', bloccato, ['lupi']).join('\n')).toMatch(/senza condizione/);
  });
});

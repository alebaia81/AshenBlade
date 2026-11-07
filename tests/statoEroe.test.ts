import { describe, expect, it } from 'vitest';
import {
  aggiornaStato,
  attendiAttacco,
  creaStatoEroe,
  èInvulnerabile,
  provaAttacco,
  provaParata,
  provaSchivata,
  riceviColpo,
  sconfiggi,
  type RegoleEroe,
} from '../src/systems/statoEroe';

const regole: RegoleEroe = {
  durataAttaccoMs: 150,
  ricaricaAttaccoMs: 100,
  durataSchivataMs: 200,
  ricaricaSchivataMs: 600,
  durataRespintaMs: 180,
  invulnerabilitaMs: 900,
  durataParataMs: 600,
};

describe('macchina a stati dell’eroe', () => {
  it('si parte liberi e non invulnerabili', () => {
    const s = creaStatoEroe();
    expect(s.nome).toBe('libero');
    expect(èInvulnerabile(s, 0)).toBe(false);
  });

  it('attacco: dura il tempo dell’arma e poi si torna liberi', () => {
    const s = provaAttacco(creaStatoEroe(), 1000, regole);
    expect(s.nome).toBe('attacco');
    expect(aggiornaStato(s, 1149, regole).nome).toBe('attacco');
    expect(aggiornaStato(s, 1150, regole).nome).toBe('libero');
  });

  it('dopo un attacco serve la ricarica prima del successivo', () => {
    let s = provaAttacco(creaStatoEroe(), 1000, regole);
    s = aggiornaStato(s, 1150, regole);
    expect(provaAttacco(s, 1200, regole).nome).toBe('libero'); // troppo presto
    expect(provaAttacco(s, 1250, regole).nome).toBe('attacco');
  });

  it('durante l’attacco non si può schivare', () => {
    const s = provaAttacco(creaStatoEroe(), 1000, regole);
    expect(provaSchivata(s, 1050, regole).nome).toBe('attacco');
  });

  it('schivata: invulnerabili durante, poi ricarica', () => {
    let s = provaSchivata(creaStatoEroe(), 1000, regole);
    expect(s.nome).toBe('schivata');
    expect(èInvulnerabile(s, 1100)).toBe(true);
    s = aggiornaStato(s, 1200, regole);
    expect(s.nome).toBe('libero');
    expect(èInvulnerabile(s, 1200)).toBe(false);
    expect(provaSchivata(s, 1500, regole).nome).toBe('libero'); // ancora in ricarica
    expect(provaSchivata(s, 1800, regole).nome).toBe('schivata');
  });

  it('colpito: respinta breve, invulnerabilità più lunga', () => {
    let s = riceviColpo(creaStatoEroe(), 1000, regole);
    expect(s.nome).toBe('colpito');
    s = aggiornaStato(s, 1180, regole);
    expect(s.nome).toBe('libero');
    expect(èInvulnerabile(s, 1500)).toBe(true);
    expect(èInvulnerabile(s, 1900)).toBe(false);
  });

  it('mentre si è invulnerabili un secondo colpo non ha effetto', () => {
    const s = riceviColpo(creaStatoEroe(), 1000, regole);
    expect(riceviColpo(s, 1100, regole)).toBe(s);
  });

  it('un colpo interrompe l’attacco', () => {
    const s = provaAttacco(creaStatoEroe(), 1000, regole);
    expect(riceviColpo(s, 1050, regole).nome).toBe('colpito');
  });

  it('sconfitto da qualsiasi stato, e da sconfitti non si fa più nulla', () => {
    for (const s of [creaStatoEroe(), provaAttacco(creaStatoEroe(), 0, regole), provaSchivata(creaStatoEroe(), 0, regole)]) {
      const sconfitto = sconfiggi(s, 100);
      expect(sconfitto.nome).toBe('sconfitto');
      expect(provaAttacco(sconfitto, 5000, regole).nome).toBe('sconfitto');
      expect(provaSchivata(sconfitto, 5000, regole).nome).toBe('sconfitto');
      expect(aggiornaStato(sconfitto, 5000, regole).nome).toBe('sconfitto');
      expect(èInvulnerabile(sconfitto, 5000)).toBe(true);
    }
  });

  it('parata: dura il tempo previsto, poi si torna liberi', () => {
    const s = provaParata(creaStatoEroe(), 1000, regole);
    expect(s.nome).toBe('parata');
    expect(aggiornaStato(s, 1599, regole).nome).toBe('parata');
    expect(aggiornaStato(s, 1600, regole).nome).toBe('libero');
  });

  it('durante la parata non si attacca e non si schiva', () => {
    const s = provaParata(creaStatoEroe(), 1000, regole);
    expect(provaAttacco(s, 1100, regole).nome).toBe('parata');
    expect(provaSchivata(s, 1100, regole).nome).toBe('parata');
  });

  it('la parata non rende invulnerabili: i colpi da dietro arrivano (lo decide chi colpisce)', () => {
    const s = provaParata(creaStatoEroe(), 1000, regole);
    expect(èInvulnerabile(s, 1100)).toBe(false);
  });

  it('si para solo da liberi', () => {
    const s = provaAttacco(creaStatoEroe(), 1000, regole);
    expect(provaParata(s, 1050, regole).nome).toBe('attacco');
  });
});

describe('due capriole di fila (Stivali del vento)', () => {
  const dueCariche: RegoleEroe = { ...regole, capriole: 2 };

  it('con una sola carica la seconda capriola aspetta la ricarica', () => {
    let s = provaSchivata(creaStatoEroe(), 1000, regole);
    s = aggiornaStato(s, 1200, regole);
    expect(provaSchivata(s, 1200, regole)).toBe(s);
  });

  it('con due cariche se ne fanno due di fila, poi serve la ricarica', () => {
    let s = provaSchivata(creaStatoEroe(), 1000, dueCariche);
    s = aggiornaStato(s, 1200, dueCariche);
    const seconda = provaSchivata(s, 1200, dueCariche);
    expect(seconda.nome).toBe('schivata');
    s = aggiornaStato(seconda, 1400, dueCariche);
    expect(provaSchivata(s, 1400, dueCariche)).toBe(s); // terza: no
    // Finita la ricarica (1000 + 200 + 600) tornano tutte e due.
    s = provaSchivata(s, 1800, dueCariche);
    expect(s.nome).toBe('schivata');
    s = aggiornaStato(s, 2000, dueCariche);
    expect(provaSchivata(s, 2000, dueCariche).nome).toBe('schivata');
  });
});

describe('attesa dopo il cambio d’arma', () => {
  it('per mezzo secondo non si attacca', () => {
    const s = attendiAttacco(creaStatoEroe(), 1000, 500);
    expect(provaAttacco(s, 1499, regole)).toBe(s);
    expect(provaAttacco(s, 1500, regole).nome).toBe('attacco');
  });

  it('non accorcia una ricarica più lunga già in corso', () => {
    const s = { ...creaStatoEroe(), attaccoPronto: 3000 };
    expect(attendiAttacco(s, 1000, 500).attaccoPronto).toBe(3000);
  });
});

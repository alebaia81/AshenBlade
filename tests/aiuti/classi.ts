// Classi scritte qui per i test: così i test non cambiano quando si
// ribilanciano i numeri veri in src/data/classi.json.
import type { DefinizioneClasse } from '../../src/systems/personaggio';

export const guerrieroDiProva: DefinizioneClasse = {
  id: 'guerriero',
  nome: 'Guerriero',
  descrizione: '',
  caratteristiche: { FOR: 15, DES: 12, COS: 14, INT: 8, SAG: 10, CAR: 10 },
  vitaBase: 14,
  vitaPerLivello: 6,
  manaBase: 0,
  arma: 'spada_e_scudo',
  abilita: { id: 'parata', nome: 'Parata', descrizione: '', ricaricaMs: 3000, costoMana: 0, durataMs: 600, mira: false },
  passive: [],
  colore: '#5b8fd6',
};

export const magoDiProva: DefinizioneClasse = {
  ...guerrieroDiProva,
  id: 'mago',
  nome: 'Mago',
  caratteristiche: { FOR: 8, DES: 12, COS: 12, INT: 15, SAG: 12, CAR: 10 },
  vitaBase: 8,
  vitaPerLivello: 3,
  manaBase: 10,
  arma: 'bastone',
  abilita: { id: 'palla_di_fuoco', nome: 'Palla di fuoco', descrizione: '', ricaricaMs: 2000, costoMana: 6, dado: '2d6', raggio: 24, gittata: 160, mira: true },
};

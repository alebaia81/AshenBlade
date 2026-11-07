// Valori DERIVATI del personaggio: non si memorizzano, si calcolano ogni volta
// da classe, caratteristiche e livello. Come una proprietà calcolata (computed)
// o un selettore: se cambia la COS, la vita massima è giusta automaticamente.

import { modificatore, type Caratteristiche, type NomeCaratteristica } from './caratteristiche';
import { probabilitaCritico } from './combattimento';

export interface DefinizioneClasse {
  id: string;
  nome: string;
  descrizione: string;
  caratteristiche: Caratteristiche;
  vitaBase: number;
  vitaPerLivello: number;
  /** 0 = la classe non usa il mana. */
  manaBase: number;
  /** Id dell'arma iniziale in armi.json. */
  arma: string;
  abilita: DefinizioneAbilita;
  /** Capacità sempre attive, es. "alle_spalle" (Ladro), "contro_nonmorti" (Chierico). */
  passive: string[];
  colore: string;
}

/** L'abilità di classe (design §6) con i suoi numeri, tutti nei dati. */
export interface DefinizioneAbilita {
  id: string;
  nome: string;
  descrizione: string;
  ricaricaMs: number;
  costoMana: number;
  /** Se vero, dopo il pulsante si clicca il bersaglio. */
  mira: boolean;
  durataMs?: number;
  dado?: string;
  raggio?: number;
  gittata?: number;
}

/** I dati del personaggio che cambiano durante il gioco. */
export interface Personaggio {
  nome: string;
  /** Id della classe in classi.json. */
  classe: string;
  caratteristiche: Caratteristiche;
  livello: number;
}

/** Design §6: base + crescita × (livello − 1) + modificatore COS × livello. Almeno 1. */
export function vitaMassima(classe: DefinizioneClasse, c: Caratteristiche, livello: number): number {
  const totale = classe.vitaBase + classe.vitaPerLivello * (livello - 1) + modificatore(c.COS) * livello;
  return Math.max(1, totale);
}

/** Solo per le classi che usano il mana: base + 2 × modificatore INT. */
export function manaMassimo(classe: DefinizioneClasse, c: Caratteristiche): number {
  if (classe.manaBase <= 0) return 0;
  return Math.max(1, classe.manaBase + 2 * modificatore(c.INT));
}

/** −5% di ricarica per ogni punto di modificatore DES (+5% se negativo), mai sotto la metà. */
export function ricaricaSchivata(baseMs: number, c: Caratteristiche): number {
  return baseMs * Math.max(0.5, 1 - 0.05 * modificatore(c.DES));
}

/** Modificatore della caratteristica usata dall'arma (FOR per le pesanti, DES per le leggere, INT per il bastone). */
export function modificatoreArma(arma: { caratteristica: NomeCaratteristica }, c: Caratteristiche): number {
  return modificatore(c[arma.caratteristica]);
}

export function probabilitaCriticoDi(arma: { bonusCritico: number }, c: Caratteristiche): number {
  return probabilitaCritico(modificatore(c.DES), arma.bonusCritico);
}

/** Mana recuperato al secondo: 1 + 0,25 × modificatore SAG, mai sotto 0,25. */
export function rigenerazioneMana(c: Caratteristiche): number {
  return Math.max(0.25, 1 + 0.25 * modificatore(c.SAG));
}

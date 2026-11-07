// Abilità di classe: quando si possono usare. Ogni abilità ha una ricarica
// e, per Mago e Chierico, un costo in mana. Cosa FA l'abilità non è qui
// (sono effetti nel mondo di gioco): qui ci sono solo le regole del "posso?".

import { basta, type Risorsa } from './risorsa';

/** Le abilità che il codice sa eseguire (vedi scenes/mondo/abilita/). */
export const ABILITA_CONOSCIUTE = ['parata', 'palla_di_fuoco', 'scatto_ombra', 'cura'] as const;

/** Le capacità passive che il codice sa applicare. */
export const PASSIVE_CONOSCIUTE = ['alle_spalle', 'contro_nonmorti'] as const;

export interface StatoAbilita {
  /** Da quando è di nuovo pronta. */
  prontaDa: number;
}

export type Disponibilita = 'pronta' | 'in ricarica' | 'mana insufficiente';

export function creaStatoAbilita(): StatoAbilita {
  return { prontaDa: 0 };
}

export function puòUsare(
  s: StatoAbilita,
  abilita: { costoMana: number },
  adesso: number,
  mana: Risorsa,
): Disponibilita {
  if (adesso < s.prontaDa) return 'in ricarica';
  if (abilita.costoMana > 0 && !basta(mana, abilita.costoMana)) return 'mana insufficiente';
  return 'pronta';
}

export function usa(_s: StatoAbilita, abilita: { ricaricaMs: number }, adesso: number): StatoAbilita {
  return { prontaDa: adesso + abilita.ricaricaMs };
}

/** Per l'interfaccia: 1 = appena usata, 0 = pronta. */
export function frazioneRicarica(s: StatoAbilita, abilita: { ricaricaMs: number }, adesso: number): number {
  if (abilita.ricaricaMs <= 0) return 0;
  return Math.min(1, Math.max(0, (s.prontaDa - adesso) / abilita.ricaricaMs));
}

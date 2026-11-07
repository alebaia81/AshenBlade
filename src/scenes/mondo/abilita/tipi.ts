// Ciò che un'abilità può usare per fare il suo effetto.

import type * as Phaser from 'phaser';
import type { Eroe } from '../../../entities/Eroe';
import type { Casuale } from '../../../systems/casuale';
import type { Caratteristiche } from '../../../systems/caratteristiche';
import type { DefinizioneAbilita } from '../../../systems/personaggio';
import type { Vettore } from '../../../systems/tipi';
import type { Combattimento } from '../Combattimento';
import type { GestoreProiettili } from '../GestoreProiettili';
import type { GruppoNemici } from '../GruppoNemici';

export interface ContestoAbilita {
  scena: Phaser.Scene;
  eroe: Eroe;
  nemici: GruppoNemici;
  combattimento: Combattimento;
  proiettili: GestoreProiettili;
  abilita: DefinizioneAbilita;
  caratteristiche: Caratteristiche;
  casuale: Casuale;
  adesso: number;
}

/**
 * Esegue l'effetto dell'abilità verso "punto" (il cursore o il bersaglio
 * cliccato). Restituisce false se in questo momento non si può (per esempio
 * la parata mentre si sta già attaccando): allora non si consuma nulla.
 */
export type EseguiAbilita = (contesto: ContestoAbilita, punto: Vettore) => boolean;

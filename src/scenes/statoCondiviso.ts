// Accesso "tipizzato" al registro condiviso tra le scene.
// Il registro di Phaser accetta qualsiasi cosa (unknown): queste piccole
// funzioni dicono a TypeScript cosa c'è dentro, così negli altri file
// non servono conversioni sparse.

import type * as Phaser from 'phaser';
import { CHIAVE_AVVISO, CHIAVE_PARTITA } from '../costanti';
import type { Partita } from '../systems/partita';

export function leggiPartita(scena: Phaser.Scene): Partita {
  const partita = scena.registry.get(CHIAVE_PARTITA) as Partita | undefined;
  if (!partita) throw new Error('Nessuna partita in corso: manca la creazione del personaggio');
  return partita;
}

/** Scrivere una partita NUOVA fa scattare "changedata-partita": l'interfaccia si aggiorna da sola. */
export function scriviPartita(scena: Phaser.Scene, partita: Partita): void {
  scena.registry.set(CHIAVE_PARTITA, partita);
}

export interface Avviso {
  testo: string;
  /** Diverso a ogni avviso, così due avvisi uguali di fila fanno scattare comunque l'evento. */
  id: number;
}

let prossimoAvviso = 1;

export function mostraAvviso(scena: Phaser.Scene, testo: string): void {
  const avviso: Avviso = { testo, id: prossimoAvviso++ };
  scena.registry.set(CHIAVE_AVVISO, avviso);
}

import type * as Phaser from 'phaser';
import { leggiOpzioni } from '../../systems/opzioni';
import { archivioDelBrowser } from '../browser';

/**
 * Vibrazione della visuale: attiva solo se abilitata nelle opzioni di gioco
 * e riservata a colpi critici ed eventi boss.
 */
export function scuotiSchermo(scena: Phaser.Scene, durataMs = 120, intensita = 0.004): void {
  const opzioni = leggiOpzioni(archivioDelBrowser());
  if (opzioni.scuotimentoSchermo) {
    scena.cameras.main.shake(durataMs, intensita);
  }
}

/**
 * Segnala all'interfaccia (HUD) di mostrare la vignette rossa sui bordi dello schermo
 * per dare feedback visivo immediato del danno subito dall'eroe.
 */
export function mostraVignetteDanno(scena: Phaser.Scene): void {
  scena.registry.events.emit('vignette_danno');
}


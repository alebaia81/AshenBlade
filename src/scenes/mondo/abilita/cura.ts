// Cura (Chierico): recupera 1d8 + 2 × modificatore SAG punti vita.

import { modificatore } from '../../../systems/caratteristiche';
import { leggiDado, tiraDado } from '../../../systems/dadi';
import { mostraNumero } from '../numeriDanno';
import type { EseguiAbilita } from './tipi';

export const cura: EseguiAbilita = ({ scena, eroe, abilita, caratteristiche, casuale }) => {
  const quantita = Math.max(1, tiraDado(leggiDado(abilita.dado ?? '1d8'), casuale) + 2 * modificatore(caratteristiche.SAG));
  const recuperata = eroe.recuperaVita(quantita);
  mostraNumero(scena, eroe.x, eroe.y, `+${recuperata}`, 'cura');
  // Un anello verde che si allarga: si vede subito che l'abilità è partita.
  const anello = scena.add.circle(eroe.x, eroe.y, 6).setStrokeStyle(2, 0x7dff9a).setDepth(13);
  scena.tweens.add({ targets: anello, scale: 2.5, alpha: 0, duration: 400, onComplete: () => anello.destroy() });
  return true;
};

// Una domanda con due risposte ("Sì" / "No") sopra tutto il resto, come il
// confirm() del browser ma disegnata nel gioco. Finché è aperta, uno strato
// scuro cattura i clic: sotto non si può toccare nulla.

import * as Phaser from 'phaser';
import { ALTEZZA_SCHERMO, LARGHEZZA_SCHERMO } from '../../costanti';
import { Pulsante } from './Pulsante';
import { STILE_TESTO } from './testi';

export function chiediConferma(scena: Phaser.Scene, domanda: string, siTesto: string, alSi: () => void, alNo: () => void = () => {}): Phaser.GameObjects.Container {
  const cx = LARGHEZZA_SCHERMO / 2;
  const cy = ALTEZZA_SCHERMO / 2;
  const scatola = scena.add.container(0, 0).setDepth(1000);
  const chiudi = () => scatola.destroy();
  scatola.add(scena.add.rectangle(cx, cy, LARGHEZZA_SCHERMO, ALTEZZA_SCHERMO, 0x000000, 0.6).setInteractive());
  scatola.add(scena.add.rectangle(cx, cy, 520, 190, 0x1b2230).setStrokeStyle(2, 0xffd23f));
  scatola.add(scena.add.text(cx, cy - 40, domanda, { ...STILE_TESTO, fontSize: '18px', align: 'center', wordWrap: { width: 470 } }).setOrigin(0.5));
  scatola.add(new Pulsante(scena, cx - 95, cy + 50, { larghezza: 170, altezza: 42, testo: siTesto, colore: 0x6a2a2a, alClic: () => { chiudi(); alSi(); } }));
  scatola.add(new Pulsante(scena, cx + 95, cy + 50, { larghezza: 170, altezza: 42, testo: 'Annulla', alClic: () => { chiudi(); alNo(); } }));
  return scatola;
}

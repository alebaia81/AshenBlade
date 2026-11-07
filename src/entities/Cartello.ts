// Un cartello, un cancello o una frana (fase 7b): una cosa che non si attraversa
// e che, cliccata, "dice" qualcosa. Il testo sta nella mappa, non nel codice:
// il cancello della cripta e la frana sulla strada della miniera sono dati.
// Nella fase 8 il cancello e la frana diventeranno passaggi veri.

import * as Phaser from 'phaser';
import type { CellaCartello } from '../systems/mappa';
import type { Vettore } from '../systems/tipi';
import type { AspettoRisolto } from '../systems/sprite';
import { aggiungiImmagine } from '../scenes/grafica';


const LATO = 16;

export class Cartello {
  readonly forma: Phaser.GameObjects.Rectangle;

  constructor(
    scena: Phaser.Scene,
    readonly posizione: Vettore,
    readonly dati: CellaCartello,
    /** Fase 9b: l'immagine (null = disegno a forme, come la nebbia che non ha una tessera). */
    immagine: AspettoRisolto | null = null,
  ) {
    const { x, y } = posizione;
    // Corpo fisico invisibile: il disegno sta nel Graphics (o nell'immagine).
    this.forma = scena.add.rectangle(x, y, LATO, LATO).setVisible(false);
    scena.physics.add.existing(this.forma, true);
    if (immagine) {
      aggiungiImmagine(scena, x, y, immagine).setDepth(2);
      return;
    }
    const g = scena.add.graphics().setDepth(2);
    if (dati.aspetto === 'cartello') {
      g.fillStyle(0x000000, 0.2).fillEllipse(x, y + 7, 8, 3);
      g.fillStyle(0x6b4a2a, 1).fillRect(x - 1, y - 2, 2, 9); // palo
      g.fillStyle(0x9a7040, 1).fillRect(x - 7, y - 7, 14, 7); // tavola
      g.lineStyle(0.6, 0x4a3018, 1).lineBetween(x - 5, y - 5, x + 4, y - 5).lineBetween(x - 5, y - 3, x + 2, y - 3);
    } else if (dati.aspetto === 'cancello') {
      // Sbarre di ferro su un fondo buio, con un lucchetto.
      g.fillStyle(0x15151a, 1).fillRect(x - 8, y - 8, 16, 16);
      g.fillStyle(0x6a6a72, 1);
      for (const dx of [-6, -3, 0, 3, 6]) g.fillRect(x + dx - 0.6, y - 8, 1.2, 16);
      g.fillRect(x - 8, y - 5, 16, 1.2).fillRect(x - 8, y + 3, 16, 1.2);
      g.fillStyle(0xb8862a, 1).fillRect(x - 1.5, y - 1, 3, 3);
    } else if (dati.aspetto === 'nebbia') {
      // Nebbia: nuvole grigio chiaro sovrapposte, un po' trasparenti.
      g.fillStyle(0xd8d8e0, 0.75).fillCircle(x - 4, y + 2, 6).fillCircle(x + 4, y + 1, 6).fillCircle(x, y - 4, 6);
      g.fillStyle(0xffffff, 0.35).fillCircle(x - 2, y - 3, 3);
    } else if (dati.aspetto === 'lapide') {
      // Una piccola lapide arrotondata, con il muschio alla base.
      g.fillStyle(0x000000, 0.2).fillEllipse(x, y + 6, 12, 3);
      g.fillStyle(0xb0b0b8, 1).fillRoundedRect(x - 5, y - 7, 10, 13, { tl: 5, tr: 5, bl: 0, br: 0 });
      g.lineStyle(0.8, 0x707078, 1).lineBetween(x - 2, y - 2, x + 2, y - 2).lineBetween(x, y - 4, x, y + 2);
      g.fillStyle(0x4a7a3a, 1).fillRect(x - 6, y + 4, 12, 2);
    } else if (dati.aspetto === 'germoglio') {
      // La lapide, e davanti un germoglio della Quercia con due foglie.
      g.fillStyle(0xb0b0b8, 1).fillRoundedRect(x - 5, y - 8, 10, 10, { tl: 5, tr: 5, bl: 0, br: 0 });
      g.fillStyle(0x5a3a1e, 1).fillRect(x - 0.6, y, 1.2, 7);
      g.fillStyle(0x6fbf5a, 1).fillEllipse(x - 2.5, y + 1, 4, 2.5).fillEllipse(x + 2.5, y - 1, 4, 2.5);
    } else if (dati.aspetto === 'ramo') {
      // Un ramo tagliato: un tronco marrone con qualche ciuffo di foglie, e il taglio chiaro.
      g.fillStyle(0x000000, 0.2).fillEllipse(x, y + 5, 16, 4);
      g.lineStyle(4, 0x5a3a1e, 1).lineBetween(x - 7, y + 3, x + 6, y - 2);
      g.fillStyle(0x3f6a2a, 1).fillCircle(x - 4, y - 2, 3).fillCircle(x + 1, y - 5, 3);
      g.fillStyle(0xd8c090, 1).fillCircle(x + 6, y - 2, 2);
    } else {
      // Frana: un mucchio di massi grigi di grandezze diverse.
      g.fillStyle(0x5a5a5a, 1).fillCircle(x - 4, y + 3, 5).fillCircle(x + 4, y + 2, 5.5).fillCircle(x, y - 3, 5);
      g.fillStyle(0x7a7a7a, 1).fillCircle(x - 5, y + 1, 2.5).fillCircle(x + 3, y - 1, 2.5).fillCircle(x - 1, y - 5, 2);
    }
  }

  /** Cosa si legge: con l'oggetto giusto nello zaino (la chiave), un altro testo. */
  testo(hai: (oggetto: string) => boolean): string {
    const { oggetto, testoConOggetto, testo } = this.dati;
    return oggetto && testoConOggetto && hai(oggetto) ? testoConOggetto : testo;
  }
}

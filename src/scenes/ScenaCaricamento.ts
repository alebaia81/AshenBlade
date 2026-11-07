// Prepara le immagini prima di tutto il resto (fase 9b, la scena "Caricamento" del design §4).
//
// I due fogli di Kenney sono file PNG nella cartella assets/. Il "?inline" dice a
// Vite di trasformarli in testo (un data URL, "data:image/png;base64,…") dentro
// il codice: così finiscono DENTRO gioco.html e il gioco resta un file solo,
// senza internet. È come incollare un'immagine in un CSS con url(data:…).

import * as Phaser from 'phaser';
import urlCitta from '../../assets/tiny-town/tilemap_packed.png?inline';
import urlDungeon from '../../assets/tiny-dungeon/tilemap_packed.png?inline';
import { SCENA_CARICAMENTO, SCENA_MENU, TESSERA } from '../costanti';
import type { DatiGioco } from '../data/caricaDati';
import { chiaveDisegno, LATO_DISEGNO } from '../systems/sprite';

export class ScenaCaricamento extends Phaser.Scene {
  constructor(private readonly dati: DatiGioco) {
    super(SCENA_CARICAMENTO);
  }

  /** preload: Phaser carica tutto ciò che è chiesto qui, POI chiama create. */
  preload(): void {
    // Uno "spritesheet" è un'immagine divisa in fotogrammi uguali: la tessera n
    // si chiede come fotogramma n. tilemap_packed.png non ha spazi tra le tessere.
    this.load.spritesheet('citta', urlCitta, { frameWidth: TESSERA, frameHeight: TESSERA });
    this.load.spritesheet('dungeon', urlDungeon, { frameWidth: TESSERA, frameHeight: TESSERA });
  }

  create(): void {
    this.creaDisegni();
    this.scene.start(SCENA_MENU);
  }

  /**
   * I disegni scritti come testo in sprite.json (il dischetto, la pecora):
   * ogni carattere è un pixel, la tavolozza dice il colore, "." è trasparente.
   * Si dipingono su un canvas e diventano texture come le altre.
   */
  private creaDisegni(): void {
    for (const [nome, img] of Object.entries(this.dati.sprite.immagini)) {
      if (!('disegno' in img)) continue;
      const chiave = chiaveDisegno(nome);
      if (this.textures.exists(chiave)) continue;
      const tela = this.textures.createCanvas(chiave, LATO_DISEGNO, LATO_DISEGNO);
      if (!tela) continue;
      const ctx = tela.getContext();
      img.disegno.forEach((riga, y) =>
        [...riga].forEach((c, x) => {
          const colore = img.tavolozza[c];
          if (!colore) return;
          ctx.fillStyle = colore;
          ctx.fillRect(x, y, 1, 1);
        }),
      );
      tela.refresh();
    }
  }
}

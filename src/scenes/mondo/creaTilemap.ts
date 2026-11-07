// Trasforma la mappa in una Tilemap di Phaser: disegno e muri solidi insieme.
//
// Perché una Tilemap e non un corpo fisico per ogni muro? Con tanti corpi
// separati, un eroe che scivola lungo una parete urta le "giunture" invisibili
// tra una tessera e l'altra e si incastra. La Tilemap sa quali lati delle tessere
// toccano altre tessere solide e li ignora: la parete diventa liscia.

import * as Phaser from 'phaser';
import { TESSERA } from '../../costanti';
import type { DatiSprite } from '../../systems/sprite';
import { preparaTessere } from '../../systems/tessere';
import type { Mappa } from '../../systems/tipi';
import { dipingiTessera } from '../grafica';

/** Il nome del fotogramma con il muro di un muro segreto, nell'immagine delle tessere della mappa. */
export function fotogrammaMuroSegreto(simbolo: string): string {
  return `muro:${simbolo}`;
}

export function chiaveTessere(mappa: Mappa): string {
  return `tessere-${mappa.id}`;
}

export function creaTilemap(scena: Phaser.Scene, mappa: Mappa, sprite: DatiSprite): Phaser.Tilemaps.TilemapLayer {
  const tessere = preparaTessere(mappa);
  const chiaveImmagine = chiaveTessere(mappa);

  // 1. L'immagine delle tessere (tileset): una striscia con un quadrato per
  //    simbolo della legenda. Dalla fase 9b ogni quadrato è dipinto con la
  //    pixel art scritta nella legenda ("tessera"), strati e tinte compresi;
  //    se manca, resta il colore delle fasi 1–8. In fondo alla striscia, i
  //    muri dei muri segreti (li usa MuroSegreto). La mappa non cambia mai
  //    durante il gioco, quindi la striscia si prepara una volta sola.
  if (!scena.textures.exists(chiaveImmagine)) {
    const segreti = tessere.simboli.filter((s) => mappa.legenda[s]!.tesseraMuro);
    const tela = scena.textures.createCanvas(chiaveImmagine, (tessere.simboli.length + segreti.length) * TESSERA, TESSERA);
    if (!tela) throw new Error(`Impossibile preparare le tessere della mappa "${mappa.id}"`);
    const ctx = tela.getContext();
    tessere.simboli.forEach((simbolo, i) => {
      dipingiTessera(scena, ctx, i * TESSERA, 0, mappa.legenda[simbolo]!.tessera ?? tessere.colori[i]!, sprite);
    });
    segreti.forEach((simbolo, j) => {
      const x = (tessere.simboli.length + j) * TESSERA;
      dipingiTessera(scena, ctx, x, 0, mappa.legenda[simbolo]!.tesseraMuro!, sprite);
      tela.add(fotogrammaMuroSegreto(simbolo), 0, x, 0, TESSERA, TESSERA);
    });
    tela.refresh();
  }

  // 2. La Tilemap: la griglia di numeri + l'immagine da cui ritagliare le tessere.
  const tilemap = scena.make.tilemap({ data: tessere.indici, tileWidth: TESSERA, tileHeight: TESSERA });
  const tileset = tilemap.addTilesetImage(chiaveImmagine, chiaveImmagine, TESSERA, TESSERA, 0, 0);
  if (!tileset) throw new Error(`Impossibile creare le tessere della mappa "${mappa.id}"`);
  // L'ultimo parametro (gpu = false) chiede un TilemapLayer "classico", che supporta
  // le collisioni. TypeScript non può dedurlo dal valore, quindi lo diciamo noi.
  const livello = tilemap.createLayer(0, tileset, 0, 0, false) as Phaser.Tilemaps.TilemapLayer | null;
  if (!livello) throw new Error(`Impossibile creare il livello della mappa "${mappa.id}"`);

  // 3. Quali tessere sono solide: la fisica impedirà di attraversarle.
  livello.setCollision(tessere.solide);
  return livello;
}

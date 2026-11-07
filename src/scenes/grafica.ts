// Dalla pixel art "come dati" (systems/sprite.ts) agli oggetti di Phaser.
// Qui si decide COME si disegna; QUALE immagine usare lo dice data/sprite.json.

import type * as Phaser from 'phaser';
import { TESSERA } from '../costanti';
import { risolvi, stratiDi, type AspettoRisolto, type DatiSprite, type Strato } from '../systems/sprite';

type Sezione = 'classi' | 'compagni' | 'abitanti' | 'nemici' | 'oggetti' | 'vene';

/** L'aspetto di una cosa del gioco ("nemici", "slime"), o null se sprite.json non lo prevede. */
export function aspettoDi(sprite: DatiSprite, sezione: Sezione, id: string): AspettoRisolto | null {
  const a = sprite[sezione][id];
  return a ? risolvi(a, sprite.immagini) : null;
}

/** Un'immagine nel mondo, con tinta e trasparenza già applicate. */
export function aggiungiImmagine(scena: Phaser.Scene, x: number, y: number, a: AspettoRisolto): Phaser.GameObjects.Image {
  const img = scena.add.image(x, y, a.chiave, a.fotogramma).setAlpha(a.alfa);
  if (a.tinta !== 0xffffff) img.setTint(a.tinta);
  return img;
}

/**
 * Dipinge una tessera (uno o più strati) su un canvas, nel quadrato che parte da
 * (x, y). Serve a costruire l'immagine delle tessere di una mappa: la Tilemap
 * di Phaser vuole UN'immagine sola, quindi gli strati (erba + albero) e le tinte
 * si "cuociono" qui, una volta, invece che a ogni fotogramma.
 */
export function dipingiTessera(scena: Phaser.Scene, ctx: CanvasRenderingContext2D, x: number, y: number, tessera: Strato | Strato[], sprite: DatiSprite): void {
  for (const s of stratiDi(tessera, sprite.immagini)) {
    if ('colore' in s) {
      ctx.fillStyle = `#${s.colore.toString(16).padStart(6, '0')}`;
      ctx.fillRect(x, y, TESSERA, TESSERA);
      continue;
    }
    const fotogramma = scena.textures.getFrame(s.chiave, s.fotogramma);
    const sorgente = fotogramma.source.image as CanvasImageSource;
    const pezzo = s.tinta === 0xffffff ? null : tinto(sorgente, fotogramma, s.tinta);
    ctx.globalAlpha = s.alfa;
    if (pezzo) ctx.drawImage(pezzo, x, y);
    else ctx.drawImage(sorgente, fotogramma.cutX, fotogramma.cutY, TESSERA, TESSERA, x, y, TESSERA, TESSERA);
    ctx.globalAlpha = 1;
  }
}

/**
 * La tinta su un canvas: si moltiplica il colore (come un filtro "moltiplica"
 * di un programma di grafica), poi si ritaglia sulla forma originale perché le
 * parti trasparenti restino trasparenti. È ciò che fa setTint sugli sprite.
 */
function tinto(sorgente: CanvasImageSource, f: Phaser.Textures.Frame, tinta: number): HTMLCanvasElement {
  const tela = document.createElement('canvas');
  tela.width = TESSERA;
  tela.height = TESSERA;
  const c = tela.getContext('2d')!;
  c.drawImage(sorgente, f.cutX, f.cutY, TESSERA, TESSERA, 0, 0, TESSERA, TESSERA);
  c.globalCompositeOperation = 'multiply';
  c.fillStyle = `#${tinta.toString(16).padStart(6, '0')}`;
  c.fillRect(0, 0, TESSERA, TESSERA);
  c.globalCompositeOperation = 'destination-in';
  c.drawImage(sorgente, f.cutX, f.cutY, TESSERA, TESSERA, 0, 0, TESSERA, TESSERA);
  return tela;
}

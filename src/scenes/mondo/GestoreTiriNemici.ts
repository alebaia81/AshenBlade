// I tiri dei nemici (fase 8b): frecce dei goblin arcieri, palle dei cultisti.
// Sono il "rovescio" di GestoreProiettili: là i proiettili dell'eroe cercano i
// nemici, qui quelli dei nemici cercano l'eroe. Il proiettile (entità e calcolo
// del volo) è lo stesso; cambia solo chi può essere colpito.

import type * as Phaser from 'phaser';
import { TESSERA } from '../../costanti';
import type { Nemico } from '../../entities/Nemico';
import { Proiettile } from '../../entities/Proiettile';
import { cellaDaPixel } from '../../systems/coordinate';
import type { Vettore } from '../../systems/tipi';
import type { ColpoDaLontano } from './gestisciContatti';

/** Quanto deve passare vicino all'eroe per colpirlo (metà del suo lato, più un margine). */
const RAGGIO_EROE = 6;

export class GestoreTiriNemici {
  private readonly inVolo: { proiettile: Proiettile; nemico: Nemico; dado: string }[] = [];

  constructor(
    private readonly scena: Phaser.Scene,
    private readonly calpestabile: (col: number, riga: number) => boolean,
    private readonly eroe: () => Vettore | null,
    private readonly colpisci: ColpoDaLontano,
  ) {}

  /** Chiamata dal nemico quando la sua mente decide di tirare. */
  tira(nemico: Nemico, direzione: Vettore): void {
    const t = nemico.definizione.tiro;
    if (t) this.tiraCon(nemico, direzione, t, nemico.definizione.danno);
  }

  /** Un tiro con parametri scelti da fuori (le sfere del Negromante, fase 8c). */
  tiraCon(nemico: Nemico, direzione: Vettore, t: { velocita: number; gittata: number; dimensione: number; colore: string }, dado: string): void {
    const distanza = nemico.definizione.dimensione / 2 + 2;
    const da = { x: nemico.forma.x + direzione.x * distanza, y: nemico.forma.y + direzione.y * distanza };
    const proiettile = new Proiettile(this.scena, da, direzione, t.velocita, t.gittata, t.dimensione, t.colore);
    this.inVolo.push({ proiettile, nemico, dado });
  }

  aggiorna(dtMs: number): void {
    const eroe = this.eroe();
    for (const v of this.inVolo) {
      if (!v.proiettile.attivo) continue;
      const ancora = v.proiettile.avanza(dtMs);
      const p = v.proiettile.posizione;
      const cella = cellaDaPixel(p.x, p.y, TESSERA);
      const colpito = eroe !== null && Math.hypot(p.x - eroe.x, p.y - eroe.y) <= v.proiettile.raggio + RAGGIO_EROE;
      if (colpito || !ancora || !this.calpestabile(cella.col, cella.riga)) {
        v.proiettile.distruggi();
        if (colpito) this.colpisci(v.nemico, v.dado, p);
      }
    }
    for (let i = this.inVolo.length - 1; i >= 0; i--) if (!this.inVolo[i]!.proiettile.attivo) this.inVolo.splice(i, 1);
  }
}

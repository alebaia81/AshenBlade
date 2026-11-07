// Tutti i proiettili in volo: li muove, controlla se colpiscono un muro o un
// nemico e, quando succede, chiama la funzione d'impatto scelta da chi li ha lanciati.

import type * as Phaser from 'phaser';
import { TESSERA } from '../../costanti';
import type { Nemico } from '../../entities/Nemico';
import { Proiettile } from '../../entities/Proiettile';
import { cellaDaPixel } from '../../systems/coordinate';
import { nelRaggio } from '../../systems/proiettili';
import type { Vettore } from '../../systems/tipi';
import type { GruppoNemici } from './GruppoNemici';

export interface Lancio {
  da: Vettore;
  direzione: Vettore;
  velocita: number;
  gittata: number;
  raggio: number;
  colore: string;
  /** Cosa succede all'impatto: nemico colpito (o null se muro / fine gittata) e punto. */
  impatto: (nemico: Nemico | null, punto: Vettore) => void;
  /** Se vero, l'impatto avviene anche a fine gittata (la palla di fuoco esplode comunque). */
  impattoAFineCorsa: boolean;
  /** Nemici da attraversare senza colpirli (una freccia che rimbalza non ricolpisce chi ha già colpito). */
  ignora?: ReadonlySet<number>;
}

export class GestoreProiettili {
  private readonly inVolo: { proiettile: Proiettile; lancio: Lancio }[] = [];

  constructor(
    private readonly scena: Phaser.Scene,
    /** "Qui si passa?" della mappa: un muro segreto aperto lascia passare anche le frecce. */
    private readonly calpestabile: (col: number, riga: number) => boolean,
    private readonly nemici: GruppoNemici,
  ) {}

  lancia(lancio: Lancio): void {
    const p = new Proiettile(this.scena, lancio.da, lancio.direzione, lancio.velocita, lancio.gittata, lancio.raggio, lancio.colore);
    this.inVolo.push({ proiettile: p, lancio });
  }

  aggiorna(dtMs: number): void {
    for (const voce of this.inVolo) {
      const { proiettile, lancio } = voce;
      if (!proiettile.attivo) continue;
      const ancoraInVolo = proiettile.avanza(dtMs);
      const punto = proiettile.posizione;

      // Contro un nemico?
      const vivi = this.nemici.vivi().filter((n) => !lancio.ignora?.has(n.id));
      const [id] = nelRaggio(punto, proiettile.raggio, vivi.map((n) => ({ id: n.id, rettangolo: n.rettangolo() })));
      const nemico = vivi.find((n) => n.id === id);
      // Contro un muro? (alberi, rocce, acqua: tutto ciò che è "muro" ferma anche i proiettili)
      const cella = cellaDaPixel(punto.x, punto.y, TESSERA);
      const muro = !this.calpestabile(cella.col, cella.riga);

      if (nemico || muro || !ancoraInVolo) {
        proiettile.distruggi();
        if (nemico || muro || lancio.impattoAFineCorsa) lancio.impatto(nemico ?? null, punto);
      }
    }
    // Via quelli finiti, così l'elenco non cresce per sempre.
    for (let i = this.inVolo.length - 1; i >= 0; i--) if (!this.inVolo[i]!.proiettile.attivo) this.inVolo.splice(i, 1);
  }

  get quanti(): number {
    return this.inVolo.length;
  }
}

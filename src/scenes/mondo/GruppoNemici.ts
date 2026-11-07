// Tutti i nemici di una mappa: li crea, li aggiorna e ritrova il Nemico
// a partire dall'oggetto di Phaser (serve nelle collisioni, che danno solo l'oggetto).

import type * as Phaser from 'phaser';
import { Nemico } from '../../entities/Nemico';
import type { DefinizioneNemico, Vettore } from '../../systems/tipi';
import type { AspettoRisolto } from '../../systems/sprite';

export class GruppoNemici {
  readonly gruppo: Phaser.Physics.Arcade.Group;
  private readonly lista: Nemico[] = [];
  private readonly perForma = new Map<Phaser.GameObjects.GameObject, Nemico>();
  private prossimoId = 1;
  /** Fase 8b: cosa collegare a ogni nemico (tiri, linea di tiro), anche a quelli evocati dopo. */
  private configura: ((n: Nemico) => void) | null = null;

  constructor(
    private readonly scena: Phaser.Scene,
    livello: Phaser.Tilemaps.TilemapLayer,
    /** Fase 9b: la figura di ogni nemico (da data/sprite.json). */
    private readonly aspetto: (d: DefinizioneNemico) => AspettoRisolto | null = () => null,
  ) {
    this.gruppo = scena.physics.add.group();
    // I nemici si fermano contro i muri e non si sovrappongono tra loro.
    scena.physics.add.collider(this.gruppo, livello);
    scena.physics.add.collider(this.gruppo, this.gruppo);
  }

  aggiungi(definizione: DefinizioneNemico, posizione: Vettore): Nemico {
    const nemico = new Nemico(this.scena, this.gruppo, this.prossimoId++, definizione, posizione.x, posizione.y, this.aspetto(definizione));
    this.lista.push(nemico);
    this.perForma.set(nemico.forma, nemico);
    this.configura?.(nemico);
    return nemico;
  }

  /** Imposta la configurazione per tutti: quelli che ci sono e quelli che arriveranno. */
  configuraTutti(f: (n: Nemico) => void): void {
    this.configura = f;
    for (const n of this.lista) f(n);
  }

  /**
   * "bersagli": chi i nemici possono inseguire (l'eroe e, dalla fase 5, il
   * compagno). Ogni nemico sceglie il più vicino a sé. Vuoto = nessuno da
   * inseguire (eroe invisibile o sconfitto): tornano a casa.
   */
  aggiorna(adesso: number, bersagli: readonly Vettore[]): void {
    for (const n of this.vivi()) {
      let bersaglio: Vettore | null = null;
      let d = Infinity;
      for (const b of bersagli) {
        const qui = Math.hypot(b.x - n.forma.x, b.y - n.forma.y);
        if (qui < d) {
          d = qui;
          bersaglio = b;
        }
      }
      n.aggiorna(adesso, bersaglio);
    }
  }

  vivi(): Nemico[] {
    return this.lista.filter((n) => n.vivo);
  }

  /**
   * "Sei in combattimento?": almeno un nemico vivo ti vede (sei nel suo raggio
   * di vista). Serve a bloccare il cambio di armatura nella scheda.
   */
  inCombattimento(eroe: Vettore): boolean {
    return this.vivi().some((n) => Math.hypot(n.forma.x - eroe.x, n.forma.y - eroe.y) <= n.definizione.raggioVista);
  }

  daForma(forma: unknown): Nemico | undefined {
    return this.perForma.get(forma as Phaser.GameObjects.GameObject);
  }

  fermaTutti(): void {
    for (const n of this.vivi()) n.ferma();
  }
}

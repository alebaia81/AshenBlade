// Tutti gli oggetti a terra nella mappa: li crea, controlla se l'eroe ci passa
// sopra e prova a metterli nello zaino. Quando la mappa cambia spariscono
// (come in molti giochi: il bottino non raccolto non ti aspetta).

import type * as Phaser from 'phaser';
import { OggettoATerra } from '../../entities/OggettoATerra';
import { posizioniCaduta, type DefinizioneOggetto } from '../../systems/oggetti';
import type { Vettore } from '../../systems/tipi';

/** Distanza sotto la quale l'eroe raccoglie un oggetto. */
const DISTANZA_RACCOLTA = 12;
/** Un oggetto "bloccato" si sblocca quando l'eroe si allontana più di così. */
const DISTANZA_SBLOCCO = 16;

export interface OpzioniLascia {
  /** Direzione preferita verso cui far cadere gli oggetti (es. verso l'eroe). */
  verso?: Vettore;
  /** Distanza minima da "centro" (es. per non sovrapporsi a un forziere). */
  distanzaMinima?: number;
}

export class GestoreOggettiATerra {
  private readonly oggetti: OggettoATerra[] = [];

  constructor(
    private readonly scena: Phaser.Scene,
    private readonly catalogo: Readonly<Record<string, DefinizioneOggetto>>,
    /** Vero se un punto è calpestabile e libero da alberi, muri o ostacoli solidi. */
    private readonly puntoLibero: (punto: Vettore) => boolean = () => true,
  ) {}

  /** Fa cadere uno o più oggetti intorno a un punto, evitando ostacoli e sovrapposizioni. */
  lascia(
    oggetti: readonly { id: string; quantita: number }[],
    centro: Vettore,
    bloccati = false,
    opzioni: OpzioniLascia = {},
  ): void {
    const validi = oggetti.filter(({ id }) => Boolean(this.catalogo[id]));
    const posizioni = posizioniCaduta(validi.length, {
      origine: centro,
      verso: opzioni.verso,
      distanzaMinima: opzioni.distanzaMinima,
      libero: (p) =>
        this.puntoLibero(p) &&
        this.oggetti.every((esistente) => Math.hypot(esistente.posizione.x - p.x, esistente.posizione.y - p.y) >= 10),
    });
    validi.forEach(({ id, quantita }, i) => {
      const definizione = this.catalogo[id]!;
      const posizione = posizioni[i] ?? centro;
      this.oggetti.push(new OggettoATerra(this.scena, definizione, quantita, posizione, bloccati));
    });
  }

  /**
   * A ogni fotogramma: l'eroe è sopra qualche oggetto? "raccogli" prova a
   * metterlo nello zaino e restituisce quanti NON sono entrati.
   */
  aggiorna(eroe: Vettore, raccogli: (id: string, quantita: number) => number): void {
    for (const o of [...this.oggetti]) {
      const d = Math.hypot(o.posizione.x - eroe.x, o.posizione.y - eroe.y);
      if (o.bloccato) {
        if (d > DISTANZA_SBLOCCO) o.bloccato = false;
        continue;
      }
      if (d > DISTANZA_RACCOLTA) continue;
      const rimasti = raccogli(o.definizione.id, o.quantita);
      if (rimasti === 0) {
        o.distruggi();
        this.oggetti.splice(this.oggetti.indexOf(o), 1);
      } else {
        // Zaino pieno: resta a terra finché l'eroe non si allontana, così
        // l'avviso "zaino pieno" non si ripete a ogni fotogramma.
        o.lascia(rimasti);
        o.bloccato = true;
      }
    }
  }

  /** L'oggetto sotto un punto (per il clic: l'eroe ci va). */
  sotto(punto: Vettore): OggettoATerra | null {
    return this.oggetti.find((o) => Math.hypot(o.posizione.x - punto.x, o.posizione.y - punto.y) < 8) ?? null;
  }

  get quanti(): number {
    return this.oggetti.length;
  }
}

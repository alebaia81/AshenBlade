// Collega l'area di colpo dell'eroe ai nemici: chi viene toccato subisce danno.
// Il calcolo del danno lo fa Combattimento, lo stesso dei proiettili.

import type { Eroe } from '../../entities/Eroe';
import type { Nemico } from '../../entities/Nemico';
import { TESSERA } from '../../costanti';
import { intersecano, nelCono, VERSI } from '../../systems/geometria';
import type { Combattimento } from './Combattimento';
import type { GruppoNemici } from './GruppoNemici';

/** Numeri dell'eroe che dipendono dalle caratteristiche, letti al momento del colpo. */
export interface StatisticheAttacco {
  modificatore: number;
  probabilitaCritico: number;
}

/** Raggio del fendente cleave: 2 tessere + tolleranza per le sagome dei nemici. */
const RAGGIO_CLEAVE = 2.0 * TESSERA + 4; // ~36px

export class GestoreAttacchi {
  /** Nemici già colpiti dal fendente in corso. */
  private giàColpiti = new Set<number>();
  private fendente = -1;

  constructor(
    private readonly eroe: Eroe,
    private readonly nemici: GruppoNemici,
    private readonly combattimento: Combattimento,
    /** Funzione e non valore: se nella scheda alzi la FOR, il colpo successivo lo sa già. */
    private readonly statistiche: () => StatisticheAttacco,
    /** Bersaglio primario agganciato dalla guida, se presente. */
    private readonly bersaglioPrimario: () => Nemico | null = () => null,
  ) {}

  aggiorna(adesso: number): void {
    const area = this.eroe.areaDiColpoAttiva();
    if (!area) return;

    // Nuovo fendente: si ricomincia a contare chi è stato colpito.
    if (this.eroe.fendente !== this.fendente) {
      this.fendente = this.eroe.fendente;
      this.giàColpiti = new Set();
    }

    const vivi = this.nemici.vivi();
    const nonColpiti = vivi.filter((n) => !this.giàColpiti.has(n.id));
    if (nonColpiti.length === 0) return;

    const quiEroe = { x: this.eroe.x, y: this.eroe.y };
    const verso = VERSI[this.eroe.guarda];

    // Candidati nel cono d'attacco o che toccano l'area del colpo
    const candidati = nonColpiti.filter((n) => {
      const r = n.rettangolo();
      const centroNemico = { x: r.x + r.larghezza / 2, y: r.y + r.altezza / 2 };
      return nelCono(quiEroe, verso, RAGGIO_CLEAVE, undefined, centroNemico) || intersecano(area, r);
    });

    if (candidati.length === 0) return;

    // Individuazione del bersaglio primario: quello agganciato o il più frontale/vicino
    const bersaglioAgganciato = this.bersaglioPrimario();
    let primario: Nemico = candidati.find((c) => bersaglioAgganciato && c.id === bersaglioAgganciato.id) ?? candidati[0]!;
    if (!bersaglioAgganciato || primario.id !== bersaglioAgganciato.id) {
      let migliorPunteggio = -Infinity;
      for (const c of candidati) {
        const r = c.rettangolo();
        const cx = r.x + r.larghezza / 2 - quiEroe.x;
        const cy = r.y + r.altezza / 2 - quiEroe.y;
        const dist = Math.hypot(cx, cy) || 1;
        const dot = (verso.x * cx + verso.y * cy) / dist;
        const punteggio = dot * 100 - dist;
        if (punteggio > migliorPunteggio) {
          migliorPunteggio = punteggio;
          primario = c;
        }
      }
    }

    const { modificatore, probabilitaCritico } = this.statistiche();

    for (const nemico of candidati) {
      this.giàColpiti.add(nemico.id);
      const èPrimario = nemico.id === primario.id;
      const colpoBase = this.combattimento.colpoArma(this.eroe.arma, modificatore, probabilitaCritico, quiEroe);
      const colpo = {
        ...colpoBase,
        // Bersaglio primario: 100% danno; nemici secondari nel cono: 70% splash
        moltiplicatore: èPrimario ? 1.0 : 0.7,
      };
      this.combattimento.infliggi(nemico, colpo, adesso);
    }
  }
}

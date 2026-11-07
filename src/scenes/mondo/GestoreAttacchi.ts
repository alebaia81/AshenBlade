// Collega l'area di colpo dell'eroe ai nemici: chi viene toccato subisce danno.
// Il calcolo del danno lo fa Combattimento, lo stesso dei proiettili.

import type { Eroe } from '../../entities/Eroe';
import { nuoviColpiti } from '../../systems/geometria';
import type { Combattimento } from './Combattimento';
import type { GruppoNemici } from './GruppoNemici';

/** Numeri dell'eroe che dipendono dalle caratteristiche, letti al momento del colpo. */
export interface StatisticheAttacco {
  modificatore: number;
  probabilitaCritico: number;
}

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
    const colpiti = nuoviColpiti(area, vivi.map((n) => ({ id: n.id, rettangolo: n.rettangolo() })), this.giàColpiti);
    const { modificatore, probabilitaCritico } = this.statistiche();
    for (const id of colpiti) {
      this.giàColpiti.add(id);
      const colpo = this.combattimento.colpoArma(this.eroe.arma, modificatore, probabilitaCritico, { x: this.eroe.x, y: this.eroe.y });
      this.combattimento.infliggi(vivi.find((n) => n.id === id)!, colpo, adesso);
    }
  }
}

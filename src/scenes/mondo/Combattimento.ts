// Un solo posto dove un colpo dell'eroe diventa danno, qualunque sia la sua
// origine: fendente, dardo magico, freccia o palla di fuoco. Qui si applicano
// le capacità passive della classe (alle spalle, contro i non morti) e gli
// effetti speciali di armi e armature (risucchio, fuoco, predatore…).

import type * as Phaser from 'phaser';
import type { Eroe } from '../../entities/Eroe';
import type { Nemico } from '../../entities/Nemico';
import type { Casuale } from '../../systems/casuale';
import { calcolaDanno } from '../../systems/combattimento';
import { moltiplicatoreCritico, NUMERI_EFFETTI, vitaRisucchiata } from '../../systems/effettiArmi';
import { alleSpalle } from '../../systems/geometria';
import type { DefinizioneArma, Vettore } from '../../systems/tipi';
import { mostraNumero } from './numeriDanno';
import { suoni } from '../../audio/Suoni';
import { scuotiSchermo } from './feedbackVisivo';

export interface Colpo {
  dado: string;
  modificatore: number;
  probabilitaCritico: number;
  /** Velocità con cui il nemico viene respinto. */
  respinta: number;
  /** Da dove arriva il colpo: per la respinta e per capire se è alle spalle. */
  da: Vettore;
  /** Gli incantesimi ad area non contano come colpi alle spalle. */
  puòEssereAlleSpalle: boolean;
  /** Effetti dell'arma che ha colpito (vuoto per gli incantesimi). */
  effetti: readonly string[];
  /** Bonus di potenziamento dell'arma (+1…+5): si somma al danno. 0 per incantesimi e compagno. */
  bonus?: number;
  /** Colpo del compagno: niente passive della classe dell'eroe né effetti delle sue armature. */
  dalCompagno?: boolean;
  /** Moltiplicatore speciale del colpo (es. 1.0 per primario, 0.7 per cleave ad area). */
  moltiplicatore?: number;
}

export class Combattimento {
  constructor(
    private readonly scena: Phaser.Scene,
    private readonly eroe: Eroe,
    private readonly casuale: Casuale,
    /** Funzione e non valore: le passive non cambiano, ma così la classe resta l'unica fonte. */
    private readonly passive: () => readonly string[],
    /** Effetti delle armature indossate in questo momento (possono cambiare dalla scheda). */
    private readonly effettiArmatura: () => readonly string[],
    private readonly quandoSconfitto: (nemico: Nemico) => void,
  ) {}

  infliggi(nemico: Nemico, colpo: Colpo, adesso: number): void {
    if (!nemico.vivo) return;
    const passive = colpo.dalCompagno ? [] : this.passive();
    const posizione = { x: nemico.forma.x, y: nemico.forma.y };

    // Ladro: danno doppio se il colpo arriva alle spalle del nemico.
    const dietro = colpo.puòEssereAlleSpalle && passive.includes('alle_spalle') && alleSpalle(nemico.guarda, posizione, colpo.da);
    // Chierico: +1d6 contro i non morti.
    const controNonMorti = passive.includes('contro_nonmorti') && nemico.definizione.etichette.includes('nonMorto');

    const esito = calcolaDanno(
      {
        dado: colpo.dado,
        modificatore: colpo.modificatore,
        bonus: colpo.bonus ?? 0,
        armatura: nemico.definizione.armatura,
        probabilitaCritico: colpo.probabilitaCritico,
        dadiAggiuntivi: controNonMorti ? ['1d6'] : [],
        moltiplicatore: (colpo.moltiplicatore ?? 1) * (dietro ? 2 : 1),
        moltiplicatoreCritico: moltiplicatoreCritico(colpo.effetti),
      },
      this.casuale,
    );
    const sconfitto = nemico.subisci(esito.danno, colpo.da, colpo.respinta, adesso);
    suoni.effetto('colpo');
    const evidenziato = esito.critico || dietro;
    mostraNumero(this.scena, posizione.x, posizione.y, dietro ? `${esito.danno} alle spalle!` : esito.danno, evidenziato ? 'critico' : 'normale');
    if (esito.critico) {
      scuotiSchermo(this.scena, 120, 0.005);
    }

    this.effettiDopoIlColpo(nemico, colpo, esito.danno, esito.critico, sconfitto, adesso);
    if (sconfitto) this.quandoSconfitto(nemico);
  }

  /**
   * Danno "diretto" senza tiro di dadi né stordimento: le bruciature del fuoco e
   * le spine della corazza. Anche questo può sconfiggere (e dare esperienza).
   */
  danneggiaDiretto(nemico: Nemico, danno: number, adesso: number): void {
    if (!nemico.vivo || danno <= 0) return;
    const posizione = { x: nemico.forma.x, y: nemico.forma.y };
    const sconfitto = nemico.subisci(danno, posizione, 0, adesso, false);
    mostraNumero(this.scena, posizione.x, posizione.y, danno, 'avviso');
    if (sconfitto) this.quandoSconfitto(nemico);
  }

  /** A ogni fotogramma: i nemici che bruciano perdono vita. */
  aggiorna(nemici: readonly Nemico[], adesso: number): void {
    for (const n of nemici) this.danneggiaDiretto(n, n.danniDaFuoco(adesso), adesso);
  }

  /** Colpo con un'arma (fendente, dardo, freccia): numeri dell'arma e caratteristiche attuali. */
  colpoArma(arma: DefinizioneArma, modificatore: number, probabilitaCritico: number, da: Vettore): Colpo {
    return { dado: arma.dado, modificatore, probabilitaCritico, respinta: arma.respinta, da, puòEssereAlleSpalle: true, effetti: arma.effetti, bonus: arma.potenziamento ?? 0 };
  }

  // Il "registro" degli effetti: ogni etichetta dei dati diventa un comportamento.
  private effettiDopoIlColpo(nemico: Nemico, colpo: Colpo, danno: number, critico: boolean, sconfitto: boolean, adesso: number): void {
    const e = colpo.effetti;
    let cura = 0;
    if (e.includes('risucchio_vita')) cura += vitaRisucchiata(danno);
    if (critico && !colpo.dalCompagno && this.effettiArmatura().includes('predatore')) cura += NUMERI_EFFETTI.curaPredatore;
    if (cura > 0) {
      const recuperata = this.eroe.recuperaVita(cura);
      if (recuperata > 0) mostraNumero(this.scena, this.eroe.x, this.eroe.y - 8, `+${recuperata}`, 'cura');
    }
    if (!sconfitto && e.includes('fuoco')) {
      nemico.aggiungiEffetto('fuoco', NUMERI_EFFETTI.fuoco.dannoAlSecondo, NUMERI_EFFETTI.fuoco.durataMs, adesso);
    }
    if (!sconfitto && e.includes('rallentamento')) {
      nemico.aggiungiEffetto('rallentamento', NUMERI_EFFETTI.rallentamento.fattore, NUMERI_EFFETTI.rallentamento.durataMs, adesso);
    }
    if (sconfitto && e.includes('invisibile_dopo_uccisione')) {
      this.eroe.rendiInvisibile(adesso + NUMERI_EFFETTI.invisibileMs);
      mostraNumero(this.scena, this.eroe.x, this.eroe.y - 10, 'invisibile!', 'avviso');
    }
  }
}

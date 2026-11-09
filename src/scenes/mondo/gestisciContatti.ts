// Nemici che toccano l'eroe: danno da contatto.
// Usiamo overlap (sovrapposizione) e non collider: eroe e nemici possono
// toccarsi senza spingersi, e quando succede chiamiamo la nostra funzione.

import type * as Phaser from 'phaser';
import type { Eroe } from '../../entities/Eroe';
import type { Casuale } from '../../systems/casuale';
import { calcolaDanno } from '../../systems/combattimento';
import { arrivaDavanti } from '../../systems/geometria';
import type { Nemico } from '../../entities/Nemico';
import type { Vettore } from '../../systems/tipi';
import type { GruppoNemici } from './GruppoNemici';
import { mostraNumero } from './numeriDanno';
import { suoni } from '../../audio/Suoni';
import { mostraVignetteDanno, scuotiSchermo } from './feedbackVisivo';

/** Un colpo che arriva da lontano: chi lo manda, quanto fa, da dove arriva. */
export type ColpoDaLontano = (nemico: Nemico, dado: string, da: Vettore) => void;

export function gestisciContatti(
  scena: Phaser.Scene,
  eroe: Eroe,
  nemici: GruppoNemici,
  casuale: Casuale,
  /** Armatura dell'eroe in questo momento (base + pozione di resistenza). */
  armatura: () => number,
  quandoSconfitto: () => void,
  /** Dopo un colpo subito davvero (per la Corazza di spine). */
  dopoColpoSubito: (nemico: Nemico, danno: number) => void = () => {},
  /**
   * Protezioni dei compagni (parata di Corrado, scudo di Elisa): riceve il danno
   * e restituisce quanto ne arriva davvero all'eroe. 0 = colpo fermato.
   */
  protezione: (danno: number, nemico: Nemico) => number = (danno) => danno,
): ColpoDaLontano {
  /**
   * Il colpo vero e proprio, da un nemico all'eroe. "contatto" = il nemico lo
   * tocca (morso, artigli); falso = un tiro o un masso, che arrivano da lontano:
   * in quel caso non c'è nessun nemico da respingere o da fermare.
   */
  const colpisci = (nemico: Nemico, dado: string, da: Vettore, contatto: boolean): void => {
    const adesso = scena.time.now;
    // Parata del Guerriero: un colpo che arriva davanti allo scudo non fa danno
    // e il nemico viene respinto. Da dietro o di lato invece passa.
    if (eroe.staParando() && arrivaDavanti(eroe.guarda, { x: eroe.x, y: eroe.y }, da)) {
      if (contatto) {
        nemico.respingi({ x: eroe.x, y: eroe.y }, 200, adesso);
        nemico.dopoAttacco(adesso);
      }
      mostraNumero(scena, eroe.x, eroe.y - 6, 'parato!', 'avviso');
      return;
    }

    // Un eroe che ora non può essere colpito non consuma lo scudo del compagno.
    if (!eroe.puòEssereColpito(adesso)) return;
    // I nemici non fanno critici: sarebbe frustrante senza poterli prevedere.
    const { danno: dannoPieno } = calcolaDanno({ dado, modificatore: 0, bonus: 0, armatura: armatura(), probabilitaCritico: 0 }, casuale);
    const danno = protezione(dannoPieno, nemico);
    if (danno <= 0) {
      if (contatto) {
        nemico.respingi({ x: eroe.x, y: eroe.y }, 160, adesso);
        nemico.dopoAttacco(adesso);
      }
      return;
    }
    const esito = eroe.colpisci(danno, da, adesso);
    if (esito === 'ignorato') return;

    if (contatto) nemico.dopoAttacco(adesso);
    mostraNumero(scena, eroe.x, eroe.y, danno, 'eroe');
    // La Corazza di spine rimanda il danno solo a chi ti ha toccato, non a chi tira da lontano.
    if (contatto) dopoColpoSubito(nemico, danno);
    // Feedback danno subito: vignette rossa sui bordi dello schermo
    mostraVignetteDanno(scena);
    // Screen shake disattivato sui colpi normali dei mob; attivo solo sui colpi dei boss (se abilitato nelle opzioni)
    if (nemico.definizione.fasi) {
      scuotiSchermo(scena, 150, 0.005);
    }
    if (esito === 'ferito') suoni.effetto('ferito'); // la sconfitta ha il suo suono, nella scena
    if (esito === 'sconfitto') quandoSconfitto();
  };

  scena.physics.add.overlap(eroe.forma, nemici.gruppo, (_, formaNemico) => {
    const nemico = nemici.daForma(formaNemico);
    if (!nemico || !nemico.puòAttaccare(scena.time.now)) return;
    colpisci(nemico, nemico.definizione.danno, { x: nemico.forma.x, y: nemico.forma.y }, true);
  });

  // Fase 8b: tiri dei goblin arcieri e massi del troll usano lo stesso colpo.
  return (nemico, dado, da) => colpisci(nemico, dado, da, false);
}

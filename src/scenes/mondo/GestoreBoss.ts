// Lo scontro con un boss (fase 8a). Il boss è un Nemico come gli altri (si
// muove e colpisce con il suo comportamento); questo gestore aggiunge ciò che
// lo rende un boss: l'ingaggio (le barriere si chiudono alle spalle dell'eroe),
// le fasi con i loro attacchi speciali (scelti da systems/boss.ts) e la barra
// della vita in alto, che l'interfaccia legge dal registro condiviso.

import type * as Phaser from 'phaser';
import { CHIAVE_BOSS, TESSERA } from '../../costanti';
import type { Barriera } from '../../entities/Barriera';
import type { Nemico } from '../../entities/Nemico';
import { attacchiPronti, faseDi, puntiCrollo, puntoTeletrasporto, quantiEvocare, ventaglio, type AttaccoBoss } from '../../systems/boss';
import { cellaDaPixel, centroCella } from '../../systems/coordinate';
import type { Griglia } from '../../systems/percorso';
import type { DefinizioneNemico, Vettore } from '../../systems/tipi';
import type { ColpoDaLontano } from './gestisciContatti';
import type { GruppoNemici } from './GruppoNemici';
import { scuotiSchermo } from './feedbackVisivo';

/** Ciò che serve al boss del mondo intorno (fase 8b): dov'è l'eroe e come colpirlo da lontano. */
export interface AmbienteBoss {
  eroe: () => Vettore;
  colpisci: ColpoDaLontano;
  casuale: () => number;
  /** Fase 8c: un tiro magico del boss (stesso sistema delle frecce dei goblin). */
  tira: (nemico: Nemico, direzione: Vettore, parametri: { velocita: number; gittata: number; dimensione: number; colore: string }, dado: string) => void;
}

type Carica = { fase: 'mira'; fino: number; attacco: Extract<AttaccoBoss, { tipo: 'carica' }> } | { fase: 'scatto'; fino: number; attacco: Extract<AttaccoBoss, { tipo: 'carica' }> };

/** Sotto questa distanza (in pixel) il boss non carica: l'eroe gli è già addosso. */
const DISTANZA_MINIMA_CARICA = 48;

export interface StatoBarra {
  nome: string;
  vita: number;
  massima: number;
}

export class GestoreBoss {
  private ingaggiato = false;
  private fase = 0;
  private ultimoUso: Record<number, number> = {};
  private evocati: Nemico[] = [];
  /** La carica in corso (mira o scatto): finché dura non parte nessun altro attacco. */
  private carica: Carica | null = null;
  private readonly segni: Phaser.GameObjects.Graphics;
  /** Dove è nato: il teletrasporto resta intorno a qui, cioè nella sua stanza. */
  private readonly casa: Vettore;

  constructor(
    private readonly scena: Phaser.Scene,
    readonly nemico: Nemico,
    private readonly barriere: readonly Barriera[],
    private readonly nemici: GruppoNemici,
    private readonly griglia: Griglia,
    private readonly definizioni: Readonly<Record<string, DefinizioneNemico>>,
    private readonly avvisa: (testo: string) => void,
    private readonly ambiente: AmbienteBoss,
  ) {
    scena.registry.set(CHIAVE_BOSS, null);
    this.segni = scena.add.graphics().setDepth(4);
    this.casa = { x: nemico.forma.x, y: nemico.forma.y };
  }

  get inCorso(): boolean {
    return this.ingaggiato && this.nemico.vivo;
  }

  aggiorna(adesso: number, eroe: Vettore): void {
    if (!this.nemico.vivo) return;
    const d = this.nemico.definizione;
    if (!this.ingaggiato) {
      const vicino = Math.hypot(this.nemico.forma.x - eroe.x, this.nemico.forma.y - eroe.y) <= d.raggioVista;
      // Non si chiude una barriera con l'eroe sopra: resterebbe incastrato.
      if (!vicino || this.barriere.some((b) => b.contiene(eroe))) return;
      this.ingaggiato = true;
      for (const b of this.barriere) b.chiudi();
      // Appena ingaggiato non attacca subito: gli attacchi della prima fase partono
      // dopo un giro di ricarica. Quelli delle fasi successive invece subito.
      (d.fasi?.[0]?.attacchi ?? []).forEach((_, i) => (this.ultimoUso[i] = adesso));
      this.avvisa(`${d.nome}!`);
    }
    const fasi = d.fasi ?? [];
    const { attuale, massima } = this.nemico.vitaAttuale;
    const fase = faseDi(fasi, attuale, massima);
    if (fase !== this.fase) {
      this.fase = fase;
      this.ultimoUso = {};
      if (fasi[fase]?.avviso) this.avvisa(fasi[fase]!.avviso!);
    }
    this.aggiornaCarica(adesso);
    const attuali = fasi[fase];
    if (attuali && !this.carica) {
      for (const i of attacchiPronti(attuali, this.ultimoUso, adesso)) {
        // Un attacco che adesso non ha senso (la carica con l'eroe addosso) riprova al prossimo fotogramma.
        if (!this.esegui(attuali.attacchi[i]!, adesso)) continue;
        this.ultimoUso[i] = adesso;
        if (this.carica) break;
      }
    }
    this.scena.registry.set(CHIAVE_BOSS, { nome: d.nome, vita: attuale, massima } satisfies StatoBarra);
  }

  /** Il boss è caduto: le barriere si riaprono, la barra sparisce. */
  sconfitto(): void {
    this.segni.clear();
    this.carica = null;
    for (const b of this.barriere) b.apri();
    this.scena.registry.set(CHIAVE_BOSS, null);
  }

  /** Esegue un attacco. Falso se adesso non si può (e allora non conta come usato). */
  private esegui(a: AttaccoBoss, adesso: number): boolean {
    switch (a.tipo) {
      case 'carica': {
        // Con l'eroe addosso una carica non ha senso: il troll lo colpisce e basta.
        const eroe = this.ambiente.eroe();
        if (Math.hypot(eroe.x - this.nemico.forma.x, eroe.y - this.nemico.forma.y) < DISTANZA_MINIMA_CARICA) return false;
        // Si ferma e mira: per tutta la mira si vede una linea verso l'eroe.
        this.carica = { fase: 'mira', fino: adesso + a.miraMs, attacco: a };
        this.nemico.fermaPer(adesso, a.miraMs);
        return true;
      }
      case 'crollo_massi':
        this.crolloMassi(a);
        return true;
      case 'teletrasporto': {
        const candidati: Vettore[] = [];
        for (let r = 0; r < this.griglia.altezza; r++)
          for (let c = 0; c < this.griglia.larghezza; c++) if (this.griglia.calpestabile(c, r)) candidati.push(centroCella({ col: c, riga: r }, TESSERA));
        const punto = puntoTeletrasporto(this.casa, this.ambiente.eroe(), candidati, a.raggio, a.distanzaMin, this.ambiente.casuale);
        if (!punto) return false;
        this.sbuffo({ x: this.nemico.forma.x, y: this.nemico.forma.y });
        this.nemico.teletrasporta(punto);
        this.sbuffo(punto);
        return true;
      }
      case 'incantesimo': {
        const eroe = this.ambiente.eroe();
        const d = Math.hypot(eroe.x - this.nemico.forma.x, eroe.y - this.nemico.forma.y) || 1;
        const verso = { x: (eroe.x - this.nemico.forma.x) / d, y: (eroe.y - this.nemico.forma.y) / d };
        for (const dir of ventaglio(verso, a.colpi, a.ventaglioGradi)) this.ambiente.tira(this.nemico, dir, a, a.danno);
        return true;
      }
      case 'evoca': {
        this.evocati = this.evocati.filter((n) => n.vivo);
        const quanti = quantiEvocare(a, this.evocati.length);
        const posti = this.celleLibereVicine(quanti);
        for (const p of posti) this.evocati.push(this.nemici.aggiungi(this.definizioni[a.nemico]!, p));
        return true;
      }
    }
  }

  /** Celle libere a 2–3 tessere dal boss, per farci comparire i servitori. */
  private celleLibereVicine(quante: number): Vettore[] {
    const centro = cellaDaPixel(this.nemico.forma.x, this.nemico.forma.y, TESSERA);
    const libere: Vettore[] = [];
    for (let dr = -3; dr <= 3; dr++) {
      for (let dc = -3; dc <= 3; dc++) {
        const distanza = Math.max(Math.abs(dc), Math.abs(dr));
        const cella = { col: centro.col + dc, riga: centro.riga + dr };
        if (distanza >= 2 && this.griglia.calpestabile(cella.col, cella.riga)) libere.push(centroCella(cella, TESSERA));
      }
    }
    // Sparse intorno al boss, non tutte in fila: si prende una cella ogni tante.
    const passo = Math.max(1, Math.floor(libere.length / Math.max(1, quante)));
    return libere.filter((_, i) => i % passo === 0).slice(0, quante);
  }

  private aggiornaCarica(adesso: number): void {
    const c = this.carica;
    const boss = { x: this.nemico.forma.x, y: this.nemico.forma.y };
    this.segni.clear();
    if (!c) return;
    if (c.fase === 'mira') {
      const eroe = this.ambiente.eroe();
      // La linea rossa lampeggia: è il momento di preparare la capriola.
      this.segni.lineStyle(3, 0xff3030, Math.floor(adesso / 90) % 2 ? 0.9 : 0.4).lineBetween(boss.x, boss.y, eroe.x, eroe.y);
      if (adesso < c.fino) return;
      const d = Math.hypot(eroe.x - boss.x, eroe.y - boss.y);
      // Se nel frattempo l'eroe gli è finito addosso, carica nella direzione in cui guarda.
      const dir = d > 1 ? { x: (eroe.x - boss.x) / d, y: (eroe.y - boss.y) / d } : this.nemico.guarda;
      const lunghezza = Math.hypot(dir.x, dir.y) || 1;
      const v = { x: (dir.x / lunghezza) * c.attacco.velocita, y: (dir.y / lunghezza) * c.attacco.velocita };
      this.nemico.imponi(v, adesso + c.attacco.durataMs);
      this.carica = { fase: 'scatto', fino: adesso + c.attacco.durataMs, attacco: c.attacco };
      return;
    }
    // Scatto: contro un muro si stordisce (è il momento di colpirlo); altrimenti si ferma a fine corsa.
    if (this.nemico.controUnMuro && adesso > c.fino - c.attacco.durataMs + 100) {
      this.nemico.fermaPer(adesso, c.attacco.stordimentoMs);
      scuotiSchermo(this.scena, 200, 0.006);
      this.avvisa(`${this.nemico.definizione.nome} sbatte contro la roccia!`);
      this.carica = null;
    } else if (adesso >= c.fino) {
      this.nemico.fermaPer(adesso, c.attacco.stordimentoMs / 2);
      this.carica = null;
    }
  }

  /** Ombre a terra, poi i massi: chi è ancora sotto un'ombra quando cade viene colpito. */
  private crolloMassi(a: Extract<AttaccoBoss, { tipo: 'crollo_massi' }>): void {
    const punti = puntiCrollo(this.ambiente.eroe(), a.quanti, this.ambiente.casuale, (x, y) => {
      const c = cellaDaPixel(x, y, TESSERA);
      return this.griglia.calpestabile(c.col, c.riga);
    });
    for (const p of punti) {
      const ombra = this.scena.add.circle(p.x, p.y, a.raggio, 0x000000, 0.25).setDepth(3).setScale(0.3);
      this.scena.tweens.add({
        targets: ombra,
        scale: 1,
        alpha: 0.55,
        duration: a.preavvisoMs,
        onComplete: () => {
          ombra.destroy();
          if (!this.nemico.vivo) return;
          const masso = this.scena.add.circle(p.x, p.y, a.raggio * 0.8, 0x7a7a7a).setDepth(9).setStrokeStyle(1, 0x3a3a3a);
          this.scena.tweens.add({ targets: masso, alpha: 0, delay: 250, duration: 300, onComplete: () => masso.destroy() });
          const eroe = this.ambiente.eroe();
          if (Math.hypot(eroe.x - p.x, eroe.y - p.y) <= a.raggio + 4) this.ambiente.colpisci(this.nemico, a.danno, p);
        },
      });
    }
  }

  /** Un lampo viola dove il Negromante sparisce o ricompare. */
  private sbuffo(p: Vettore): void {
    const lampo = this.scena.add.circle(p.x, p.y, 14, 0xb46bff, 0.6).setDepth(8);
    this.scena.tweens.add({ targets: lampo, scale: 1.8, alpha: 0, duration: 400, onComplete: () => lampo.destroy() });
  }
}

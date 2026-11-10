// L'eroe: un quadrato con un corpo fisico, un "occhio" che indica dove guarda,
// un'area di colpo che compare durante l'attacco e (per il Guerriero) uno scudo.
// Le regole (velocità, stati, vita, mana) vengono dai systems; qui c'è solo il
// collegamento con Phaser.

import * as Phaser from 'phaser';
import datiEroe from '../data/eroe.json';
import { areaDiColpo, direzioneDa, rettangoloDaCentro, type Rettangolo } from '../systems/geometria';
import { direzioneVerso } from '../systems/mira';
import { aggiornaDirezioneDaVettore } from '../systems/movimento';
import { basta, consuma, èEsaurita, recupera, type Risorsa } from '../systems/risorsa';
import {
  aggiornaStato,
  attendiAttacco,
  creaStatoEroe,
  èInvulnerabile,
  provaAttacco,
  provaParata,
  provaSchivata,
  riceviColpo,
  sconfiggi,
  type RegoleEroe,
  type StatoEroe,
} from '../systems/statoEroe';
import type { ComandiEroe, DefinizioneArma, Direzione, Vettore } from '../systems/tipi';
import { colore } from './colori';
import { Figura } from './Figura';
import { suoni } from '../audio/Suoni';

import type { AspettoRisolto } from '../systems/sprite';

const SPOSTAMENTO_OCCHIO = 3;
/** Ogni quanti millisecondi l'eroe invulnerabile alterna visibile/trasparente. */
const PERIODO_LAMPEGGIO = 80;

const VERSI: Record<Direzione, Vettore> = {
  su: { x: 0, y: -1 },
  giu: { x: 0, y: 1 },
  sinistra: { x: -1, y: 0 },
  destra: { x: 1, y: 0 },
};

export type EsitoColpoSubito = 'ignorato' | 'ferito' | 'sconfitto';

/** Ciò che dell'eroe dipende dalla classe e dalle caratteristiche (calcolato dalla scena). */
export interface ProfiloEroe {
  arma: DefinizioneArma;
  colore: string;
  ricaricaSchivataMs: number;
  vita: Risorsa;
  mana: Risorsa;
  /** Mana recuperato al secondo. */
  rigenerazioneMana: number;
  /** Durata della parata (solo Guerriero; 0 per gli altri). */
  durataParataMs: number;
  /** Capriole di fila: 2 con gli Stivali del vento. */
  capriole: number;
  /** La figura in pixel art della classe (fase 9b); null = il quadrato colorato di prima. */
  figura: AspettoRisolto | null;
}

export class Eroe {
  readonly forma: Phaser.GameObjects.Rectangle;
  /** L'arma in mano: cambia quando se ne impugna un'altra (zaino, scheda, barra). */
  private _arma: DefinizioneArma;
  private readonly occhio: Phaser.GameObjects.Rectangle;
  /** Disegno dell'area di colpo e dello scudo: un Graphics si ridisegna facilmente. */
  private readonly disegno: Phaser.GameObjects.Graphics;
  private readonly corpo: Phaser.Physics.Arcade.Body;
  private readonly regole: RegoleEroe;

  private direzione: Direzione = 'giu';
  private stato: StatoEroe = creaStatoEroe();
  private _vita: Risorsa;
  private _mana: Risorsa;
  private rigenerazioneMana: number;
  private ultimoAggiornamento: number | null = null;
  /** Numero del fendente attuale: serve a non colpire due volte lo stesso nemico. */
  private _fendente = 0;
  /** Direzione della capriola o della respinta, decisa quando iniziano. */
  private spinta: Vettore = { x: 0, y: 0 };
  /** Scatto nell'ombra: fino a quando l'eroe è invisibile. */
  private invisibileFino = 0;
  /** Modalità sviluppatore: i colpi non hanno effetto. */
  invulnerabileSviluppatore = false;
  /** Chiamata quando un'arma a distanza tira: la scena crea il proiettile. */
  quandoTira: (da: Vettore, direzione: Vettore) => void = () => {};

  constructor(scena: Phaser.Scene, x: number, y: number, profilo: ProfiloEroe) {
    const lato = datiEroe.dimensione;
    this._arma = profilo.arma;
    this.forma = scena.add.rectangle(x, y, lato, lato, colore(profilo.colore)).setDepth(10);
    this.occhio = scena.add.rectangle(x, y, 3, 3, colore(datiEroe.coloreOcchio)).setDepth(11);
    this.disegno = scena.add.graphics().setDepth(12);

    scena.physics.add.existing(this.forma);
    this.corpo = this.forma.body as Phaser.Physics.Arcade.Body;
    if (profilo.figura) {
      // Fase 9b: si vede la figura; il quadrato resta come corpo fisico, invisibile.
      // L'occhio non serve più: la figura si gira da sola verso dove cammina.
      this.forma.setVisible(false);
      this.occhio.setVisible(false);
      new Figura(scena, this.forma, profilo.figura, { profondita: 10, sollevamento: 2 });
    }

    this.regole = {
      durataAttaccoMs: profilo.arma.durataMs,
      ricaricaAttaccoMs: profilo.arma.ricaricaMs,
      durataSchivataMs: datiEroe.schivata.durataMs,
      ricaricaSchivataMs: profilo.ricaricaSchivataMs,
      durataRespintaMs: datiEroe.respinta.durataMs,
      invulnerabilitaMs: datiEroe.invulnerabilitaMs,
      durataParataMs: profilo.durataParataMs,
      capriole: profilo.capriole,
    };
    this._vita = profilo.vita;
    this._mana = profilo.mana;
    this.rigenerazioneMana = profilo.rigenerazioneMana;

    // Occhio, area e scudo vanno riposizionati DOPO che la fisica ha spostato
    // l'eroe, altrimenti resterebbero indietro di un fotogramma.
    scena.events.on(Phaser.Scenes.Events.POST_UPDATE, this.dopoFisica, this);
    scena.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scena.events.off(Phaser.Scenes.Events.POST_UPDATE, this.dopoFisica, this);
    });
    this.dopoFisica();
  }

  /** Chiamato a ogni fotogramma dalla scena. */
  aggiorna(comandi: ComandiEroe, adesso: number): void {
    // 0. Il mana si ricarica col tempo (solo per chi ne ha).
    const trascorso = this.ultimoAggiornamento === null ? 0 : adesso - this.ultimoAggiornamento;
    this.ultimoAggiornamento = adesso;
    if (this._mana.massima > 0 && this._mana.attuale < this._mana.massima && !this.sconfitto) {
      this._mana = recupera(this._mana, (this.rigenerazioneMana * trascorso) / 1000);
    }

    // 1. Il tempo che passa può chiudere attacco, capriola, respinta o parata.
    this.stato = aggiornaStato(this.stato, adesso, this.regole);

    // 2. I comandi possono avviare un nuovo stato (solo se quello attuale lo permette).
    if (comandi.attacca) this.provaAdAttaccare(comandi, adesso);
    if (comandi.schiva) {
      const nuovo = provaSchivata(this.stato, adesso, this.regole);
      if (nuovo !== this.stato) {
        // La capriola va verso il cursore; altrimenti dove si cammina, o dove si guarda.
        const m = comandi.movimento;
        this.spinta = comandi.direzioneSchivata ?? (m.x === 0 && m.y === 0 ? VERSI[this.direzione] : m);
        suoni.effetto('capriola');
      }
      this.stato = nuovo;
    }

    // 3. Ogni stato decide come ci si muove.
    switch (this.stato.nome) {
      case 'libero': {
        const m = comandi.movimento;
        this.corpo.setVelocity(m.x * datiEroe.velocita, m.y * datiEroe.velocita);
        this.direzione = comandi.guarda ?? aggiornaDirezioneDaVettore(this.direzione, m);
        break;
      }
      case 'schivata':
        this.corpo.setVelocity(this.spinta.x * datiEroe.schivata.velocita, this.spinta.y * datiEroe.schivata.velocita);
        break;
      case 'colpito':
        this.corpo.setVelocity(this.spinta.x * datiEroe.respinta.velocita, this.spinta.y * datiEroe.respinta.velocita);
        break;
      case 'attacco':
      case 'parata':
      case 'sconfitto':
        this.corpo.setVelocity(0, 0);
        break;
    }

    this.aggiornaAspetto(adesso);
  }

  private provaAdAttaccare(comandi: ComandiEroe, adesso: number): void {
    const tiro = this.arma.proiettile;
    // Le armi a distanza costano mana: senza, il colpo non parte.
    if (tiro && !basta(this._mana, tiro.costoMana)) return;
    const nuovo = provaAttacco(this.stato, adesso, this.regole);
    if (nuovo === this.stato) return;
    this.stato = nuovo;
    this._fendente++;
    this.invisibileFino = 0; // attaccare rivela il Ladro nascosto
    // Col mouse si mira: prima di colpire l'eroe si gira verso il bersaglio.
    const qui = { x: this.x, y: this.y };
    if (comandi.mira) this.direzione = direzioneVerso(qui, comandi.mira);
    else if (comandi.guarda) this.direzione = comandi.guarda;
    if (tiro) {
      this._mana = consuma(this._mana, tiro.costoMana);
      this.quandoTira(qui, comandi.mira ? direzioneDa(qui, comandi.mira) : VERSI[this.direzione]);
    }
  }

  /** Parata del Guerriero verso un punto. Restituisce false se ora non si può. */
  alzaScudo(verso: Vettore, adesso: number): boolean {
    const nuovo = provaParata(this.stato, adesso, this.regole);
    if (nuovo === this.stato) return false;
    this.direzione = direzioneVerso({ x: this.x, y: this.y }, verso);
    this.stato = nuovo;
    this.corpo.setVelocity(0, 0);
    return true;
  }

  /** Un nemico ha toccato l'eroe. "da" è la posizione del nemico, per la respinta. */
  colpisci(danno: number, da: Vettore, adesso: number): EsitoColpoSubito {
    if (this.invulnerabileSviluppatore || èInvulnerabile(this.stato, adesso)) return 'ignorato';

    this._vita = consuma(this._vita, danno);
    this.invisibileFino = 0;
    if (èEsaurita(this._vita)) {
      this.stato = sconfiggi(this.stato, adesso);
      this.corpo.setVelocity(0, 0);
      this.aggiornaAspetto(adesso);
      return 'sconfitto';
    }
    this.stato = riceviColpo(this.stato, adesso, this.regole);
    this.spinta = direzioneDa(da, { x: this.x, y: this.y });
    return 'ferito';
  }

  /** Un colpo adesso avrebbe effetto? (No durante la capriola, l'invulnerabilità o da sconfitti.) */
  puòEssereColpito(adesso: number): boolean {
    return !this.invulnerabileSviluppatore && !èInvulnerabile(this.stato, adesso);
  }

  /** Area di colpo, solo mentre un attacco in mischia è in corso. */
  areaDiColpoAttiva(): Rettangolo | null {
    if (this.stato.nome !== 'attacco' || this.arma.proiettile) return null;
    return areaDiColpo({ x: this.x, y: this.y }, datiEroe.dimensione, this.direzione, {
      portata: this.arma.portata,
      larghezza: this.arma.larghezzaColpo,
    });
  }

  rettangolo(): Rettangolo {
    return rettangoloDaCentro({ x: this.x, y: this.y }, datiEroe.dimensione, datiEroe.dimensione);
  }

  // ---- risorse ----

  /** Vita e mana "veri" stanno nella Partita: la scena li ricopia qui quando cambiano da fuori. */
  impostaRisorse(vita: Risorsa, mana: Risorsa): void {
    this._vita = vita;
    this._mana = mana;
  }

  consumaMana(quantita: number): void {
    this._mana = consuma(this._mana, quantita);
  }

  /** Cura: restituisce quanta vita è stata davvero recuperata (non si supera il massimo). */
  recuperaVita(quantita: number): number {
    const prima = this._vita.attuale;
    this._vita = recupera(this._vita, quantita);
    return this._vita.attuale - prima;
  }

  /** Con caratteristiche diverse (punto assegnato nella scheda) cambiano capriola e mana. */
  impostaDerivati(ricaricaSchivataMs: number, rigenerazioneMana: number): void {
    this.regole.ricaricaSchivataMs = ricaricaSchivataMs;
    this.rigenerazioneMana = rigenerazioneMana;
  }

  /**
   * Impugna un'altra arma: cambiano durata e ricarica dell'attacco. "attesaMs"
   * impedisce di attaccare subito (cambio rapido dalla barra, fase 4c).
   */
  impostaArma(arma: DefinizioneArma, adesso: number, attesaMs = 0): void {
    this._arma = arma;
    this.regole.durataAttaccoMs = arma.durataMs;
    this.regole.ricaricaAttaccoMs = arma.ricaricaMs;
    if (attesaMs > 0) this.stato = attendiAttacco(this.stato, adesso, attesaMs);
  }

  /** Gli Stivali del vento danno due capriole di fila. */
  impostaCapriole(quante: number): void {
    this.regole.capriole = quante;
  }

  /** Si gira verso un punto (per esempio prima di tirare con l'arma secondaria). */
  girati(verso: Vettore): void {
    this.direzione = direzioneVerso({ x: this.x, y: this.y }, verso);
  }

  rendiInvisibile(fino: number): void {
    this.invisibileFino = fino;
  }

  invisibile(adesso: number): boolean {
    return adesso < this.invisibileFino && !this.sconfitto;
  }

  staParando(): boolean {
    return this.stato.nome === 'parata';
  }

  ferma(): void {
    this.corpo.setVelocity(0, 0);
  }

  /** Quanto manca alla fine della ricarica della capriola: 1 = appena usata, 0 = pronta. */
  frazioneRicaricaSchivata(adesso: number): number {
    const restante = this.stato.schivataPronta - adesso;
    const totale = this.regole.durataSchivataMs + this.regole.ricaricaSchivataMs;
    return Math.min(1, Math.max(0, restante / totale));
  }

  get arma(): DefinizioneArma {
    return this._arma;
  }
  get libero(): boolean {
    return this.stato.nome === 'libero';
  }
  get lato(): number {
    return datiEroe.dimensione;
  }
  get vita(): Risorsa {
    return this._vita;
  }
  get mana(): Risorsa {
    return this._mana;
  }
  get fendente(): number {
    return this._fendente;
  }
  get sconfitto(): boolean {
    return this.stato.nome === 'sconfitto';
  }
  get guarda(): Direzione {
    return this.direzione;
  }
  get x(): number {
    return this.forma.x;
  }
  get y(): number {
    return this.forma.y;
  }

  /** Lampeggio durante l'invulnerabilità, trasparenza durante la capriola e l'invisibilità. */
  private aggiornaAspetto(adesso: number): void {
    let alfa = 1;
    if (this.stato.nome === 'sconfitto') alfa = 0.35;
    else if (this.invisibile(adesso)) alfa = 0.3;
    else if (this.stato.nome === 'schivata') alfa = 0.5;
    else if (èInvulnerabile(this.stato, adesso)) alfa = Math.floor(adesso / PERIODO_LAMPEGGIO) % 2 ? 0.25 : 1;
    this.forma.setAlpha(alfa);
    this.occhio.setAlpha(alfa);
  }

  private dopoFisica(): void {
    const verso = VERSI[this.direzione];
    this.occhio.setPosition(this.x + verso.x * SPOSTAMENTO_OCCHIO, this.y + verso.y * SPOSTAMENTO_OCCHIO);

    // Si cancella e si ridisegna a ogni fotogramma: è economico e sempre aggiornato.
    this.disegno.clear();
    const area = this.areaDiColpoAttiva();
    if (area) {
      // Calcolo avanzamento dell'animazione d'attacco per il picco dell'arco (Cleave VFX)
      const p =
        this.ultimoAggiornamento !== null && this.regole.durataAttaccoMs > 0
          ? Math.min(1, Math.max(0, (this.ultimoAggiornamento - this.stato.inizio) / this.regole.durataAttaccoMs))
          : 0.5;
      const alfa = Math.sin(p * Math.PI);
      const angoloCentro =
        verso.x === 1 ? 0 : verso.x === -1 ? Math.PI : verso.y === 1 ? Math.PI / 2 : -Math.PI / 2;
      const semiAmpiezza = (50 * Math.PI) / 180;
      const raggio = 32;

      // Scia esterna dorata
      this.disegno.lineStyle(3, 0xffe680, alfa * 0.85);
      this.disegno.beginPath();
      this.disegno.arc(this.x, this.y, raggio, angoloCentro - semiAmpiezza, angoloCentro + semiAmpiezza, false);
      this.disegno.strokePath();

      // Lama interna bianca brillante
      this.disegno.lineStyle(1.5, 0xffffff, alfa * 0.95);
      this.disegno.beginPath();
      this.disegno.arc(this.x, this.y, raggio - 2, angoloCentro - semiAmpiezza * 0.85, angoloCentro + semiAmpiezza * 0.85, false);
      this.disegno.strokePath();

      // Cono di taglio semi-trasparente
      this.disegno.fillStyle(0xffe680, alfa * 0.15);
      this.disegno.beginPath();
      this.disegno.moveTo(this.x, this.y);
      this.disegno.arc(this.x, this.y, raggio, angoloCentro - semiAmpiezza, angoloCentro + semiAmpiezza, false);
      this.disegno.closePath();
      this.disegno.fillPath();
    }
    if (this.staParando()) {
      // Lo scudo: una barra chiara appoggiata al lato verso cui si guarda.
      const lungo = 16;
      const spesso = 3;
      const cx = this.x + verso.x * 9;
      const cy = this.y + verso.y * 9;
      const w = verso.x !== 0 ? spesso : lungo;
      const h = verso.x !== 0 ? lungo : spesso;
      this.disegno.fillStyle(0xcfe3ff, 0.9).fillRect(cx - w / 2, cy - h / 2, w, h);
    }
  }
}

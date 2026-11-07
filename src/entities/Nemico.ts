// Un nemico: corpo fisico, vita e una "mente" presa dal registro dei comportamenti.
// La mente decide la velocità; il nemico la applica, tranne quando è stordito
// (sta volando all'indietro per un colpo) o in pausa dopo aver attaccato.

import type * as Phaser from 'phaser';
import { aggiungiEffetto, attivi, danniDaTick, type EffettoAttivo } from '../systems/effettiTemporanei';
import { creaMente, type Mente } from '../systems/ia/comportamenti';
import { direzioneDa, type Rettangolo } from '../systems/geometria';
import type { DefinizioneNemico, Vettore } from '../systems/tipi';
import { consuma, creaRisorsa, èEsaurita, type Risorsa } from '../systems/risorsa';
import { colore } from './colori';
import { Figura } from './Figura';
import type { AspettoRisolto } from '../systems/sprite';

export class Nemico {
  readonly forma: Phaser.GameObjects.Rectangle;
  private readonly corpo: Phaser.Physics.Arcade.Body;
  private readonly mente: Mente;
  private readonly casa: Vettore;
  private vita: Risorsa;
  private storditoFino = 0;
  private pausaFino = 0;
  private _vivo = true;
  /** Dove guarda: l'ultima direzione in cui ha camminato (serve al colpo alle spalle del Ladro). */
  private _guarda: Vettore = { x: 0, y: 1 };
  /** Effetti delle armi dell'eroe: fuoco e rallentamento (stessa logica delle pozioni). */
  private effetti: EffettoAttivo[] = [];
  /** Fase 8b: un movimento imposto da fuori (la carica del troll), che vince sulla mente. */
  private imposto: { velocita: Vettore; fino: number } | null = null;
  /** Fase 8b: chi tira (goblin arcieri) chiama questa funzione; la scena crea il proiettile. */
  quandoTira: ((nemico: Nemico, direzione: Vettore) => void) | null = null;
  /** Fase 8b: "tra me e lui ci sono muri?". La scena la imposta con la griglia della mappa. */
  /** La figura in pixel art (fase 9b), se c'è. */
  private readonly figura: Figura | null = null;
  lineaLibera: ((da: Vettore, a: Vettore) => boolean) | null = null;

  constructor(
    private readonly scena: Phaser.Scene,
    gruppo: Phaser.Physics.Arcade.Group,
    readonly id: number,
    readonly definizione: DefinizioneNemico,
    x: number,
    y: number,
    /** Fase 9b: la figura in pixel art (null = il quadrato colorato delle fasi 1–8). */
    aspetto: AspettoRisolto | null = null,
  ) {
    const lato = definizione.dimensione;
    this.forma = scena.add.rectangle(x, y, lato, lato, colore(definizione.colore)).setDepth(5).setAlpha(definizione.opacita ?? 1);
    if (aspetto) {
      // La figura è un po' più grande del corpo (le tessere hanno un bordo vuoto)
      // e appoggia i piedi sul fondo del rettangolo. I boss, più grossi, crescono con lui.
      const latoFigura = Math.max(16, Math.round(lato * 1.25));
      this.figura = new Figura(scena, this.forma, aspetto, { profondita: 5, lato: latoFigura, sollevamento: (latoFigura - lato) / 2 });
      this.forma.setVisible(false);
    }
    // Aggiungerlo al gruppo fisico gli dà un corpo e lo fa partecipare
    // alle collisioni definite per il gruppo (muri, altri nemici).
    gruppo.add(this.forma);
    this.corpo = this.forma.body as Phaser.Physics.Arcade.Body;
    this.mente = creaMente(definizione.comportamento, definizione);
    this.casa = { x, y };
    this.vita = creaRisorsa(definizione.vita);
  }

  aggiorna(adesso: number, bersaglio: Vettore | null): void {
    if (!this._vivo) return;
    if (this.imposto && adesso < this.imposto.fino) {
      this.corpo.setVelocity(this.imposto.velocita.x, this.imposto.velocita.y);
      return;
    }
    this.imposto = null;
    if (adesso < this.storditoFino) return; // la velocità della respinta resta quella impostata
    if (adesso < this.pausaFino) {
      this.corpo.setVelocity(0, 0);
      return;
    }
    const posizione = { x: this.forma.x, y: this.forma.y };
    const lineaLibera = bersaglio && this.lineaLibera ? this.lineaLibera(posizione, bersaglio) : true;
    const azione = this.mente({ posizione, casa: this.casa, bersaglio, adesso, lineaLibera });
    const v = azione.velocita;
    // Rallentato: si muove a una frazione della velocità (il valore dell'effetto).
    const lento = attivi(this.effetti, adesso).find((e) => e.tipo === 'rallentamento');
    const fattore = lento ? lento.valore : 1;
    this.corpo.setVelocity(v.x * fattore, v.y * fattore);
    if (v.x !== 0 || v.y !== 0) this._guarda = v;
    if (azione.tira) {
      this._guarda = azione.tira;
      this.quandoTira?.(this, azione.tira);
    }
    this.aggiornaBordo(adesso);
    // Il ragno che mira lampeggia: è il segnale per prepararsi alla capriola.
    if (azione.stato === 'mira') {
      const c = Math.floor(adesso / 80) % 2 ? 0xffffff : 0xff4040;
      this.forma.setStrokeStyle(2, c);
      this.figura?.evidenzia(c === 0xffffff ? 0xffa0a0 : 0xff4040);
    }
  }

  /** Un bordo colorato mostra gli effetti attivi (fuoco, rallentamento). */
  private aggiornaBordo(adesso: number): void {
    const c = this.coloreEffetto(adesso);
    if (c === null) this.forma.setStrokeStyle();
    else this.forma.setStrokeStyle(1.5, c);
    this.figura?.evidenzia(c); // con la pixel art il colore dell'effetto tinge la figura
  }

  /**
   * Colpito dall'eroe. Restituisce true se è stato sconfitto.
   * Le bruciature e le spine non stordiscono (stordisci = false): solo i colpi veri.
   */
  subisci(danno: number, da: Vettore, respinta: number, adesso: number, stordisci = true): boolean {
    this.vita = consuma(this.vita, danno);
    if (stordisci) {
      const verso = direzioneDa(da, { x: this.forma.x, y: this.forma.y });
      this.corpo.setVelocity(verso.x * respinta, verso.y * respinta);
      this.storditoFino = adesso + this.definizione.storditoMs;
    }

    // Lampo bianco: un segnale visivo immediato che il colpo è andato a segno.
    this.forma.setFillStyle(0xffffff);
    this.scena.time.delayedCall(70, () => this.forma.setFillStyle(colore(this.definizione.colore)));
    this.figura?.lampo();

    if (èEsaurita(this.vita)) this.muori();
    return !this._vivo;
  }

  /** Fuoco o rallentamento: lo stesso tipo non si somma, si rinnova (come le pozioni). */
  aggiungiEffetto(tipo: 'fuoco' | 'rallentamento', valore: number, durataMs: number, adesso: number): void {
    this.effetti = aggiungiEffetto(this.effetti, tipo, valore, durataMs, adesso);
  }

  /** Danni del fuoco maturati fino ad adesso (chi chiama li applica con subisci). */
  danniDaFuoco(adesso: number): number {
    const esito = danniDaTick(this.effetti, 'fuoco', adesso);
    this.effetti = attivi(esito.effetti, adesso);
    return esito.danni;
  }

  /** Per il colore: arancione se brucia, azzurro se rallentato. */
  coloreEffetto(adesso: number): number | null {
    const tipi = attivi(this.effetti, adesso).map((e) => e.tipo);
    if (tipi.includes('fuoco')) return 0xff8c32;
    if (tipi.includes('rallentamento')) return 0x8fd3ff;
    return null;
  }

  /** Respinto senza danno (per esempio dallo scudo del Guerriero). */
  respingi(da: Vettore, velocita: number, adesso: number): void {
    const verso = direzioneDa(da, { x: this.forma.x, y: this.forma.y });
    this.corpo.setVelocity(verso.x * velocita, verso.y * velocita);
    this.storditoFino = adesso + this.definizione.storditoMs;
  }

  puòAttaccare(adesso: number): boolean {
    return this._vivo && adesso >= this.pausaFino && adesso >= this.storditoFino;
  }

  /** Dopo aver colpito l'eroe si ferma un attimo, per dare respiro al giocatore. */
  dopoAttacco(adesso: number): void {
    this.pausaFino = adesso + this.definizione.pausaDopoAttaccoMs;
  }

  /** Fase 8b: per un po' si muove così, qualunque cosa decida la mente (la carica del troll). */
  imponi(velocita: Vettore, fino: number): void {
    this.imposto = { velocita, fino };
    if (velocita.x !== 0 || velocita.y !== 0) this._guarda = velocita;
  }

  /** Fase 8c: il Negromante sparisce e ricompare altrove. */
  teletrasporta(p: Vettore): void {
    this.imposto = null;
    this.corpo.reset(p.x, p.y);
  }

  /** Interrompe un movimento imposto (la carica che sbatte contro un muro) e resta fermo un po'. */
  fermaPer(adesso: number, ms: number): void {
    this.imposto = null;
    this.pausaFino = adesso + ms;
    this.corpo.setVelocity(0, 0);
  }

  /** Sta sbattendo contro un muro? */
  get controUnMuro(): boolean {
    const b = this.corpo.blocked;
    return b.left || b.right || b.up || b.down;
  }

  ferma(): void {
    if (this._vivo) this.corpo.setVelocity(0, 0);
  }

  rettangolo(): Rettangolo {
    return { x: this.corpo.x, y: this.corpo.y, larghezza: this.corpo.width, altezza: this.corpo.height };
  }

  get guarda(): Vettore {
    return this._guarda;
  }

  /** Per la barra della vita dei boss. */
  get vitaAttuale(): Readonly<Risorsa> {
    return this.vita;
  }

  get vivo(): boolean {
    return this._vivo;
  }

  private muori(): void {
    this._vivo = false;
    this.corpo.enable = false; // niente più collisioni
    // Una tween anima una proprietà nel tempo, come una transizione CSS.
    this.scena.tweens.add({
      targets: this.forma,
      alpha: 0,
      scale: 1.8,
      duration: 220,
      onComplete: () => this.forma.destroy(),
    });
  }
}

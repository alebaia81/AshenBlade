// La "guida" dell'eroe: trasforma mouse e tastiera in comandi per l'eroe.
//
// Col mouse il giocatore non dice "vai a destra", dice "vai LÌ" o "attacca
// QUELLO". Serve quindi un'intenzione che dura nel tempo (l'obiettivo) e, a
// ogni fotogramma, il passo giusto per avvicinarsi: è qui che si usano la
// ricerca del percorso (A*) e la mira.

import type { Eroe } from '../../entities/Eroe';
import type { Nemico } from '../../entities/Nemico';
import type { Tastiera } from '../../entities/Comandi';
import { TESSERA } from '../../costanti';
import { cellaDaPixel, centroCella } from '../../systems/coordinate';
import { aPortata, aTiro, bersaglioSotto, direzioneVerso } from '../../systems/mira';
import { calcolaVelocita } from '../../systems/movimento';
import { cellaRaggiungibilePiuVicina, liberoTra, lisciaPercorso, trovaPercorso, type Griglia } from '../../systems/percorso';
import { seguiPercorso } from '../../systems/seguiPercorso';
import type { ComandiEroe, Vettore } from '../../systems/tipi';
import type { GruppoNemici } from './GruppoNemici';

/** Tenendo premuto sul terreno, ogni quanto si ricalcola il percorso verso il cursore. */
const RICALCOLO_CURSORE_MS = 150;
/** Inseguendo un nemico (che si muove), ogni quanto si ricalcola il percorso. */
const RICALCOLO_NEMICO_MS = 250;
/** Margine in pixel per cliccare un nemico anche un po' fuori dal suo quadrato. */
const MARGINE_CLIC = 4;
/** Se l'eroe dovrebbe muoversi ma resta fermo così a lungo, è bloccato: si rinuncia. */
const BLOCCATO_MS = 600;

/** Qualcosa con cui si interagisce avvicinandosi (un forziere; dalla fase 5 persone e porte). */
export interface Interagibile {
  posizione: Vettore;
  /** Entro questa distanza dal centro dell'eroe si può interagire. */
  distanza: number;
  interagisci: () => void;
  /** Che cursore mostrare sopra: la mano (forzieri, muri) o il fumetto (persone). */
  cursore?: 'interazione' | 'parla';
}

type Obiettivo =
  | { tipo: 'punto'; destinazione: Vettore; punti: Vettore[]; indice: number }
  | { tipo: 'interagisci'; bersaglio: Interagibile; punti: Vettore[]; indice: number }
  | { tipo: 'nemico'; nemico: Nemico; punti: Vettore[]; indice: number; ricalcolo: number };

const FERMO: Vettore = { x: 0, y: 0 };

export class GuidaEroe {
  private obiettivo: Obiettivo | null = null;
  /** Il tasto sinistro è tenuto premuto? */
  private tenuto = false;
  /** Dove si trova il cursore, in coordinate del MONDO. */
  private cursore: Vettore = { x: 0, y: 0 };
  private ultimoRicalcoloCursore = 0;
  private schivataRichiesta: Vettore | null = null;
  private ultimaPosizione: Vettore = { x: 0, y: 0 };
  private fermoDa = 0;

  constructor(
    private readonly eroe: Eroe,
    private readonly nemici: GruppoNemici,
    private readonly griglia: Griglia,
    /** Cosa c'è di interagibile sotto un punto (lo sa la scena). */
    private readonly interagibileSotto: (punto: Vettore) => Interagibile | null = () => null,
  ) {}

  // ---- eventi del mouse (chiamati dalla scena) ----

  /** Clic sinistro: su un nemico lo si attacca, altrimenti si cammina fin lì. */
  premiSinistro(punto: Vettore, adesso: number): 'nemico' | 'interagibile' | 'terreno' {
    this.tenuto = true;
    this.cursore = punto;
    const interagibile = this.interagibileSotto(punto);
    if (interagibile) {
      this.obiettivo = { tipo: 'interagisci', bersaglio: interagibile, punti: this.percorsoVerso(interagibile.posizione, false), indice: 0 };
      this.fermoDa = adesso;
      return 'interagibile';
    }
    const nemico = this.nemicoSotto(punto);
    if (nemico) {
      this.obiettivo = { tipo: 'nemico', nemico, punti: [], indice: 0, ricalcolo: 0 };
      return 'nemico';
    }
    this.vaiA(punto, adesso);
    return 'terreno';
  }

  rilasciaSinistro(): void {
    this.tenuto = false;
  }

  /** Clic destro: capriola verso il cursore. */
  premiDestro(punto: Vettore): void {
    const d = Math.hypot(punto.x - this.eroe.x, punto.y - this.eroe.y);
    this.schivataRichiesta = d === 0 ? null : { x: (punto.x - this.eroe.x) / d, y: (punto.y - this.eroe.y) / d };
  }

  /** Posizione del cursore nel mondo: cambia anche se il mouse è fermo ma la telecamera si sposta. */
  impostaCursore(punto: Vettore): void {
    this.cursore = punto;
  }

  nemicoSotto(punto: Vettore): Nemico | null {
    const vivi = this.nemici.vivi();
    const id = bersaglioSotto(punto, vivi.map((n) => ({ id: n.id, rettangolo: n.rettangolo() })), MARGINE_CLIC);
    return vivi.find((n) => n.id === id) ?? null;
  }

  annulla(): void {
    this.obiettivo = null;
    this.tenuto = false;
  }

  // ---- a ogni fotogramma ----

  comandi(tastiera: Tastiera, adesso: number): ComandiEroe {
    const comandi: ComandiEroe = {
      movimento: FERMO,
      attacca: tastiera.attacca,
      guarda: null,
      mira: null,
      schiva: tastiera.schiva || this.schivataRichiesta !== null,
      direzioneSchivata: this.schivataRichiesta,
    };
    this.schivataRichiesta = null;

    // La tastiera ha la precedenza: se la usi per camminare, il mouse si "dimentica" l'obiettivo.
    const conTastiera = calcolaVelocita(tastiera.movimento, 1);
    if (conTastiera.x !== 0 || conTastiera.y !== 0) {
      this.obiettivo = null;
      return { ...comandi, movimento: conTastiera };
    }
    if (this.eroe.sconfitto) this.obiettivo = null;
    if (!this.obiettivo) return comandi;

    const obiettivo = this.obiettivo;
    if (obiettivo.tipo === 'nemico') return this.versoNemico(obiettivo, comandi, adesso);
    if (obiettivo.tipo === 'interagisci') {
      const b = obiettivo.bersaglio;
      // Abbastanza vicini: si interagisce (si apre il forziere) e l'obiettivo è raggiunto.
      if (Math.hypot(b.posizione.x - this.eroe.x, b.posizione.y - this.eroe.y) <= b.distanza) {
        this.obiettivo = null;
        b.interagisci();
        return comandi;
      }
      return { ...comandi, movimento: this.passo(adesso) };
    }

    // Tenendo premuto, l'eroe segue il cursore.
    if (this.tenuto && adesso - this.ultimoRicalcoloCursore >= RICALCOLO_CURSORE_MS) {
      const spostato = Math.hypot(this.cursore.x - obiettivo.destinazione.x, this.cursore.y - obiettivo.destinazione.y);
      if (spostato > 4) this.vaiA(this.cursore, adesso);
    }
    return { ...comandi, movimento: this.passo(adesso) };
  }

  /** C'è un percorso da seguire? (per la prova automatica e per l'interfaccia) */
  get inMovimento(): boolean {
    return this.obiettivo !== null;
  }

  /** Il nemico che l'eroe sta inseguendo e attaccando adesso (o null). */
  get nemicoBersaglio(): Nemico | null {
    return this.obiettivo?.tipo === 'nemico' && this.obiettivo.nemico.vivo ? this.obiettivo.nemico : null;
  }

  /** I punti ancora da raggiungere: la modalità sviluppatore li disegna. */
  percorsoRimasto(): Vettore[] {
    return this.obiettivo ? this.obiettivo.punti.slice(this.obiettivo.indice) : [];
  }

  // ---- funzioni interne ----

  private versoNemico(
    o: Extract<Obiettivo, { tipo: 'nemico' }>,
    comandi: ComandiEroe,
    adesso: number,
  ): ComandiEroe {
    if (!o.nemico.vivo) {
      this.obiettivo = null;
      return comandi;
    }
    const eroe = { x: this.eroe.x, y: this.eroe.y };
    const bersaglio = o.nemico.rettangolo();
    const centro = { x: bersaglio.x + bersaglio.larghezza / 2, y: bersaglio.y + bersaglio.altezza / 2 };
    const tiro = this.eroe.arma.proiettile;
    const forma = { portata: this.eroe.arma.portata, larghezza: this.eroe.arma.larghezzaColpo };
    // In mischia serve che l'area di colpo lo tocchi; a distanza basta che sia "a tiro".
    const pronto = tiro
      ? aTiro(this.griglia, eroe, centro, tiro.gittata, TESSERA)
      : aPortata(eroe, this.eroe.lato, forma, bersaglio);
    if (pronto) {
      // Fermo e girato verso il nemico: l'eroe continua ad attaccare finché il nemico non cade.
      return { ...comandi, attacca: true, guarda: direzioneVerso(eroe, centro), mira: centro };
    }
    // Se non ci sono muri in mezzo, si corre dritti verso il nemico senza aspettare il ricalcolo di A*.
    const mezzo = this.eroe.lato / 2;
    if (liberoTra(this.griglia, eroe, centro, mezzo, TESSERA)) {
      const d = Math.hypot(centro.x - eroe.x, centro.y - eroe.y);
      const movimento = d > 0 ? { x: (centro.x - eroe.x) / d, y: (centro.y - eroe.y) / d } : FERMO;
      return { ...comandi, movimento, guarda: direzioneVerso(eroe, centro) };
    }
    // Con un ostacolo in mezzo si usa A*, ricalcolando quando serve o quando finisce il tratto.
    if (adesso >= o.ricalcolo || o.indice >= o.punti.length) {
      o.punti = this.percorsoVerso({ x: o.nemico.forma.x, y: o.nemico.forma.y }, false);
      o.indice = 0;
      o.ricalcolo = adesso + RICALCOLO_NEMICO_MS;
    }
    return { ...comandi, movimento: this.passo(adesso) };
  }

  private vaiA(punto: Vettore, adesso: number): void {
    this.obiettivo = { tipo: 'punto', destinazione: punto, punti: this.percorsoVerso(punto, true), indice: 0 };
    this.ultimoRicalcoloCursore = adesso;
    this.fermoDa = adesso;
  }

  /** Un passo lungo il percorso dell'obiettivo attuale. */
  private passo(adesso: number): Vettore {
    const o = this.obiettivo;
    if (!o) return FERMO;
    const posizione = { x: this.eroe.x, y: this.eroe.y };
    const r = seguiPercorso(posizione, o.punti, o.indice, 1);
    o.indice = r.indice;
    if (r.arrivato) {
      // Arrivati in fondo al percorso senza essere abbastanza vicini (per esempio
      // un forziere irraggiungibile): ci si ferma lì.
      if (o.tipo !== 'nemico') this.obiettivo = null;
      return FERMO;
    }
    // Se dovremmo muoverci ma siamo fermi da un po' (spinti contro un nemico,
    // incastrati), meglio fermarsi che spingere all'infinito.
    const mosso = Math.hypot(posizione.x - this.ultimaPosizione.x, posizione.y - this.ultimaPosizione.y);
    this.ultimaPosizione = posizione;
    if (mosso > 0.3) this.fermoDa = adesso;
    else if (adesso - this.fermoDa > BLOCCATO_MS && o.tipo !== 'nemico') {
      this.obiettivo = null;
      return FERMO;
    }
    return r.velocita;
  }

  /**
   * Punti da seguire per arrivare a "punto": A* tra celle, poi il percorso
   * viene lisciato. Se la destinazione non è raggiungibile (dentro un albero)
   * si va alla cella raggiungibile più vicina.
   */
  private percorsoVerso(punto: Vettore, precisoAlPixel: boolean): Vettore[] {
    const g = this.griglia;
    const posizione = { x: this.eroe.x, y: this.eroe.y };
    const da = cellaDaPixel(posizione.x, posizione.y, TESSERA);
    let a = cellaDaPixel(punto.x, punto.y, TESSERA);
    let celle = trovaPercorso(g, da, a);
    if (!celle) {
      a = cellaRaggiungibilePiuVicina(g, da, a) ?? da;
      celle = trovaPercorso(g, da, a) ?? [];
      precisoAlPixel = false; // il punto cliccato non si può raggiungere
    }
    const punti = celle.map((c) => centroCella(c, TESSERA));
    if (punti.length === 0) punti.push(centroCella(a, TESSERA));
    // Se si può, l'ultimo punto è esattamente dove hai cliccato e non il centro della cella.
    const mezzo = this.eroe.lato / 2;
    if (precisoAlPixel && liberoTra(g, punti.at(-1)!, punto, mezzo, TESSERA)) punti.push(punto);
    return lisciaPercorso(g, posizione, punti, mezzo, TESSERA);
  }
}

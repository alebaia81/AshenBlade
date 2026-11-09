// La scena principale: mappa, eroe, nemici, combattimento e telecamera.
// Ogni cambio di mappa (e ogni ricomparsa dopo una sconfitta) riavvia questa
// scena con dati diversi: come rimontare un componente con nuove props.

import * as Phaser from 'phaser';
import {
  ALTEZZA_BARRA_BASSA,
  ALTEZZA_SCHERMO,
  ATTESA_SCONFITTA,
  CHIAVE_ABILITA,
  CHIAVE_ABILITA_COMPAGNO,
  CHIAVE_MESSAGGIO,
  CHIAVE_NOME_MAPPA,
  CHIAVE_SVIL_AREE,
  CHIAVE_SVIL_INVULNERABILE,
  DURATA_DISSOLVENZA,
  LARGHEZZA_SCHERMO,
  SCENA_DIALOGO,
  SCENA_FUCINA,
  SCENA_INTERFACCIA,
  SCENA_INVENTARIO,
  SCENA_MONDO,
  SCENA_NEGOZIO,
  SCENA_SCHEDA,
  SCENA_SVILUPPATORE,
  SCENA_MAPPA_TESORO,
  SCENA_FINALE,
  SCENA_PAUSA,
  CHIAVE_SLOT,
  SCENA_REGISTRO,
  SCENA_TAVERNA,
  CHIAVE_PARTITA,
  CHIAVE_BOSS,
  TESSERA,
  ZOOM,
} from '../costanti';
import type { DatiGioco } from '../data/caricaDati';
import datiEroe from '../data/eroe.json';
import { Comandi } from '../entities/Comandi';
import { Eroe, type ProfiloEroe } from '../entities/Eroe';
import { Abitante } from '../entities/Abitante';
import { Compagno } from '../entities/Compagno';
import { Forziere } from '../entities/Forziere';
import { MuroSegreto } from '../entities/MuroSegreto';
import { Vena } from '../entities/Vena';
import { Cartello } from '../entities/Cartello';
import { Porta } from '../entities/Porta';
import { Barriera } from '../entities/Barriera';
import { GestoreBoss } from './mondo/GestoreBoss';
import { scuotiSchermo, mostraVignetteDanno } from './mondo/feedbackVisivo';
import { apriConChiave, apriPorta, portaAperta } from '../systems/porte';
import type { Nemico } from '../entities/Nemico';
import { creaStatoAbilita, frazioneRicarica, puòUsare, usa, type StatoAbilita } from '../systems/abilita';
import { tiraBottino } from '../systems/bottino';
import type { Caratteristiche } from '../systems/caratteristiche';
import { casualeVero } from '../systems/casuale';
import { calcolaDanno } from '../systems/combattimento';
import { assorbiDanno, type Protezione } from '../systems/compagno';
import type { AzioneDialogo, Condizione, CosaApribile } from '../systems/dialoghi';
import { modificatore } from '../systems/caratteristiche';
import { applicaCondizioni, type CondizioneCella } from '../systems/condizioniMappa';
import { èDiMissione } from '../systems/oggetti';
import { accetta, automatichePronte, avvisiRaccolta, concludi, registraEvento, segnoSopra, statoDi, type EventoQuest } from '../systems/quest';
import { danniRimandati, NUMERI_EFFETTI, prossimoRimbalzo } from '../systems/effettiArmi';
import { aggiungiMonete, moneteDelNemico } from '../systems/monete';
import {
  armaturaTotale,
  bonusCaratteristiche,
  effettiEquipaggiati,
  type SpazioEquipaggiamento,
} from '../systems/equipaggiamento';
import { areaDiColpo, direzioneDa, intersecano } from '../systems/geometria';
import { aTiro, direzioneVerso } from '../systems/mira';
import { attivi, bonus, rimanente } from '../systems/effettiTemporanei';
import { aggiungi, conta, togli } from '../systems/inventario';
import { cellaDaPixel, centroCella } from '../systems/coordinate';
import { assegnaPreferito, cosaFa, svuotaPreferito } from '../systems/preferiti';
import {
  celleAbitante,
  celleForziere,
  celleNemico,
  celleSegrete,
  celleVena,
  celleCartello,
  cellePorte,
  celleBarriera,
  èCalpestabile,
  grigliaDellaMappa,
  puntoIngressoPredefinito,
  trovaPunto,
  uscitaIn,
} from '../systems/mappa';
import {
  aggiungiEsperienza,
  apriForziere,
  apriMuro,
  caratteristicheTotali,
  forziereAperto,
  guarisci,
  indossa,
  invertiArmi,
  muroAperto,
  togliIndossato,
  usaOggetto,
  type Partita,
} from '../systems/partita';
import {
  modificatoreArma,
  probabilitaCriticoDi,
  ricaricaSchivata,
  rigenerazioneMana,
  type DefinizioneClasse,
} from '../systems/personaggio';
import type { Cella, DefinizioneArma, DefinizioneCompagno, Mappa, Vettore } from '../systems/tipi';
import { liberoTra, type Griglia } from '../systems/percorso';
import { CURSORE_ATTACCO, CURSORE_INTERAZIONE, CURSORE_MIRA, CURSORE_NORMALE, CURSORE_PARLA } from './interfaccia/cursori';
import { ABILITA } from './mondo/abilita';
import { Combattimento } from './mondo/Combattimento';
import { GestoreProiettili } from './mondo/GestoreProiettili';
import { chiaveTessere, creaTilemap, fotogrammaMuroSegreto } from './mondo/creaTilemap';
import { GestoreAttacchi } from './mondo/GestoreAttacchi';
import { gestisciContatti, type ColpoDaLontano } from './mondo/gestisciContatti';
import { GestoreTiriNemici } from './mondo/GestoreTiriNemici';
import { GruppoNemici } from './mondo/GruppoNemici';
import { GestoreOggettiATerra } from './mondo/GestoreOggettiATerra';
import { GuidaEroe, type Interagibile } from './mondo/GuidaEroe';
import { mostraNumero } from './mondo/numeriDanno';
import { leggiPartita, mostraAvviso, scriviPartita } from './statoCondiviso';
import { archivioDelBrowser } from './browser';
import { aspettoDi } from './grafica';
import { suoni } from '../audio/Suoni';
import type { AspettiForziere } from '../entities/Forziere';
import { creaSalvataggio, scriviSlot } from '../systems/salvataggio';
import { leggiOpzioni } from '../systems/opzioni';

/** Dati passati alla scena quando (ri)parte. */
interface DatiIngresso {
  idMappa?: string;
  /** Simbolo del punto d'arrivo; se manca si usa la partenza "@". */
  arrivo?: string;
  /** Appena creato il personaggio (fase 9a): si salva subito nello slot scelto. */
  nuovaPartita?: boolean;
  /** Da quale mappa si arriva camminando (per il salvataggio automatico nel villaggio). */
  daMappa?: string;
}

/** Dopo un cambio d'arma dalla barra dei preferiti non si attacca per mezzo secondo (design §8). */
const ATTESA_CAMBIO_ARMA = 500;

export class ScenaMondo extends Phaser.Scene {
  private mappa!: Mappa;
  private puntoIngresso = '@';
  private eroe!: Eroe;
  private comandi!: Comandi;
  private guida!: GuidaEroe;
  private cursoreAttuale = CURSORE_NORMALE;
  /** Linea del percorso, visibile solo in modalità sviluppatore. */
  private lineaPercorso!: Phaser.GameObjects.Graphics;
  private nemici!: GruppoNemici;
  private attacchi!: GestoreAttacchi;
  private combattimento!: Combattimento;
  private proiettili!: GestoreProiettili;
  private oggettiATerra!: GestoreOggettiATerra;
  private forzieri: Forziere[] = [];
  private muri: MuroSegreto[] = [];
  private abitanti: Abitante[] = [];
  private vene: Vena[] = [];
  private cartelli: Cartello[] = [];
  private porte: Porta[] = [];
  private tiriNemici!: GestoreTiriNemici;
  /** Per i massi del troll: un colpo all'eroe che non arriva per contatto. */
  private colpoDaLontano!: ColpoDaLontano;
  private barriere: Barriera[] = [];
  /** Il boss della mappa, se c'è e non è già stato sconfitto (fase 8a). */
  private boss: GestoreBoss | null = null;
  private livello!: Phaser.Tilemaps.TilemapLayer;
  private griglia!: Griglia;
  // ---- compagno (fase 5c) ----
  private compagno: Compagno | null = null;
  /** Collisioni e contatto del compagno: si tolgono quando il compagno cambia. */
  private collisioniCompagno: Phaser.Physics.Arcade.Collider[] = [];
  /** Parata di Corrado o scudo di Elisa sull'eroe. */
  private protezione: Protezione = null;
  /** Fino a quando il fiuto di Volpe fa brillare i tesori. */
  private segnaleFino = 0;
  /** Ultima cura "nel tempo" di Sorella Agata. */
  private ultimaCuraCompagno = 0;
  /** Disegno dello scudo intorno all'eroe. */
  private disegnoProtezione!: Phaser.GameObjects.Graphics;
  /**
   * Mirino attivo: dopo il clic sul pulsante dell'abilità (o dell'arma secondaria)
   * il prossimo clic nel mondo sceglie il bersaglio.
   */
  private mira: 'abilita' | 'secondaria' | null = null;
  /** Da quando l'arma secondaria può tirare di nuovo. */
  private secondariaPronta = 0;
  /** Vero durante dissolvenze e sconfitta: il gioco non accetta comandi. */
  private inTransizione = false;
  /** Come si è entrati in questa mappa (per il salvataggio automatico). */
  private ingresso: DatiIngresso = {};

  constructor(private readonly dati: DatiGioco) {
    super(SCENA_MONDO);
  }

  /** init arriva prima di create e riceve i dati di scene.start/restart. */
  init(dati: DatiIngresso): void {
    const id = dati.idMappa ?? this.dati.mappaIniziale;
    const mappa = this.dati.mappe[id];
    if (!mappa) throw new Error(`Mappa "${id}" non trovata`);
    // Fase 8b: la mappa come è ADESSO nella storia (frana sparita, Quercia ferita…).
    this.mappa = applicaCondizioni(mappa, (c) => this.condizioneCellaVera(c));
    this.puntoIngresso = dati.arrivo ?? '@';
    this.inTransizione = false;
    this.ingresso = dati;
  }

  /** create costruisce la scena una volta: come il "mount" di un componente. */
  create(): void {
    const livello = creaTilemap(this, this.mappa, this.dati.sprite);
    this.livello = livello;

    const cella = trovaPunto(this.mappa, this.puntoIngresso);
    if (!cella) throw new Error(`Punto "${this.puntoIngresso}" assente nella mappa "${this.mappa.id}"`);
    const inizio = centroCella(cella, TESSERA);
    // Chi è l'eroe lo dice la Partita, che sopravvive ai riavvii della scena.
    this.eroe = new Eroe(this, inizio.x, inizio.y, this.profiloEroe());
    this.comandi = new Comandi(this);
    this.physics.add.collider(this.eroe.forma, livello);

    // I nemici rinascono ogni volta che la scena riparte (design §11).
    this.nemici = new GruppoNemici(this, livello, (d) => aspettoDi(this.dati.sprite, 'nemici', d.id));
    let bossQui: Nemico | null = null;
    for (const { cella: c, idNemico } of celleNemico(this.mappa)) {
      const def = this.dati.nemici[idNemico]!;
      // I boss sconfitti non ricompaiono (§11); i nemici normali sì.
      if (def.fasi && this.partita.bossSconfitti.includes(idNemico)) continue;
      const n = this.nemici.aggiungi(def, centroCella(c, TESSERA));
      if (def.fasi) bossQui = n;
    }
    this.oggettiATerra = new GestoreOggettiATerra(this, this.dati.oggetti, (p) => this.puntoLiberoPerOggetto(p));
    this.creaForzieri();
    this.creaMuriSegreti();
    this.creaAbitanti();
    this.creaVene();
    this.creaCartelli();
    this.creaPorte();
    // Quest: i segni sopra le persone seguono la Partita (accetti, raccogli, vendi…).
    const segni = () => this.aggiornaSegni();
    this.registry.events.on(`changedata-${CHIAVE_PARTITA}`, segni);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.registry.events.off(`changedata-${CHIAVE_PARTITA}`, segni));
    this.aggiornaSegni();
    this.eventoQuest({ tipo: 'raggiunto', mappa: this.mappa.id });
    // La griglia per A* chiede alla scena se un muro segreto è stato aperto:
    // è una funzione, quindi vede sempre lo stato attuale.
    const qui = (x: { cella: Cella }, c: number, r: number) => x.cella.col === c && x.cella.riga === r;
    const griglia = grigliaDellaMappa(
      this.mappa,
      (c, r) => this.muri.some((m) => m.aperto && qui(m, c, r)) || this.porte.some((p) => p.aperta && qui(p, c, r)),
      (c, r) => this.barriere.some((b) => b.chiusa && qui(b, c, r)),
    );
    this.griglia = griglia;
    this.boss = bossQui
      ? new GestoreBoss(
          this,
          bossQui,
          this.barriere,
          this.nemici,
          griglia,
          this.dati.nemici,
          (t) => {
            mostraAvviso(this, t);
            this.scuotiSchermo(200, 0.004);
          },
          {
            eroe: () => ({ x: this.eroe.x, y: this.eroe.y }),
            colpisci: (n, dado, da) => this.colpoDaLontano(n, dado, da),
            casuale: casualeVero,
            tira: (n, direzione, parametri, dado) => this.tiriNemici.tiraCon(n, direzione, parametri, dado),
          },
        )
      : null;
    if (!bossQui) this.registry.set(CHIAVE_BOSS, null);
    this.guida = new GuidaEroe(this.eroe, this.nemici, griglia, (p) => this.interagibileSotto(p));
    this.protezione = null;
    this.segnaleFino = 0;
    this.disegnoProtezione = this.add.graphics().setDepth(12);
    this.preparaMouse();
    this.lineaPercorso = this.add.graphics().setDepth(3);
    this.combattimento = new Combattimento(
      this,
      this.eroe,
      casualeVero,
      () => this.classe.passive,
      () => this.effettiArmatura(),
      (nemico) => this.nemicoSconfitto(nemico),
    );
    this.attacchi = new GestoreAttacchi(this.eroe, this.nemici, this.combattimento, () => this.statisticheArma(this.eroe.arma));
    this.proiettili = new GestoreProiettili(this, griglia.calpestabile, this.nemici);
    // Il bastone del Mago: ogni attacco lancia un dardo magico.
    this.eroe.quandoTira = (da, direzione) => this.tiraProiettile(this.eroe.arma, da, direzione);
    this.mira = null;
    this.secondariaPronta = 0;
    const colpoDaLontano = gestisciContatti(
      this,
      this.eroe,
      this.nemici,
      casualeVero,
      () => this.armaturaEroe(),
      () => this.sconfitta(),
      (nemico, danno) => {
        // Corazza di spine: una parte del danno torna a chi ha colpito.
        if (this.effettiArmatura().includes('spine')) this.combattimento.danneggiaDiretto(nemico, danniRimandati(danno), this.time.now);
      },
      (danno) => this.proteggiEroe(danno),
    );
    // Fase 8b: i tiratori tirano, e la linea di tiro tiene conto dei muri (anche delle porte chiuse).
    this.tiriNemici = new GestoreTiriNemici(
      this,
      (c, r) => griglia.calpestabile(c, r),
      () => (this.eroe.sconfitto || this.eroe.invisibile(this.time.now) ? null : { x: this.eroe.x, y: this.eroe.y }),
      colpoDaLontano,
    );
    this.colpoDaLontano = colpoDaLontano;
    this.nemici.configuraTutti((n) => {
      n.quandoTira = (nemico, direzione) => this.tiriNemici.tira(nemico, direzione);
      n.lineaLibera = (a, b) => liberoTra(griglia, a, b, 2, TESSERA);
    });
    // Il compagno nasce dopo i proiettili e il combattimento, che gli servono.
    this.compagno = null;
    this.collisioniCompagno = []; // la scena è ripartita: i vecchi collider non esistono più
    this.creaCompagno();

    this.preparaTelecamera();
    this.avviaInterfaccia();
    this.applicaSviluppatore();
    this.input.keyboard?.on('keydown-F8', this.alternaSviluppatore, this);
    this.input.keyboard?.on('keydown-C', this.apriScheda, this);
    this.input.keyboard?.on('keydown-I', this.apriInventario, this);
    this.input.keyboard?.on('keydown-L', this.apriRegistro, this);
    // 1–6: gli spazi della barra dei preferiti.
    ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX'].forEach((tasto, i) => this.input.keyboard?.on(`keydown-${tasto}`, () => this.usaPreferito(i)));
    // E: abilità di classe verso il cursore (scorciatoia del pulsante nella barra).
    this.input.keyboard?.on('keydown-E', () => this.usaAbilita(this.nelMondo(this.input.activePointer)));
    // K: arma secondaria verso il cursore.
    this.input.keyboard?.on('keydown-K', () => {
      const p = this.nelMondo(this.input.activePointer);
      const fermo = Boolean(this.comandi?.leggi().fermo);
      this.usaSecondaria(p, fermo);
    });
    // Q: abilità del compagno (scorciatoia del suo pulsante nella barra).
    this.input.keyboard?.on('keydown-Q', () => this.usaAbilitaCompagno());
    // Esc: il menu di pausa. Arriva qui solo se nessun pannello è aperto (con un
    // pannello aperto il mondo è in pausa e Esc lo ascolta il pannello).
    this.input.keyboard?.on('keydown-ESC', () => this.apriPausa());
    this.salvataggioAllIngresso();
    this.musica();

    // Quando la scena riparte dopo la pausa (scheda chiusa) rileggiamo la Partita:
    // nella scheda possono essere cambiate caratteristiche e vita massima.
    // this.events sopravvive ai riavvii della scena: va pulito a mano.
    this.events.on(Phaser.Scenes.Events.RESUME, this.alRiprendere, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off(Phaser.Scenes.Events.RESUME, this.alRiprendere, this));
  }

  /** update viene chiamato circa 60 volte al secondo: è il cuore del ciclo di gioco. */
  update(): void {
    if (this.inTransizione) return;
    const adesso = this.time.now;
    this.aggiornaCursore();
    this.eroe.aggiorna(this.guida.comandi(this.comandi.leggi(), adesso), adesso);
    // Un eroe invisibile (Scatto nell'ombra) o sconfitto non si insegue: i nemici tornano a casa.
    const visibile = !this.eroe.sconfitto && !this.eroe.invisibile(adesso);
    // I nemici inseguono il più vicino tra l'eroe (se visibile) e il compagno (se in piedi).
    const bersagli: Vettore[] = visibile ? [{ x: this.eroe.x, y: this.eroe.y }] : [];
    if (this.compagno && !this.compagno.alTappeto && !this.eroe.sconfitto) bersagli.push({ x: this.compagno.x, y: this.compagno.y });
    this.nemici.aggiorna(adesso, bersagli);
    this.aggiornaCompagno(adesso);
    this.attacchi.aggiorna(adesso);
    this.combattimento.aggiorna(this.nemici.vivi(), adesso);
    if (!this.eroe.sconfitto) this.boss?.aggiorna(adesso, { x: this.eroe.x, y: this.eroe.y });
    this.aggiornaMuri(adesso);
    this.proiettili.aggiorna(this.game.loop.delta);
    this.tiriNemici.aggiorna(this.game.loop.delta);
    this.disegnaProtezione(adesso);
    if (!this.eroe.sconfitto) this.oggettiATerra.aggiorna({ x: this.eroe.x, y: this.eroe.y }, (id, q) => this.raccogli(id, q));
    this.salvaRisorse();
    this.disegnaPercorso();
    this.controllaUscita();
  }

  /** Apre la scheda del personaggio mettendo in pausa il mondo (icona del ritratto o C). */
  apriScheda(): void {
    if (this.inTransizione || this.eroe.sconfitto || !this.scene.isActive()) return;
    this.salvaRisorse();
    this.scene.launch(SCENA_SCHEDA);
    this.scene.pause();
  }

  /**
   * Fase 9c: la musica della zona; durante lo scontro con un boss, la sua.
   * La barra del boss nel registro dice quando lo scontro comincia e finisce.
   */
  private musica(): void {
    suoni.branoDellaZona(this.mappa.id);
    let inScontro = false;
    const boss = (_: unknown, valore: unknown) => {
      const ora = valore !== null && valore !== undefined;
      if (ora === inScontro) return;
      inScontro = ora;
      if (ora) suoni.effetto('boss');
      suoni.branoDellaZona(ora ? 'boss' : this.mappa.id);
    };
    this.registry.events.on(`changedata-${CHIAVE_BOSS}`, boss);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.registry.events.off(`changedata-${CHIAVE_BOSS}`, boss));
  }

  /** Il menu di pausa (Esc o l'icona), con il mondo fermo. Esc annulla prima il mirino. */
  apriPausa(): void {
    if (this.inTransizione || this.eroe.sconfitto || !this.scene.isActive()) return;
    if (this.mira) {
      this.mira = null;
      return;
    }
    this.salvaRisorse();
    this.scene.launch(SCENA_PAUSA);
    this.scene.pause();
  }

  // ---- salvataggio (fase 9a) ----

  /**
   * Salva nello slot in uso. Si riprenderà all'ingresso di questa mappa, come
   * dopo una sconfitta (§12): niente posizione esatta né nemici da ricordare.
   */
  salvaPartita(): { ok: boolean; messaggio: string } {
    const slot = this.registry.get(CHIAVE_SLOT) as number | undefined;
    if (!slot) return { ok: false, messaggio: 'Nessuno slot scelto: parti dal menu iniziale' };
    if (this.inTransizione || !this.eroe || this.eroe.sconfitto) return { ok: false, messaggio: 'Non si può salvare adesso' };
    this.salvaRisorse(); // la vita "viva" sta nell'eroe: prima la riportiamo nella Partita
    const salvataggio = creaSalvataggio({
      partita: this.partita,
      mappa: this.mappa.id,
      arrivo: this.puntoIngresso,
      zona: this.mappa.nome,
      adesso: this.time.now,
      data: new Date(),
    });
    const esito = scriviSlot(archivioDelBrowser(), slot, salvataggio);
    return esito.ok ? { ok: true, messaggio: `Partita salvata nello slot ${slot}` } : { ok: false, messaggio: esito.errore };
  }

  /**
   * §12: si salva da soli entrando nel villaggio a piedi. E all'inizio di una
   * nuova partita, così lo slot scelto è subito occupato e "Continua" funziona.
   */
  private salvataggioAllIngresso(): void {
    const { nuovaPartita, daMappa } = this.ingresso;
    if (nuovaPartita) {
      this.salvaPartita();
      return;
    }
    const nelVillaggio = this.dati.salvataggioAutomatico.includes(this.mappa.id);
    const arrivatoDaFuori = daMappa !== undefined && daMappa !== this.mappa.id;
    if (!nelVillaggio || !arrivatoDaFuori || !leggiOpzioni(archivioDelBrowser()).salvataggioAutomatico) return;
    const esito = this.salvaPartita();
    if (esito.ok) mostraAvviso(this, `Salvataggio automatico (slot ${String(this.registry.get(CHIAVE_SLOT))})`);
  }

  /** Apre lo zaino mettendo in pausa il mondo (icona dello zaino o I). */
  apriInventario(): void {
    if (this.inTransizione || this.eroe.sconfitto || !this.scene.isActive()) return;
    this.salvaRisorse();
    this.scene.launch(SCENA_INVENTARIO);
    this.scene.pause();
  }

  /** Il finale della storia: pagine di testo, poi si torna a giocare (fase 8c). */
  apriFinale(): void {
    if (this.eroe.sconfitto || !this.scene.isActive()) return;
    this.guida.annulla();
    this.eroe.ferma();
    this.scene.launch(SCENA_FINALE);
    this.scene.pause();
  }

  /** Apre il registro delle quest (icona della pergamena o L). */
  apriRegistro(): void {
    if (this.inTransizione || this.eroe.sconfitto || !this.scene.isActive()) return;
    this.salvaRisorse();
    this.scene.launch(SCENA_REGISTRO);
    this.scene.pause();
  }

  // ---- quest (fase 7) ----

  /** Manda un evento alle quest attive; se qualcosa avanza, salva e avvisa. */
  private eventoQuest(evento: EventoQuest): void {
    const p = this.partita;
    const { stato, avvisi } = registraEvento(p, evento, this.dati.quest, (id) => this.dati.abitanti[id]?.nome ?? id);
    if (stato !== p && (stato.quest !== p.quest || stato.inventario !== p.inventario)) scriviPartita(this, stato);
    // Un avviso alla volta: il più recente è il più utile ("fatto! Torna da…").
    if (avvisi.length > 0) mostraAvviso(this, avvisi.at(-1)!);
    // Le quest "automatiche" (la mappa del tesoro) si chiudono qui, senza tornare da nessuno.
    for (const id of automatichePronte(this.partita.quest, this.dati.quest, this.partita.inventario)) this.concludiQuest(id);
  }

  /**
   * Usare una mappa del tesoro: si apre il disegno e parte la quest. Se il
   * forziere era già stato aperto prima (per caso), la quest si chiude subito.
   */
  private usaMappa(idQuest: string, idOggetto: string): void {
    const p = this.partita;
    const quest = accetta(p.quest, idQuest, this.dati.quest);
    this.scene.launch(SCENA_MAPPA_TESORO, { oggetto: idOggetto });
    if (quest === p.quest) return;
    scriviPartita(this, { ...p, quest });
    mostraAvviso(this, `Nuova quest: «${this.dati.quest[idQuest]!.nome}» (registro: L)`);
    for (const passo of this.dati.quest[idQuest]!.passi) {
      if (passo.obiettivo.tipo === 'trova' && this.partita.forzieriAperti.includes(passo.obiettivo.forziere)) {
        this.eventoQuest({ tipo: 'aperto', forziere: passo.obiettivo.forziere });
      }
    }
  }

  private aggiornaSegni(): void {
    const { quest, inventario } = this.partita;
    for (const a of this.abitanti) a.impostaSegno(segnoSopra(a.definizione.id, quest, this.dati.quest, inventario));
  }

  /** Una cella che cambia con la storia: la sua condizione è vera adesso? */
  private condizioneCellaVera(c: CondizioneCella): boolean {
    const p = this.registry.get(CHIAVE_PARTITA) as Partita | undefined;
    if (!p) return false;
    if (c.boss) return p.bossSconfitti.includes(c.boss);
    if (!c.quest) return false;
    const stati = ([] as string[]).concat(c.stato ?? 'conclusa');
    return stati.includes(statoDi(c.quest, p.quest, this.dati.quest, p.inventario));
  }

  /** Il dialogo chiede: questa risposta si vede? */
  condizioneVera(c: Condizione): boolean {
    const { quest, inventario } = this.partita;
    return ([] as string[]).concat(c.stato).includes(statoDi(c.quest, quest, this.dati.quest, inventario));
  }

  /**
   * Il dialogo esegue un'azione: accettare o concludere una quest. Restituisce
   * una riga da mostrare nel riquadro del dialogo (l'avviso in basso resterebbe coperto).
   */
  azioneQuest(azione: AzioneDialogo): string | null {
    const p = this.partita;
    if ('accetta' in azione) {
      const quest = accetta(p.quest, azione.accetta, this.dati.quest);
      if (quest === p.quest) return null;
      scriviPartita(this, { ...p, quest });
      // Alcune quest danno subito qualcosa da portare (la lettera di Bruno).
      for (const o of this.dati.quest[azione.accetta]!.oggettiAllInizio ?? []) this.daiOTerra(o.id, o.quantita);
      const testo = `Nuova quest: «${this.dati.quest[azione.accetta]!.nome}» (registro: L)`;
      mostraAvviso(this, testo);
      return testo;
    }
    return this.concludiQuest(azione.concludi);
  }

  /** Nello zaino, o ai piedi dell'eroe se non c'è posto. */
  private daiOTerra(id: string, quantita: number): void {
    const rimasti = this.raccogli(id, quantita);
    // "Bloccati": come il bottino rifiutato, si raccolgono dopo che l'eroe si è allontanato.
    if (rimasti > 0) this.oggettiATerra.lascia([{ id, quantita: rimasti }], { x: this.eroe.x, y: this.eroe.y }, true);
  }

  /** Conclude una quest pronta: ricompense, esperienza, avviso. Restituisce il testo dell'avviso. */
  private concludiQuest(id: string): string | null {
    const p = this.partita;
    const esito = concludi(p, id, this.dati.quest, modificatore(this.caratteristiche.CAR));
    if (!esito.ok) return null;
    scriviPartita(this, esito.stato);
    const monete = esito.stato.monete - p.monete;
    // Gli oggetti della ricompensa: nello zaino, o ai piedi dell'eroe se non c'è posto.
    for (const o of esito.oggetti) this.daiOTerra(o.id, o.quantita);
    this.guadagnaEsperienza(esito.esperienza);
    const oggetti = esito.oggetti.map((o) => `${o.quantita > 1 ? `${o.quantita} × ` : ''}${this.dati.oggetti[o.id]?.nome ?? o.id}`);
    const testo = `«${this.dati.quest[id]!.nome}» conclusa: ${[...(monete > 0 ? [`+${monete} monete`] : []), `+${esito.esperienza} esperienza`, ...oggetti].join(', ')}`;
    mostraAvviso(this, testo);
    return testo;
  }

  // ---- oggetti ----

  /** Usa l'oggetto in uno spazio dello zaino. Restituisce il messaggio per il giocatore. */
  usaOggettoInventario(indice: number): string | null {
    if (this.eroe.sconfitto) return null;
    this.salvaRisorse();
    const effetto = this.dati.oggetti[this.partita.inventario.spazi[indice]?.id ?? '']?.effetto;
    if (effetto?.tipo === 'mappa') {
      this.usaMappa(effetto.quest, this.partita.inventario.spazi[indice]!.id);
      return null;
    }
    const esito = usaOggetto(this.partita, indice, this.dati.oggetti, this.time.now);
    if (esito.partita !== this.partita) {
      scriviPartita(this, esito.partita);
      this.dallaPartita();
    }
    if (esito.messaggio) mostraNumero(this, this.eroe.x, this.eroe.y - 8, esito.messaggio, esito.partita !== this.partita ? 'cura' : 'avviso');
    return esito.messaggio;
  }

  /** Spazi rapidi della barra (e tasti 1 e 2): la prima pila di quella pozione. */
  usaPozione(id: string): void {
    if (!this.scene.isActive() || this.inTransizione) return;
    const indice = this.partita.inventario.spazi.findIndex((s) => s?.id === id);
    if (indice < 0) {
      mostraNumero(this, this.eroe.x, this.eroe.y - 8, 'nessuna pozione', 'avviso');
      return;
    }
    this.usaOggettoInventario(indice);
  }

  // ---- barra dei preferiti ----

  /** Clic (o tasto 1–6) su uno spazio della barra: bevi la pozione o impugna l'arma. */
  usaPreferito(indice: number): void {
    if (!this.scene.isActive() || this.inTransizione || this.eroe.sconfitto) return;
    const p = this.partita;
    const azione = cosaFa(p.preferiti, indice, p.inventario, p.equipaggiamento, this.tipoDi);
    const avviso = (testo: string) => mostraNumero(this, this.eroe.x, this.eroe.y - 8, testo, 'avviso');
    switch (azione.tipo) {
      case 'vuoto':
        avviso('spazio vuoto');
        return;
      case 'pozione':
        this.usaPozione(azione.id);
        return;
      case 'arma':
        if (azione.inMano) avviso('già in mano');
        else if (azione.indiceZaino < 0) avviso('non è nello zaino');
        // Cambio rapido: mezzo secondo senza poter attaccare (design §8).
        else avviso(this.indossaDaZaino(azione.indiceZaino, ATTESA_CAMBIO_ARMA));
    }
  }

  /** Dallo zaino: mette un collegamento nello spazio "indice". Restituisce l'errore, se c'è. */
  impostaPreferito(indice: number, id: string): string | null {
    const esito = assegnaPreferito(this.partita.preferiti, indice, id, this.tipoDi);
    if (!esito.ok) return esito.errore;
    scriviPartita(this, { ...this.partita, preferiti: esito.preferiti });
    return null;
  }

  rimuoviPreferito(indice: number): void {
    const preferiti = svuotaPreferito(this.partita.preferiti, indice);
    if (preferiti !== this.partita.preferiti) scriviPartita(this, { ...this.partita, preferiti });
  }

  private readonly tipoDi = (id: string): string | undefined => this.dati.oggetti[id]?.tipo;

  /** Getta a terra un'intera pila dello zaino, accanto all'eroe. */
  gettaOggetto(indice: number): void {
    const pila = this.partita.inventario.spazi[indice];
    if (!pila || èDiMissione(this.dati.oggetti[pila.id])) return;
    scriviPartita(this, { ...this.partita, inventario: togli(this.partita.inventario, indice, pila.quantita) });
    // "Bloccato": non lo si raccoglie di nuovo finché l'eroe non si allontana.
    this.oggettiATerra.lascia([pila], { x: this.eroe.x, y: this.eroe.y + 10 }, true);
  }

  /** Modalità sviluppatore: un oggetto direttamente nello zaino. */
  daiOggetto(id: string, quantita = 1): string {
    const definizione = this.dati.oggetti[id];
    if (!definizione) return `Oggetto "${id}" sconosciuto`;
    const rimasti = this.raccogli(id, quantita);
    return rimasti === 0 ? `Preso: ${definizione.nome}` : 'Zaino pieno';
  }

  /**
   * Modalità sviluppatore: porta ogni quest attiva a "pronta". Per un ultimo
   * passo "raccogli" regala gli oggetti che mancano, così la consegna li toglie davvero.
   */
  completaQuest(): string {
    const nomi: string[] = [];
    for (const [id, q] of Object.entries(this.partita.quest)) {
      const d = this.dati.quest[id];
      if (!d || q.stato !== 'attiva') continue;
      const ultimo = d.passi.at(-1)!.obiettivo;
      const passo = ultimo.tipo === 'raccogli' ? d.passi.length - 1 : d.passi.length;
      const p = this.partita;
      scriviPartita(this, { ...p, quest: { ...p.quest, [id]: { ...q, passo, conteggio: 0 } } });
      if (ultimo.tipo === 'raccogli') {
        const mancano = ultimo.quantita - conta(this.partita.inventario, ultimo.oggetto);
        if (mancano > 0) this.raccogli(ultimo.oggetto, mancano);
      }
      nomi.push(d.nome);
    }
    return nomi.length > 0 ? `Pronte: ${nomi.join(', ')}` : 'Nessuna quest attiva';
  }

  /** Modalità sviluppatore: riempie gli spazi vuoti (per provare lo zaino pieno). */
  riempiZaino(): void {
    const inv = this.partita.inventario;
    const vuoti = inv.spazi.filter((s) => s === null).length;
    for (let i = 0; i < vuoti; i++) {
      const p = this.partita;
      scriviPartita(this, { ...p, inventario: aggiungi(p.inventario, 'borsa', 1, 1).inventario });
    }
  }

  /** Per l'interfaccia: gli effetti a tempo attivi, con i secondi che restano. */
  effettiAttivi(): { tipo: string; valore: number; secondi: number }[] {
    const adesso = this.time.now;
    return attivi(this.partita.effetti, adesso).map((e) => ({ tipo: e.tipo, valore: e.valore, secondi: Math.ceil(rimanente(e, adesso) / 1000) }));
  }

  alternaSviluppatore(): void {
    if (this.scene.isActive(SCENA_SVILUPPATORE)) this.scene.stop(SCENA_SVILUPPATORE);
    else this.scene.launch(SCENA_SVILUPPATORE);
  }

  // ---- comandi della modalità sviluppatore (chiamati da ScenaSviluppatore) ----

  impostaAreeVisibili(attive: boolean): void {
    this.registry.set(CHIAVE_SVIL_AREE, attive);
    this.applicaSviluppatore();
  }

  impostaInvulnerabile(attiva: boolean): void {
    this.registry.set(CHIAVE_SVIL_INVULNERABILE, attiva);
    this.applicaSviluppatore();
  }

  /** Vita e mana pieni (modalità sviluppatore). */
  vitaPiena(): void {
    if (this.eroe.sconfitto) return;
    scriviPartita(this, guarisci(this.partita));
    this.dallaPartita();
  }

  /** Esperienza regalata dalla modalità sviluppatore. */
  regalaEsperienza(quantita: number): void {
    this.salvaRisorse();
    this.guadagnaEsperienza(quantita);
  }

  /** Esattamente l'esperienza che manca al prossimo livello. */
  saliDiLivello(): void {
    const { esperienza, personaggio } = this.partita;
    const prossima = this.dati.soglieLivelli[personaggio.livello];
    if (prossima !== undefined) this.regalaEsperienza(prossima - esperienza);
  }

  /** Modalità sviluppatore: monete regalate. */
  regalaMonete(quantita: number): void {
    scriviPartita(this, aggiungiMonete(this.partita, quantita));
  }

  /** Vibrazione della visuale, attiva solo se abilitata nelle opzioni di gioco. */
  scuotiSchermo(durataMs = 120, intensita = 0.004): void {
    scuotiSchermo(this, durataMs, intensita);
  }

  /** Segnala all'interfaccia di mostrare la vignette rossa sui bordi per danno subito. */
  mostraVignetteDanno(): void {
    mostraVignetteDanno(this);
  }

  /** Va in una mappa precisa, al suo punto d'ingresso (sviluppatore e prove nel browser). */
  vaiA(idMappa: string): void {
    const destinazione = this.dati.mappe[idMappa];
    if (!destinazione) return;
    this.salvaRisorse();
    this.cambiaMappa({ idMappa, arrivo: puntoIngressoPredefinito(destinazione) });
  }

  /** Passa alla mappa successiva nell'elenco. Restituisce il nome della destinazione. */
  teletrasporta(): string {
    const id = prossimaMappa(Object.keys(this.dati.mappe), this.mappa.id);
    const destinazione = this.dati.mappe[id]!;
    this.salvaRisorse();
    this.cambiaMappa({ idMappa: id, arrivo: puntoIngressoPredefinito(destinazione) });
    return destinazione.nome;
  }

  /** Crea un nemico una tessera davanti all'eroe, se lì si può stare. */
  generaNemico(idNemico: string): boolean {
    const verso = { su: [0, -1], giu: [0, 1], sinistra: [-1, 0], destra: [1, 0] }[this.eroe.guarda];
    const qui = cellaDaPixel(this.eroe.x, this.eroe.y, TESSERA);
    const cella = { col: qui.col + verso[0]! * 2, riga: qui.riga + verso[1]! * 2 };
    const definizione = this.dati.nemici[idNemico];
    if (!definizione || !èCalpestabile(this.mappa, cella.col, cella.riga)) return false;
    this.nemici.aggiungi(definizione, centroCella(cella, TESSERA));
    return true;
  }

  /** Capriola dal pulsante della barra in basso: verso dove guarda l'eroe. */
  capriola(): void {
    if (this.scene.isActive()) this.guida.premiDestro(this.davantiAllEroe());
  }

  // ---- abilità di classe ----

  /** Pulsante dell'abilità nella barra: con il mirino aspetta il clic sul bersaglio, altrimenti parte subito. */
  attivaAbilita(): void {
    if (!this.scene.isActive() || this.inTransizione) return;
    if (this.classe.abilita.mira) {
      this.mira = this.mira === 'abilita' ? null : 'abilita'; // un secondo clic sul pulsante annulla
      return;
    }
    this.usaAbilita(this.nelMondo(this.input.activePointer));
  }

  /** Usa l'abilità verso un punto del mondo, se è pronta e c'è abbastanza mana. */
  usaAbilita(punto: Vettore): void {
    this.mira = null;
    if (this.inTransizione || this.eroe.sconfitto) return;
    const abilita = this.classe.abilita;
    const adesso = this.time.now;
    const stato = this.statoAbilita;
    const disponibilita = puòUsare(stato, abilita, adesso, this.eroe.mana);
    if (disponibilita !== 'pronta') {
      mostraNumero(this, this.eroe.x, this.eroe.y - 8, disponibilita === 'in ricarica' ? 'non ancora!' : 'mana!', 'avviso');
      return;
    }
    const riuscita = ABILITA[abilita.id as keyof typeof ABILITA]({
      scena: this,
      eroe: this.eroe,
      nemici: this.nemici,
      combattimento: this.combattimento,
      proiettili: this.proiettili,
      abilita,
      caratteristiche: this.caratteristiche,
      casuale: casualeVero,
      adesso,
    }, punto);
    if (!riuscita) return; // per esempio la parata mentre si sta attaccando: non si consuma nulla
    suoni.effetto('magia');
    if (abilita.costoMana > 0) this.eroe.consumaMana(abilita.costoMana);
    // La ricarica sta nel registro: cambiando mappa non si "resetta".
    this.registry.set(CHIAVE_ABILITA, usa(stato, abilita, adesso));
    this.salvaRisorse();
  }

  /** Per l'interfaccia: ricarica (1 → 0) e se c'è abbastanza mana. */
  statoPulsanteAbilita(): { frazione: number; manaSufficiente: boolean; inMira: boolean } {
    if (!this.eroe) return { frazione: 0, manaSufficiente: true, inMira: false };
    const abilita = this.classe.abilita;
    return {
      frazione: frazioneRicarica(this.statoAbilita, abilita, this.time.now),
      manaSufficiente: abilita.costoMana <= this.eroe.mana.attuale,
      inMira: this.mira === 'abilita',
    };
  }

  // ---- arma secondaria (arco, balestra, pugnali da lancio, bacchetta) ----

  private get armaSecondaria(): DefinizioneArma | null {
    const id = this.partita.equipaggiamento.secondaria;
    return id ? (this.dati.armi[id] ?? null) : null;
  }

  /** Pulsante della barra: come per le abilità, accende il mirino; il clic dopo sceglie il bersaglio. */
  attivaSecondaria(): void {
    if (!this.scene.isActive() || this.inTransizione) return;
    if (!this.armaSecondaria) {
      mostraAvviso(this, 'Nessuna arma secondaria: equipaggiane una dallo zaino o dalla scheda');
      return;
    }
    this.mira = this.mira === 'secondaria' ? null : 'secondaria';
  }

  /** Usa l'arma secondaria (a distanza o da mischia) verso un punto del mondo. */
  usaSecondaria(punto: Vettore, forzaFermo = false): void {
    this.mira = null;
    if (this.inTransizione || this.eroe.sconfitto || !this.scene.isActive()) return;
    const arma = this.armaSecondaria;
    if (!arma) {
      mostraNumero(this, this.eroe.x, this.eroe.y - 8, 'nessuna arma secondaria', 'avviso');
      return;
    }
    const adesso = this.time.now;
    // Si usa solo "da liberi": non durante un attacco, una capriola o una parata.
    if (!this.eroe.libero || adesso < this.secondariaPronta) {
      mostraNumero(this, this.eroe.x, this.eroe.y - 8, 'non ancora!', 'avviso');
      return;
    }
    const tiro = arma.proiettile;
    if (tiro && this.eroe.mana.attuale < tiro.costoMana) {
      mostraNumero(this, this.eroe.x, this.eroe.y - 8, 'mana!', 'avviso');
      return;
    }

    const da = { x: this.eroe.x, y: this.eroe.y };
    const nemico = this.guida.nemicoSotto(punto);
    const bersaglio = nemico ? { x: nemico.forma.x, y: nemico.forma.y } : punto;

    // Se è un'arma a distanza ed è fuori gittata utile (e non c'è Shift / Force Stand),
    // l'eroe si avvicina automaticamente fino alla massima gittata utile prima di scoccare.
    if (tiro && !forzaFermo) {
      const pronto = aTiro(this.griglia, da, bersaglio, tiro.gittata, TESSERA);
      if (!pronto) {
        this.guida.avvicinatiESpara(bersaglio, nemico ?? undefined, tiro.gittata, () => {
          const puntoAttuale = nemico && nemico.vivo ? { x: nemico.forma.x, y: nemico.forma.y } : bersaglio;
          this.eseguiTiroSecondaria(arma, puntoAttuale);
        });
        return;
      }
    }

    this.eseguiTiroSecondaria(arma, bersaglio);
  }

  private eseguiTiroSecondaria(arma: DefinizioneArma, punto: Vettore): void {
    if (this.inTransizione || this.eroe.sconfitto || !this.scene.isActive()) return;
    const adesso = this.time.now;
    if (!this.eroe.libero || adesso < this.secondariaPronta) return;
    const tiro = arma.proiettile;
    if (tiro) {
      if (this.eroe.mana.attuale < tiro.costoMana) {
        mostraNumero(this, this.eroe.x, this.eroe.y - 8, 'mana!', 'avviso');
        return;
      }
      if (tiro.costoMana > 0) this.eroe.consumaMana(tiro.costoMana);
    }
    this.secondariaPronta = adesso + arma.ricaricaMs;
    const da = { x: this.eroe.x, y: this.eroe.y };
    this.eroe.girati(punto);
    this.eroe.rendiInvisibile(0); // attaccare rivela
    if (tiro) {
      this.tiraProiettile(arma, da, direzioneDa(da, punto));
    } else {
      suoni.effetto('colpo');
      const dir = direzioneVerso(da, punto);
      const area = areaDiColpo(da, this.eroe.lato, dir, { portata: arma.portata, larghezza: arma.larghezzaColpo });
      const rett = this.add
        .rectangle(area.x + area.larghezza / 2, area.y + area.altezza / 2, area.larghezza, area.altezza, 0xffe680, 0.45)
        .setDepth(12);
      this.time.delayedCall(arma.durataMs || 140, () => rett.destroy());
      const { modificatore: mod, probabilitaCritico } = this.statisticheArma(arma);
      const colpo = this.combattimento.colpoArma(arma, mod, probabilitaCritico, da);
      for (const nemico of this.nemici.vivi()) {
        if (intersecano(area, nemico.rettangolo())) this.combattimento.infliggi(nemico, colpo, adesso);
      }
      for (const m of this.muri) {
        if (!m.aperto && intersecano(area, m.rettangolo())) this.apriMuro(m);
      }
    }
    this.salvaRisorse();
  }

  /** Per l'interfaccia: nome dell'arma secondaria, ricarica (1 → 0) e mirino. */
  statoPulsanteSecondaria(): { nome: string | null; frazione: number; inMira: boolean } {
    const arma = this.eroe ? this.armaSecondaria : null;
    if (!arma) return { nome: null, frazione: 0, inMira: false };
    const restante = this.secondariaPronta - this.time.now;
    return { nome: arma.nome, frazione: Math.min(1, Math.max(0, restante / arma.ricaricaMs)), inMira: this.mira === 'secondaria' };
  }

  private get statoAbilita(): StatoAbilita {
    return (this.registry.get(CHIAVE_ABILITA) as StatoAbilita | undefined) ?? creaStatoAbilita();
  }

  private statisticheArma(arma: DefinizioneArma): { modificatore: number; probabilitaCritico: number } {
    const car = this.caratteristiche;
    // La pozione di forza aiuta solo in mischia (non dardi e frecce).
    const forza = arma.proiettile ? 0 : bonus(this.partita.effetti, 'forza', this.time.now);
    return {
      modificatore: modificatoreArma(arma, car) + forza,
      // Volpe: +5% di critico finché è con te.
      probabilitaCritico: probabilitaCriticoDi(arma, car) + this.bonusCompagno('critico'),
    };
  }

  /** Armatura dell'eroe adesso: base + pezzi indossati + pozione di resistenza (design §7). */
  private armaturaEroe(): number {
    const pezzi = armaturaTotale(this.partita.equipaggiamento, this.dati.indossabili);
    // Corrado: +1 armatura finché è con te.
    return datiEroe.armatura + pezzi + bonus(this.partita.effetti, 'resistenza', this.time.now) + this.bonusCompagno('armatura');
  }

  /** Effetti speciali delle armature indossate (spine, predatore, veggente…). */
  private effettiArmatura(): string[] {
    return effettiEquipaggiati(this.partita.equipaggiamento, this.dati.indossabili, 'armatura');
  }

  // ---- equipaggiamento (chiamati da zaino e scheda) ----

  /**
   * Indossa o impugna l'oggetto di uno spazio dello zaino. Restituisce il messaggio.
   * "attesaMs": dopo il cambio non si attacca per un po' (cambio rapido dalla barra).
   * "spazioScelto": per le armi permette di scegliere se metterle in primaria o secondaria.
   */
  indossaDaZaino(indice: number, attesaMs = 0, spazioScelto?: 'primaria' | 'secondaria'): string {
    const pila = this.partita.inventario.spazi[indice];
    const esito = indossa(this.partita, indice, this.dati.indossabili, this.classe, spazioScelto);
    if (esito.messaggio || !pila) return esito.messaggio ?? 'Spazio vuoto';
    scriviPartita(this, esito.partita);
    this.dallaPartita(attesaMs);
    const oggetto = this.dati.oggetti[pila.id]!;
    const destinazione = spazioScelto ?? this.dati.armi[pila.id]?.slot;
    // Anche l'arma secondaria appena impugnata aspetta prima di tirare.
    if (attesaMs > 0 && destinazione === 'secondaria') {
      this.secondariaPronta = Math.max(this.secondariaPronta, this.time.now + attesaMs);
    }
    if (oggetto.tipo === 'armatura') return `Indossi: ${oggetto.nome}`;
    return destinazione === 'secondaria' ? `Arma secondaria: ${oggetto.nome}` : `Impugni: ${oggetto.nome}`;
  }

  /** Scambia tra loro l'arma primaria e quella secondaria. */
  scambiaArmiEquipaggiate(attesaMs = 0): string {
    const esito = invertiArmi(this.partita, this.dati.indossabili, this.classe);
    if (esito.messaggio) return esito.messaggio;
    scriviPartita(this, esito.partita);
    this.dallaPartita(attesaMs);
    if (attesaMs > 0) this.secondariaPronta = Math.max(this.secondariaPronta, this.time.now + attesaMs);
    const primaria = this.dati.oggetti[esito.partita.equipaggiamento.primaria!]!.nome;
    const secondaria = this.dati.oggetti[esito.partita.equipaggiamento.secondaria!]!.nome;
    return `Scambiate: ${primaria} (1ª) ↔ ${secondaria} (2ª)`;
  }

  /** Toglie il pezzo di uno spazio dell'equipaggiamento e lo rimette nello zaino. */
  togliEquipaggiamento(spazio: SpazioEquipaggiamento): string {
    const id = this.partita.equipaggiamento[spazio];
    const esito = togliIndossato(this.partita, spazio, this.dati.indossabili, this.classe);
    if (esito.messaggio || !id) return esito.messaggio ?? 'Non c’è niente da togliere';
    scriviPartita(this, esito.partita);
    this.dallaPartita();
    return `Tolto: ${this.dati.oggetti[id]!.nome} (è nello zaino)`;
  }

  /** C'è un nemico che ti vede? Allora l'armatura non si cambia (design §8). */
  inCombattimento(): boolean {
    return !!this.nemici && this.nemici.inCombattimento({ x: this.eroe.x, y: this.eroe.y });
  }

  // ---- forzieri e raccolta ----

  private creaForzieri(): void {
    const p = this.partita;
    this.forzieri = celleForziere(this.mappa).map(({ cella, contenuto, monete, chiusoCon }) => {
      const chiave = `${this.mappa.id}:${cella.col}:${cella.riga}`;
      return new Forziere(this, centroCella(cella, TESSERA), chiave, contenuto, forziereAperto(p, chiave), monete, chiusoCon, this.aspettiForziere());
    });
    // I forzieri sono solidi per l'eroe e per i nemici.
    const forme = this.forzieri.map((f) => f.forma);
    this.physics.add.collider(this.eroe.forma, forme);
    this.physics.add.collider(this.nemici.gruppo, forme);
  }

  /** Cosa c'è da usare sotto un punto: forzieri chiusi e muri segreti ancora chiusi. */
  private interagibileSotto(punto: Vettore): Interagibile | null {
    const sotto = (posizione: Vettore, mezzo: number) => Math.abs(posizione.x - punto.x) <= mezzo && Math.abs(posizione.y - punto.y) <= mezzo;
    const f = this.forzieri.find((x) => !x.aperto && sotto(x.posizione, 9));
    if (f) return { posizione: f.posizione, distanza: 20, interagisci: () => this.apriForziere(f) };
    const v = this.vene.find((x) => !x.esaurita && sotto(x.posizione, 8));
    if (v) return { posizione: v.posizione, distanza: 22, interagisci: () => this.scava(v) };
    const porta = this.porte.find((x) => !x.aperta && sotto(x.posizione, 8));
    if (porta) return { posizione: porta.posizione, distanza: 22, interagisci: () => this.tentaPorta(porta) };
    const c = this.cartelli.find((x) => sotto(x.posizione, 8));
    if (c) return { posizione: c.posizione, distanza: 22, interagisci: () => this.leggiCartello(c) };
    const m = this.muri.find((x) => !x.aperto && sotto(x.posizione, 8));
    if (m) return { posizione: m.posizione, distanza: 22, interagisci: () => this.apriMuro(m) };
    // Le persone hanno un'area un po' più alta: si clicca anche sulla testa.
    const a = this.abitanti.find((x) => Math.abs(x.posizione.x - punto.x) <= 7 && punto.y >= x.posizione.y - 10 && punto.y <= x.posizione.y + 8);
    if (a) return { posizione: a.posizione, distanza: 24, cursore: 'parla', interagisci: () => this.parla(a.definizione.id) };
    return null;
  }

  // ---- il compagno (fase 5c) ----

  /** Il compagno attivo nei dati (null = nessuno). */
  private get definizioneCompagno(): DefinizioneCompagno | null {
    const id = this.partita.compagni.attivo;
    return id ? (this.dati.compagni[id] ?? null) : null;
  }

  /** Bonus fisso del compagno attivo, se è di quel tipo (0 altrimenti). */
  private bonusCompagno(tipo: DefinizioneCompagno['bonus']['tipo']): number {
    const d = this.definizioneCompagno;
    return d && d.bonus.tipo === tipo ? d.bonus.valore : 0;
  }

  /** Crea (o toglie) il compagno accanto all'eroe: all'avvio della scena e dopo la taverna. */
  private creaCompagno(): void {
    // Prima si tolgono le collisioni: un collider che punta a un oggetto distrutto darebbe errore.
    for (const c of this.collisioniCompagno) c.destroy();
    this.collisioniCompagno = [];
    this.compagno?.distruggi();
    this.compagno = null;
    const d = this.definizioneCompagno;
    if (!d) return;
    const c = new Compagno(this, this.eroe.x - 14, this.eroe.y + 4, d, this.griglia, aspettoDi(this.dati.sprite, 'compagni', d.id));
    this.compagno = c;
    // Si ferma contro muri, forzieri, muri segreti e persone, come l'eroe.
    this.collisioniCompagno.push(
      this.physics.add.collider(c.forma, this.livello),
      this.physics.add.collider(c.forma, [...this.forzieri.map((f) => f.forma), ...this.muri.map((m) => m.forma), ...this.abitanti.map((a) => a.forma), ...this.vene.map((v) => v.forma)]),
    );
    // I nemici che lo toccano gli fanno danno, come all'eroe (ma senza armatura).
    const contatto = this.physics.add.overlap(c.forma, this.nemici.gruppo, (_, formaNemico) => {
      const adesso = this.time.now;
      const nemico = this.nemici.daForma(formaNemico);
      if (!nemico || !nemico.puòAttaccare(adesso) || c.alTappeto) return;
      const { danno } = calcolaDanno({ dado: nemico.definizione.danno, modificatore: 0, bonus: 0, armatura: 0, probabilitaCritico: 0 }, casualeVero);
      c.subisci(danno);
      nemico.dopoAttacco(adesso);
      mostraNumero(this, c.x, c.y - 4, c.alTappeto ? `${d.nome} al tappeto!` : danno, 'avviso');
    });
    this.collisioniCompagno.push(contatto);
  }

  /** A ogni fotogramma: il compagno decide e si muove; Agata cura un poco. */
  private aggiornaCompagno(adesso: number): void {
    const c = this.compagno;
    if (!c) return;
    if (this.eroe.sconfitto) {
      (c.forma.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      return;
    }
    const eroe = { x: this.eroe.x, y: this.eroe.y };
    c.aggiorna(adesso, eroe, this.nemici.vivi(), this.nemici.inCombattimento(eroe), (n) => this.attaccoCompagno(c, n));
    // Sorella Agata: 1 punto vita ogni 5 secondi.
    const cura = this.bonusCompagno('cura_nel_tempo');
    if (cura > 0 && adesso - this.ultimaCuraCompagno >= 5000) {
      this.ultimaCuraCompagno = adesso;
      if (this.eroe.recuperaVita(cura) > 0) mostraNumero(this, this.eroe.x, this.eroe.y - 8, `+${cura}`, 'cura');
    }
  }

  /** Il compagno colpisce: in mischia subito, Elisa con un dardo magico. */
  private attaccoCompagno(c: Compagno, nemico: Nemico): void {
    const d = c.definizione;
    const da = { x: c.x, y: c.y };
    // Elisa con un eroe senza mana: i suoi dardi fanno +1 (il suo bonus serve comunque a qualcosa).
    const extra = d.bonus.tipo === 'rigenerazione_mana' && this.eroe.mana.massima === 0 ? 1 : 0;
    const colpo = { dado: d.danno, modificatore: extra, probabilitaCritico: 0.05, respinta: 80, da, puòEssereAlleSpalle: false, effetti: [], dalCompagno: true };
    if (d.proiettile) {
      const tiro = d.proiettile;
      this.proiettili.lancia({
        da,
        direzione: direzioneDa(da, { x: nemico.forma.x, y: nemico.forma.y }),
        velocita: tiro.velocita,
        gittata: tiro.gittata,
        raggio: tiro.dimensione,
        colore: tiro.colore,
        impattoAFineCorsa: false,
        impatto: (colpito) => colpito && this.combattimento.infliggi(colpito, colpo, this.time.now),
      });
      return;
    }
    // Un piccolo fendente disegnato verso il nemico.
    const lampo = this.add.line(0, 0, da.x, da.y, nemico.forma.x, nemico.forma.y, 0xffffff, 0.7).setOrigin(0, 0).setDepth(12).setLineWidth(1.5);
    this.time.delayedCall(90, () => lampo.destroy());
    this.combattimento.infliggi(nemico, colpo, this.time.now);
  }

  /** Il danno passa prima dalle protezioni dei compagni (Corrado, Elisa). */
  private proteggiEroe(danno: number): number {
    const esito = assorbiDanno(this.protezione, danno, this.time.now);
    const prima = this.protezione;
    this.protezione = esito.protezione;
    if (esito.assorbito > 0) {
      const testo = prima?.tipo === 'parata' ? `parato da ${this.definizioneCompagno?.nome ?? 'Corrado'}!` : `scudo −${esito.assorbito}`;
      mostraNumero(this, this.eroe.x, this.eroe.y - 6, testo, 'avviso');
    }
    return esito.danno;
  }

  /** Lo scudo di Elisa o la parata pronta di Corrado si vedono intorno all'eroe. */
  private disegnaProtezione(adesso: number): void {
    const g = this.disegnoProtezione.clear();
    const p = this.protezione;
    if (p?.tipo === 'scudo' && adesso >= p.fino) this.protezione = null;
    // Indicatore visivo sotto il nemico agganciato dall'attacco continuo.
    const bersaglio = this.guida?.nemicoBersaglio;
    if (bersaglio && bersaglio.vivo) {
      const r = 7 + 1.2 * Math.sin(adesso / 110);
      g.lineStyle(1.4, 0xff6b6b, 0.85).strokeCircle(bersaglio.forma.x, bersaglio.forma.y + 3, r);
    }
    if (!this.protezione) return;
    const colore = this.protezione.tipo === 'scudo' ? 0x8fd3ff : 0xcfe3ff;
    g.lineStyle(1.2, colore, 0.6 + 0.3 * Math.sin(adesso / 120)).strokeCircle(this.eroe.x, this.eroe.y, 11);
  }

  /** Pulsante del compagno nella barra (o Q): la sua abilità speciale. */
  usaAbilitaCompagno(): void {
    if (!this.scene.isActive() || this.inTransizione || this.eroe.sconfitto) return;
    const c = this.compagno;
    const avviso = (t: string) => mostraNumero(this, this.eroe.x, this.eroe.y - 8, t, 'avviso');
    if (!c) {
      mostraAvviso(this, 'Nessun compagno: ingaggialo da Tobia, alla taverna');
      return;
    }
    if (c.alTappeto) {
      avviso(`${c.definizione.nome} è al tappeto`);
      return;
    }
    const a = c.definizione.abilita;
    const adesso = this.time.now;
    if (puòUsare(this.statoAbilitaCompagno, { costoMana: 0 }, adesso, this.eroe.mana) !== 'pronta') {
      avviso('non ancora!');
      return;
    }
    switch (a.id) {
      case 'cura_eroe': {
        const recuperata = this.eroe.recuperaVita(a.quantita ?? 8);
        if (recuperata === 0) {
          avviso('vita già piena');
          return; // non si spreca la ricarica
        }
        mostraNumero(this, this.eroe.x, this.eroe.y - 8, `+${recuperata}`, 'cura');
        this.salvaRisorse();
        break;
      }
      case 'para_colpo':
        this.protezione = { tipo: 'parata' };
        avviso(`${c.definizione.nome} ti copre`);
        break;
      case 'scudo_magico':
        this.protezione = { tipo: 'scudo', resto: a.quantita ?? 10, fino: adesso + (a.durataMs ?? 8000) };
        avviso('scudo magico!');
        break;
      case 'segnala_tesori': {
        this.segnaleFino = adesso + (a.durataMs ?? 6000);
        // Dalla fase 8a Volpe apre anche il forziere chiuso a chiave più vicino (§10).
        const raggio = a.raggio ?? 160;
        const chiuso = this.forzieri.find((f) => !f.aperto && f.chiusoCon && Math.hypot(f.posizione.x - this.eroe.x, f.posizione.y - this.eroe.y) <= raggio);
        if (chiuso) this.apriForziere(chiuso, true);
        else avviso('fiuto per i tesori!');
        break;
      }
    }
    this.registry.set(CHIAVE_ABILITA_COMPAGNO, usa(this.statoAbilitaCompagno, a, adesso));
  }

  private get statoAbilitaCompagno(): StatoAbilita {
    return (this.registry.get(CHIAVE_ABILITA_COMPAGNO) as StatoAbilita | undefined) ?? creaStatoAbilita();
  }

  /** Per l'interfaccia: il pulsante del compagno. */
  statoPulsanteCompagno(): { id: string; nome: string; colore: string; abilita: string; descrizione: string; frazione: number; alTappeto: boolean } | null {
    const c = this.compagno;
    if (!c) return null;
    const d = c.definizione;
    return {
      id: d.id,
      nome: d.nome,
      colore: d.colore,
      abilita: d.abilita.nome,
      descrizione: d.abilita.descrizione,
      frazione: frazioneRicarica(this.statoAbilitaCompagno, d.abilita, this.time.now),
      alTappeto: c.alTappeto,
    };
  }

  // ---- vene di minerale ----

  private creaVene(): void {
    this.vene = celleVena(this.mappa).map(({ cella, materiale, quantita, aspetto }) => {
      const colore = parseInt((this.dati.oggetti[materiale]?.colore ?? '#b07050').replace('#', ''), 16);
      return new Vena(this, cella, centroCella(cella, TESSERA), materiale, quantita, colore, aspetto, aspettoDi(this.dati.sprite, 'vene', materiale));
    });
    const forme = this.vene.map((v) => v.forma);
    this.physics.add.collider(this.eroe.forma, forme);
    this.physics.add.collider(this.nemici.gruppo, forme);
  }

  /** Clic su una vena: l'eroe scava e i pezzi cadono ai suoi piedi. */
  private scava(v: Vena): void {
    if (v.esaurita) return;
    this.eroe.girati(v.posizione);
    v.scava(() => {
      const [minimo, massimo] = v.quantita;
      const quanti = minimo + Math.floor(casualeVero() * (massimo - minimo + 1));
      // I pezzi cadono ai piedi dell'eroe: li raccoglie subito (con lo zaino pieno restano lì).
      this.oggettiATerra.lascia([{ id: v.materiale, quantita: quanti }], { x: this.eroe.x, y: this.eroe.y });
    });
  }

  // ---- cartelli, cancelli e frane (fase 7b) ----

  private creaCartelli(): void {
    this.cartelli = celleCartello(this.mappa).map((d) => new Cartello(this, centroCella(d.cella, TESSERA), d, aspettoDi(this.dati.sprite, 'oggetti', d.aspetto)));
    const forme = this.cartelli.map((c) => c.forma);
    this.physics.add.collider(this.eroe.forma, forme);
    this.physics.add.collider(this.nemici.gruppo, forme);
  }

  // ---- porte chiuse a chiave e barriere del boss (fase 8a) ----

  private creaPorte(): void {
    const p = this.partita;
    this.porte = cellePorte(this.mappa).map((d) => {
      const chiave = `${this.mappa.id}:${d.cella.col}:${d.cella.riga}`;
      return new Porta(this, d.cella, centroCella(d.cella, TESSERA), chiave, d.chiave, d.nome, d.aspetto, portaAperta(p, chiave), aspettoDi(this.dati.sprite, 'oggetti', `porta_${d.aspetto}`));
    });
    this.barriere = celleBarriera(this.mappa).map((d) => new Barriera(this, d.cella, centroCella(d.cella, TESSERA)));
    const forme = [...this.porte, ...this.barriere].map((x) => x.forma);
    this.physics.add.collider(this.eroe.forma, forme);
    this.physics.add.collider(this.nemici.gruppo, forme);
  }

  /** Clic su una porta: si apre se nello zaino c'è la sua chiave (che resta: è "di missione"). */
  private tentaPorta(porta: Porta): void {
    this.eroe.girati(porta.posizione);
    const nomeChiave = this.dati.oggetti[porta.serveChiave]?.nome ?? porta.serveChiave;
    const esito = apriConChiave(this.partita.inventario, { chiave: porta.serveChiave, consuma: false });
    // "Chiuso a chiave: la porta d'ossa" invece di "La porta è chiusa": così il testo
    // va bene sia per "il cancello" sia per "la porta", senza accordare il genere.
    if (!esito.ok) {
      mostraAvviso(this, `Chiuso a chiave: ${porta.nome}. Serve: ${nomeChiave}`);
      return;
    }
    porta.apri();
    suoni.effetto('porta');
    scriviPartita(this, apriPorta(this.partita, porta.chiave));
    mostraAvviso(this, `Apri ${porta.nome} con: ${nomeChiave}`);
  }

  private leggiCartello(c: Cartello): void {
    this.eroe.girati(c.posizione);
    mostraAvviso(this, c.testo((id) => conta(this.partita.inventario, id) > 0));
  }

  // ---- persone del villaggio e dialoghi ----

  private creaAbitanti(): void {
    this.abitanti = celleAbitante(this.mappa).map(({ cella, idAbitante }) => new Abitante(this, centroCella(cella, TESSERA), this.dati.abitanti[idAbitante]!, aspettoDi(this.dati.sprite, 'abitanti', idAbitante)));
    const forme = this.abitanti.map((a) => a.forma);
    this.physics.add.collider(this.eroe.forma, forme);
    this.physics.add.collider(this.nemici.gruppo, forme);
  }

  /** Apre il dialogo con una persona: il mondo va in pausa finché non si chiude. */
  parla(idAbitante: string): void {
    if (this.inTransizione || this.eroe.sconfitto || !this.scene.isActive()) return;
    this.guida.annulla();
    this.eroe.ferma();
    this.salvaRisorse();
    // Parlare è anche un evento per le quest (consegnare una lettera, "parla con…").
    this.eventoQuest({ tipo: 'parlato', abitante: idAbitante });
    this.scene.launch(SCENA_DIALOGO, { idAbitante });
    this.scene.pause();
  }

  /** Una risposta del dialogo apre qualcosa: il negozio o (dalla 5c) la taverna. */
  apri(cosa: CosaApribile): void {
    if (cosa === 'taverna') this.scene.launch(SCENA_TAVERNA);
    else if (cosa === 'fucina') this.scene.launch(SCENA_FUCINA);
    else this.scene.launch(SCENA_NEGOZIO, { negozio: 'gemma' });
    this.scene.pause();
  }

  /** Fase 9b: le tre immagini dei forzieri, se sprite.json le prevede tutte. */
  private aspettiForziere(): AspettiForziere | null {
    const a = (id: string) => aspettoDi(this.dati.sprite, 'oggetti', id);
    const chiuso = a('forziere');
    const aperto = a('forziere_aperto');
    const rinforzato = a('forziere_chiuso');
    return chiuso && aperto && rinforzato ? { chiuso, aperto, rinforzato } : null;
  }

  // ---- muri segreti ----

  private creaMuriSegreti(): void {
    const p = this.partita;
    this.muri = celleSegrete(this.mappa).map((cella) => {
      const chiave = `${this.mappa.id}:${cella.col}:${cella.riga}`;
      const voce = this.mappa.legenda[this.mappa.simboli[cella.riga]![cella.col]!]!;
      const colore = parseInt((voce.coloreMuro ?? '#2f3b2f').replace('#', ''), 16);
      const simbolo = this.mappa.simboli[cella.riga]![cella.col]!;
      const muro = voce.tesseraMuro ? { chiave: chiaveTessere(this.mappa), fotogramma: fotogrammaMuroSegreto(simbolo) } : null;
      return new MuroSegreto(this, cella, centroCella(cella, TESSERA), chiave, colore, muroAperto(p, chiave), muro);
    });
    const forme = this.muri.map((m) => m.forma);
    this.physics.add.collider(this.eroe.forma, forme);
    this.physics.add.collider(this.nemici.gruppo, forme);
  }

  /** A ogni fotogramma: un fendente che tocca un muro segreto lo apre; l'Elmo del veggente lo fa brillare. */
  private aggiornaMuri(adesso: number): void {
    const fiuto = adesso < this.segnaleFino;
    const raggioFiuto = this.definizioneCompagno?.abilita.raggio ?? 160;
    for (const f of this.forzieri) {
      f.segnala(fiuto && Math.hypot(f.posizione.x - this.eroe.x, f.posizione.y - this.eroe.y) <= raggioFiuto, adesso);
    }
    if (this.muri.length === 0) return;
    const area = this.eroe.areaDiColpoAttiva();
    const veggente = this.effettiArmatura().includes('veggente');
    // Il fiuto di Volpe funziona come l'Elmo del veggente, ma più lontano e solo per poco.
    const raggio = fiuto ? raggioFiuto : NUMERI_EFFETTI.raggioVeggente;
    for (const m of this.muri) {
      if (m.aperto) continue;
      if (area && intersecano(area, m.rettangolo())) this.apriMuro(m);
      m.aggiorna({ x: this.eroe.x, y: this.eroe.y }, veggente || fiuto, raggio, adesso);
    }
  }

  private apriMuro(m: MuroSegreto): void {
    if (m.aperto) return;
    m.apri();
    suoni.effetto('porta');
    scriviPartita(this, apriMuro(this.partita, m.chiave));
    this.scuotiSchermo(150, 0.003);
    mostraAvviso(this, 'Un passaggio segreto!');
  }

  /** Apre un forziere. Se è chiuso a chiave serve una chiave piccola, oppure Volpe ("scassinatore"). */
  private apriForziere(f: Forziere, scassinatore = false): void {
    if (f.aperto) return;
    if (f.chiusoCon) {
      const esito = apriConChiave(this.partita.inventario, { chiave: f.chiusoCon, consuma: true }, { scassinatore });
      if (!esito.ok) {
        mostraAvviso(this, `Chiuso a chiave. Serve: ${this.dati.oggetti[f.chiusoCon]?.nome ?? f.chiusoCon} (o un ladro esperto)`);
        return;
      }
      if (esito.inventario !== this.partita.inventario) scriviPartita(this, { ...this.partita, inventario: esito.inventario });
      mostraAvviso(this, esito.come === 'volpe' ? 'Volpe fa scattare la serratura!' : 'La chiave piccola gira nella serratura');
    }
    f.apri();
    suoni.effetto('forziere');
    scriviPartita(this, apriForziere(this.partita, f.chiave));
    this.eventoQuest({ tipo: 'aperto', forziere: f.chiave });
    // Il contenuto "salta fuori" verso l'eroe, lontano dal corpo del forziere e dagli alberi/muri.
    const dentro = f.contenuto.map((id) => ({ id, quantita: 1 }));
    if (f.monete > 0) dentro.push({ id: 'monete', quantita: f.monete });
    this.oggettiATerra.lascia(dentro, f.posizione, false, {
      verso: { x: this.eroe.x, y: this.eroe.y },
      distanzaMinima: 15,
    });
  }

  /** Vero se un punto della mappa è calpestabile e non cade sopra piante, muri, forzieri o altri ostacoli solidi. */
  private puntoLiberoPerOggetto(punto: Vettore): boolean {
    if (!this.griglia) return true;
    // Controlla il punto e un piccolo margine (4 px) intorno, così l'eroe può sempre passarci sopra senza incastrarsi.
    const margine = 4;
    for (const [dx, dy] of [[0, 0], [-margine, 0], [margine, 0], [0, -margine], [0, margine]] as const) {
      const c = cellaDaPixel(punto.x + dx, punto.y + dy, TESSERA);
      if (!this.griglia.calpestabile(c.col, c.riga)) return false;
    }
    const vicinoA = (pos: Vettore, raggio: number) => Math.hypot(pos.x - punto.x, pos.y - punto.y) < raggio;
    if (this.forzieri.some((f) => vicinoA(f.posizione, 13))) return false;
    if (this.vene.some((v) => !v.esaurita && vicinoA(v.posizione, 11))) return false;
    if (this.cartelli.some((c) => vicinoA(c.posizione, 11))) return false;
    if (this.abitanti.some((a) => vicinoA(a.posizione, 11))) return false;
    return true;
  }

  /** Prova a mettere oggetti nello zaino. Restituisce quanti NON sono entrati. */
  private raccogli(id: string, quantita: number): number {
    const definizione = this.dati.oggetti[id];
    if (!definizione) return quantita;
    const p = this.partita;
    // Le monete non vanno nello zaino: si raccolgono sempre, anche a zaino pieno.
    if (definizione.tipo === 'monete') {
      suoni.effetto('raccolta');
      scriviPartita(this, aggiungiMonete(p, quantita));
      mostraNumero(this, this.eroe.x, this.eroe.y - 10, `+${quantita} monete`, 'esperienza');
      return 0;
    }
    const esito = aggiungi(p.inventario, id, quantita, definizione.pila);
    if (esito.inventario !== p.inventario) scriviPartita(this, { ...p, inventario: esito.inventario });
    const presi = quantita - esito.rimasti;
    if (presi > 0) {
      suoni.effetto('raccolta');
      mostraNumero(this, this.eroe.x, this.eroe.y - 10, `+${presi} ${definizione.nome}`, 'esperienza');
    }
    if (esito.rimasti > 0) mostraNumero(this, this.eroe.x, this.eroe.y - 4, 'zaino pieno', 'avviso');
    // Una quest "raccogli" aspettava proprio questo oggetto? Avvisa del progresso.
    if (presi > 0) {
      const avvisi = avvisiRaccolta(this.partita.quest, this.dati.quest, esito.inventario, id);
      if (avvisi.length > 0) mostraAvviso(this, avvisi.at(-1)!);
    }
    return esito.rimasti;
  }

  /**
   * Un proiettile di un'arma (dardo del bastone, freccia, pugnale da lancio…):
   * colpisce il primo nemico che incontra. Con l'effetto "rimbalzo" riparte
   * verso il nemico più vicino non ancora colpito, fino a 2 volte.
   */
  private tiraProiettile(
    arma: DefinizioneArma,
    da: Vettore,
    direzione: Vettore,
    colpiti: Set<number> = new Set(),
    rimbalzi = arma.effetti.includes('rimbalzo') ? NUMERI_EFFETTI.rimbalzi : 0,
  ): void {
    const tiro = arma.proiettile;
    if (!tiro) return;
    // Il primo tiro suona; i rimbalzi no (sarebbe un frastuono).
    if (colpiti.size === 0) suoni.effetto('magia');
    this.proiettili.lancia({
      da,
      direzione,
      velocita: tiro.velocita,
      gittata: tiro.gittata,
      raggio: tiro.dimensione,
      colore: tiro.colore,
      impattoAFineCorsa: false,
      ignora: colpiti,
      impatto: (nemico) => {
        if (!nemico) return;
        colpiti.add(nemico.id);
        const { modificatore: mod, probabilitaCritico } = this.statisticheArma(arma);
        const posizione = { x: nemico.forma.x, y: nemico.forma.y };
        this.combattimento.infliggi(nemico, this.combattimento.colpoArma(arma, mod, probabilitaCritico, da), this.time.now);
        if (rimbalzi <= 0) return;
        const candidati = this.nemici.vivi().map((n) => ({ id: n.id, posizione: { x: n.forma.x, y: n.forma.y } }));
        const prossimo = prossimoRimbalzo(posizione, candidati, colpiti, NUMERI_EFFETTI.raggioRimbalzo);
        const bersaglio = candidati.find((c) => c.id === prossimo);
        if (bersaglio) this.tiraProiettile(arma, posizione, direzioneDa(posizione, bersaglio.posizione), colpiti, rimbalzi - 1);
      },
    });
  }

  /** Per l'interfaccia: 1 = capriola appena usata, 0 = pronta. */
  frazioneRicaricaCapriola(): number {
    return this.eroe ? this.eroe.frazioneRicaricaSchivata(this.time.now) : 0;
  }

  /** Dati in tempo reale della zona per la minimappa dell'interfaccia. */
  statoMinimappa(): {
    idMappa: string;
    nomeMappa: string;
    larghezza: number;
    altezza: number;
    celle: ('muro' | 'uscita' | 'pavimento')[][];
    eroe: Vettore;
    compagno: Vettore | null;
    nemici: { x: number; y: number; boss: boolean }[];
    forzieri: Vettore[];
    abitanti: Vettore[];
  } | null {
    if (!this.eroe || !this.mappa || !this.griglia) return null;
    const celle: ('muro' | 'uscita' | 'pavimento')[][] = [];
    for (let r = 0; r < this.mappa.altezza; r++) {
      const riga: ('muro' | 'uscita' | 'pavimento')[] = [];
      for (let c = 0; c < this.mappa.larghezza; c++) {
        const s = this.mappa.simboli[r]?.[c];
        const v = s ? this.mappa.legenda[s] : undefined;
        if (v?.tipo === 'uscita') riga.push('uscita');
        else if (!this.griglia.calpestabile(c, r)) riga.push('muro');
        else riga.push('pavimento');
      }
      celle.push(riga);
    }
    return {
      idMappa: this.mappa.id,
      nomeMappa: this.mappa.nome,
      larghezza: this.mappa.larghezza,
      altezza: this.mappa.altezza,
      celle,
      eroe: { x: this.eroe.x, y: this.eroe.y },
      compagno: this.compagno && !this.compagno.alTappeto ? { x: this.compagno.x, y: this.compagno.y } : null,
      nemici: this.nemici.vivi().map((n) => ({ x: n.forma.x, y: n.forma.y, boss: Boolean(n.definizione.fasi) })),
      forzieri: this.forzieri.filter((f) => !f.aperto).map((f) => f.posizione),
      abitanti: this.abitanti.map((a) => a.posizione),
    };
  }

  // ---- mouse ----

  private preparaMouse(): void {
    // Il tasto destro serve per la capriola: niente menu del browser sul gioco.
    this.input.mouse?.disableContextMenu();

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.inTransizione || this.sopraInterfaccia(p)) return;
      const punto = this.nelMondo(p);
      const shiftPremuto = Boolean(
        p.event?.shiftKey || this.comandi?.leggi().fermo
      );
      // Col mirino attivo il clic sinistro sceglie il bersaglio (abilità o arma secondaria), il destro annulla.
      if (this.mira) {
        if (p.leftButtonDown()) {
          this.segnaleClic(punto, 0xff8c32);
          if (this.mira === 'abilita') this.usaAbilita(punto);
          else this.usaSecondaria(punto, shiftPremuto);
        } else this.mira = null;
        return;
      }
      if (p.rightButtonDown()) {
        this.guida.premiDestro(punto);
        this.segnaleClic(punto, 0x8fd3ff);
      } else if (p.leftButtonDown()) {
        const cosa = this.guida.premiSinistro(punto, this.time.now, shiftPremuto);
        this.segnaleClic(punto, cosa === 'nemico' ? 0xff6b6b : 0xffffff);
      }
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (!p.leftButtonDown()) this.guida.rilasciaSinistro();
    });
    // Se il mouse esce dalla finestra mentre è premuto, non riceveremmo il "pointerup".
    this.input.on('gameout', () => this.guida.rilasciaSinistro());
  }

  /**
   * Da coordinate dello SCHERMO (pixel della finestra) a coordinate del MONDO
   * (pixel della mappa): la telecamera è spostata e ingrandita ×3, quindi lo
   * stesso punto dello schermo corrisponde a punti diversi della mappa.
   */
  private nelMondo(p: Phaser.Input.Pointer): Vettore {
    const punto = this.cameras.main.getWorldPoint(p.x, p.y);
    return { x: punto.x, y: punto.y };
  }

  /** Il clic è su un pulsante dell'interfaccia (o del pannello sviluppatore)? Allora non è per il mondo. */
  private sopraInterfaccia(p: Phaser.Input.Pointer): boolean {
    return [SCENA_INTERFACCIA, SCENA_SVILUPPATORE].some(
      (chiave) => this.scene.isActive(chiave) && this.scene.get(chiave).input.hitTestPointer(p).length > 0,
    );
  }

  /** A ogni fotogramma: dov'è il cursore nel mondo, e che aspetto deve avere. */
  private aggiornaCursore(): void {
    const p = this.input.activePointer;
    const punto = this.nelMondo(p);
    this.guida.impostaCursore(punto);
    let desiderato = CURSORE_NORMALE;
    if (!this.sopraInterfaccia(p)) {
      if (this.mira) desiderato = CURSORE_MIRA;
      else {
        const interagibile = this.interagibileSotto(punto);
        if (interagibile) desiderato = interagibile.cursore === 'parla' ? CURSORE_PARLA : CURSORE_INTERAZIONE;
        else if (this.guida.nemicoSotto(punto)) desiderato = CURSORE_ATTACCO;
      }
    }
    if (desiderato !== this.cursoreAttuale) {
      this.cursoreAttuale = desiderato;
      this.input.setDefaultCursor(desiderato);
    }
  }

  /** Un cerchio che si allarga e svanisce dove hai cliccato: conferma che il clic è arrivato. */
  private segnaleClic(punto: Vettore, colore: number): void {
    const cerchio = this.add.circle(punto.x, punto.y, 3).setStrokeStyle(1, colore).setDepth(4);
    this.tweens.add({ targets: cerchio, scale: 2.5, alpha: 0, duration: 350, onComplete: () => cerchio.destroy() });
  }

  /** In modalità sviluppatore si vede la strada scelta da A* (già lisciata). */
  private disegnaPercorso(): void {
    this.lineaPercorso.clear();
    if (this.registry.get(CHIAVE_SVIL_AREE) !== true) return;
    const punti = this.guida.percorsoRimasto();
    if (punti.length === 0) return;
    this.lineaPercorso.lineStyle(1, 0xffe680, 1).beginPath().moveTo(this.eroe.x, this.eroe.y);
    for (const p of punti) this.lineaPercorso.lineTo(p.x, p.y);
    this.lineaPercorso.strokePath();
    this.lineaPercorso.fillStyle(0xffe680, 1);
    for (const p of punti) this.lineaPercorso.fillCircle(p.x, p.y, 1.5);
  }

  private davantiAllEroe(): Vettore {
    const verso = { su: [0, -1], giu: [0, 1], sinistra: [-1, 0], destra: [1, 0] }[this.eroe.guarda];
    return { x: this.eroe.x + verso[0]! * 16, y: this.eroe.y + verso[1]! * 16 };
  }

  // ---- partita ed esperienza ----

  private get partita(): Partita {
    return leggiPartita(this);
  }

  private get classe(): DefinizioneClasse {
    return this.dati.classi[this.partita.personaggio.classe]!;
  }

  /** Caratteristiche che contano in gioco: base + bonus dei pezzi leggendari. */
  private get caratteristiche(): Caratteristiche {
    return caratteristicheTotali(this.partita, this.dati.indossabili);
  }

  private profiloEroe(): ProfiloEroe {
    const { vita, mana, equipaggiamento } = this.partita;
    const abilita = this.classe.abilita;
    const car = this.caratteristiche;
    return {
      arma: this.dati.armi[equipaggiamento.primaria!]!, // la primaria non è mai vuota
      colore: this.classe.colore,
      figura: aspettoDi(this.dati.sprite, 'classi', this.classe.id),
      ricaricaSchivataMs: ricaricaSchivata(datiEroe.schivata.ricaricaBaseMs, car),
      vita,
      mana,
      // Elisa: +25% di rigenerazione del mana.
      rigenerazioneMana: rigenerazioneMana(car) * (1 + this.bonusCompagno('rigenerazione_mana')),
      durataParataMs: abilita.id === 'parata' ? (abilita.durataMs ?? 600) : 0,
      capriole: this.effettiArmatura().includes('doppia_capriola') ? 2 : 1,
    };
  }

  /**
   * La vita cambia nell'eroe a ogni colpo subito; la copiamo nella Partita
   * (solo se è cambiata) così l'interfaccia e i cambi di mappa la conoscono.
   */
  private salvaRisorse(): void {
    const p = this.partita;
    const { vita, mana } = this.eroe;
    // Il mana cresce un pochino a ogni fotogramma: lo salviamo solo quando cambia
    // il numero intero mostrato, non 60 volte al secondo.
    const manaCambiato = Math.floor(mana.attuale) !== Math.floor(p.mana.attuale) || mana.massima !== p.mana.massima;
    if (vita !== p.vita || manaCambiato) scriviPartita(this, { ...p, vita, mana });
  }

  /** Il contrario: la Partita è cambiata da fuori (livello, scheda, sviluppatore). */
  /** Una funzione a parte: l'evento RESUME passa i suoi argomenti, che non sono un'attesa. */
  private alRiprendere(): void {
    this.dallaPartita();
    // Dalla taverna può essere cambiato il compagno.
    if ((this.compagno?.definizione.id ?? null) !== this.partita.compagni.attivo) this.creaCompagno();
  }

  private dallaPartita(attesaArmaMs = 0): void {
    const profilo = this.profiloEroe();
    this.eroe.impostaRisorse(profilo.vita, profilo.mana);
    this.eroe.impostaDerivati(profilo.ricaricaSchivataMs, profilo.rigenerazioneMana);
    this.eroe.impostaCapriole(profilo.capriole);
    if (profilo.arma.id !== this.eroe.arma.id) this.eroe.impostaArma(profilo.arma, this.time.now, attesaArmaMs);
  }

  private nemicoSconfitto(nemico: Nemico): void {
    suoni.effetto('sconfitto');
    const { esperienza } = nemico.definizione;
    mostraNumero(this, nemico.forma.x, nemico.forma.y - 8, `+${esperienza} esp`, 'esperienza');
    this.salvaRisorse();
    this.guadagnaEsperienza(esperienza);
    this.eventoQuest({ tipo: 'sconfitto', nemico: nemico.definizione.id });
    // Un boss sconfitto non ricompare più, e la stanza si riapre.
    if (nemico.definizione.fasi) {
      const p = this.partita;
      if (!p.bossSconfitti.includes(nemico.definizione.id)) scriviPartita(this, { ...p, bossSconfitti: [...p.bossSconfitti, nemico.definizione.id] });
      this.boss?.sconfitto();
      this.scuotiSchermo(400, 0.008);
      mostraAvviso(this, `${nemico.definizione.nome} è sconfitto!`);
      // Il Negromante (fase 8c): dopo un attimo, le pagine del finale con il mondo in pausa.
      if (nemico.definizione.finale) this.time.delayedCall(1500, () => this.apriFinale());
    }
    // Bottino: ogni voce della tabella del nemico ha la sua probabilità.
    const bottino = tiraBottino(nemico.definizione.bottino, casualeVero);
    const monete = moneteDelNemico(nemico.definizione.monete, casualeVero);
    if (monete > 0) bottino.push({ id: 'monete', quantita: monete });
    if (bottino.length > 0) this.oggettiATerra.lascia(bottino, { x: nemico.forma.x, y: nemico.forma.y });
  }

  private guadagnaEsperienza(quantita: number): void {
    const bonusEquip = bonusCaratteristiche(this.partita.equipaggiamento, this.dati.indossabili);
    const esito = aggiungiEsperienza(this.partita, quantita, this.classe, this.dati.soglieLivelli, bonusEquip);
    scriviPartita(this, esito.partita);
    if (esito.livelliGuadagnati > 0) {
      suoni.effetto('livello');
      this.dallaPartita(); // la vita massima è cresciuta
      const { livello } = esito.partita.personaggio;
      mostraAvviso(this, `Livello ${livello}! Punti da assegnare: ${esito.partita.puntiDaAssegnare} — apri la scheda`);
    }
  }

  // ---- funzioni interne ----

  private preparaTelecamera(): void {
    const camera = this.cameras.main;
    // La telecamera disegna solo sopra la barra in basso, così la barra non copre la mappa.
    camera.setViewport(0, 0, LARGHEZZA_SCHERMO, ALTEZZA_SCHERMO - ALTEZZA_BARRA_BASSA);
    // I limiti impediscono alla telecamera di mostrare il "fuori mappa".
    camera.setBounds(0, 0, this.mappa.larghezza * TESSERA, this.mappa.altezza * TESSERA);
    camera.setZoom(ZOOM);
    // Il secondo parametro (roundPixels) arrotonda la posizione della telecamera
    // ai pixel interi, per evitare tremolii.
    camera.startFollow(this.eroe.forma, true);
    camera.fadeIn(DURATA_DISSOLVENZA);
    // La luna nera (fase 8c): un velo blu scuro sopra il TERRENO. Sta sotto eroe e
    // nemici (profondità 1): si vede che è notte, ma chi combatte resta leggibile.
    if (this.mappa.notte) {
      this.add.rectangle(0, 0, this.mappa.larghezza * TESSERA, this.mappa.altezza * TESSERA, 0x0a0a30, 0.38).setOrigin(0, 0).setDepth(1);
    }
  }

  private avviaInterfaccia(): void {
    // Il registro è un piccolo archivio condiviso da tutte le scene:
    // l'interfaccia "ascolta" i cambiamenti, come uno state store nel web.
    this.registry.set(CHIAVE_NOME_MAPPA, this.mappa.nome);
    this.registry.set(CHIAVE_MESSAGGIO, '');
    if (!this.scene.isActive(SCENA_INTERFACCIA)) this.scene.launch(SCENA_INTERFACCIA);
  }

  /** Se il centro dell'eroe è su un'uscita, passa all'altra mappa. */
  private controllaUscita(): void {
    const cella = cellaDaPixel(this.eroe.x, this.eroe.y, TESSERA);
    const destinazione = uscitaIn(this.mappa, cella.col, cella.riga);
    if (!destinazione) return;
    this.salvaRisorse();
    this.cambiaMappa({ idMappa: destinazione.verso, arrivo: destinazione.arrivo, daMappa: this.mappa.id });
  }

  /** Dissolvenza in uscita, poi la scena riparte con i nuovi dati. */
  private cambiaMappa(dati: DatiIngresso): void {
    if (this.inTransizione) return;
    this.inTransizione = true;
    this.guida.annulla();
    this.input.setDefaultCursor(CURSORE_NORMALE);
    this.eroe.ferma();
    this.nemici.fermaTutti();
    this.cameras.main.fadeOut(DURATA_DISSOLVENZA);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.restart(dati));
  }

  /** Vita a zero: messaggio, poi ricomparsa all'ingresso della zona con la vita piena (§12). */
  private sconfitta(): void {
    this.salvaRisorse(); // così l'interfaccia mostra 0 (da qui update non gira più)
    this.inTransizione = true;
    this.nemici.fermaTutti();
    this.registry.set(CHIAVE_MESSAGGIO, 'Sei stato sconfitto');
    suoni.effetto('sconfitta');
    this.time.delayedCall(ATTESA_SCONFITTA, () => {
      // Nessuna penalità (§12): si ricomincia con la vita piena, esperienza intatta.
      scriviPartita(this, guarisci(this.partita));
      this.inTransizione = false; // cambiaMappa lo reimposta subito
      this.cambiaMappa({ idMappa: this.mappa.id, arrivo: this.puntoIngresso });
    });
  }

  /** Le impostazioni stanno nel registro, così sopravvivono ai riavvii della scena. */
  private applicaSviluppatore(): void {
    this.eroe.invulnerabileSviluppatore = this.registry.get(CHIAVE_SVIL_INVULNERABILE) === true;
    const mondoFisico = this.physics.world;
    if (this.registry.get(CHIAVE_SVIL_AREE) === true) {
      if (!mondoFisico.debugGraphic) mondoFisico.createDebugGraphic();
      mondoFisico.drawDebug = true;
    } else {
      mondoFisico.drawDebug = false;
      mondoFisico.debugGraphic?.clear();
    }
  }
}

/** Id della mappa dopo quella attuale, ricominciando dalla prima. */
function prossimaMappa(ids: string[], attuale: string): string {
  return ids[(ids.indexOf(attuale) + 1) % ids.length]!;
}

// Il menu iniziale (fase 9a): la prima scena che si vede aprendo il gioco.
//
// È una piccola "app a pagine" dentro una scena sola: la pagina principale,
// la scelta dello slot (per una nuova partita o per caricare) e i crediti.
// Cambiare pagina = svuotare un contenitore e ridisegnarlo, come un componente
// che si ri-renderizza quando cambia lo stato.

import * as Phaser from 'phaser';
import { ALTEZZA_SCHERMO, CHIAVE_PARTITA, CHIAVE_SLOT, SCENA_CREAZIONE, SCENA_INTRO, SCENA_MENU, SCENA_MONDO, SCENA_OPZIONI } from '../costanti';
import type { DatiGioco } from '../data/caricaDati';
import { trovaPunto } from '../systems/mappa';
import { leggiOpzioni } from '../systems/opzioni';
import {
  dopoIlCaricamento,
  elencoSlot,
  eliminaSlot,
  leggiSalvataggio,
  leggiSlot,
  nomeFileEsportazione,
  scriviSlot,
  testoSalvataggio,
  ultimoSlot,
  type Salvataggio,
  type StatoSlot,
} from '../systems/salvataggio';
import {
  archivioDelBrowser,
  avviaInstallazionePwa,
  eDispositivoIos,
  inModalitaStandalone,
  promptInstallazioneDisponibile,
  scaricaFile,
  scegliFile,
  soloInMemoria,
} from './browser';
import { chiediConferma } from './interfaccia/Conferma';
import { Pulsante } from './interfaccia/Pulsante';
import { STILE_TESTO, STILE_TITOLO } from './interfaccia/testi';
import { scriviPartita } from './statoCondiviso';
import { suoni } from '../audio/Suoni';

type Pagina = 'principale' | 'nuova' | 'carica' | 'crediti';

/** Posizioni dei pulsanti: le usano anche le prove nel browser (tests/browser/aiuti.cjs). */
export const MENU = {
  continua: 250,
  nuova: 306,
  carica: 362,
  opzioni: 418,
  crediti: 474,
  /** Centro y delle tre righe degli slot. */
  righeSlot: [170, 270, 370],
  indietro: 492,
};

export class ScenaMenu extends Phaser.Scene {
  private pagina: Pagina = 'principale';
  private contenuto!: Phaser.GameObjects.Container;
  private messaggio!: Phaser.GameObjects.Text;
  private pulsanteInstalla?: Pulsante;

  constructor(private readonly dati: DatiGioco) {
    super(SCENA_MENU);
  }

  get cx(): number {
    return this.scale.width / 2;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#141a24');
    this.add.text(this.cx, 38, 'Ashen Blade', { ...STILE_TITOLO, fontSize: '42px', color: '#f0e6c8' }).setOrigin(0.5);
    this.add.text(this.cx, 74, "L'Ombra della Quercia", { ...STILE_TITOLO, fontSize: '20px', color: '#d8c290' }).setOrigin(0.5);
    this.contenuto = this.add.container(0, 0);
    this.messaggio = this.add.text(this.cx, 518, '', { ...STILE_TESTO, fontSize: '13px', color: '#ffb0a0', align: 'center' }).setOrigin(0.5).setDepth(10);
    this.input.keyboard?.on('keydown-ESC', () => this.pagina !== 'principale' && this.vai('principale'));
    this.cameras.main.fadeIn(400);
    suoni.branoDellaZona('menu');

    const ascoltatoreInstallazione = () => {
      if (this.pagina === 'principale') {
        this.mostraPulsanteInstalla();
      }
    };
    window.addEventListener('pwa-installabile', ascoltatoreInstallazione);
    window.addEventListener('pwa-installata', () => {
      this.pulsanteInstalla?.destroy();
      this.pulsanteInstalla = undefined;
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('pwa-installabile', ascoltatoreInstallazione);
    });

    this.vai('principale');
  }

  /** Per le prove nel browser: la pagina attuale. */
  get paginaAttuale(): Pagina {
    return this.pagina;
  }

  private vai(pagina: Pagina, messaggio = ''): void {
    this.pagina = pagina;
    this.pulsanteInstalla = undefined;
    this.contenuto.removeAll(true); // true = distruggi anche gli oggetti, non solo staccarli
    this.messaggio.setText(messaggio).setColor('#ffb0a0');
    if (pagina === 'principale') this.paginaPrincipale();
    else if (pagina === 'crediti') this.paginaCrediti();
    else this.paginaSlot(pagina);
  }

  // ---- le pagine ----

  private paginaPrincipale(): void {
    this.disegnaSfondo();
    const archivio = archivioDelBrowser();
    const ultimo = ultimoSlot(archivio);
    const riepilogo = ultimo ? elencoSlot(archivio)[ultimo - 1] : null;
    const voce = (y: number, testo: string, alClic: () => void, colore?: number): Pulsante => {
      const p = new Pulsante(this, this.cx, y, { larghezza: 320, altezza: 46, testo, dimensioneTesto: 18, ...(colore ? { colore } : {}), alClic });
      this.contenuto.add(p);
      return p;
    };

    const continua = voce(
      MENU.continua,
      riepilogo?.stato === 'pieno' ? `Continua · ${riepilogo.riepilogo.nome}, liv. ${riepilogo.riepilogo.livello}` : 'Continua',
      () => ultimo && this.carica(ultimo),
      0x2f5d3a,
    );
    if (!ultimo) continua.impostaAttivo(false);
    voce(MENU.nuova, 'Nuova partita', () => this.vai('nuova'));
    voce(MENU.carica, 'Carica', () => this.vai('carica'));
    voce(MENU.opzioni, 'Opzioni', () => this.apriOpzioni());
    voce(MENU.crediti, 'Crediti', () => this.vai('crediti'));
    if (soloInMemoria) {
      this.messaggio.setText('Questo browser non permette di salvare: i salvataggi durano finché la pagina resta aperta.');
    }
    this.mostraPulsanteInstalla();
  }

  private mostraPulsanteInstalla(): void {
    if (this.pulsanteInstalla && this.pulsanteInstalla.active) return;
    if (inModalitaStandalone()) return;

    if (promptInstallazioneDisponibile()) {
      this.pulsanteInstalla = new Pulsante(this, this.scale.width - 96, 38, {
        larghezza: 148,
        altezza: 36,
        testo: '📲 Installa App',
        dimensioneTesto: 13,
        colore: 0x1f3b58,
        alClic: async () => {
          const installato = await avviaInstallazionePwa();
          if (installato && this.pulsanteInstalla) {
            this.pulsanteInstalla.destroy();
            this.pulsanteInstalla = undefined;
          }
        },
      });
      this.contenuto.add(this.pulsanteInstalla);
    } else if (eDispositivoIos()) {
      this.pulsanteInstalla = new Pulsante(this, this.scale.width - 96, 38, {
        larghezza: 148,
        altezza: 36,
        testo: '📲 Installa su iOS',
        dimensioneTesto: 13,
        colore: 0x1f3b58,
        alClic: () => this.mostraGuidaIos(),
      });
      this.contenuto.add(this.pulsanteInstalla);
    }
  }

  private mostraGuidaIos(): void {
    const cx = this.cx;
    const cy = ALTEZZA_SCHERMO / 2;
    const scatola = this.add.container(0, 0).setDepth(1000);
    const chiudi = () => scatola.destroy();

    // Sfondo oscurato che cattura i tocchi per non interagire sotto
    scatola.add(this.add.rectangle(cx, cy, this.scale.width, ALTEZZA_SCHERMO, 0x000000, 0.75).setInteractive().on('pointerdown', chiudi));

    // Riquadro stile fantasy
    scatola.add(this.add.rectangle(cx, cy, 620, 240, 0x141a24).setStrokeStyle(2, 0xffd23f));

    // Titolo
    scatola.add(this.add.text(cx, cy - 80, '📲 Come installare su iPhone o iPad', { ...STILE_TITOLO, fontSize: '20px', color: '#ffd23f' }).setOrigin(0.5));

    // Istruzioni
    const testo =
      '1. Tocca il tasto Condividi di Safari in basso (l\'icona del quadrato con freccia ⬆️).\n\n' +
      '2. Scorri il menu verso il basso e tocca "Aggiungi alla schermata Home".\n\n' +
      '3. Tocca "Aggiungi" in alto a destra: avrai il gioco a tutto schermo!';
    scatola.add(this.add.text(cx, cy - 10, testo, { ...STILE_TESTO, fontSize: '15px', color: '#e2e8f0', lineSpacing: 4, wordWrap: { width: 560 } }).setOrigin(0.5));

    // Tasto chiudi
    scatola.add(new Pulsante(this, cx, cy + 80, { larghezza: 160, altezza: 40, testo: 'Ho capito', dimensioneTesto: 15, colore: 0x2f5d3a, alClic: chiudi }));
  }

  private paginaSlot(modo: 'nuova' | 'carica'): void {
    const titolo = modo === 'nuova' ? 'Nuova partita: scegli uno slot' : 'Carica una partita';
    this.contenuto.add(this.add.text(this.cx, 106, titolo, { ...STILE_TITOLO, fontSize: '22px' }).setOrigin(0.5));
    elencoSlot(archivioDelBrowser()).forEach((s, i) => this.rigaSlot(s, MENU.righeSlot[i]!, modo));
    this.contenuto.add(new Pulsante(this, this.cx, MENU.indietro, { larghezza: 200, altezza: 40, testo: 'Indietro (Esc)', alClic: () => this.vai('principale') }));
  }

  private rigaSlot(s: StatoSlot, y: number, modo: 'nuova' | 'carica'): void {
    const larghezza = modo === 'carica' ? 520 : 600;
    const inizioX = modo === 'carica' ? (this.scale.width - 770) / 2 : this.cx - larghezza / 2;
    const x = inizioX + larghezza / 2;
    const riga = new Pulsante(this, x, y, {
      larghezza,
      altezza: 84,
      testo: this.descrizioneSlot(s),
      dimensioneTesto: 15,
      aCapo: true,
      alClic: () => (modo === 'nuova' ? this.sceltoPerNuova(s) : this.carica(s.slot)),
    });
    if (modo === 'carica' && s.stato !== 'pieno') riga.impostaAttivo(false);
    this.contenuto.add(riga);
    if (modo === 'nuova') return;

    // A destra: esporta, importa, elimina.
    const piccolo = (dx: number, testo: string, alClic: () => void, attivo: boolean) => {
      const p = new Pulsante(this, inizioX + larghezza + 20 + dx, y, { larghezza: 76, altezza: 40, testo, dimensioneTesto: 13, alClic });
      if (!attivo) p.impostaAttivo(false);
      this.contenuto.add(p);
    };
    piccolo(38, 'Esporta', () => this.esporta(s.slot), s.stato === 'pieno');
    piccolo(122, 'Importa', () => this.importa(s), true);
    piccolo(206, 'Elimina', () => this.elimina(s), s.stato !== 'vuoto');
  }

  private descrizioneSlot(s: StatoSlot): string {
    if (s.stato === 'vuoto') return `Slot ${s.slot}\nvuoto`;
    if (s.stato === 'rovinato') return `Slot ${s.slot}\n${s.errore}`;
    const r = s.riepilogo;
    const classe = this.dati.classi[r.classe]?.nome ?? r.classe;
    const data = r.data ? new Date(r.data).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }) : '';
    return `Slot ${s.slot} · ${r.nome}\n${classe}, livello ${r.livello}\n${r.zona} · ${data}`;
  }

  private paginaCrediti(): void {
    const righe = [
      "Ashen Blade: L'Ombra della Quercia",
      '',
      'Un gioco di ruolo ideato e costruito da Ale,',
      'una fase alla volta, insieme a Claude.',
      '',
      'Motore di gioco: Phaser (licenza MIT)',
      'Grafica (dalla fase 9b): Kenney.nl, pacchetti Tiny Town e Tiny Dungeon (CC0)',
      'Suoni e musica (dalla fase 9c): generati dal codice',
    ];
    this.contenuto.add(this.add.text(this.cx, 260, righe.join('\n'), { ...STILE_TESTO, fontSize: '18px', align: 'center', lineSpacing: 8 }).setOrigin(0.5));
    this.contenuto.add(new Pulsante(this, this.cx, MENU.indietro, { larghezza: 200, altezza: 40, testo: 'Indietro (Esc)', alClic: () => this.vai('principale') }));
  }

  // ---- azioni ----

  private sceltoPerNuova(s: StatoSlot): void {
    if (s.stato === 'vuoto') {
      this.nuovaPartita(s.slot);
      return;
    }
    const chi = s.stato === 'pieno' ? ` (${s.riepilogo.nome}, livello ${s.riepilogo.livello})` : '';
    chiediConferma(this, `Lo slot ${s.slot}${chi} verrà sovrascritto. Continuare?`, 'Sovrascrivi', () => this.nuovaPartita(s.slot));
  }

  /** Nuova partita nello slot scelto: testo introduttivo (se attivo nelle opzioni), poi creazione. */
  nuovaPartita(slot: number): void {
    this.registry.set(CHIAVE_SLOT, slot);
    this.registry.remove(CHIAVE_PARTITA);
    const intro = leggiOpzioni(archivioDelBrowser()).mostraIntroduzione;
    this.cameras.main.fadeOut(300);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(intro ? SCENA_INTRO : SCENA_CREAZIONE));
  }

  /** Carica uno slot ed entra nel mondo, all'ingresso della zona in cui si era. */
  carica(slot: number): void {
    const letto = leggiSlot(archivioDelBrowser(), slot);
    if (!letto.ok) {
      this.messaggio.setText(letto.errore);
      return;
    }
    const { mappa, arrivo } = this.doveRiprendere(letto.salvataggio);
    scriviPartita(this, dopoIlCaricamento(letto.salvataggio.partita, this.time.now));
    this.registry.set(CHIAVE_SLOT, slot);
    this.cameras.main.fadeOut(300);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(SCENA_MONDO, { idMappa: mappa, arrivo }));
  }

  /**
   * Un salvataggio può citare una mappa che non esiste più (il gioco è cambiato,
   * o il file è stato toccato a mano): meglio ripartire dal villaggio che bloccarsi.
   */
  private doveRiprendere(s: Salvataggio): { mappa: string; arrivo: string } {
    const m = this.dati.mappe[s.mappa];
    if (m && trovaPunto(m, s.arrivo)) return { mappa: s.mappa, arrivo: s.arrivo };
    return { mappa: this.dati.mappaIniziale, arrivo: '@' };
  }

  private esporta(slot: number): void {
    const letto = leggiSlot(archivioDelBrowser(), slot);
    if (!letto.ok) return;
    scaricaFile(nomeFileEsportazione(letto.salvataggio), testoSalvataggio(letto.salvataggio));
    this.messaggio.setText(`Salvataggio dello slot ${slot} esportato`).setColor('#8fe08f');
  }

  private importa(s: StatoSlot): void {
    const procedi = () =>
      scegliFile((testo) => {
        const letto = leggiSalvataggio(testo);
        if (!letto.ok) {
          this.vai('carica', `Importazione non riuscita: ${letto.errore}`);
          return;
        }
        const scritto = scriviSlot(archivioDelBrowser(), s.slot, letto.salvataggio);
        this.vai('carica', scritto.ok ? `Importato nello slot ${s.slot}` : scritto.errore);
        if (scritto.ok) this.messaggio.setColor('#8fe08f');
      });
    if (s.stato === 'vuoto') procedi();
    else chiediConferma(this, `Importare nello slot ${s.slot}? Il salvataggio che c'è ora verrà sostituito.`, 'Importa', procedi);
  }

  private elimina(s: StatoSlot): void {
    chiediConferma(this, `Eliminare per sempre lo slot ${s.slot}?`, 'Elimina', () => {
      eliminaSlot(archivioDelBrowser(), s.slot);
      this.vai('carica', `Slot ${s.slot} eliminato`);
    });
  }

  private apriOpzioni(): void {
    this.scene.launch(SCENA_OPZIONI, { torna: SCENA_MENU });
    this.scene.pause();
  }

  // ---- decorazione ----

  /** Una quercia e la luna fatte di cerchi (la pixel art arriva nella 9b). */
  private disegnaSfondo(): void {
    const g = this.add.graphics();
    this.contenuto.add(g);
    g.fillStyle(0x1f2a1f, 1);
    g.fillRect(0, ALTEZZA_SCHERMO - 60, this.scale.width, 60); // prato

    const xAlbero = Math.max(80, this.cx - 350);
    g.fillStyle(0x5a3d22, 1);
    g.fillRect(xAlbero - 13, 330, 26, 150); // tronco
    g.fillStyle(0x2f5d3a, 1);
    for (const [dx, y, r] of [[0, 300, 62], [-41, 330, 44], [41, 330, 44], [0, 250, 46]] as const) {
      g.fillCircle(xAlbero + dx, y, r);
    }

    const xLuna = Math.min(this.scale.width - 130, this.cx + 350);
    g.fillStyle(0xe8e0c0, 1);
    g.fillCircle(xLuna, 90, 30); // la luna
    g.fillStyle(0x141a24, 1);
    g.fillCircle(xLuna + 12, 82, 26); // …che diventa una falce
    this.contenuto.add(this.add.text(this.cx, 104, 'Un gioco di ruolo', { ...STILE_TESTO, fontSize: '15px', color: '#9aa7b8' }).setOrigin(0.5));
  }
}

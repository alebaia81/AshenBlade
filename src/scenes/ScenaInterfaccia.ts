// Interfaccia in sovrimpressione (HUD). È una scena separata che gira SOPRA
// la scena del mondo: non scorre con la telecamera e non subisce lo zoom,
// come un elemento con position: fixed sopra una pagina che scorre.
// Non chiede nulla al mondo: ascolta il registro condiviso e ridisegna.

import * as Phaser from 'phaser';
import {
  ALTEZZA_BARRA_BASSA,
  ALTEZZA_SCHERMO,
  CHIAVE_AVVISO,
  CHIAVE_MESSAGGIO,
  CHIAVE_NOME_MAPPA,
  CHIAVE_PARTITA,
  LARGHEZZA_SCHERMO,
  SCENA_INTERFACCIA,
  SCENA_MONDO, CHIAVE_BOSS } from '../costanti';
import type { DatiGioco } from '../data/caricaDati';
import { avanzamento } from '../systems/livelli';
import type { Partita } from '../systems/partita';
import { cosaFa, NUMERO_PREFERITI } from '../systems/preferiti';
import {
  iconaAbilita,
  iconaArmaAssente,
  iconaCapriola,
  iconaCompagno,
  iconaDischetto,
  iconaIngranaggio,
  iconaMappa,
  iconaMenu,
  iconaDaDisegno,
  iconaPergamena,
  iconaRitratto,
  iconaZaino,
  type DisegnaIcona,
} from './interfaccia/icone';
import { disegnaOggetto } from './interfaccia/iconeOggetti';
import { Minimappa } from './interfaccia/Minimappa';
import { Pulsante } from './interfaccia/Pulsante';
import { LATO_SPAZIO, SpazioBarra } from './interfaccia/SpazioBarra';
import type { ScenaMondo } from './ScenaMondo';
import { leggiPartita, mostraAvviso, type Avviso } from './statoCondiviso';
import { suoni } from '../audio/Suoni';

const VITA = { x: 12, y: 46, larghezza: 180, altezza: 14 };
/**
 * Barra in basso (design §13): a sinistra 4 azioni fisse (capriola, abilità,
 * arma secondaria, compagno), a destra i 6 preferiti. Quadrati da 44 ogni 52 px.
 */
const BARRA_BASSA = { altezza: ALTEZZA_BARRA_BASSA, distanza: 52, stacco: 40 };
/** Centro x dello spazio "i" (0–3 azioni, 4–9 preferiti): tutto centrato nello schermo. */
export function xSpazioBarra(i: number): number {
  const larghezza = 10 * BARRA_BASSA.distanza + BARRA_BASSA.stacco;
  const inizio = (LARGHEZZA_SCHERMO - larghezza) / 2 + BARRA_BASSA.distanza / 2;
  return inizio + i * BARRA_BASSA.distanza + (i >= 4 ? BARRA_BASSA.stacco : 0);
}
/** Nomi brevi degli effetti a tempo, per l'elenco sotto le barre. */
const NOMI_EFFETTI: Record<string, string> = { forza: 'Forza', resistenza: 'Resistenza' };
/** Icone in alto a destra, da destra verso sinistra. */
const DISTANZA_ICONE = 52;
const MANA = { x: 12, y: 64, larghezza: 180, altezza: 10 };
/** La barra dell'esperienza scende sotto quella del mana per le classi che lo usano. */
const ESPERIENZA_SENZA_MANA = { x: 12, y: 66, larghezza: 180, altezza: 6 };
const ESPERIENZA_CON_MANA = { x: 12, y: 80, larghezza: 180, altezza: 6 };

export class ScenaInterfaccia extends Phaser.Scene {
  private capriola!: SpazioBarra;
  private abilita!: SpazioBarra;
  private secondaria!: SpazioBarra;
  private compagno!: SpazioBarra;
  private preferiti: SpazioBarra[] = [];
  private effetti!: Phaser.GameObjects.Text;
  private dischetto!: Pulsante;
  private minimappa!: Minimappa;

  constructor(private readonly dati: DatiGioco) {
    super(SCENA_INTERFACCIA);
  }

  create(): void {
    const nomeMappa = this.add.text(12, 10, '', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#00000099',
      padding: { x: 8, y: 4 },
    });

    // La classe non cambia durante la partita: la leggiamo una volta per decidere la disposizione.
    const conMana = leggiPartita(this).mana.massima > 0;
    const ESPERIENZA = conMana ? ESPERIENZA_CON_MANA : ESPERIENZA_SENZA_MANA;
    const barraVita = this.creaBarra(VITA, 0xd94a4a);
    const barraEsperienza = this.creaBarra(ESPERIENZA, 0x5fb3f0);
    const stileNumeri = { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff', stroke: '#000000', strokeThickness: 3 };
    const numeriVita = this.add.text(VITA.x + VITA.larghezza + 8, VITA.y - 2, '', stileNumeri);
    const barraMana = conMana ? this.creaBarra(MANA, 0x4a7df0) : null;
    const numeriMana = conMana ? this.add.text(MANA.x + MANA.larghezza + 8, MANA.y - 3, '', { ...stileNumeri, fontSize: '13px' }) : null;
    const livello = this.add.text(ESPERIENZA.x + ESPERIENZA.larghezza + 8, ESPERIENZA.y - 3, '', { ...stileNumeri, fontSize: '13px' });

    // Icone in alto a destra: si cliccano, come nel design §13.
    // Quelle delle fasi future si vedono già, spente: l'interfaccia non si sposterà più.
    const mondo = () => this.scene.get(SCENA_MONDO) as ScenaMondo;
    const icone = [
      { icona: iconaRitratto, suggerimento: 'Scheda del personaggio (C)', alClic: () => mondo().apriScheda() },
      { icona: iconaZaino, suggerimento: 'Zaino (I)', alClic: () => mondo().apriInventario() },
      { icona: iconaPergamena, suggerimento: 'Registro delle quest (L)', alClic: () => mondo().apriRegistro() },
      { icona: this.iconaDelDischetto(), suggerimento: 'Salva (F2)', alClic: () => this.salva() },
      { icona: iconaIngranaggio, suggerimento: 'Modalità sviluppatore (F8)', alClic: () => mondo().alternaSviluppatore() },
      { icona: iconaMenu, suggerimento: 'Pausa e menu (Esc)', alClic: () => mondo().apriPausa() },
      { icona: iconaMappa, suggerimento: 'Mappa: Zona / Valle / Grande (M)', alClic: () => this.minimappa.alternaModalita() },
    ];
    icone.forEach((voce, i) => {
      const pulsante = new Pulsante(this, LARGHEZZA_SCHERMO - 30 - i * DISTANZA_ICONE, 30, {
        larghezza: 44,
        altezza: 44,
        icona: voce.icona,
        suggerimento: voce.suggerimento,
        alClic: voce.alClic ?? (() => {}),
      });
      if (voce.suggerimento.startsWith('Salva')) this.dischetto = pulsante;
    });
    // F2 lo ascolta l'interfaccia, che resta attiva anche quando il mondo è in pausa:
    // si può salvare in qualsiasi momento (§12), anche con lo zaino aperto.
    this.input.keyboard?.on('keydown-F2', () => this.salva());
    // Pallino giallo sul ritratto quando ci sono punti da assegnare.
    const pallino = this.add.circle(LARGHEZZA_SCHERMO - 12, 12, 7, 0xffd23f).setStrokeStyle(2, 0x000000).setDepth(2);

    this.creaBarraBassa(mondo);
    this.minimappa = new Minimappa(this);
    // Monete: un'icona e il numero, sotto le barre.
    const yMonete = ESPERIENZA.y + 20;
    const iconaMonete = this.add.graphics({ x: 22, y: yMonete });
    disegnaOggetto(iconaMonete, this.dati.oggetti['monete']!, 18);
    const monete = this.add.text(36, yMonete - 9, '', { ...stileNumeri, fontSize: '15px', color: '#ffe680' });
    // Effetti a tempo attivi (pozioni di forza, resistenza) con i secondi che restano.
    this.effetti = this.add.text(12, yMonete + 16, '', { ...stileNumeri, fontSize: '13px', color: '#ffe680' });

    const messaggio = this.add
      .text(LARGHEZZA_SCHERMO / 2, ALTEZZA_SCHERMO / 2, '', {
        fontFamily: 'monospace',
        fontSize: '40px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    const avviso = this.add
      // In basso al centro: in alto ci sono già nome della mappa, barre e pannelli.
      .text(LARGHEZZA_SCHERMO / 2, ALTEZZA_SCHERMO - 90, '', {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: '#ffe680',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center',
        wordWrap: { width: 640 },
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // La barra del boss (fase 8a): in alto al centro, visibile solo durante lo scontro.
    const LARGHEZZA_BOSS = 280;
    const xBoss = LARGHEZZA_SCHERMO / 2 - LARGHEZZA_BOSS / 2;
    const fondoBoss = this.add.rectangle(xBoss, 66, LARGHEZZA_BOSS, 12, 0x1a0a0a).setOrigin(0, 0.5).setStrokeStyle(2, 0x000000);
    const barraBoss = this.add.rectangle(xBoss + 2, 66, LARGHEZZA_BOSS - 4, 8, 0xb02a6a).setOrigin(0, 0.5);
    const nomeBoss = this.add.text(LARGHEZZA_SCHERMO / 2, 57, '', { ...stileNumeri, fontSize: '14px', color: '#f0c8ff' }).setOrigin(0.5, 1);
    const parteBoss = [fondoBoss, barraBoss, nomeBoss];

    // Ogni "mostra" riceve il valore dal registro e aggiorna il disegno.
    const mostra: Record<string, (valore: unknown) => void> = {
      [CHIAVE_NOME_MAPPA]: (v) => nomeMappa.setText(String(v ?? '')),
      [CHIAVE_MESSAGGIO]: (v) => messaggio.setText(String(v ?? '')),
      [CHIAVE_BOSS]: (v) => {
        const b = v as { nome: string; vita: number; massima: number } | null | undefined;
        for (const o of parteBoss) o.setVisible(!!b);
        if (!b) return;
        nomeBoss.setText(b.nome);
        barraBoss.width = (LARGHEZZA_BOSS - 4) * Math.max(0, b.vita / b.massima);
      },
      [CHIAVE_PARTITA]: (v) => {
        const partita = v as Partita | undefined;
        if (!partita) return;
        const { attuale, massima } = partita.vita;
        barraVita.width = (VITA.larghezza - 4) * (attuale / massima);
        numeriVita.setText(`${attuale}/${massima}`);
        if (barraMana && numeriMana && partita.mana.massima > 0) {
          barraMana.width = (MANA.larghezza - 4) * (partita.mana.attuale / partita.mana.massima);
          numeriMana.setText(`${Math.floor(partita.mana.attuale)}/${partita.mana.massima}`);
        }
        const progresso = avanzamento(partita.esperienza, this.dati.soglieLivelli);
        const frazione = progresso.perIlProssimo > 0 ? progresso.nelLivello / progresso.perIlProssimo : 1;
        barraEsperienza.width = (ESPERIENZA.larghezza - 4) * frazione;
        livello.setText(`Liv. ${progresso.livello}`);
        pallino.setVisible(partita.puntiDaAssegnare > 0);
        monete.setText(String(partita.monete));
        this.aggiornaPreferiti(partita);
      },
      [CHIAVE_AVVISO]: (v) => {
        const a = v as Avviso | undefined;
        if (!a) return;
        // L'avviso compare, resta un po' e svanisce: una tween con "hold".
        this.tweens.killTweensOf(avviso);
        avviso.setText(a.testo).setAlpha(1);
        this.tweens.add({ targets: avviso, alpha: 0, delay: 2500, duration: 600 });
      },
    };

    for (const [chiave, funzione] of Object.entries(mostra)) {
      if (chiave !== CHIAVE_AVVISO) funzione(this.registry.get(chiave));
      // "changedata-<chiave>" scatta ogni volta che quella chiave del registro cambia.
      const evento = `changedata-${chiave}`;
      const ascoltatore = (_: unknown, valore: unknown) => funzione(valore);
      this.registry.events.on(evento, ascoltatore);
      // Puliamo l'ascoltatore quando la scena si chiude, per non lasciarne di "orfani".
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.registry.events.off(evento, ascoltatore));
    }
  }

  /** Il dischetto in pixel art (sprite.json); se manca, quello a forme delle fasi precedenti. */
  private iconaDelDischetto(): DisegnaIcona {
    const img = this.dati.sprite.immagini['dischetto'];
    return img && 'disegno' in img ? iconaDaDisegno(img.disegno, img.tavolozza) : iconaDischetto;
  }

  /**
   * Il dischetto (§12): salva, lo fa "girare" (si stringe e si riallarga due
   * volte, come una moneta che ruota), fa "bip" e mostra l'esito.
   */
  salva(): void {
    const esito = (this.scene.get(SCENA_MONDO) as ScenaMondo).salvaPartita();
    this.tweens.killTweensOf(this.dischetto);
    this.dischetto.setScale(1);
    if (esito.ok) {
      this.tweens.add({ targets: this.dischetto, scaleX: 0, duration: 110, yoyo: true, repeat: 1 });
      suoni.effetto('bip');
    }
    mostraAvviso(this, esito.messaggio);
  }

  /** A ogni fotogramma: le ricariche di capriola, abilità e arma secondaria (chieste al mondo, che le conosce). */
  update(): void {
    const mondo = this.scene.get(SCENA_MONDO) as ScenaMondo;
    if (!this.scene.isActive(SCENA_MONDO) && !this.scene.isPaused(SCENA_MONDO)) return;
    this.capriola.impostaRicarica(mondo.frazioneRicaricaCapriola());
    const abilita = mondo.statoPulsanteAbilita();
    this.abilita.impostaRicarica(abilita.frazione);
    // Senza mana lo spazio resta cliccabile (ti dice "mana!") ma è più scuro.
    this.abilita.impostaSpento(!abilita.manaSufficiente);
    // Col mirino attivo il bordo è giallo: il prossimo clic sceglie il bersaglio.
    this.abilita.impostaEvidenziato(abilita.inMira ? 'mira' : null);

    const sec = mondo.statoPulsanteSecondaria();
    const idSec = leggiPartita(this).equipaggiamento.secondaria;
    const oggettoSec = idSec ? this.dati.oggetti[idSec] : undefined;
    this.secondaria
      .impostaIcona(idSec ?? '-', oggettoSec ? (g, lato) => disegnaOggetto(g, oggettoSec, lato) : iconaArmaAssente)
      .impostaSuggerimento(sec.nome ? `${sec.nome} · K\nclic qui, poi sul bersaglio` : 'Arma secondaria: nessuna\n(sceglila dalla scheda o dallo zaino)')
      .impostaRicarica(sec.frazione)
      .impostaEvidenziato(sec.inMira ? 'mira' : null)
      .impostaSpento(!sec.nome);
    this.minimappa.aggiorna(mondo, this.time.now);
    // Il compagno: la sua figura, la ricarica dell'abilità, spento se assente o al tappeto.
    const c = mondo.statoPulsanteCompagno();
    if (!c) {
      this.compagno.impostaIcona('nessuno', iconaCompagno).impostaRicarica(0).impostaSpento(true);
      this.compagno.impostaSuggerimento('Compagno: nessuno\nIngaggialo da Tobia, alla taverna');
    } else {
      const colore = parseInt(c.colore.replace('#', ''), 16);
      this.compagno.impostaIcona(c.id, (g, lato) => {
        const u = lato / 10;
        g.fillStyle(colore, 1).fillRoundedRect(-3 * u, 0, 6 * u, 4.5 * u, 1.2 * u);
        g.fillStyle(0xf0d2b0, 1).fillCircle(0, -2 * u, 2 * u);
      });
      this.compagno.impostaRicarica(c.frazione).impostaSpento(c.alTappeto);
      this.compagno.impostaSuggerimento(`${c.nome} · Q\n${c.abilita}: ${c.descrizione}${c.alTappeto ? '\nAl tappeto: si rialza a fine combattimento' : ''}`);
    }
    this.effetti.setText(mondo.effettiAttivi().map((e) => `${NOMI_EFFETTI[e.tipo] ?? e.tipo} +${e.valore} · ${e.secondi} s`).join('\n'));
  }

  private creaBarraBassa(mondo: () => ScenaMondo): void {
    const y = ALTEZZA_SCHERMO - BARRA_BASSA.altezza / 2;
    // Lo sfondo è interattivo: un clic sulla barra non deve far camminare l'eroe.
    this.add
      .rectangle(LARGHEZZA_SCHERMO / 2, y, LARGHEZZA_SCHERMO, BARRA_BASSA.altezza, 0x10141c, 0.85)
      .setInteractive();
    const abilita = this.dati.classi[leggiPartita(this).personaggio.classe]!.abilita;
    const costo = abilita.costoMana > 0 ? ` · ${abilita.costoMana} mana` : '';
    const spazio = (i: number, tasto: string, icona: DisegnaIcona, suggerimento: string, alClic: () => void) =>
      new SpazioBarra(this, xSpazioBarra(i), y, tasto, alClic).impostaIcona('fissa', icona).impostaSuggerimento(suggerimento);

    this.capriola = spazio(0, '', iconaCapriola, 'Capriola\nclic destro nel mondo · Spazio', () => mondo().capriola());
    this.abilita = spazio(1, 'E', iconaAbilita, `${abilita.nome}${costo} · E\n${abilita.descrizione}`, () => mondo().attivaAbilita());
    this.secondaria = spazio(2, 'K', iconaArmaAssente, '', () => mondo().attivaSecondaria());
    this.compagno = spazio(3, 'Q', iconaCompagno, '', () => mondo().usaAbilitaCompagno());

    // Una lineetta separa le azioni fisse dai preferiti.
    const xSeparatore = (xSpazioBarra(3) + xSpazioBarra(4)) / 2;
    this.add.rectangle(xSeparatore, y, 2, LATO_SPAZIO - 8, 0x4a5568);
    this.preferiti = Array.from({ length: NUMERO_PREFERITI }, (_, i) =>
      new SpazioBarra(this, xSpazioBarra(4 + i), y, String(i + 1), () => mondo().usaPreferito(i)),
    );
    this.aggiornaPreferiti(leggiPartita(this));
  }

  /** I 6 preferiti cambiano solo quando cambia la Partita (non a ogni fotogramma). */
  private aggiornaPreferiti(partita: Partita): void {
    const tipoDi = (id: string) => this.dati.oggetti[id]?.tipo;
    this.preferiti.forEach((spazio, i) => {
      const azione = cosaFa(partita.preferiti, i, partita.inventario, partita.equipaggiamento, tipoDi);
      if (azione.tipo === 'vuoto') {
        spazio.impostaIcona('', null).impostaQuantita('').impostaSpento(false).impostaEvidenziato(null);
        spazio.impostaSuggerimento(`Spazio ${i + 1} vuoto\nTrascinaci una pozione o un'arma dallo zaino`);
        return;
      }
      const oggetto = this.dati.oggetti[azione.id];
      spazio.impostaIcona(azione.id, oggetto ? (g, lato) => disegnaOggetto(g, oggetto, lato) : null);
      if (azione.tipo === 'pozione') {
        spazio.impostaQuantita(String(azione.quantita)).impostaSpento(azione.quantita === 0).impostaEvidenziato(null);
        spazio.impostaSuggerimento(`${oggetto?.nome ?? azione.id} · ${i + 1}`);
      } else {
        const presente = azione.inMano || azione.indiceZaino >= 0;
        spazio.impostaQuantita('').impostaSpento(!presente).impostaEvidenziato(azione.inMano ? 'inMano' : null);
        spazio.impostaSuggerimento(`${oggetto?.nome ?? azione.id} · ${i + 1}\n${azione.inMano ? 'in mano' : presente ? 'clic per impugnarla' : 'non è nello zaino'}`);
      }
    });
  }

  /** Sfondo + riempimento: restituisce il riempimento, la cui larghezza segue il valore. */
  private creaBarra(
    misure: { x: number; y: number; larghezza: number; altezza: number },
    colore: number,
  ): Phaser.GameObjects.Rectangle {
    this.add
      .rectangle(misure.x, misure.y, misure.larghezza, misure.altezza, 0x000000, 0.6)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0xffffff, 0.8);
    return this.add
      .rectangle(misure.x + 2, misure.y + 2, misure.larghezza - 4, misure.altezza - 4, colore)
      .setOrigin(0, 0);
  }
}

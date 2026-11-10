// Scheda del personaggio. Si apre sopra il mondo, che nel frattempo è in
// PAUSA: niente update, niente fisica, niente tempo che scorre.
// Due schede (come le "tab" di una pagina web):
// - Caratteristiche: si assegnano i punti guadagnati salendo di livello;
// - Equipaggiamento: armi e armature. Le armature si cambiano SOLO qui (design §8),
//   e non mentre un nemico ti vede.

import * as Phaser from 'phaser';
import { ALTEZZA_SCHERMO, LARGHEZZA_SCHERMO, SCENA_MONDO, SCENA_SCHEDA } from '../costanti';
import datiEroe from '../data/eroe.json';
import type { DatiGioco } from '../data/caricaDati';
import { modificatore, NOMI_CARATTERISTICHE, type NomeCaratteristica } from '../systems/caratteristiche';
import {
  armaturaTotale,
  bonusCaratteristiche,
  SPAZI_EQUIPAGGIAMENTO,
  type SpazioEquipaggiamento,
} from '../systems/equipaggiamento';
import { avanzamento } from '../systems/livelli';
import { colorePerRarita } from '../systems/oggetti';
import { assegnaPuntoPartita, caratteristicheTotali } from '../systems/partita';
import { dannoBaseArma } from '../systems/combattimento';
import { modificatoreArma, probabilitaCriticoDi, ricaricaSchivata } from '../systems/personaggio';
import { righeOggetto } from './interfaccia/descrizioni';
import { disegnaOggetto } from './interfaccia/iconeOggetti';
import { Pulsante } from './interfaccia/Pulsante';
import { conSegno, DESCRIZIONE_CARATTERISTICA, NOMI_SPAZI, STILE_TESTO, STILE_TITOLO } from './interfaccia/testi';
import type { ScenaMondo } from './ScenaMondo';
import { leggiPartita, scriviPartita } from './statoCondiviso';

const PANNELLO = { larghezza: 680, altezza: 470 };
const RIGA_SPAZIO = 50;
const numero = (colore: string) => parseInt(colore.replace('#', ''), 16);

type Scheda = 'caratteristiche' | 'equipaggiamento';

export class ScenaScheda extends Phaser.Scene {
  private intestazione!: Phaser.GameObjects.Text;
  private derivati!: Phaser.GameObjects.Text;
  private righe!: Record<NomeCaratteristica, { valore: Phaser.GameObjects.Text; piu: Pulsante }>;
  /** Ogni scheda è un Container: nasconderlo nasconde (e disattiva) tutto ciò che contiene. */
  private paginaCaratteristiche!: Phaser.GameObjects.Container;
  private paginaEquipaggiamento!: Phaser.GameObjects.Container;
  private schede!: Record<Scheda, Pulsante>;
  private spazioScelto: SpazioEquipaggiamento | null = null;
  private messaggio = '';
  /** Deciso all'apertura: il mondo è in pausa, i nemici non si muovono finché la scheda è aperta. */
  private bloccata = false;
  private sinistra = 0;
  private alto = 0;

  constructor(private readonly dati: DatiGioco) {
    super(SCENA_SCHEDA);
  }

  /** La scheda può essere aperta direttamente su una pagina (es. dallo zaino). */
  create(dati: { scheda?: Scheda } = {}): void {
    const cx = LARGHEZZA_SCHERMO / 2;
    const cy = ALTEZZA_SCHERMO / 2;
    this.sinistra = cx - PANNELLO.larghezza / 2;
    this.alto = cy - PANNELLO.altezza / 2;
    this.spazioScelto = null;
    this.messaggio = '';
    this.bloccata = this.mondo.inCombattimento();

    // Velo scuro su tutto lo schermo: è interattivo così "assorbe" i clic
    // e non li lascia passare al gioco sotto (come un overlay modale).
    this.add.rectangle(cx, cy, LARGHEZZA_SCHERMO, ALTEZZA_SCHERMO, 0x000000, 0.55).setInteractive();
    this.add.rectangle(cx, cy, PANNELLO.larghezza, PANNELLO.altezza, 0x1b2230, 0.97).setStrokeStyle(2, 0x9aa7b8);
    this.intestazione = this.add.text(this.sinistra + 24, this.alto + 18, '', { ...STILE_TITOLO, fontSize: '18px', lineSpacing: 6 });

    this.schede = {
      caratteristiche: new Pulsante(this, this.sinistra + 470, this.alto + 32, {
        larghezza: 132, altezza: 34, testo: 'Caratteristiche', dimensioneTesto: 14, alClic: () => this.mostra('caratteristiche'),
      }),
      equipaggiamento: new Pulsante(this, this.sinistra + 608, this.alto + 32, {
        larghezza: 132, altezza: 34, testo: 'Equipaggiamento', dimensioneTesto: 14, alClic: () => this.mostra('equipaggiamento'),
      }),
    };
    this.paginaCaratteristiche = this.add.container(0, 0);
    this.paginaEquipaggiamento = this.add.container(0, 0);
    this.creaCaratteristiche();

    new Pulsante(this, cx + PANNELLO.larghezza / 2 - 90, this.alto + PANNELLO.altezza - 34, {
      larghezza: 150,
      altezza: 40,
      testo: 'Chiudi (C)',
      alClic: () => this.chiudi(),
    });
    this.input.keyboard?.on('keydown-C', () => this.chiudi());
    this.input.keyboard?.on('keydown-ESC', () => this.chiudi());
    this.mostra(dati.scheda ?? 'caratteristiche');
  }

  private get mondo(): ScenaMondo {
    return this.scene.get(SCENA_MONDO) as ScenaMondo;
  }

  private mostra(scheda: Scheda): void {
    this.paginaCaratteristiche.setVisible(scheda === 'caratteristiche');
    this.paginaEquipaggiamento.setVisible(scheda === 'equipaggiamento');
    this.schede.caratteristiche.impostaSelezionato(scheda === 'caratteristiche');
    this.schede.equipaggiamento.impostaSelezionato(scheda === 'equipaggiamento');
    this.aggiorna();
  }

  // ---- scheda "Caratteristiche" ----

  private creaCaratteristiche(): void {
    const { sinistra, alto } = this;
    const pagina = this.paginaCaratteristiche;
    const righe = {} as typeof this.righe;
    NOMI_CARATTERISTICHE.forEach((nome, i) => {
      const y = alto + 140 + i * 40;
      const d = DESCRIZIONE_CARATTERISTICA[nome];
      pagina.add(this.add.text(sinistra + 24, y - 10, `${nome}  ${d.nome}`, { ...STILE_TESTO, fontStyle: 'bold' }));
      pagina.add(this.add.text(sinistra + 24, y + 8, d.effetto, { ...STILE_TESTO, fontSize: '12px', color: '#9aa7b8' }));
      const valore = this.add.text(sinistra + 290, y, '', { ...STILE_TESTO, fontSize: '18px' }).setOrigin(0.5);
      const piu = new Pulsante(this, sinistra + 360, y, { larghezza: 34, altezza: 30, testo: '+', alClic: () => this.assegna(nome) });
      pagina.add([valore, piu]);
      righe[nome] = { valore, piu };
    });
    this.righe = righe;
    this.derivati = this.add.text(sinistra + 410, alto + 128, '', { ...STILE_TESTO, lineSpacing: 10 });
    pagina.add(this.derivati);
  }

  private assegna(nome: NomeCaratteristica): void {
    const partita = leggiPartita(this);
    if (partita.puntiDaAssegnare <= 0) return;
    const bonus = bonusCaratteristiche(partita.equipaggiamento, this.dati.indossabili);
    scriviPartita(this, assegnaPuntoPartita(partita, nome, this.dati.classi[partita.personaggio.classe]!, bonus));
    this.aggiorna();
  }

  // ---- scheda "Equipaggiamento" ----

  /** Si ricostruisce tutta a ogni cambiamento: sono poche decine di oggetti. */
  private disegnaEquipaggiamento(): void {
    const { sinistra, alto } = this;
    const pagina = this.paginaEquipaggiamento;
    pagina.removeAll(true);
    const partita = leggiPartita(this);
    const equip = partita.equipaggiamento;

    pagina.add(this.add.text(sinistra + 24, alto + 100, `Armatura totale: ${armaturaTotale(equip, this.dati.indossabili)}`, { ...STILE_TESTO, fontStyle: 'bold' }));
    SPAZI_EQUIPAGGIAMENTO.forEach((spazio, i) => {
      const y = alto + 150 + i * RIGA_SPAZIO;
      const id = equip[spazio];
      const oggetto = id ? this.dati.oggetti[id] : undefined;
      const scelto = spazio === this.spazioScelto;
      const sfondo = this.add.rectangle(sinistra + 24 + 150, y, 300, RIGA_SPAZIO - 6, scelto ? 0x3e4a5c : 0x10141c);
      sfondo.setStrokeStyle(scelto ? 3 : 2, oggetto ? numero(colorePerRarita(oggetto.rarita)) : 0x4a5568);
      sfondo.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.scegliSpazio(spazio));
      pagina.add(sfondo);
      if (oggetto) {
        const icona = this.add.graphics({ x: sinistra + 46, y });
        disegnaOggetto(icona, oggetto, 34);
        pagina.add(icona);
      }
      pagina.add(this.add.text(sinistra + 72, y - 18, NOMI_SPAZI[spazio]!, { ...STILE_TESTO, fontSize: '12px', color: '#9aa7b8' }));
      pagina.add(
        this.add.text(sinistra + 72, y - 2, oggetto?.nome ?? '— vuoto —', {
          ...STILE_TESTO,
          fontSize: '15px',
          color: oggetto ? colorePerRarita(oggetto.rarita) : '#6b7686',
        }),
      );
    });
    this.disegnaScelta(pagina);
  }

  /** A destra: cosa si può mettere nello spazio scelto (oggetti adatti nello zaino). */
  private disegnaScelta(pagina: Phaser.GameObjects.Container): void {
    const x = this.sinistra + 360;
    const alto = this.alto;
    const testo = (y: number, contenuto: string, stile: Phaser.Types.GameObjects.Text.TextStyle = {}) =>
      pagina.add(this.add.text(x, y, contenuto, { ...STILE_TESTO, wordWrap: { width: 300 }, ...stile }));
    const spazio = this.spazioScelto;
    if (!spazio) {
      testo(alto + 110, 'Clicca uno spazio a sinistra per cambiare arma o armatura.', { color: '#9aa7b8' });
      if (this.messaggio) testo(alto + 370, this.messaggio, { color: '#ffe680', fontSize: '14px' });
      return;
    }
    const partita = leggiPartita(this);
    const èArmatura = spazio !== 'primaria' && spazio !== 'secondaria';
    testo(alto + 96, NOMI_SPAZI[spazio]!, { fontStyle: 'bold', fontSize: '17px' });
    const id = partita.equipaggiamento[spazio];
    if (id) testo(alto + 128, righeOggetto(id, this.dati).filter((r) => r !== '').slice(0, 3).join('\n'), { fontSize: '12px', color: '#c8c8c8', wordWrap: { width: 290 } });

    if (èArmatura && this.bloccata) {
      testo(alto + 200, 'Non durante un combattimento: allontanati dai nemici per cambiare armatura.', { color: '#ff9a9a' });
      return;
    }
    // Gli oggetti dello zaino che vanno in questo spazio (per primaria e secondaria, QUALSIASI arma).
    const adatti = partita.inventario.spazi
      .map((pila, indice) => ({ pila, indice }))
      .filter(({ pila }) => {
        if (!pila) return false;
        const voce = this.dati.indossabili[pila.id];
        if (!voce) return false;
        return èArmatura ? voce.spazio === spazio : voce.categoria === 'arma';
      })
      .sort((a, b) => {
        if (èArmatura) return 0;
        const aProprio = this.dati.indossabili[a.pila!.id]?.spazio === spazio ? 0 : 1;
        const bProprio = this.dati.indossabili[b.pila!.id]?.spazio === spazio ? 0 : 1;
        return aProprio - bProprio;
      })
      .slice(0, 4);
    testo(alto + 196, adatti.length > 0 ? 'Dallo zaino:' : 'Nello zaino non hai niente per questo spazio.', { fontSize: '13px', color: '#9aa7b8' });
    adatti.forEach(({ pila, indice }, i) => {
      const oggetto = this.dati.oggetti[pila!.id]!;
      const p = new Pulsante(this, x + 150, alto + 236 + i * 34, {
        larghezza: 300,
        altezza: 30,
        testo: oggetto.nome,
        dimensioneTesto: 14,
        alClic: () => {
          this.messaggio = this.mondo.indossaDaZaino(indice, 0, èArmatura ? undefined : spazio);
          this.aggiorna();
        },
      });
      // Il bordo del pulsante ha il colore della rarità, come nello zaino.
      (p.list[0] as Phaser.GameObjects.Rectangle).setStrokeStyle(2, numero(colorePerRarita(oggetto.rarita)));
      pagina.add(p);
    });
    if (!èArmatura && partita.equipaggiamento.secondaria) {
      pagina.add(
        new Pulsante(this, x + 235, alto + 76, {
          larghezza: 120,
          altezza: 28,
          testo: 'Scambia 1ª ↔ 2ª',
          dimensioneTesto: 12,
          alClic: () => {
            this.messaggio = this.mondo.scambiaArmiEquipaggiate();
            this.aggiorna();
          },
        }),
      );
    }
    if (id && spazio !== 'primaria') {
      pagina.add(
        new Pulsante(this, x + 245, alto + 112, {
          larghezza: 100,
          altezza: 30,
          testo: 'Togli',
          alClic: () => {
            this.messaggio = this.mondo.togliEquipaggiamento(spazio);
            this.aggiorna();
          },
        }),
      );
    }
    if (this.messaggio) testo(alto + 370, this.messaggio, { color: '#ffe680', fontSize: '14px' });
  }

  private scegliSpazio(spazio: SpazioEquipaggiamento): void {
    this.spazioScelto = this.spazioScelto === spazio ? null : spazio;
    this.messaggio = '';
    this.aggiorna();
  }

  private chiudi(): void {
    this.scene.stop();
    // resume fa ripartire il mondo esattamente da dove si era fermato.
    this.scene.resume(SCENA_MONDO);
  }

  private aggiorna(): void {
    const partita = leggiPartita(this);
    const { personaggio } = partita;
    const classe = this.dati.classi[personaggio.classe]!;
    const arma = this.dati.armi[partita.equipaggiamento.primaria!]!;
    const base = personaggio.caratteristiche;
    const car = caratteristicheTotali(partita, this.dati.indossabili);
    const progresso = avanzamento(partita.esperienza, this.dati.soglieLivelli);
    const esperienza =
      progresso.perIlProssimo > 0
        ? `Esperienza: ${progresso.nelLivello} / ${progresso.perIlProssimo} per il livello ${progresso.livello + 1}`
        : 'Esperienza: livello massimo';

    this.intestazione.setText(
      [
        `${personaggio.nome} — ${classe.nome}, livello ${personaggio.livello}`,
        `${esperienza}`,
        partita.puntiDaAssegnare > 0 ? `Punti da assegnare: ${partita.puntiDaAssegnare}` : 'Nessun punto da assegnare',
      ].join('\n'),
    );

    for (const nome of NOMI_CARATTERISTICHE) {
      // Il bonus dei pezzi leggendari si vede a parte: "15 +1 (+3)".
      const extra = car[nome] - base[nome];
      const testoBonus = extra !== 0 ? ` ${conSegno(extra)}` : '';
      this.righe[nome].valore.setText(`${base[nome]}${testoBonus} (${conSegno(modificatore(car[nome]))})`);
      this.righe[nome].valore.setColor(extra !== 0 ? '#b46bff' : '#e8e8e8');
      this.righe[nome].piu.impostaAttivo(partita.puntiDaAssegnare > 0);
    }

    const secondi = (ms: number) => `${(ms / 1000).toFixed(2).replace('.', ',')} s`;
    const dBase = dannoBaseArma(arma, arma.potenziamento ?? 0);
    const modArma = modificatoreArma(arma, car);
    const dannoTotale = dBase + modArma;
    this.derivati.setText(
      [
        `Vita: ${partita.vita.attuale} / ${partita.vita.massima}`,
        `Arma: ${arma.nome}`,
        `Danno: ${dannoTotale} [Base ${dBase} (Liv. ${(arma.potenziamento ?? 0) + 1}) ${conSegno(modArma)} ${arma.caratteristica}]`,
        `Critico: ${Math.round(probabilitaCriticoDi(arma, car) * 100)}%`,
        `Armatura: ${datiEroe.armatura + armaturaTotale(partita.equipaggiamento, this.dati.indossabili)}`,
        `Ricarica capriola: ${secondi(ricaricaSchivata(datiEroe.schivata.ricaricaBaseMs, car))}`,
        '',
        `Abilità: ${classe.abilita.nome}`,
      ].join('\n'),
    );
    if (this.paginaEquipaggiamento.visible) this.disegnaEquipaggiamento();
  }
}

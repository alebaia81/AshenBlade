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
  confrontaConAttuale,
  type ConfrontoEquipaggiamento,
  SPAZI_EQUIPAGGIAMENTO,
  type SpazioEquipaggiamento,
} from '../systems/equipaggiamento';
import { avanzamento } from '../systems/livelli';
import { colorePerRarita, nomeRarita } from '../systems/oggetti';
import { assegnaPuntoPartita, caratteristicheTotali } from '../systems/partita';
import { dannoBaseArma } from '../systems/combattimento';
import { modificatoreArma, probabilitaCriticoDi, ricaricaSchivata } from '../systems/personaggio';
import { disegnaOggetto } from './interfaccia/iconeOggetti';
import { Pulsante } from './interfaccia/Pulsante';
import { conSegno, DESCRIZIONE_CARATTERISTICA, NOMI_SPAZI, STILE_TESTO, STILE_TITOLO } from './interfaccia/testi';
import type { ScenaMondo } from './ScenaMondo';
import { leggiPartita, scriviPartita } from './statoCondiviso';

const PANNELLO = { larghezza: 680, altezza: 470 };
const RIGA_SPAZIO = 50;
const numero = (colore: string) => parseInt(colore.replace('#', ''), 16);

function badgeConfronto(confronto: ConfrontoEquipaggiamento | null): { testo: string; colore: string } {
  if (!confronto) return { testo: '', colore: '#9aa7b8' };
  if (confronto.tipo === 'arma') {
    const { deltaDanno, deltaCritico } = confronto;
    if (deltaDanno > 0) return { testo: `▲ +${deltaDanno} Dan`, colore: '#5fd35f' };
    if (deltaDanno < 0) return { testo: `▼ ${deltaDanno} Dan`, colore: '#ff6b6b' };
    if (deltaCritico > 0) return { testo: `▲ +${deltaCritico}% Crit`, colore: '#5fd35f' };
    if (deltaCritico < 0) return { testo: `▼ ${deltaCritico}% Crit`, colore: '#ff6b6b' };
    return { testo: '= Dan', colore: '#9aa7b8' };
  } else {
    const { deltaArmatura, deltaBonus } = confronto;
    if (deltaArmatura > 0) return { testo: `▲ +${deltaArmatura} Dif`, colore: '#5fd35f' };
    if (deltaArmatura < 0) return { testo: `▼ ${deltaArmatura} Dif`, colore: '#ff6b6b' };
    const bonusEntries = Object.entries(deltaBonus);
    if (bonusEntries.length > 0) {
      const [stat, val] = bonusEntries[0]!;
      const segno = (val ?? 0) > 0 ? `+${val}` : `${val}`;
      return { testo: `${segno} ${stat}`, colore: (val ?? 0) > 0 ? '#5fd35f' : '#ff6b6b' };
    }
    return { testo: '= Dif', colore: '#9aa7b8' };
  }
}

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
  private anteprimaOggettoId: string | null = null;
  private anteprimaContainer?: Phaser.GameObjects.Container;
  private righeZaino: { id: string; sfondo: Phaser.GameObjects.Rectangle; rarita: string }[] = [];
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
    this.anteprimaOggettoId = null;
    this.righeZaino = [];
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

  /** A destra: cosa si può mettere nello spazio scelto (oggetti adatti nello zaino con anteprima e confronto). */
  private disegnaScelta(pagina: Phaser.GameObjects.Container): void {
    const x = this.sinistra + 355;
    const alto = this.alto;
    const testo = (y: number, contenuto: string, stile: Phaser.Types.GameObjects.Text.TextStyle = {}) =>
      pagina.add(this.add.text(x, y, contenuto, { ...STILE_TESTO, wordWrap: { width: 305 }, ...stile }));
    const spazio = this.spazioScelto;
    if (!spazio) {
      testo(alto + 110, 'Clicca uno spazio a sinistra per cambiare arma o armatura.', { color: '#9aa7b8' });
      if (this.messaggio) testo(alto + 412, this.messaggio, { color: '#ffe680', fontSize: '13px' });
      return;
    }

    const partita = leggiPartita(this);
    const èArmatura = spazio !== 'primaria' && spazio !== 'secondaria';
    const idEquip = partita.equipaggiamento[spazio];
    const oggettoEquip = idEquip ? this.dati.oggetti[idEquip] : undefined;

    // Titolo dello spazio scelto (es. "Stivali", "Arma primaria", ecc.)
    testo(alto + 66, NOMI_SPAZI[spazio]!, { fontStyle: 'bold', fontSize: '16px' });
    if (oggettoEquip) {
      testo(alto + 88, `In uso: ${oggettoEquip.nome}`, {
        fontSize: '12px',
        color: colorePerRarita(oggettoEquip.rarita),
      });
    } else {
      testo(alto + 88, 'In uso: — vuoto —', { fontSize: '12px', color: '#6b7686' });
    }

    // Pulsanti azione in alto a destra dello spazio
    if (!èArmatura && partita.equipaggiamento.secondaria) {
      pagina.add(
        new Pulsante(this, x + 240, alto + 76, {
          larghezza: 110,
          altezza: 26,
          testo: 'Scambia 1ª ↔ 2ª',
          dimensioneTesto: 11,
          alClic: () => {
            this.messaggio = this.mondo.scambiaArmiEquipaggiate();
            this.aggiorna();
          },
        }),
      );
    }
    if (idEquip && spazio !== 'primaria') {
      pagina.add(
        new Pulsante(this, x + 270, alto + 76, {
          larghezza: 56,
          altezza: 26,
          testo: 'Togli',
          dimensioneTesto: 12,
          alClic: () => {
            this.messaggio = this.mondo.togliEquipaggiamento(spazio);
            this.anteprimaOggettoId = null;
            this.aggiorna();
          },
        }),
      );
    }

    // Se in combattimento e si tratta di armatura: avviso chiaro
    if (èArmatura && this.bloccata) {
      testo(alto + 112, '⚠️ Non durante il combattimento: allontanati dai nemici.', { color: '#ff9a9a', fontSize: '11px' });
    }

    // Oggetti dello zaino che vanno in questo spazio
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
      });

    // Se l'oggetto anteprima non è impostato o non è più valido, imposta su equipaggiato o primo adatto
    if (!this.anteprimaOggettoId || (!this.dati.oggetti[this.anteprimaOggettoId] && !idEquip)) {
      this.anteprimaOggettoId = idEquip ?? (adatti[0]?.pila?.id ?? null);
    }

    testo(
      alto + 112,
      adatti.length > 0 ? 'Dallo zaino (tocca o passa sopra per anteprima):' : 'Nello zaino non hai oggetti per questo spazio.',
      { fontSize: '11px', color: '#9aa7b8' },
    );

    const carTotali = caratteristicheTotali(partita, this.dati.indossabili);

    // Mostra fino a 3 oggetti con riga interattiva (icona + nome + delta badge + pulsante indossa)
    const adattiVisibili = adatti.slice(0, 3);
    adattiVisibili.forEach(({ pila, indice }, i) => {
      const oggetto = this.dati.oggetti[pila!.id]!;
      const yRow = alto + 138 + i * 34;
      const isAnteprima = this.anteprimaOggettoId === pila!.id;

      const sfondoRow = this.add.rectangle(x + 152, yRow, 305, 30, isAnteprima ? 0x223249 : 0x131a26);
      sfondoRow.setStrokeStyle(isAnteprima ? 2 : 1, isAnteprima ? 0xffd23f : numero(colorePerRarita(oggetto.rarita)));
      sfondoRow.setInteractive({ useHandCursor: true });
      sfondoRow.on('pointerover', () => this.impostaAnteprima(pila!.id));
      sfondoRow.on('pointerdown', () => this.impostaAnteprima(pila!.id));
      pagina.add(sfondoRow);
      this.righeZaino.push({ id: pila!.id, sfondo: sfondoRow, rarita: oggetto.rarita });

      // Mini-icona
      const icona = this.add.graphics({ x: x + 16, y: yRow });
      disegnaOggetto(icona, oggetto, 24);
      pagina.add(icona);

      // Nome oggetto
      pagina.add(
        this.add.text(x + 34, yRow - 7, oggetto.nome, {
          ...STILE_TESTO,
          fontSize: '12px',
          fontStyle: 'bold',
          color: colorePerRarita(oggetto.rarita),
        }),
      );

      // Delta rapido
      const confronto = confrontaConAttuale(
        pila!.id,
        partita.equipaggiamento,
        this.dati.armi,
        this.dati.armature,
        carTotali,
        spazio,
      );
      const badge = badgeConfronto(confronto);
      pagina.add(
        this.add.text(x + 180, yRow - 7, badge.testo, {
          ...STILE_TESTO,
          fontSize: '11px',
          fontStyle: 'bold',
          color: badge.colore,
        }),
      );

      // Pulsante "Indossa" diretto nella riga
      if (!(èArmatura && this.bloccata)) {
        const btnIndossa = new Pulsante(this, x + 270, yRow, {
          larghezza: 54,
          altezza: 22,
          testo: 'Indossa',
          dimensioneTesto: 11,
          alClic: () => {
            this.messaggio = this.mondo.indossaDaZaino(indice, 0, èArmatura ? undefined : spazio);
            this.anteprimaOggettoId = pila!.id;
            this.aggiorna();
          },
        });
        pagina.add(btnIndossa);
      }
    });

    if (adatti.length > 3) {
      pagina.add(
        this.add.text(x, alto + 238, `(+${adatti.length - 3} altri oggetti nello zaino)`, {
          ...STILE_TESTO,
          fontSize: '10px',
          color: '#7a899c',
        }),
      );
    }

    // Scheda Anteprima dedicata
    this.anteprimaContainer = this.add.container(0, 0);
    pagina.add(this.anteprimaContainer);
    this.ridisegnaAnteprima();

    if (this.messaggio) {
      pagina.add(this.add.text(x, alto + 412, this.messaggio, { ...STILE_TESTO, color: '#ffe680', fontSize: '12px', fontStyle: 'bold' }));
    }
  }

  private impostaAnteprima(id: string): void {
    if (this.anteprimaOggettoId === id) return;
    this.anteprimaOggettoId = id;
    this.ridisegnaAnteprima();
    this.aggiornaStatoRigheZaino();
  }

  private aggiornaStatoRigheZaino(): void {
    for (const r of this.righeZaino) {
      const isAnteprima = this.anteprimaOggettoId === r.id;
      r.sfondo.setFillStyle(isAnteprima ? 0x223249 : 0x131a26);
      r.sfondo.setStrokeStyle(isAnteprima ? 2 : 1, isAnteprima ? 0xffd23f : numero(colorePerRarita(r.rarita as any)));
    }
  }

  private ridisegnaAnteprima(): void {
    if (!this.anteprimaContainer) return;
    this.anteprimaContainer.removeAll(true);
    const spazio = this.spazioScelto;
    if (!spazio) return;

    const x = this.sinistra + 355;
    const alto = this.alto;
    const yCard = alto + 246;
    const partita = leggiPartita(this);
    const idEquip = partita.equipaggiamento[spazio];
    const id = this.anteprimaOggettoId;
    const èArmatura = spazio !== 'primaria' && spazio !== 'secondaria';

    // Sfondo della scheda anteprima (larga 305, alta 158)
    const sfondo = this.add.rectangle(x + 152, yCard + 79, 305, 158, 0x0e141e).setStrokeStyle(1.5, 0x2d3d52);
    this.anteprimaContainer.add(sfondo);

    if (!id || !this.dati.oggetti[id]) {
      const tVuoto = this.add.text(x + 152, yCard + 79, 'Nessun oggetto selezionato.\nPassa sopra un oggetto dello zaino per vederne i dettagli.', {
        ...STILE_TESTO,
        fontSize: '11px',
        color: '#8a99ad',
        align: 'center',
      }).setOrigin(0.5);
      this.anteprimaContainer.add(tVuoto);
      return;
    }

    const oggetto = this.dati.oggetti[id]!;
    const isEquip = id === idEquip;
    const carTotali = caratteristicheTotali(partita, this.dati.indossabili);

    // Intestazione card
    const etichettaCard = isEquip ? '★ IN USO' : 'ANTEPRIMA & BENEFICI';
    const coloreEtichetta = isEquip ? '#8a99ad' : '#ffd23f';
    this.anteprimaContainer.add(
      this.add.text(x + 10, yCard + 6, etichettaCard, {
        ...STILE_TESTO,
        fontSize: '10px',
        fontStyle: 'bold',
        color: coloreEtichetta,
      }),
    );

    // Icona oggetto
    const icona = this.add.graphics({ x: x + 24, y: yCard + 34 });
    disegnaOggetto(icona, oggetto, 32);
    this.anteprimaContainer.add(icona);

    // Nome oggetto
    const tNome = this.add.text(x + 48, yCard + 20, oggetto.nome, {
      ...STILE_TESTO,
      fontSize: '13px',
      fontStyle: 'bold',
      color: colorePerRarita(oggetto.rarita),
    });
    this.anteprimaContainer.add(tNome);

    // Tipo e rarità
    const arma = this.dati.armi[id];
    const armatura = this.dati.armature[id];
    let tipoTesto = nomeRarita(oggetto.rarita);
    if (arma) tipoTesto += ` · ${NOMI_SPAZI[arma.slot] ?? 'Arma'}`;
    else if (armatura) tipoTesto += ` · ${NOMI_SPAZI[armatura.pezzo] ?? 'Armatura'}`;
    this.anteprimaContainer.add(
      this.add.text(x + 48, yCard + 36, tipoTesto, {
        ...STILE_TESTO,
        fontSize: '11px',
        color: '#9aa7b8',
      }),
    );

    // Statistiche di base dell'oggetto
    let infoBase = '';
    if (arma) {
      const dBase = dannoBaseArma(arma, arma.potenziamento ?? 0);
      const modCar = modificatoreArma(arma, carTotali);
      const dTot = dBase + modCar;
      const crit = Math.round(probabilitaCriticoDi(arma, carTotali) * 100);
      infoBase = `Danno: ${dTot} (base ${dBase} + ${arma.caratteristica}) · Crit: ${crit}%`;
    } else if (armatura) {
      const bonusList = Object.entries(armatura.bonus ?? {})
        .map(([k, v]) => `${k} ${conSegno(v)}`)
        .join(', ');
      infoBase = `Difesa: +${armatura.armatura}${bonusList ? ' · ' + bonusList : ''}`;
    }
    if (infoBase) {
      this.anteprimaContainer.add(
        this.add.text(x + 10, yCard + 54, infoBase, {
          ...STILE_TESTO,
          fontSize: '11px',
          color: '#e0e6ed',
        }),
      );
    }

    // Sezione Benefici / Confronto
    if (!isEquip) {
      const boxConfronto = this.add.rectangle(x + 152, yCard + 93, 290, 36, 0x141c28).setStrokeStyle(1, 0x253549);
      this.anteprimaContainer.add(boxConfronto);

      const confronto = confrontaConAttuale(
        id,
        partita.equipaggiamento,
        this.dati.armi,
        this.dati.armature,
        carTotali,
        spazio,
      );

      const nomeAttuale = confronto?.nomeAttuale ?? (idEquip ? this.dati.oggetti[idEquip]?.nome : 'Nessuno');
      this.anteprimaContainer.add(
        this.add.text(x + 14, yCard + 77, `Benefici vs ${nomeAttuale}:`, {
          ...STILE_TESTO,
          fontSize: '10px',
          color: '#ffd23f',
        }),
      );

      const deltaVoci: { testo: string; colore: string }[] = [];
      if (confronto?.tipo === 'arma') {
        const { deltaDanno, deltaCritico } = confronto;
        const strDan = deltaDanno > 0 ? `▲ +${deltaDanno} Danno` : deltaDanno < 0 ? `▼ ${deltaDanno} Danno` : '= Stesso Danno';
        const colDan = deltaDanno > 0 ? '#5fd35f' : deltaDanno < 0 ? '#ff6b6b' : '#9aa7b8';
        deltaVoci.push({ testo: strDan, colore: colDan });
        if (deltaCritico !== 0) {
          const strCrit = deltaCritico > 0 ? `▲ +${deltaCritico}% Crit` : `▼ ${deltaCritico}% Crit`;
          const colCrit = deltaCritico > 0 ? '#5fd35f' : '#ff6b6b';
          deltaVoci.push({ testo: strCrit, colore: colCrit });
        }
      } else if (confronto?.tipo === 'armatura') {
        const { deltaArmatura, deltaBonus } = confronto;
        const strArm = deltaArmatura > 0 ? `▲ +${deltaArmatura} Difesa` : deltaArmatura < 0 ? `▼ ${deltaArmatura} Difesa` : '= Stessa Difesa';
        const colArm = deltaArmatura > 0 ? '#5fd35f' : deltaArmatura < 0 ? '#ff6b6b' : '#9aa7b8';
        deltaVoci.push({ testo: strArm, colore: colArm });
        for (const [stat, val] of Object.entries(deltaBonus)) {
          if (!val) continue;
          const strB = val > 0 ? `▲ +${val} ${stat}` : `▼ ${val} ${stat}`;
          const colB = val > 0 ? '#5fd35f' : '#ff6b6b';
          deltaVoci.push({ testo: strB, colore: colB });
        }
      }

      if (deltaVoci.length === 0) {
        deltaVoci.push({ testo: '= Statistiche invariate', colore: '#9aa7b8' });
      }

      let dx = x + 14;
      for (const voce of deltaVoci.slice(0, 3)) {
        const t = this.add.text(dx, yCard + 93, voce.testo, {
          ...STILE_TESTO,
          fontSize: '11px',
          fontStyle: 'bold',
          color: voce.colore,
        });
        this.anteprimaContainer.add(t);
        dx += t.width + 10;
      }
    } else {
      // Già equipaggiato: mostra lore
      this.anteprimaContainer.add(
        this.add.text(x + 10, yCard + 74, oggetto.descrizione, {
          ...STILE_TESTO,
          fontSize: '11px',
          color: '#8a99ad',
          fontStyle: 'italic',
          wordWrap: { width: 285 },
        }),
      );
    }

    // Parte bassa: azione "Indossa" o avviso combattimento
    if (èArmatura && this.bloccata) {
      this.anteprimaContainer.add(
        this.add.text(x + 10, yCard + 132, '⚠️ Non puoi cambiare armatura in combattimento.', {
          ...STILE_TESTO,
          fontSize: '10px',
          color: '#ff8a8a',
        }),
      );
    } else if (!isEquip) {
      const adatti = partita.inventario.spazi
        .map((pila, indice) => ({ pila, indice }))
        .filter(({ pila }) => pila?.id === id);
      const primoAdatto = adatti[0];
      if (primoAdatto) {
        const btnIndossa = new Pulsante(this, x + 152, yCard + 136, {
          larghezza: 286,
          altezza: 24,
          testo: 'Indossa questo oggetto',
          dimensioneTesto: 11,
          colore: 0x1f382b,
          alClic: () => {
            this.messaggio = this.mondo.indossaDaZaino(primoAdatto.indice, 0, èArmatura ? undefined : spazio);
            this.anteprimaOggettoId = primoAdatto.pila!.id;
            this.aggiorna();
          },
        });
        (btnIndossa.list[0] as Phaser.GameObjects.Rectangle).setStrokeStyle(1.5, 0x48bb78);
        this.anteprimaContainer.add(btnIndossa);
      }
    }
  }

  private scegliSpazio(spazio: SpazioEquipaggiamento): void {
    if (this.spazioScelto === spazio) {
      this.spazioScelto = null;
      this.anteprimaOggettoId = null;
    } else {
      this.spazioScelto = spazio;
      const partita = leggiPartita(this);
      const idEquip = partita.equipaggiamento[spazio];
      if (idEquip) {
        this.anteprimaOggettoId = idEquip;
      } else {
        const èArmatura = spazio !== 'primaria' && spazio !== 'secondaria';
        const adatto = partita.inventario.spazi.find((p) => {
          if (!p) return false;
          const voce = this.dati.indossabili[p.id];
          if (!voce) return false;
          return èArmatura ? voce.spazio === spazio : voce.categoria === 'arma';
        });
        this.anteprimaOggettoId = adatto ? adatto.id : null;
      }
    }
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

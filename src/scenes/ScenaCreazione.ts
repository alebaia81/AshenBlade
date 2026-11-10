// Creazione del personaggio: scelta della classe, 2 punti liberi, nome.
// Tutto si fa col mouse; la tastiera serve solo per scrivere il nome
// (e Invio come scorciatoia per iniziare).

import * as Phaser from 'phaser';
import { LARGHEZZA_SCHERMO, SCENA_CREAZIONE, SCENA_MENU, SCENA_MONDO } from '../costanti';
import type { DatiGioco } from '../data/caricaDati';
import {
  modificatore,
  NOMI_CARATTERISTICHE,
  PUNTI_LIBERI,
  puòAggiungereLibero,
  type NomeCaratteristica,
} from '../systems/caratteristiche';
import { creaPartita, NOME_PREDEFINITO } from '../systems/partita';
import { manaMassimo, probabilitaCriticoDi, vitaMassima, type DefinizioneClasse } from '../systems/personaggio';
import { Pulsante } from './interfaccia/Pulsante';
import { conSegno, DESCRIZIONE_CARATTERISTICA, STILE_TESTO, STILE_TITOLO } from './interfaccia/testi';
import { scriviPartita } from './statoCondiviso';
import { aggiungiImmagine, aspettoDi } from './grafica';

const LUNGHEZZA_MASSIMA_NOME = 16;

const NOMI_CASUALI: Record<string, string[]> = {
  guerriero: ['Arturo', 'Valerio', 'Gareth', 'Brenno', 'Elena', 'Rolando', 'Kaelen'],
  mago: ['Alden', 'Morrigan', 'Elion', 'Selene', 'Ignis', 'Miriel', 'Eldrin'],
  ladro: ['Dario', 'Nives', 'Vipera', 'Silas', 'Lia', 'Corvo', 'Zefiro'],
  chierico: ['Benedetto', 'Lucia', 'Anselmo', 'Clara', 'Gideon', 'Mirella', 'Franca'],
};

export class ScenaCreazione extends Phaser.Scene {
  private classe!: DefinizioneClasse;
  /** Caratteristiche su cui sono stati messi i punti liberi. */
  private scelte: NomeCaratteristica[] = [];
  private nome = '';
  private nomeAttivo = false;

  // Oggetti da aggiornare quando cambia qualcosa.
  private schede: Pulsante[] = [];
  private righe!: Record<NomeCaratteristica, { valore: Phaser.GameObjects.Text; meno: Pulsante; piu: Pulsante }>;
  private testoPunti!: Phaser.GameObjects.Text;
  private riepilogo!: Phaser.GameObjects.Text;
  private campoNome!: Phaser.GameObjects.Rectangle;
  private testoNome!: Phaser.GameObjects.Text;
  private inizia!: Pulsante;

  constructor(private readonly dati: DatiGioco) {
    super(SCENA_CREAZIONE);
  }

  create(): void {
    // Dalla fase 9a la scena può ripartire (nuova partita dal menu): si ricomincia da capo.
    this.schede = [];
    this.scelte = [];
    this.nome = '';
    this.nomeAttivo = false;
    this.cameras.main.setBackgroundColor('#1b2230');
    this.add.text(LARGHEZZA_SCHERMO / 2, 34, 'Crea il tuo personaggio', STILE_TITOLO).setOrigin(0.5);
    new Pulsante(this, 70, 34, { larghezza: 110, altezza: 34, testo: '← Menu', dimensioneTesto: 14, alClic: () => this.scene.start(SCENA_MENU) });

    this.creaSchedeClassi();
    this.creaCaratteristiche();
    this.riepilogo = this.add.text(560, 190, '', { ...STILE_TESTO, wordWrap: { width: 370 }, lineSpacing: 6 });
    this.creaCampoNome();
    this.inizia = new Pulsante(this, 800, 492, {
      larghezza: 240,
      altezza: 46,
      testo: "Inizia l'avventura",
      dimensioneTesto: 18,
      colore: 0x2f5d3a,
      alClic: () => this.iniziaPartita(),
    });

    // Per scrivere il nome ascoltiamo direttamente la tastiera del browser
    // (window "keydown", come in una pagina web): ogni pressione arriva una volta
    // sola e con il carattere giusto, anche con maiuscole e lettere accentate.
    const tasto = (e: KeyboardEvent) => this.tastoPremuto(e);
    window.addEventListener('keydown', tasto);
    // Quando la scena si chiude l'ascoltatore va tolto, altrimenti resterebbe attivo per sempre.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener('keydown', tasto));
    this.scegliClasse(Object.values(this.dati.classi)[0]!);
  }

  // ---- costruzione dell'interfaccia ----

  private creaSchedeClassi(): void {
    Object.values(this.dati.classi).forEach((classe, i) => {
      const pulsante = new Pulsante(this, 125 + i * 237, 112, {
        larghezza: 220,
        altezza: 84,
        testo: `${classe.nome}\n${classe.descrizione}`,
        dimensioneTesto: 13,
        aCapo: true,
        alClic: () => this.scegliClasse(classe),
      });
      // L'anteprima dell'eroe: la sua figura in pixel art (o un quadratino del colore della classe).
      const figura = aspettoDi(this.dati.sprite, 'classi', classe.id);
      if (figura) pulsante.add(aggiungiImmagine(this, -90, -22, figura).setScale(2));
      else pulsante.add(this.add.rectangle(-94, -28, 14, 14, parseInt(classe.colore.slice(1), 16)).setStrokeStyle(1, 0x000000));
      pulsante.setData('classe', classe.id);
      this.schede.push(pulsante);
    });
  }

  private creaCaratteristiche(): void {
    this.testoPunti = this.add.text(30, 172, '', { ...STILE_TESTO, fontSize: '18px' });
    const righe = {} as typeof this.righe;
    NOMI_CARATTERISTICHE.forEach((nome, i) => {
      const y = 222 + i * 40;
      const d = DESCRIZIONE_CARATTERISTICA[nome];
      this.add.text(30, y - 10, `${nome}  ${d.nome}`, { ...STILE_TESTO, fontStyle: 'bold' });
      this.add.text(30, y + 8, d.effetto, { ...STILE_TESTO, fontSize: '12px', color: '#9aa7b8' });
      const valore = this.add.text(300, y, '', { ...STILE_TESTO, fontSize: '18px' }).setOrigin(0.5);
      const meno = new Pulsante(this, 380, y, { larghezza: 34, altezza: 30, testo: '−', alClic: () => this.togliPunto(nome) });
      const piu = new Pulsante(this, 420, y, { larghezza: 34, altezza: 30, testo: '+', alClic: () => this.mettiPunto(nome) });
      righe[nome] = { valore, meno, piu };
    });
    this.righe = righe;
  }

  private creaCampoNome(): void {
    this.add.text(30, 478, 'Nome:', { ...STILE_TESTO, fontSize: '18px' });
    this.campoNome = this.add.rectangle(100, 470, 330, 40, 0x10141c).setOrigin(0, 0).setStrokeStyle(2, 0x9aa7b8);
    this.campoNome.setInteractive({ useHandCursor: true });
    this.testoNome = this.add.text(112, 480, '', { ...STILE_TESTO, fontSize: '18px' });

    // Pulsanti touch e rapidi: Scrivi (apre il campo nativo dello smartphone) e Casuale (dice roll)
    new Pulsante(this, 488, 490, {
      larghezza: 96,
      altezza: 38,
      testo: '✏️ Scrivi',
      dimensioneTesto: 13,
      alClic: () => this.richiediNomeTouch(),
    });

    new Pulsante(this, 600, 490, {
      larghezza: 104,
      altezza: 38,
      testo: '🎲 Casuale',
      dimensioneTesto: 13,
      alClic: () => this.generaNomeCasuale(),
    });

    this.campoNome.on('pointerdown', (pointer: Phaser.Input.Pointer, _lx: number, _ly: number, evento: Phaser.Types.Input.EventData) => {
      evento.stopPropagation(); // il clic sul campo non deve "spegnerlo" subito dopo
      const èTouch = (pointer.event as PointerEvent)?.pointerType === 'touch' || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      if (èTouch) {
        this.richiediNomeTouch();
      } else {
        this.impostaNomeAttivo(true);
      }
    });
    // Un clic in qualunque altro punto toglie il "fuoco" al campo, come in una pagina web.
    this.input.on('pointerdown', () => this.impostaNomeAttivo(false));
    // Cursore lampeggiante: un timer che si ripete, invece di setInterval.
    this.time.addEvent({ delay: 500, loop: true, callback: () => this.aggiornaNome() });
  }

  private richiediNomeTouch(): void {
    const attuale = this.nome || NOME_PREDEFINITO;
    const inserito = window.prompt('Inserisci il nome del personaggio (max 16 caratteri):', attuale);
    if (inserito !== null) {
      const pulito = inserito.trim().slice(0, LUNGHEZZA_MASSIMA_NOME);
      if (pulito.length > 0) {
        this.nome = pulito;
      }
      this.impostaNomeAttivo(false);
      this.aggiornaNome();
    }
  }

  private generaNomeCasuale(): void {
    const lista = NOMI_CASUALI[this.classe?.id] ?? NOMI_CASUALI['guerriero']!;
    const candidati = lista.filter((n) => n !== this.nome);
    const scelto = candidati[Math.floor(Math.random() * candidati.length)] ?? lista[0]!;
    this.nome = scelto;
    this.impostaNomeAttivo(false);
    this.aggiornaNome();
  }

  // ---- azioni ----

  private scegliClasse(classe: DefinizioneClasse): void {
    this.classe = classe;
    this.scelte = []; // i punti liberi dipendono dalla classe: si ricomincia
    this.aggiorna();
  }

  private mettiPunto(nome: NomeCaratteristica): void {
    if (puòAggiungereLibero(this.classe.caratteristiche, this.scelte, nome)) this.scelte.push(nome);
    this.aggiorna();
  }

  private togliPunto(nome: NomeCaratteristica): void {
    this.scelte = this.scelte.filter((s) => s !== nome);
    this.aggiorna();
  }

  private iniziaPartita(): void {
    if (this.scelte.length !== PUNTI_LIBERI) return;
    scriviPartita(this, creaPartita(this.nome || NOME_PREDEFINITO, this.classe, this.scelte));
    // start ferma questa scena e avvia il mondo; "nuovaPartita" fa salvare subito nello slot scelto.
    this.scene.start(SCENA_MONDO, { nuovaPartita: true });
  }

  private tastoPremuto(e: KeyboardEvent): void {
    if (!this.nomeAttivo) {
      if (e.key === 'Enter') this.iniziaPartita();
      return;
    }
    if (e.key === 'Enter' || e.key === 'Escape') this.impostaNomeAttivo(false);
    else if (e.key === 'Backspace') this.nome = this.nome.slice(0, -1);
    // Solo lettere, cifre, spazi, apostrofi e trattini: \p{L} = qualsiasi lettera, anche accentata.
    else if (e.key.length === 1 && /[\p{L}\p{N} '-]/u.test(e.key) && this.nome.length < LUNGHEZZA_MASSIMA_NOME) {
      this.nome += e.key;
    }
    this.aggiornaNome();
  }

  private impostaNomeAttivo(attivo: boolean): void {
    this.nomeAttivo = attivo;
    this.campoNome.setStrokeStyle(2, attivo ? 0xffd23f : 0x9aa7b8);
    this.aggiornaNome();
  }

  // ---- disegno ----

  private aggiorna(): void {
    for (const scheda of this.schede) scheda.impostaSelezionato(scheda.getData('classe') === this.classe.id);

    const base = this.classe.caratteristiche;
    const liberi = PUNTI_LIBERI - this.scelte.length;
    this.testoPunti.setText(`Caratteristiche — punti liberi da assegnare: ${liberi}`);
    for (const nome of NOMI_CARATTERISTICHE) {
      const valore = base[nome] + (this.scelte.includes(nome) ? 1 : 0);
      const riga = this.righe[nome];
      riga.valore.setText(`${valore} (${conSegno(modificatore(valore))})`);
      riga.valore.setColor(this.scelte.includes(nome) ? '#8fe08f' : '#e8e8e8');
      riga.piu.impostaAttivo(puòAggiungereLibero(base, this.scelte, nome));
      riga.meno.impostaAttivo(this.scelte.includes(nome));
    }

    // Anteprima calcolata con le stesse funzioni che userà il gioco.
    const car = { ...base };
    for (const s of this.scelte) car[s]++;
    const arma = this.dati.armi[this.classe.arma]!;
    const mana = manaMassimo(this.classe, car);
    this.riepilogo.setText(
      [
        `${this.classe.nome}`,
        '',
        `Vita: ${vitaMassima(this.classe, car, 1)}`,
        `Mana: ${mana > 0 ? mana : '—'}`,
        `Arma: ${arma.nome} (${arma.dado} ${conSegno(modificatore(car[arma.caratteristica]))} ${arma.caratteristica})`,
        `Critico: ${Math.round(probabilitaCriticoDi(arma, car) * 100)}%`,
        '',
        `Abilità: ${this.classe.abilita.nome}`,
        this.classe.abilita.descrizione,
        '(le abilità arrivano nella fase 3c)',
      ].join('\n'),
    );
    this.inizia.impostaAttivo(this.scelte.length === PUNTI_LIBERI);
  }

  private aggiornaNome(): void {
    const lampeggio = this.nomeAttivo && Math.floor(this.time.now / 500) % 2 === 0 ? '|' : '';
    const èTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const invito = èTouch ? 'tocca per scrivere' : 'clicca per scrivere';
    if (this.nome === '' && !this.nomeAttivo) {
      this.testoNome.setText(`${NOME_PREDEFINITO} (${invito})`).setColor('#6f7a88');
    } else {
      this.testoNome.setText(this.nome + lampeggio).setColor('#ffffff');
    }
  }
}

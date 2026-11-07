// Il sintetizzatore del gioco (fase 9c): effetti e musica generati dal codice
// con la Web Audio API del browser. Nessun file audio: il gioco resta un file
// solo e funziona senza internet.
//
// Come funziona la Web Audio API, in breve: si costruisce un piccolo "circuito"
// di nodi, come cavi tra pedali di una chitarra elettrica.
//   oscillatore (genera l'onda) → guadagno (il volume della nota) → volume
//   della musica o degli effetti → volume generale → altoparlanti
// Ogni nodo si collega con connect(). Le note si PRENOTANO su un orologio
// preciso (contesto.currentTime): "suona a 12,350 s, fermati a 12,600 s".
//
// Le regole (che note, quando) stanno in systems/sequenze.ts; qui c'è solo il suono.

import {
  noteNellIntervallo,
  preparaBrano,
  type BranoPronto,
  type DatiMusica,
  type NomeEffetto,
  type NotaSuonata,
  type PezzoEffetto,
} from '../systems/sequenze';

/** Ogni quanto il lettore guarda avanti (ms) e quanto avanti prenota (s). */
const OGNI_MS = 40;
const ANTICIPO_S = 0.2;
/** Dissolvenza quando si cambia brano. */
const DISSOLVENZA_S = 0.6;

interface BranoInCorso {
  nome: string;
  pronto: BranoPronto;
  /** Quando è partito, sull'orologio dell'audio. */
  inizio: number;
  /** Fin dove abbiamo già prenotato le note (secondi dall'inizio del brano). */
  prenotatoFino: number;
  /** Il volume di questo brano: serve a farlo sfumare quando ne parte un altro. */
  uscita: GainNode;
}

export class Suoni {
  private contesto: AudioContext | null = null;
  private generale!: GainNode;
  private busMusica!: GainNode;
  private busEffetti!: GainNode;
  private rumore: AudioBuffer | null = null;
  private dati: DatiMusica | null = null;
  private branoVoluto: string | null = null;
  private inCorso: BranoInCorso | null = null;
  private volumi = { musica: 0.5, effetti: 0.7 };
  private timer: number | null = null;
  // Per le prove nel browser e per curiosare dalla console (F12): window.suoni.stato
  private ultimiEffetti: string[] = [];
  private notePrenotate = 0;

  configura(dati: DatiMusica): void {
    this.dati = dati;
    // I browser fanno partire l'audio solo dopo un gesto dell'utente (un clic,
    // un tasto): è la regola contro i siti che suonano da soli. Al primo gesto
    // creiamo (o riattiviamo) il contesto audio.
    const sblocca = () => this.sblocca();
    window.addEventListener('pointerdown', sblocca);
    window.addEventListener('keydown', sblocca);
  }

  private sblocca(): void {
    if (!this.contesto) this.crea();
    if (this.contesto && this.contesto.state === 'suspended') void this.contesto.resume();
  }

  private crea(): void {
    const Contesto = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Contesto) return; // browser senza audio: il gioco funziona lo stesso, in silenzio
    const c = new Contesto();
    this.contesto = c;
    this.generale = c.createGain();
    this.generale.gain.value = 0.8;
    this.generale.connect(c.destination);
    this.busMusica = c.createGain();
    this.busEffetti = c.createGain();
    this.busMusica.connect(this.generale);
    this.busEffetti.connect(this.generale);
    this.applicaVolumi();
    // Un secondo di rumore bianco (numeri a caso tra -1 e 1), riusato da tutti gli effetti "rumore".
    const b = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const canale = b.getChannelData(0);
    for (let i = 0; i < canale.length; i++) canale[i] = Math.random() * 2 - 1;
    this.rumore = b;
    this.timer = window.setInterval(() => this.pianifica(), OGNI_MS);
    if (this.branoVoluto) this.avviaBrano(this.branoVoluto);
  }

  // ---- volumi ----

  /** 0–1 ciascuno, dalle opzioni. */
  impostaVolumi(musica: number, effetti: number): void {
    this.volumi = { musica, effetti };
    this.applicaVolumi();
  }

  private applicaVolumi(): void {
    if (!this.contesto) return;
    // Il volume "percepito" non è lineare: elevare al quadrato rende il cursore più naturale.
    this.busMusica.gain.setTargetAtTime(this.volumi.musica ** 2, this.contesto.currentTime, 0.05);
    this.busEffetti.gain.setTargetAtTime(this.volumi.effetti ** 2, this.contesto.currentTime, 0.05);
  }

  // ---- effetti ----

  effetto(nome: NomeEffetto): void {
    this.ultimiEffetti = [...this.ultimiEffetti.slice(-29), nome];
    const pezzi = this.dati?.effetti[nome];
    const c = this.contesto;
    if (!pezzi || !c || c.state !== 'running' || this.volumi.effetti === 0) return;
    const adesso = c.currentTime + 0.01;
    for (const p of pezzi) this.suonaPezzo(p, adesso + (p.ritardo ?? 0));
  }

  private suonaPezzo(p: PezzoEffetto, quando: number): void {
    const c = this.contesto!;
    const fine = quando + p.durata;
    const volume = c.createGain();
    // Inviluppo: attacco rapidissimo, poi sfuma fino a quasi zero (niente "clic" a fine nota).
    volume.gain.setValueAtTime(0.0001, quando);
    volume.gain.exponentialRampToValueAtTime(p.volume, quando + 0.005);
    volume.gain.exponentialRampToValueAtTime(0.0001, fine);
    volume.connect(this.busEffetti);
    if (p.onda === 'rumore') {
      // Rumore filtrato: il filtro "passa banda" lascia passare solo le frequenze
      // vicine a quella scelta, e la facciamo scivolare da "da" ad "a".
      const sorgente = c.createBufferSource();
      sorgente.buffer = this.rumore;
      const filtro = c.createBiquadFilter();
      filtro.type = 'bandpass';
      filtro.frequency.setValueAtTime(p.da, quando);
      filtro.frequency.exponentialRampToValueAtTime(p.a, fine);
      sorgente.connect(filtro).connect(volume);
      sorgente.start(quando);
      sorgente.stop(fine + 0.02);
      return;
    }
    const osc = c.createOscillator();
    osc.type = p.onda;
    osc.frequency.setValueAtTime(p.da, quando);
    osc.frequency.exponentialRampToValueAtTime(p.a, fine);
    osc.connect(volume);
    osc.start(quando);
    osc.stop(fine + 0.02);
  }

  // ---- musica ----

  /** Il brano da suonare (null = silenzio). Se è già quello in corso non ricomincia. */
  brano(nome: string | null): void {
    this.branoVoluto = nome;
    if (this.inCorso?.nome === nome) return;
    if (this.contesto) this.avviaBrano(nome);
  }

  /** Il brano di una zona (mappa, "menu", "boss"), come dice musica.json. */
  branoDellaZona(zona: string): void {
    this.brano(this.dati?.zone[zona] ?? null);
  }

  private avviaBrano(nome: string | null): void {
    const c = this.contesto!;
    // Il brano vecchio sfuma e poi si scollega: niente tagli bruschi.
    if (this.inCorso) {
      const vecchio = this.inCorso.uscita;
      vecchio.gain.setTargetAtTime(0, c.currentTime, DISSOLVENZA_S / 4);
      window.setTimeout(() => vecchio.disconnect(), DISSOLVENZA_S * 2000);
      this.inCorso = null;
    }
    const brano = nome ? this.dati?.brani[nome] : undefined;
    if (!nome || !brano) return;
    const uscita = c.createGain();
    uscita.connect(this.busMusica);
    this.inCorso = { nome, pronto: preparaBrano(brano), inizio: c.currentTime + 0.1, prenotatoFino: 0, uscita };
  }

  /**
   * Il "lettore": ogni 40 ms prenota le note dei prossimi 200 ms. Perché non
   * suonarle con un setTimeout ciascuna? Perché i timer di JavaScript sono
   * imprecisi (anche di decine di millisecondi): il ritmo zoppicherebbe.
   * L'orologio dell'audio invece è preciso al campione. Il timer serve solo a
   * "guardare avanti"; il tempo vero lo tiene l'audio.
   */
  private pianifica(): void {
    const c = this.contesto;
    const b = this.inCorso;
    if (!c || !b || c.state !== 'running') return;
    const fino = c.currentTime + ANTICIPO_S - b.inizio;
    // Se la scheda è rimasta in secondo piano a lungo, si riparte da adesso invece di recuperare tutto.
    if (fino - b.prenotatoFino > 1) b.prenotatoFino = fino - ANTICIPO_S;
    for (const n of noteNellIntervallo(b.pronto, b.prenotatoFino, fino)) this.suonaNota(n, b);
    b.prenotatoFino = Math.max(b.prenotatoFino, fino);
  }

  private suonaNota(n: NotaSuonata, b: BranoInCorso): void {
    const c = this.contesto!;
    const quando = b.inizio + n.inizio;
    // La nota suona per l'85% della sua durata: lo stacco tra le note dà il ritmo.
    const fine = quando + n.durata * 0.85;
    const osc = c.createOscillator();
    osc.type = n.onda;
    osc.frequency.setValueAtTime(n.frequenza, quando);
    const volume = c.createGain();
    volume.gain.setValueAtTime(0.0001, quando);
    volume.gain.exponentialRampToValueAtTime(n.volume, quando + 0.01);
    volume.gain.setValueAtTime(n.volume, Math.max(quando + 0.01, fine - 0.04));
    volume.gain.exponentialRampToValueAtTime(0.0001, fine);
    osc.connect(volume).connect(b.uscita);
    osc.start(quando);
    osc.stop(fine + 0.02);
    this.notePrenotate++;
  }

  /** Per le prove nel browser e per la console: com'è messo l'audio adesso. */
  get stato(): { contesto: string; brano: string | null; notePrenotate: number; ultimiEffetti: string[]; volumi: { musica: number; effetti: number } } {
    return {
      contesto: this.contesto?.state ?? 'non creato',
      brano: this.inCorso?.nome ?? null,
      notePrenotate: this.notePrenotate,
      ultimiEffetti: [...this.ultimiEffetti],
      volumi: { ...this.volumi },
    };
  }

  /** Per i test: il volume reale dei due canali (dopo la curva al quadrato). */
  get guadagni(): { musica: number; effetti: number } | null {
    return this.contesto ? { musica: this.busMusica.gain.value, effetti: this.busEffetti.gain.value } : null;
  }

  ferma(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    void this.contesto?.close();
  }
}

/** Un solo sintetizzatore per tutto il gioco, come un servizio condiviso in un'app web. */
export const suoni = new Suoni();

import type { CondizioneCella } from './condizioniMappa';
import type { Strato } from './sprite';
import type { ParametriCarica } from './ia/caricatore';
import type { ParametriTiro } from './ia/tiratore';
import type { FaseBoss } from './boss';
import type { VoceBottino } from './bottino';
import type { Rarita } from './oggetti';
import type { PezzoArmatura } from './equipaggiamento';
import type { Caratteristiche, NomeCaratteristica } from './caratteristiche';

// Tipi condivisi dai systems. Sono solo "forme" di dati: nessuna logica,
// nessun Phaser. Li usano sia le regole del gioco sia le scene.

/** I tipi di cella che una legenda può usare. */
/** "segreto" è un muro segreto: sembra un muro (con una crepa) e si apre colpendolo. */
export type TipoCella = 'muro' | 'pavimento' | 'partenza' | 'arrivo' | 'uscita' | 'nemico' | 'forziere' | 'segreto' | 'abitante' | 'vena' | 'cartello' | 'porta' | 'barriera';

/** Come si vede un cartello: un cartello di legno, un cancello, una frana. */
export type AspettoCartello = 'cartello' | 'cancello' | 'frana' | 'ramo' | 'nebbia' | 'lapide' | 'germoglio';

/** Una voce della legenda: cosa significa un carattere della griglia. */
export interface VoceLegenda {
  tipo: TipoCella;
  /** Colore della tessera (fasi 1–8 disegnano solo forme colorate; dalla 9b è la riserva se manca "tessera"). */
  colore?: string;
  /** Fase 9b: l'immagine della tessera (data/sprite.json), o più strati dal basso: ["erba", "pino"]. */
  tessera?: Strato | Strato[];
  /** Solo per i muri segreti: com'è il muro finché è chiuso. */
  tesseraMuro?: Strato | Strato[];
  /** Solo per le uscite: id della mappa di destinazione. */
  verso?: string;
  /** Solo per le uscite: simbolo del punto d'arrivo nella mappa di destinazione. */
  arrivo?: string;
  /** Solo per i nemici: id del nemico in data/nemici.json. */
  nemico?: string;
  /** Solo per i forzieri: id degli oggetti dentro. */
  contenuto?: string[];
  /** Solo per i forzieri chiusi (fase 8a): la chiave piccola che serve (o Volpe). */
  chiusoCon?: string;
  /** Solo per le porte (fase 8a): la chiave che le apre. */
  chiave?: string;
  /** Fase 8b: quando questa condizione è vera, al posto di questo simbolo c'è "diventa". */
  cambiaCon?: CondizioneCella;
  diventa?: string;
  /** Solo per le barriere della stanza del boss (fase 8a): quale boss le chiude. */
  boss?: string;
  /** Solo per i forzieri: monete dentro. */
  monete?: number;
  /** Solo per gli abitanti: id in data/abitanti.json. */
  abitante?: string;
  /** Solo per le vene di minerale: cosa si estrae e quanti pezzi [minimo, massimo]. */
  materiale?: string;
  quantita?: [number, number];
  /** Solo per le vene: "roccia" (minerali, il valore di base) o "cespuglio" (erbe, fase 7). */
  aspetto?: 'roccia' | 'cespuglio' | AspettoCartello;
  /** Solo per i cartelli (fase 7b): cosa si legge cliccandoci. */
  testo?: string;
  /** Solo per le porte: il nome che compare nell'avviso ("la porta d'ossa"). */
  nome?: string;
  /** Solo per i cartelli: se nello zaino c'è questo oggetto, si legge "testoConOggetto". */
  oggetto?: string;
  testoConOggetto?: string;
  /** Solo per i muri segreti: il colore del muro finto ("colore" è il pavimento che c'è sotto). */
  coloreMuro?: string;
}

/** Una mappa così come sta scritta nel file JSON. */
export interface DefinizioneMappa {
  id: string;
  nome: string;
  /** Fase 8c: la notte della luna nera (la Brughiera e la Torre sono più scure). */
  notte?: boolean;
  legenda: Record<string, VoceLegenda>;
  griglia: string[];
}

/** Una mappa già controllata e pronta da interrogare. */
export interface Mappa {
  id: string;
  nome: string;
  notte?: boolean;
  larghezza: number;
  altezza: number;
  legenda: Record<string, VoceLegenda>;
  /** simboli[riga][col]: il carattere in quella posizione. */
  simboli: string[][];
}

/** Una posizione nella griglia, in celle (non in pixel). */
export interface Cella {
  col: number;
  riga: number;
}

/** Un punto o una velocità in pixel. */
export interface Vettore {
  x: number;
  y: number;
}

export type Direzione = 'su' | 'giu' | 'sinistra' | 'destra';

/** Quali tasti di movimento sono premuti in questo fotogramma. */
export interface TastiPremuti {
  su: boolean;
  giu: boolean;
  sinistra: boolean;
  destra: boolean;
}

/** Dove porta un'uscita. */
export interface Destinazione {
  verso: string;
  arrivo: string;
}

/**
 * Cosa l'eroe deve fare in questo fotogramma. Non dice NULLA su tastiera o
 * mouse: chi produce i comandi (GuidaEroe) traduce i dispositivi in "intenzioni".
 */
export interface ComandiEroe {
  /** Direzione di marcia, di lunghezza tra 0 (fermo) e 1. */
  movimento: Vettore;
  attacca: boolean;
  /** Se presente, l'eroe si gira così prima di attaccare (mira verso il nemico cliccato). */
  guarda: Direzione | null;
  /** Punto esatto da colpire con un'arma a distanza (il centro del nemico cliccato). */
  mira: Vettore | null;
  schiva: boolean;
  /** Direzione della capriola (verso il cursore). Se null: dove si cammina, o dove si guarda. */
  direzioneSchivata: Vettore | null;
}

/** Un'arma come sta scritta in data/armi.json (formato del design §4 + area di colpo). */
export interface DefinizioneArma {
  id: string;
  nome: string;
  descrizione: string;
  tipo: string;
  slot: 'primaria' | 'secondaria';
  rarita: Rarita;
  /** Prezzo pieno in monete. */
  prezzo: number;
  dado: string;
  /** Danno base deterministico (fase 5 / combat design spec). */
  dannoBase?: number;
  caratteristica: NomeCaratteristica;
  effetti: string[];
  /** Quanto si allunga davanti all'eroe, in pixel di mondo. */
  portata: number;
  /** Larghezza di traverso dell'area di colpo. */
  larghezzaColpo: number;
  durataMs: number;
  ricaricaMs: number;
  /** Probabilità di critico aggiuntiva, in frazione (0.05 = +5%). */
  bonusCritico: number;
  /** Velocità con cui il nemico colpito viene respinto. */
  respinta: number;
  /** Solo per le armi a distanza (il bastone del Mago): l'attacco lancia un proiettile. */
  proiettile?: DefinizioneProiettile;
  /** Solo le varianti create da caricaDati: +1…+5 al danno (design §9). */
  potenziamento?: number;
}

export interface DefinizioneProiettile {
  /** Pixel al secondo. */
  velocita: number;
  /** Pixel massimi di volo. */
  gittata: number;
  /** Raggio del proiettile in pixel. */
  dimensione: number;
  colore: string;
  costoMana: number;
}

/** Un nemico come sta scritto in data/nemici.json. */
export interface DefinizioneNemico {
  /** La chiave in nemici.json: la aggiunge caricaDati (serve alle quest "elimina"). */
  id: string;
  /** Solo i boss (data/boss.json): le fasi. */
  fasi?: FaseBoss[];
  /** Solo i tiratori (fase 8b): distanze, ricarica e com'è il proiettile. */
  tiro?: ParametriTiro & { velocita: number; gittata: number; dimensione: number; colore: string };
  /** Fase 8c: spettri e ombre sono un po' trasparenti (1 = pieno). */
  opacita?: number;
  /** Fase 8c: sconfitto questo boss parte il finale della storia. */
  finale?: boolean;
  /** Solo i caricatori (fase 8b): mira, scatto, stanchezza. */
  carica?: ParametriCarica;
  nome: string;
  comportamento: string;
  vita: number;
  armatura: number;
  danno: string;
  velocita: number;
  raggioVista: number;
  raggioAbbandono: number;
  dimensione: number;
  colore: string;
  /** Quanto resta stordito dopo un colpo subito. */
  storditoMs: number;
  /** Quanto si ferma dopo aver colpito l'eroe. */
  pausaDopoAttaccoMs: number;
  /** Esperienza data a chi lo sconfigge. */
  esperienza: number;
  /** Categorie a cui appartiene, es. "nonMorto" (il Chierico gli fa più danno). */
  etichette: string[];
  /** Cosa può lasciare a terra quando viene sconfitto. */
  bottino: VoceBottino[];
  /** Monete lasciate a terra: [minimo, massimo]. */
  monete: [number, number];
}

/** Un personaggio del villaggio, come sta scritto in data/abitanti.json. */
export interface DefinizioneAbitante {
  id: string;
  nome: string;
  colore: string;
  /** Id del dialogo in data/dialoghi.json. */
  dialogo: string;
}

/** Un pezzo di armatura come sta scritto in data/armature.json (design §8). */
export interface DefinizioneArmatura {
  id: string;
  nome: string;
  descrizione: string;
  pezzo: PezzoArmatura;
  rarita: Rarita;
  prezzo: number;
  /** Punti di armatura: si sommano a quelli degli altri pezzi. */
  armatura: number;
  /** Solo i leggendari: punti in più alle caratteristiche. */
  bonus?: Partial<Caratteristiche>;
  /** Solo gli esotici: l'effetto speciale. */
  effetti: string[];
}

/** I bonus fissi che un compagno dà all'eroe finché è con lui (design §10). */
export const BONUS_COMPAGNO = ['armatura', 'rigenerazione_mana', 'critico', 'cura_nel_tempo'] as const;
/** Le abilità speciali dei compagni che il codice sa eseguire. */
export const ABILITA_COMPAGNO = ['para_colpo', 'scudo_magico', 'segnala_tesori', 'cura_eroe'] as const;

/** Un compagno della taverna, come sta scritto in data/compagni.json. */
export interface DefinizioneCompagno {
  id: string;
  nome: string;
  /** Id della classe in classi.json. */
  classe: string;
  descrizione: string;
  colore: string;
  vita: number;
  velocita: number;
  /** Danno del suo attacco: più piccolo di quello dell'eroe (circa metà danno, §10). */
  danno: number | string;
  /** Da quanto lontano colpisce (dardi di Elisa: molto). */
  portata: number;
  ricaricaMs: number;
  /** Si paga una volta sola. */
  prezzo: number;
  proiettile?: DefinizioneProiettile;
  bonus: { tipo: (typeof BONUS_COMPAGNO)[number]; valore: number; descrizione: string };
  abilita: {
    id: (typeof ABILITA_COMPAGNO)[number];
    nome: string;
    descrizione: string;
    ricaricaMs: number;
    quantita?: number;
    durataMs?: number;
    raggio?: number;
  };
}

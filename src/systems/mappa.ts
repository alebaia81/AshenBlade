// Lettura e interrogazione delle mappe scritte come griglie di caratteri.
// La scena non guarda mai direttamente le stringhe della griglia: chiede a
// queste funzioni ("qui si può camminare?", "dov'è la partenza?").

import type { Griglia } from './percorso';
import type { AspettoCartello, Cella, DefinizioneMappa, Destinazione, Mappa, TipoCella, VoceLegenda } from './tipi';

const TIPI_VALIDI: readonly TipoCella[] = ['muro', 'pavimento', 'partenza', 'arrivo', 'uscita', 'nemico', 'forziere', 'segreto', 'abitante', 'vena', 'cartello', 'porta', 'barriera'];

/** Errore con un messaggio pensato per essere letto da una persona. */
export class ErroreMappa extends Error {
  constructor(idMappa: string, dettaglio: string) {
    super(`Mappa "${idMappa}": ${dettaglio}`);
    this.name = 'ErroreMappa';
  }
}

/**
 * Controlla una definizione di mappa e la trasforma in una Mappa pronta all'uso.
 * Meglio fallire subito con un messaggio chiaro che avere un eroe che
 * attraversa i muri senza capire perché.
 */
export function analizzaMappa(def: DefinizioneMappa): Mappa {
  const id = def.id;
  if (def.griglia.length === 0) throw new ErroreMappa(id, 'la griglia è vuota');

  controllaLegenda(def);

  // [...riga] divide la stringa in caratteri singoli.
  const simboli = def.griglia.map((riga) => [...riga]);
  const larghezza = simboli[0]!.length;
  let partenze = 0;

  simboli.forEach((riga, r) => {
    // Nei messaggi contiamo da 1, come farebbe una persona leggendo il file.
    if (riga.length !== larghezza) {
      throw new ErroreMappa(
        id,
        `riga ${r + 1} lunga ${riga.length} caratteri, attesi ${larghezza} come la prima`,
      );
    }
    riga.forEach((simbolo, c) => {
      const voce = def.legenda[simbolo];
      if (!voce) {
        throw new ErroreMappa(
          id,
          `simbolo "${simbolo}" non presente in legenda (riga ${r + 1}, colonna ${c + 1})`,
        );
      }
      if (voce.tipo === 'partenza') partenze++;
    });
  });

  if (partenze > 1) throw new ErroreMappa(id, `ci sono ${partenze} punti di partenza, ne serve al massimo uno`);

  return { id, nome: def.nome, larghezza, altezza: simboli.length, legenda: def.legenda, simboli, ...(def.notte ? { notte: true } : {}) };
}

function controllaLegenda(def: DefinizioneMappa): void {
  for (const [simbolo, voce] of Object.entries(def.legenda)) {
    if ([...simbolo].length !== 1) {
      throw new ErroreMappa(def.id, `in legenda "${simbolo}" deve essere un solo carattere`);
    }
    if (!TIPI_VALIDI.includes(voce.tipo)) {
      throw new ErroreMappa(def.id, `tipo "${voce.tipo}" sconosciuto per il simbolo "${simbolo}"`);
    }
    if (voce.tipo === 'uscita' && (!voce.verso || !voce.arrivo)) {
      throw new ErroreMappa(def.id, `l'uscita "${simbolo}" deve indicare "verso" e "arrivo"`);
    }
    if (voce.tipo === 'forziere' && !Array.isArray(voce.contenuto)) {
      throw new ErroreMappa(def.id, `il forziere "${simbolo}" deve indicare il suo "contenuto" (anche vuoto: [])`);
    }
    if (voce.tipo === 'abitante' && !voce.abitante) {
      throw new ErroreMappa(def.id, `l'abitante "${simbolo}" deve indicare chi è ("abitante": "gemma")`);
    }
    if (voce.tipo === 'vena' && (!voce.materiale || !Array.isArray(voce.quantita))) {
      throw new ErroreMappa(def.id, `la vena "${simbolo}" deve indicare "materiale" e "quantita" ([minimo, massimo])`);
    }
    if (voce.tipo === 'cartello' && (!voce.testo || !['cartello', 'cancello', 'frana', 'ramo', 'nebbia', 'lapide', 'germoglio'].includes(voce.aspetto ?? ''))) {
      throw new ErroreMappa(def.id, `il cartello "${simbolo}" deve indicare "testo" e "aspetto" (cartello, cancello o frana)`);
    }
    if (voce.tipo === 'porta' && !voce.chiave) throw new ErroreMappa(def.id, `la porta "${simbolo}" deve indicare la sua "chiave"`);
    if (voce.tipo === 'barriera' && !voce.boss) throw new ErroreMappa(def.id, `la barriera "${simbolo}" deve indicare il suo "boss"`);
    if (voce.tipo === 'nemico' && !voce.nemico) {
      throw new ErroreMappa(def.id, `il nemico "${simbolo}" deve indicare quale nemico è ("nemico": "slime")`);
    }
  }
}

/** Voce di legenda in una posizione, o undefined se fuori mappa. */
export function voceIn(mappa: Mappa, col: number, riga: number): VoceLegenda | undefined {
  const simbolo = mappa.simboli[riga]?.[col];
  return simbolo === undefined ? undefined : mappa.legenda[simbolo];
}

/** Si può camminare qui? Fuori dalla mappa la risposta è no. */
export function èCalpestabile(mappa: Mappa, col: number, riga: number): boolean {
  const voce = voceIn(mappa, col, riga);
  // Anche i forzieri sono "pieni": non si attraversano, si aprono da vicino.
  // I muri segreti sono pieni finché restano chiusi (la scena sa quali sono aperti).
  // Anche le persone del villaggio non si attraversano: ci si parla da vicino.
  return voce !== undefined && !['muro', 'forziere', 'segreto', 'abitante', 'vena', 'cartello', 'porta'].includes(voce.tipo);
}

/** Prima cella che contiene il simbolo indicato (partenza o punto d'arrivo). */
export function trovaPunto(mappa: Mappa, simbolo: string): Cella | undefined {
  for (let riga = 0; riga < mappa.altezza; riga++) {
    const col = mappa.simboli[riga]!.indexOf(simbolo);
    if (col !== -1) return { col, riga };
  }
  return undefined;
}

/** Se la cella è un'uscita, dice dove porta. */
export function uscitaIn(mappa: Mappa, col: number, riga: number): Destinazione | undefined {
  const voce = voceIn(mappa, col, riga);
  if (voce?.tipo !== 'uscita' || !voce.verso || !voce.arrivo) return undefined;
  return { verso: voce.verso, arrivo: voce.arrivo };
}

/** Dove nascono i nemici e quali. Sotto un nemico c'è pavimento. */
export function celleNemico(mappa: Mappa): { cella: Cella; idNemico: string }[] {
  const risultato: { cella: Cella; idNemico: string }[] = [];
  mappa.simboli.forEach((riga, r) =>
    riga.forEach((simbolo, c) => {
      const voce = mappa.legenda[simbolo];
      if (voce?.tipo === 'nemico' && voce.nemico) risultato.push({ cella: { col: c, riga: r }, idNemico: voce.nemico });
    }),
  );
  return risultato;
}

/**
 * Simbolo del punto in cui entrare nella mappa quando non si arriva da un'uscita
 * (per esempio con il teletrasporto della modalità sviluppatore): la partenza,
 * altrimenti il primo punto d'arrivo presente nella griglia.
 */
export function puntoIngressoPredefinito(mappa: Mappa): string | undefined {
  const candidati = Object.entries(mappa.legenda)
    .filter(([, voce]) => voce.tipo === 'partenza' || voce.tipo === 'arrivo')
    .sort(([, a], [, b]) => (a.tipo === 'partenza' ? -1 : 0) - (b.tipo === 'partenza' ? -1 : 0))
    .map(([simbolo]) => simbolo);
  return candidati.find((simbolo) => trovaPunto(mappa, simbolo) !== undefined);
}

/**
 * La mappa vista dalla ricerca del percorso: solo "qui si può camminare?".
 * "aperta" dice se una cella normalmente piena è stata aperta (muro segreto, porta).
 * "chiusa" il contrario: una cella normalmente libera che ora è chiusa (la barriera del boss).
 */
export function grigliaDellaMappa(
  mappa: Mappa,
  aperta: (col: number, riga: number) => boolean = () => false,
  chiusa: (col: number, riga: number) => boolean = () => false,
): Griglia {
  return {
    larghezza: mappa.larghezza,
    altezza: mappa.altezza,
    calpestabile: (col, riga) => (èCalpestabile(mappa, col, riga) || aperta(col, riga)) && !chiusa(col, riga),
  };
}

/** Dove sono i muri segreti. */
export function celleSegrete(mappa: Mappa): Cella[] {
  const risultato: Cella[] = [];
  mappa.simboli.forEach((riga, r) =>
    riga.forEach((simbolo, c) => {
      if (mappa.legenda[simbolo]?.tipo === 'segreto') risultato.push({ col: c, riga: r });
    }),
  );
  return risultato;
}

/** Dove sono i forzieri e cosa contengono (oggetti e monete). */
export function celleForziere(mappa: Mappa): { cella: Cella; contenuto: string[]; monete: number; chiusoCon?: string }[] {
  const risultato: { cella: Cella; contenuto: string[]; monete: number; chiusoCon?: string }[] = [];
  mappa.simboli.forEach((riga, r) =>
    riga.forEach((simbolo, c) => {
      const voce = mappa.legenda[simbolo];
      if (voce?.tipo !== 'forziere') return;
      const base = { cella: { col: c, riga: r }, contenuto: voce.contenuto ?? [], monete: voce.monete ?? 0 };
      risultato.push(voce.chiusoCon ? { ...base, chiusoCon: voce.chiusoCon } : base);
    }),
  );
  return risultato;
}

/** Dove sono le vene di minerale, cosa contengono e quanto. */
export interface CellaVena {
  cella: Cella;
  materiale: string;
  quantita: [number, number];
  aspetto: 'roccia' | 'cespuglio';
}

export function celleVena(mappa: Mappa): CellaVena[] {
  const risultato: CellaVena[] = [];
  mappa.simboli.forEach((riga, r) =>
    riga.forEach((simbolo, c) => {
      const voce = mappa.legenda[simbolo];
      if (voce?.tipo === 'vena' && voce.materiale && voce.quantita) risultato.push({ cella: { col: c, riga: r }, materiale: voce.materiale, quantita: voce.quantita, aspetto: voce.aspetto === 'cespuglio' ? 'cespuglio' : 'roccia' });
    }),
  );
  return risultato;
}

/** Dove stanno le persone del villaggio, e chi sono. */
export function celleAbitante(mappa: Mappa): { cella: Cella; idAbitante: string }[] {
  const risultato: { cella: Cella; idAbitante: string }[] = [];
  mappa.simboli.forEach((riga, r) =>
    riga.forEach((simbolo, c) => {
      const voce = mappa.legenda[simbolo];
      if (voce?.tipo === 'abitante' && voce.abitante) risultato.push({ cella: { col: c, riga: r }, idAbitante: voce.abitante });
    }),
  );
  return risultato;
}

/** I cartelli, i cancelli e le frane (fase 7b): si cliccano e dicono qualcosa. */
export interface CellaCartello {
  cella: Cella;
  aspetto: AspettoCartello;
  testo: string;
  oggetto?: string;
  testoConOggetto?: string;
}

export function celleCartello(mappa: Mappa): CellaCartello[] {
  const risultato: CellaCartello[] = [];
  mappa.simboli.forEach((riga, r) =>
    riga.forEach((simbolo, c) => {
      const voce = mappa.legenda[simbolo];
      if (voce?.tipo !== 'cartello') return;
      const { oggetto, testoConOggetto } = voce;
      risultato.push({ cella: { col: c, riga: r }, aspetto: voce.aspetto as AspettoCartello, testo: voce.testo!, ...(oggetto ? { oggetto, testoConOggetto } : {}) });
    }),
  );
  return risultato;
}

/** Le porte chiuse a chiave (fase 8a). */
export function cellePorte(mappa: Mappa): { cella: Cella; chiave: string; nome: string; aspetto: 'legno' | 'cancello' }[] {
  const risultato: { cella: Cella; chiave: string; nome: string; aspetto: 'legno' | 'cancello' }[] = [];
  mappa.simboli.forEach((riga, r) =>
    riga.forEach((simbolo, c) => {
      const voce = mappa.legenda[simbolo];
      if (voce?.tipo === 'porta') risultato.push({ cella: { col: c, riga: r }, chiave: voce.chiave!, nome: voce.nome ?? 'la porta', aspetto: voce.aspetto === 'cancello' ? 'cancello' : 'legno' });
    }),
  );
  return risultato;
}

/** Le celle che si chiudono quando comincia lo scontro con il boss (fase 8a). */
export function celleBarriera(mappa: Mappa): { cella: Cella; boss: string }[] {
  const risultato: { cella: Cella; boss: string }[] = [];
  mappa.simboli.forEach((riga, r) =>
    riga.forEach((simbolo, c) => {
      const voce = mappa.legenda[simbolo];
      if (voce?.tipo === 'barriera') risultato.push({ cella: { col: c, riga: r }, boss: voce.boss! });
    }),
  );
  return risultato;
}

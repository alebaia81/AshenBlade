// Effetti a tempo ("buff" e "debuff"): un bonus di forza per 60 secondi,
// il fuoco che brucia per 3 secondi, un nemico rallentato…
// Ogni effetto ricorda fino a quando dura (in millisecondi di gioco), come
// gli stati dell'eroe: niente setTimeout, solo confronti con l'ora attuale.

export interface EffettoAttivo {
  tipo: string;
  valore: number;
  /** Fino a quando dura. */
  fino: number;
  /** Per gli effetti che "colpiscono" a intervalli (fuoco): il prossimo colpo. */
  prossimoColpo?: number;
}

/** Ogni quanto colpiscono gli effetti a intervalli. */
const INTERVALLO_MS = 1000;

/**
 * Aggiunge un effetto. Lo stesso tipo non si somma a se stesso (due pozioni di
 * forza non danno +4): si rinnova la durata e si tiene il valore più alto.
 */
export function aggiungiEffetto(
  effetti: readonly EffettoAttivo[],
  tipo: string,
  valore: number,
  durataMs: number,
  adesso: number,
): EffettoAttivo[] {
  const esistente = effetti.find((e) => e.tipo === tipo && e.fino > adesso);
  const altri = effetti.filter((e) => e.tipo !== tipo);
  const nuovo: EffettoAttivo = {
    tipo,
    valore: Math.max(valore, esistente?.valore ?? 0),
    fino: adesso + durataMs,
    prossimoColpo: esistente?.prossimoColpo ?? adesso + INTERVALLO_MS,
  };
  return [...altri, nuovo];
}

export function attivi(effetti: readonly EffettoAttivo[], adesso: number): EffettoAttivo[] {
  return effetti.filter((e) => e.fino > adesso);
}

/** Bonus totale di un tipo (0 se l'effetto non c'è o è scaduto). */
export function bonus(effetti: readonly EffettoAttivo[], tipo: string, adesso: number): number {
  return attivi(effetti, adesso)
    .filter((e) => e.tipo === tipo)
    .reduce((totale, e) => totale + e.valore, 0);
}

export function rimanente(e: EffettoAttivo, adesso: number): number {
  return Math.max(0, e.fino - adesso);
}

/**
 * Per gli effetti a intervalli: quanti danni fanno da ultimo controllo ad
 * "adesso". Se un fotogramma lento salta due secondi, contano due colpi.
 */
export function danniDaTick(
  effetti: readonly EffettoAttivo[],
  tipo: string,
  adesso: number,
): { effetti: EffettoAttivo[]; danni: number } {
  let danni = 0;
  const aggiornati = effetti.map((e) => {
    if (e.tipo !== tipo || e.prossimoColpo === undefined) return e;
    let prossimo = e.prossimoColpo;
    while (prossimo <= adesso && prossimo <= e.fino) {
      danni += e.valore;
      prossimo += INTERVALLO_MS;
    }
    return { ...e, prossimoColpo: prossimo };
  });
  return { effetti: aggiornati, danni };
}

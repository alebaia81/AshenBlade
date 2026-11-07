// I boss a fasi (design §7, fase 8a): "sotto metà vita cambiano schema di attacco".
// Le fasi sono scritte nei dati (data/boss.json): per ognuna, da quale frazione
// di vita parte e quali attacchi usa. Gli attacchi sono etichette che il codice
// sa eseguire, come gli effetti delle armi: un boss nuovo si scrive coi dati,
// un attacco nuovo richiede codice.

/** Gli attacchi speciali: 8a evoca, 8b carica e crollo dei massi. */
export type AttaccoBoss =
  | { tipo: 'evoca'; nemico: string; quanti: number; massimo: number; ricaricaMs: number }
  /** Si ferma e mira (si vede una linea), poi scatta in linea retta; contro un muro resta stordito. */
  | { tipo: 'carica'; ricaricaMs: number; miraMs: number; velocita: number; durataMs: number; stordimentoMs: number }
  /** Ombre a terra sotto l'eroe e intorno; dopo il preavviso cadono i massi. */
  | { tipo: 'crollo_massi'; ricaricaMs: number; quanti: number; preavvisoMs: number; raggio: number; danno: string }
  /** Fase 8c: sparisce e ricompare in un punto della sua stanza, lontano dall'eroe. */
  | { tipo: 'teletrasporto'; ricaricaMs: number; raggio: number; distanzaMin: number }
  /** Fase 8c: un ventaglio di sfere magiche verso l'eroe. */
  | { tipo: 'incantesimo'; ricaricaMs: number; colpi: number; ventaglioGradi: number; velocita: number; gittata: number; dimensione: number; colore: string; danno: string };

export const TIPI_ATTACCO = ['evoca', 'carica', 'crollo_massi', 'teletrasporto', 'incantesimo'] as const;

export interface FaseBoss {
  /** La fase parte quando la vita scende a questa frazione (1 = dall'inizio). */
  sottoVita: number;
  attacchi: AttaccoBoss[];
  /** Cosa compare a schermo quando la fase comincia. */
  avviso?: string;
}

/** L'ultima fase la cui soglia è già stata raggiunta. Le fasi sono in ordine di soglia decrescente. */
export function faseDi(fasi: readonly FaseBoss[], vita: number, massima: number): number {
  const frazione = vita / massima;
  let attiva = 0;
  fasi.forEach((f, i) => {
    if (frazione <= f.sottoVita) attiva = i;
  });
  return attiva;
}

/** Gli attacchi (indici) la cui ricarica è finita. "ultimoUso" ricorda quando è stato usato ognuno. */
export function attacchiPronti(fase: FaseBoss, ultimoUso: Readonly<Record<number, number>>, adesso: number): number[] {
  return fase.attacchi.flatMap((a, i) => (ultimoUso[i] === undefined || adesso - ultimoUso[i]! >= a.ricaricaMs ? [i] : []));
}

/** Quanti servitori evocare, senza superare il massimo di quelli vivi. */
export function quantiEvocare(a: Extract<AttaccoBoss, { tipo: 'evoca' }>, vivi: number): number {
  return Math.max(0, Math.min(a.quanti, a.massimo - vivi));
}

/**
 * Dove cadono i massi: il primo esattamente sull'eroe (così deve muoversi), gli
 * altri a caso intorno, solo su celle dove si cammina. "casuale" è iniettato
 * come nel combattimento: nei test si usa una sequenza fissa.
 */
export function puntiCrollo(
  eroe: { x: number; y: number },
  quanti: number,
  casuale: () => number,
  calpestabile: (x: number, y: number) => boolean,
  raggioSparsi = 64,
): { x: number; y: number }[] {
  const punti = [{ ...eroe }];
  for (let tentativi = 0; punti.length < quanti && tentativi < quanti * 20; tentativi++) {
    const angolo = casuale() * Math.PI * 2;
    const distanza = 20 + casuale() * (raggioSparsi - 20);
    const p = { x: eroe.x + Math.cos(angolo) * distanza, y: eroe.y + Math.sin(angolo) * distanza };
    if (calpestabile(p.x, p.y)) punti.push(p);
  }
  return punti;
}

/**
 * Dove ricompare il Negromante: un punto libero entro "raggio" da casa sua (così
 * resta nella stanza) e ad almeno "distanzaMin" dall'eroe. Null se non c'è.
 */
export function puntoTeletrasporto(
  casa: { x: number; y: number },
  eroe: { x: number; y: number },
  candidati: readonly { x: number; y: number }[],
  raggio: number,
  distanzaMin: number,
  casuale: () => number,
): { x: number; y: number } | null {
  const buoni = candidati.filter((c) => Math.hypot(c.x - casa.x, c.y - casa.y) <= raggio && Math.hypot(c.x - eroe.x, c.y - eroe.y) >= distanzaMin);
  if (buoni.length === 0) return null;
  return buoni[Math.min(buoni.length - 1, Math.floor(casuale() * buoni.length))]!;
}

/** Le direzioni di un ventaglio di colpi, centrato sulla direzione verso l'eroe. */
export function ventaglio(direzione: { x: number; y: number }, colpi: number, ampiezzaGradi: number): { x: number; y: number }[] {
  const base = Math.atan2(direzione.y, direzione.x);
  const ampiezza = (ampiezzaGradi * Math.PI) / 180;
  return Array.from({ length: colpi }, (_, i) => {
    const angolo = colpi === 1 ? base : base - ampiezza / 2 + (ampiezza * i) / (colpi - 1);
    return { x: Math.cos(angolo), y: Math.sin(angolo) };
  });
}

export function validaBoss(id: string, fasi: readonly FaseBoss[], nemici: readonly string[]): string[] {
  const errori: string[] = [];
  const p = `Boss "${id}"`;
  if (fasi[0]?.sottoVita !== 1) errori.push(`${p}: la prima fase deve partire a vita piena ("sottoVita": 1)`);
  fasi.forEach((f, i) => {
    if (i > 0 && f.sottoVita >= fasi[i - 1]!.sottoVita) errori.push(`${p}: le fasi devono essere in ordine di vita decrescente`);
    for (const a of f.attacchi) {
      if (!(TIPI_ATTACCO as readonly string[]).includes(a.tipo)) errori.push(`${p}: attacco "${a.tipo}" sconosciuto`);
      if (a.tipo === 'evoca' && !nemici.includes(a.nemico)) errori.push(`${p}: evoca "${a.nemico}", che non è un nemico`);
    }
  });
  return errori;
}

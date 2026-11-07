// Le sei caratteristiche di D&D (design §5) e le regole per modificarle.

export const NOMI_CARATTERISTICHE = ['FOR', 'DES', 'COS', 'INT', 'SAG', 'CAR'] as const;
export type NomeCaratteristica = (typeof NOMI_CARATTERISTICHE)[number];
export type Caratteristiche = Record<NomeCaratteristica, number>;

/** Punti liberi da distribuire alla creazione del personaggio. */
export const PUNTI_LIBERI = 2;
/** Nessuna caratteristica può superare questo valore alla creazione. */
export const MASSIMO_ALLA_CREAZIONE = 16;

/**
 * Il modificatore è il numero che conta davvero nelle formule: 10–11 vale 0,
 * ogni 2 punti sopra vale +1, ogni 2 sotto vale −1.
 * Math.floor arrotonda verso il basso anche i negativi: (9 − 10) / 2 = −0,5 → −1.
 */
export function modificatore(valore: number): number {
  return Math.floor((valore - 10) / 2);
}

/** Valori della classe + i punti liberi scelti. Lancia un errore se le scelte non sono valide. */
export function conPuntiLiberi(base: Caratteristiche, scelte: readonly NomeCaratteristica[]): Caratteristiche {
  if (scelte.length !== PUNTI_LIBERI) {
    throw new Error(`Servono esattamente ${PUNTI_LIBERI} punti liberi (ricevuti ${scelte.length})`);
  }
  if (new Set(scelte).size !== scelte.length) {
    throw new Error('Non si possono mettere due punti liberi sulla stessa caratteristica');
  }
  const risultato = { ...base };
  for (const nome of scelte) {
    risultato[nome]++;
    if (risultato[nome] > MASSIMO_ALLA_CREAZIONE) {
      throw new Error(`${nome} non può superare ${MASSIMO_ALLA_CREAZIONE} alla creazione`);
    }
  }
  return risultato;
}

/** Il pulsante "+" della creazione è attivo? (stesse regole di conPuntiLiberi) */
export function puòAggiungereLibero(
  base: Caratteristiche,
  scelte: readonly NomeCaratteristica[],
  nome: NomeCaratteristica,
): boolean {
  return scelte.length < PUNTI_LIBERI && !scelte.includes(nome) && base[nome] + 1 <= MASSIMO_ALLA_CREAZIONE;
}

/** Un punto guadagnato salendo di livello. Dopo la creazione non c'è un tetto. */
export function assegnaPunto(c: Caratteristiche, nome: NomeCaratteristica): Caratteristiche {
  return { ...c, [nome]: c[nome] + 1 };
}

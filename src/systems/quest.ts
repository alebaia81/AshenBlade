// Le quest (design §11, fase 7). Una quest è una LISTA DI PASSI scritta in
// data/quest.json; ogni passo ha un obiettivo di un tipo fisso. Il gioco manda
// qui degli "eventi" (un nemico sconfitto, una persona incontrata…) e queste
// funzioni decidono se un passo avanza. Come un reducer di Redux: stato vecchio
// + evento → stato nuovo, senza toccare scene o disegni.
//
// Nella Partita si salva solo lo stretto necessario per ogni quest iniziata
// (attiva o conclusa, a che passo, quanti nemici). "Disponibile" e "pronta"
// sono valori DERIVATI: si calcolano ogni volta dai dati e dallo zaino.

import { conta, togliPerId, type Inventario } from './inventario';
import { effettoCarisma } from './negozio';

export type Obiettivo =
  | { tipo: 'elimina'; nemico: string; quantita: number }
  | { tipo: 'raccogli'; oggetto: string; quantita: number }
  | { tipo: 'consegna'; oggetto: string; a: string }
  | { tipo: 'parla'; a: string }
  | { tipo: 'raggiungi'; mappa: string }
  | { tipo: 'trova'; forziere: string };

export const TIPI_OBIETTIVO = ['elimina', 'raccogli', 'consegna', 'parla', 'raggiungi', 'trova'] as const;

export interface Passo {
  /** Il testo del registro, es. "Sconfiggi 4 lupi nel bosco". */
  descrizione: string;
  obiettivo: Obiettivo;
}

export interface Ricompensa {
  monete: number;
  esperienza: number;
  oggetti?: { id: string; quantita: number }[];
}

/** Una quest come sta scritta in data/quest.json. */
export interface DefinizioneQuest {
  id: string;
  nome: string;
  tipo: 'principale' | 'secondaria';
  /** Chi la affida (id dell'abitante). */
  daChi: string;
  descrizione: string;
  /** Quest da concludere prima che questa diventi disponibile. */
  richiede?: string[];
  passi: Passo[];
  ricompensa: Ricompensa;
  /** Da chi si torna per la ricompensa (se non è chi l'ha affidata). */
  concludeDa?: string;
  /** Oggetti che si ricevono accettando (la lettera da consegnare). */
  oggettiAllInizio?: { id: string; quantita: number }[];
  /** Si accetta USANDO questo oggetto invece che parlando (la mappa del tesoro). */
  siAccettaCon?: string;
  /** Si conclude da sola appena i passi sono fatti, senza tornare da nessuno. */
  automatica?: boolean;
  /** Per la quest principale: il capitolo che verrà, mostrato nel registro come "sbarrato". */
  prossimo?: string;
}

export type CatalogoQuest = Readonly<Record<string, DefinizioneQuest>>;

/** Ciò che si salva per ogni quest iniziata. */
export interface StatoQuest {
  stato: 'attiva' | 'conclusa';
  /** Indice del passo in corso (= numero di passi quando sono tutti fatti). */
  passo: number;
  /** Nemici sconfitti nel passo "elimina" in corso. */
  conteggio: number;
}

export type Quests = Readonly<Record<string, StatoQuest>>;

/** Gli stati che vede il giocatore. */
export type StatoVisibile = 'non_disponibile' | 'disponibile' | 'attiva' | 'pronta' | 'conclusa';

export type EventoQuest =
  | { tipo: 'sconfitto'; nemico: string }
  | { tipo: 'parlato'; abitante: string }
  | { tipo: 'raggiunto'; mappa: string }
  | { tipo: 'aperto'; forziere: string };

/** La parte della Partita che serve alle quest. */
interface Diario {
  quest: Quests;
  inventario: Inventario;
}

export const chiConclude = (d: DefinizioneQuest) => d.concludeDa ?? d.daChi;

/** "Pronta": tutti i passi fatti, oppure l'ultimo è "raccogli" e nello zaino c'è tutto. */
function èPronta(d: DefinizioneQuest, q: StatoQuest, inv: Inventario): boolean {
  if (q.stato !== 'attiva') return false;
  if (q.passo >= d.passi.length) return true;
  const o = d.passi[q.passo]!.obiettivo;
  return q.passo === d.passi.length - 1 && o.tipo === 'raccogli' && conta(inv, o.oggetto) >= o.quantita;
}

export function statoDi(id: string, quests: Quests, catalogo: CatalogoQuest, inv: Inventario): StatoVisibile {
  const d = catalogo[id];
  if (!d) return 'non_disponibile';
  const q = quests[id];
  if (q?.stato === 'conclusa') return 'conclusa';
  if (q) return èPronta(d, q, inv) ? 'pronta' : 'attiva';
  const requisiti = (d.richiede ?? []).every((r) => quests[r]?.stato === 'conclusa');
  return requisiti ? 'disponibile' : 'non_disponibile';
}

/** Accettare: solo una quest disponibile diventa attiva. Altrimenti restituisce lo stesso oggetto. */
export function accetta(quests: Quests, id: string, catalogo: CatalogoQuest): Quests {
  const d = catalogo[id];
  if (!d || quests[id]) return quests;
  if (!(d.richiede ?? []).every((r) => quests[r]?.stato === 'conclusa')) return quests;
  return { ...quests, [id]: { stato: 'attiva', passo: 0, conteggio: 0 } };
}

/** Il progresso del passo in corso, se è un passo "che si conta". */
export function progresso(d: DefinizioneQuest, q: StatoQuest, inv: Inventario): { fatti: number; servono: number } | null {
  const o = d.passi[q.passo]?.obiettivo;
  if (o?.tipo === 'elimina') return { fatti: q.conteggio, servono: o.quantita };
  if (o?.tipo === 'raccogli') return { fatti: Math.min(conta(inv, o.oggetto), o.quantita), servono: o.quantita };
  return null;
}

/**
 * Manda un evento a TUTTE le quest attive. Restituisce il nuovo stato e gli
 * avvisi da mostrare ("Sconfiggi 4 lupi: 3 / 4"). nomeDi traduce l'id di una
 * persona nel suo nome, per l'avviso "Torna da Dario".
 */
export function registraEvento<T extends Diario>(
  s: T,
  evento: EventoQuest,
  catalogo: CatalogoQuest,
  nomeDi: (abitante: string) => string = (a) => a,
): { stato: T; avvisi: string[] } {
  let { quest, inventario } = s;
  const avvisi: string[] = [];
  for (const [id, q] of Object.entries(s.quest)) {
    const d = catalogo[id];
    const passo = d?.passi[q.passo];
    if (!d || !passo || q.stato !== 'attiva') continue;
    const o = passo.obiettivo;
    let avanza = false;
    let conteggio = q.conteggio;
    if (o.tipo === 'elimina' && evento.tipo === 'sconfitto' && evento.nemico === o.nemico) {
      conteggio++;
      avvisi.push(`${passo.descrizione}: ${Math.min(conteggio, o.quantita)} / ${o.quantita}`);
      avanza = conteggio >= o.quantita;
    } else if (o.tipo === 'consegna' && evento.tipo === 'parlato' && evento.abitante === o.a) {
      const dopo = togliPerId(inventario, o.oggetto, 1);
      if (dopo) {
        inventario = dopo;
        avanza = true;
      }
    } else if (o.tipo === 'parla' && evento.tipo === 'parlato' && evento.abitante === o.a) avanza = true;
    else if (o.tipo === 'raggiungi' && evento.tipo === 'raggiunto' && evento.mappa === o.mappa) avanza = true;
    else if (o.tipo === 'trova' && evento.tipo === 'aperto' && evento.forziere === o.forziere) avanza = true;

    if (!avanza && conteggio === q.conteggio) continue;
    const nuovo: StatoQuest = avanza ? { ...q, passo: q.passo + 1, conteggio: 0 } : { ...q, conteggio };
    quest = { ...quest, [id]: nuovo };
    if (!avanza) continue;
    if (nuovo.passo >= d.passi.length) avvisi.push(`«${d.nome}»: fatto! Torna da ${nomeDi(chiConclude(d))}`);
    else avvisi.push(`«${d.nome}»: ${d.passi[nuovo.passo]!.descrizione}`);
  }
  return { stato: { ...s, quest, inventario }, avvisi };
}

/** Avviso quando entra nello zaino un oggetto che una quest "raccogli" sta aspettando. */
export function avvisiRaccolta(quests: Quests, catalogo: CatalogoQuest, inv: Inventario, idOggetto: string): string[] {
  const avvisi: string[] = [];
  for (const [id, q] of Object.entries(quests)) {
    const d = catalogo[id];
    const passo = d?.passi[q.passo];
    if (!d || !passo || q.stato !== 'attiva' || passo.obiettivo.tipo !== 'raccogli' || passo.obiettivo.oggetto !== idOggetto) continue;
    const p = progresso(d, q, inv)!;
    avvisi.push(`${passo.descrizione}: ${p.fatti} / ${p.servono}`);
  }
  return avvisi;
}

export type EsitoConclusione<T> =
  | { ok: true; stato: T; esperienza: number; oggetti: { id: string; quantita: number }[] }
  | { ok: false; errore: string };

/**
 * Concludere: toglie gli oggetti di un passo "raccogli", aggiunge le monete
 * (con il Carisma, come i prezzi del negozio) e segna la quest conclusa.
 * Esperienza e oggetti tornano al chiamante: l'esperienza può far salire di
 * livello e gli oggetti, con lo zaino pieno, cadono a terra.
 */
export function concludi<T extends Diario & { monete: number }>(s: T, id: string, catalogo: CatalogoQuest, modificatoreCAR: number): EsitoConclusione<T> {
  const d = catalogo[id];
  const q = s.quest[id];
  if (!d || !q || !èPronta(d, q, s.inventario)) return { ok: false, errore: 'La quest non è ancora finita' };
  let inventario = s.inventario;
  const o = d.passi[q.passo]?.obiettivo;
  if (o?.tipo === 'raccogli') {
    const dopo = togliPerId(inventario, o.oggetto, o.quantita);
    if (!dopo) return { ok: false, errore: 'Mancano degli oggetti' };
    inventario = dopo;
  }
  const monete = Math.round(d.ricompensa.monete * (1 + effettoCarisma(modificatoreCAR)));
  return {
    ok: true,
    stato: { ...s, inventario, monete: s.monete + monete, quest: { ...s.quest, [id]: { stato: 'conclusa', passo: d.passi.length, conteggio: 0 } } },
    esperienza: d.ricompensa.esperienza,
    oggetti: d.ricompensa.oggetti ?? [],
  };
}

/** Le quest "automatiche" pronte: la scena le conclude subito. */
export function automatichePronte(quests: Quests, catalogo: CatalogoQuest, inv: Inventario): string[] {
  return Object.keys(quests).filter((id) => catalogo[id]?.automatica && statoDi(id, quests, catalogo, inv) === 'pronta');
}

/** "!" = ha una quest per te; "?" = torna qui, è pronta; "?attiva" = in corso (? grigio). */
export type Segno = '!' | '?' | '?attiva' | null;

export function segnoSopra(abitante: string, quests: Quests, catalogo: CatalogoQuest, inv: Inventario): Segno {
  let segno: Segno = null;
  for (const d of Object.values(catalogo)) {
    const stato = statoDi(d.id, quests, catalogo, inv);
    const q = quests[d.id];
    const passo = q ? d.passi[q.passo]?.obiettivo : undefined;
    // Un passo "consegna" o "parla" verso questa persona: è lei che aspetti.
    const attesoQui = stato === 'attiva' && (passo?.tipo === 'consegna' || passo?.tipo === 'parla') && passo.a === abitante;
    if (attesoQui) return '?';
    // Le quest della mappa del tesoro non passano da nessuno: niente segni.
    if (d.automatica || d.siAccettaCon) continue;
    if (stato === 'pronta' && chiConclude(d) === abitante) return '?';
    if (stato === 'disponibile' && d.daChi === abitante) segno = '!';
    else if (stato === 'attiva' && chiConclude(d) === abitante && segno === null) segno = '?attiva';
  }
  return segno;
}

/** Cosa esiste nel gioco, per controllare i riferimenti. */
export interface Conosciuti {
  nemici: readonly string[];
  oggetti: readonly string[];
  abitanti: readonly string[];
  mappe: readonly string[];
  /** Forzieri come "mappa:colonna:riga". */
  forzieri?: readonly string[];
}

export function validaQuest(catalogo: CatalogoQuest, c: Conosciuti): string[] {
  const errori: string[] = [];
  for (const [id, d] of Object.entries(catalogo)) {
    const p = `Quest "${id}"`;
    if (d.id !== id) errori.push(`${p}: l'id interno è "${d.id}"`);
    for (const a of [d.daChi, chiConclude(d)]) if (!c.abitanti.includes(a)) errori.push(`${p}: la persona "${a}" non esiste`);
    for (const r of d.richiede ?? []) if (!catalogo[r]) errori.push(`${p}: richiede "${r}", che non è una quest`);
    if (d.passi.length === 0) errori.push(`${p}: non ha passi`);
    d.passi.forEach((passo, i) => {
      const o = passo.obiettivo;
      if (!(TIPI_OBIETTIVO as readonly string[]).includes(o.tipo)) errori.push(`${p}: il tipo di obiettivo "${o.tipo}" non esiste`);
      if (o.tipo === 'elimina' && !c.nemici.includes(o.nemico)) errori.push(`${p}: il nemico "${o.nemico}" non esiste`);
      if ((o.tipo === 'raccogli' || o.tipo === 'consegna') && !c.oggetti.includes(o.oggetto)) errori.push(`${p}: l'oggetto "${o.oggetto}" non esiste`);
      if ((o.tipo === 'consegna' || o.tipo === 'parla') && !c.abitanti.includes(o.a)) errori.push(`${p}: la persona "${o.a}" non esiste`);
      if (o.tipo === 'raggiungi' && !c.mappe.includes(o.mappa)) errori.push(`${p}: la mappa "${o.mappa}" non esiste`);
      if (o.tipo === 'trova' && c.forzieri && !c.forzieri.includes(o.forziere)) errori.push(`${p}: il forziere "${o.forziere}" non esiste`);
      // Il progresso di "raccogli" si legge dallo zaino: dopo, nessun passo saprebbe quando toglierli.
      if (o.tipo === 'raccogli' && i !== d.passi.length - 1) errori.push(`${p}: "raccogli" può essere solo l'ultimo passo`);
    });
    for (const o of [...(d.ricompensa.oggetti ?? []), ...(d.oggettiAllInizio ?? [])]) if (!c.oggetti.includes(o.id)) errori.push(`${p}: l'oggetto "${o.id}" non esiste`);
    if (d.siAccettaCon && !c.oggetti.includes(d.siAccettaCon)) errori.push(`${p}: si accetta con "${d.siAccettaCon}", che non esiste`);
  }
  return errori;
}

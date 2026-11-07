// Potenziamenti delle armi (design §9): da +1 a +5. Ogni livello dà +1 al danno,
// il "bonus di potenziamento" della formula del §7.
//
// Un'arma potenziata è un OGGETTO A SÉ con il suo id: "spada_lunga+2". Le
// varianti +1…+5 le crea caricaDati per ogni arma. Così zaino, equipaggiamento,
// preferiti e negozio non devono sapere nulla dei potenziamenti: per loro è
// solo un'altra arma. Qui sotto: come si legge l'id, quanto costa salire,
// e il potenziamento vero e proprio (tutto o niente, come il crafting).

import type { Equipaggiamento } from './equipaggiamento';
import { togliPerId, type Inventario } from './inventario';
import { spendiMonete } from './monete';
import type { Rarita } from './oggetti';
import type { Preferiti } from './preferiti';

export const MASSIMO_POTENZIAMENTO = 5;
const SEPARATORE = '+';

export function idPotenziato(base: string, livello: number): string {
  return livello > 0 ? `${base}${SEPARATORE}${livello}` : base;
}

export function livelloDi(id: string): { base: string; livello: number } {
  const i = id.lastIndexOf(SEPARATORE);
  if (i < 0) return { base: id, livello: 0 };
  return { base: id.slice(0, i), livello: Number(id.slice(i + 1)) };
}

export interface LivelloPotenziamento {
  livello: number;
  materiali: Record<string, number>;
  monete: number;
}

/** data/potenziamenti.json */
export interface TabellaPotenziamenti {
  livelli: LivelloPotenziamento[];
  /** Le monete si moltiplicano per la rarità dell'arma: potenziare un'esotica costa di più. */
  moltiplicatoreRarita: Record<Rarita, number>;
}

export interface Costo {
  materiali: Record<string, number>;
  monete: number;
}

/** Quanto costa passare dal livello attuale al successivo (null = già al massimo). */
export function costoPotenziamento(livelloAttuale: number, rarita: Rarita, t: TabellaPotenziamenti): Costo | null {
  const prossimo = t.livelli.find((l) => l.livello === livelloAttuale + 1);
  if (!prossimo) return null;
  return { materiali: { ...prossimo.materiali }, monete: Math.round(prossimo.monete * t.moltiplicatoreRarita[rarita]) };
}

/** Dove sta l'arma da potenziare: in uno spazio dello zaino o in mano. */
export type DoveArma = { zaino: number } | { spazio: 'primaria' | 'secondaria' };

interface Officina {
  monete: number;
  inventario: Inventario;
  equipaggiamento: Equipaggiamento;
  preferiti: Preferiti;
}

export type EsitoPotenziamento<T> = { ok: true; stato: T; nuovoId: string } | { ok: false; errore: string };

export function potenzia<T extends Officina>(s: T, dove: DoveArma, costo: Costo): EsitoPotenziamento<T> {
  const id = 'zaino' in dove ? s.inventario.spazi[dove.zaino]?.id : s.equipaggiamento[dove.spazio];
  if (!id) return { ok: false, errore: 'Niente da potenziare' };
  const { base, livello } = livelloDi(id);
  if (livello >= MASSIMO_POTENZIAMENTO) return { ok: false, errore: `È già al massimo (+${MASSIMO_POTENZIAMENTO})` };
  const nuovoId = idPotenziato(base, livello + 1);

  // 1. Materiali (togliPerId non tocca lo spazio dell'arma: è un altro oggetto).
  let inventario = s.inventario;
  for (const [m, q] of Object.entries(costo.materiali)) {
    const dopo = togliPerId(inventario, m, q);
    if (!dopo) return { ok: false, errore: `Mancano materiali: servono ${q} × ${m}` };
    inventario = dopo;
  }
  // 2. Monete.
  const pagato = spendiMonete(s, costo.monete);
  if (!pagato) return { ok: false, errore: `Non hai abbastanza monete (ne servono ${costo.monete})` };
  // 3. L'arma cambia id dove si trova; i collegamenti della barra la seguono.
  let equipaggiamento = s.equipaggiamento;
  if ('zaino' in dove) {
    const spazi = [...inventario.spazi];
    spazi[dove.zaino] = { id: nuovoId, quantita: 1 };
    inventario = { ...inventario, spazi };
  } else {
    equipaggiamento = { ...equipaggiamento, [dove.spazio]: nuovoId };
  }
  const preferiti = s.preferiti.map((p) => (p === id ? nuovoId : p));
  return { ok: true, stato: { ...pagato, inventario, equipaggiamento, preferiti }, nuovoId };
}

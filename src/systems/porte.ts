// Porte e forzieri chiusi a chiave (design §11, fase 8a).
// Una porta è un muro segreto con un requisito: si apre solo con la sua chiave,
// e da quel momento resta aperta per sempre (si ricorda nella Partita).
// Le chiavi delle porte sono oggetti "di missione": non si consumano.
// I forzieri chiusi invece consumano una chiave piccola, oppure li apre Volpe,
// la Ladra della taverna, con la sua abilità (§10).

import { conta, togliPerId, type Inventario } from './inventario';

export interface Serratura {
  /** Id dell'oggetto chiave. */
  chiave: string;
  /** Vero per i forzieri (chiave piccola usata), falso per le porte (chiave che resta). */
  consuma: boolean;
}

export type EsitoSerratura =
  | { ok: true; inventario: Inventario; come: 'chiave' | 'volpe' }
  | { ok: false; manca: string };

export function apriConChiave(inv: Inventario, s: Serratura, aiuto: { scassinatore?: boolean } = {}): EsitoSerratura {
  // Volpe prima di tutto: così una chiave piccola resta per un altro forziere.
  if (aiuto.scassinatore && s.consuma) return { ok: true, inventario: inv, come: 'volpe' };
  if (conta(inv, s.chiave) < 1) return { ok: false, manca: s.chiave };
  if (!s.consuma) return { ok: true, inventario: inv, come: 'chiave' };
  return { ok: true, inventario: togliPerId(inv, s.chiave, 1)!, come: 'chiave' };
}

/** "mappa:colonna:riga" delle porte aperte, come per forzieri e muri segreti. */
interface ConPorte {
  porteAperte: string[];
}

export function portaAperta(p: ConPorte, chiave: string): boolean {
  return p.porteAperte.includes(chiave);
}

export function apriPorta<T extends ConPorte>(p: T, chiave: string): T {
  return portaAperta(p, chiave) ? p : { ...p, porteAperte: [...p.porteAperte, chiave] };
}

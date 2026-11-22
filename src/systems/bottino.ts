// Il bottino dei nemici: ogni voce della tabella ha la sua probabilità e si
// tira a parte, quindi un nemico può lasciare niente, una cosa o più cose.
// Dalla fase 10a i boss usano bottinoBoss(): 1 leggendario garantito dalla loro
// lista, 25% di probabilità dell'esotico firma, 1 frammento d'eco; contro l'Eco,
// la prima vittoria garantisce l'esotico firma (o un esotico errante non posseduto).

import type { Casuale } from './casuale';
import type { Partita } from './partita';
import { livelloDi } from './potenziamento';

export interface VoceBottino {
  oggetto: string;
  /** Tra 0 e 1: 0.15 = 15%. */
  probabilita: number;
  /** Quanti ne lascia se esce (1 se non indicato). */
  quantita?: number;
}

/** Gli esotici "erranti" nascosti nei dungeon: l'Eco ne regala uno non posseduto se hai già l'esotico firma. */
export const ESOTICI_ERRANTI = [
  'spada_brace',
  'pugnale_ombra',
  'stivali_vento',
  'elmo_veggente',
  'guanti_predatore',
] as const;

/** Probabilità di trovare l'esotico firma alla prima sconfitta normale del boss (25%). */
export const PROBABILITA_ESOTICO_BOSS = 0.25;

export function tiraBottino(tabella: readonly VoceBottino[], casuale: Casuale): { id: string; quantita: number }[] {
  return tabella
    .filter((voce) => casuale() < voce.probabilita)
    .map((voce) => ({ id: voce.oggetto, quantita: voce.quantita ?? 1 }));
}

export interface DatiBottinoBoss {
  id: string;
  bottino: readonly VoceBottino[];
  leggendari?: readonly string[];
  esoticoFirma?: string;
  /** La Radice Marcia nel dopo-storia non ha un Sigillo dell'Eco. */
  senzaEco?: boolean;
}

/**
 * Vero se l'eroe possiede già un oggetto (nello zaino, nella tasca missioni o
 * equipaggiato), anche in versione potenziata (+1…+5).
 */
export function possiedeOggetto(partita: Pick<Partita, 'inventario' | 'equipaggiamento' | 'tascaMissioni'>, idBase: string): boolean {
  const corrisponde = (id: string | null | undefined) => Boolean(id && livelloDi(id).base === idBase);
  if (partita.inventario.spazi.some((p) => p && corrisponde(p.id))) return true;
  if ((partita.tascaMissioni ?? []).some((p) => corrisponde(p.id))) return true;
  return Object.values(partita.equipaggiamento).some((id) => corrisponde(id));
}

function scegliACaso<T>(lista: readonly T[], casuale: Casuale): T | undefined {
  if (lista.length === 0) return undefined;
  return lista[Math.min(lista.length - 1, Math.floor(casuale() * lista.length))];
}

/**
 * Calcola il bottino lasciato da un boss (normale o Eco) seguendo le regole
 * di espansione.md §4 e §5.1.
 */
export function bottinoBoss(
  def: DatiBottinoBoss,
  partita: Pick<Partita, 'inventario' | 'equipaggiamento' | 'tascaMissioni' | 'ecoSconfitti'>,
  casuale: Casuale,
  eco: boolean,
): { id: string; quantita: number }[] {
  const leggendari = def.leggendari ?? [];

  if (eco) {
    const primaVittoriaEco = !partita.ecoSconfitti.includes(def.id);
    if (primaVittoriaEco) {
      if (def.esoticoFirma && !possiedeOggetto(partita, def.esoticoFirma)) {
        return [{ id: def.esoticoFirma, quantita: 1 }];
      }
      const errantiMancanti = ESOTICI_ERRANTI.filter((id) => !possiedeOggetto(partita, id));
      const errante = scegliACaso(errantiMancanti, casuale);
      if (errante) {
        return [{ id: errante, quantita: 1 }];
      }
      return [{ id: 'frammento_eco', quantita: 2 }];
    }
    // Vittorie Eco successive: un leggendario della lista, mai l'esotico.
    const leggendario = scegliACaso(leggendari, casuale);
    return leggendario ? [{ id: leggendario, quantita: 1 }] : [];
  }

  // Sconfitta normale: bottino base (materiali/oggetti missione) + 1 leggendario garantito + 25% esotico firma + 1 frammento d'eco.
  const risultato = tiraBottino(def.bottino, casuale);
  const leggendario = scegliACaso(leggendari, casuale);
  if (leggendario) risultato.push({ id: leggendario, quantita: 1 });
  if (def.esoticoFirma && !possiedeOggetto(partita, def.esoticoFirma) && casuale() < PROBABILITA_ESOTICO_BOSS) {
    risultato.push({ id: def.esoticoFirma, quantita: 1 });
  }
  if (!def.senzaEco && (leggendari.length > 0 || def.esoticoFirma)) {
    risultato.push({ id: 'frammento_eco', quantita: 1 });
  }
  return risultato;
}

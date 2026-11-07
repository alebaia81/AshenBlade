// Lo stato della partita: chi è il personaggio e come sta.
// Vive FUORI dalle scene (che ripartono a ogni cambio di mappa), un po' come
// uno store globale in un'app web. Sarà anche ciò che il salvataggio della
// fase 9 scriverà nel browser. Ogni funzione restituisce una partita nuova.

import { assegnaPunto, conPuntiLiberi, type Caratteristiche, type NomeCaratteristica } from './caratteristiche';
import { aggiungiEffetto, type EffettoAttivo } from './effettiTemporanei';
import {
  bonusCaratteristiche,
  conBonus,
  creaEquipaggiamento,
  equipaggia,
  scambiaArmi,
  togliDa,
  type CatalogoIndossabili,
  type Equipaggiamento,
  type EsitoEquipaggiamento,
  type SpazioEquipaggiamento,
} from './equipaggiamento';
import { aggiungi, amplia, creaInventario, togli, type Inventario } from './inventario';
import { impara } from './crafting';
import { livelloDa } from './livelli';
import { creaPreferiti, type Preferiti } from './preferiti';
import { creaStatoCompagni, type StatoCompagni } from './taverna';
import type { DefinizioneOggetto } from './oggetti';
import { manaMassimo, vitaMassima, type DefinizioneClasse, type Personaggio } from './personaggio';
import type { Quests } from './quest';
import { creaRisorsa, recupera, type Risorsa } from './risorsa';

export const NOME_PREDEFINITO = 'Viandante';
/** Spazi dello zaino all'inizio (design §8). */
export const CAPACITA_INIZIALE = 12;

export interface Partita {
  personaggio: Personaggio;
  esperienza: number;
  puntiDaAssegnare: number;
  vita: Risorsa;
  /** Massimo 0 per le classi che non usano il mana. */
  mana: Risorsa;
  inventario: Inventario;
  /** Effetti a tempo attivi sull'eroe (pozioni di forza, resistenza…). */
  effetti: EffettoAttivo[];
  /** Forzieri già aperti, come "mappa:colonna:riga": restano aperti per sempre. */
  forzieriAperti: string[];
  /** Muri segreti già aperti, stesso formato dei forzieri. */
  muriAperti: string[];
  /** Armi in mano e armature indossate (ids). */
  equipaggiamento: Equipaggiamento;
  /** La barra dei preferiti: 6 collegamenti a pozioni e armi. */
  preferiti: Preferiti;
  /** Monete: non occupano spazio nello zaino (design §9). */
  monete: number;
  /** Compagni della taverna: chi è stato pagato e chi è con te. */
  compagni: StatoCompagni;
  /** Ricette imparate dalle pergamene (quelle di base Bruno le sa già). */
  ricette: string[];
  /** Le quest iniziate: attive o concluse, a che passo (fase 7). */
  quest: Quests;
  /** Porte aperte con la chiave, "mappa:colonna:riga" (fase 8). */
  porteAperte: string[];
  /** I boss sconfitti: non ricompaiono più (§11). */
  bossSconfitti: string[];
}

export function creaPartita(nome: string, classe: DefinizioneClasse, puntiLiberi: readonly NomeCaratteristica[]): Partita {
  const caratteristiche = conPuntiLiberi(classe.caratteristiche, puntiLiberi);
  const personaggio: Personaggio = {
    nome: nome.trim() || NOME_PREDEFINITO,
    classe: classe.id,
    caratteristiche,
    livello: 1,
  };
  return {
    personaggio,
    esperienza: 0,
    puntiDaAssegnare: 0,
    vita: creaRisorsa(vitaMassima(classe, caratteristiche, 1)),
    mana: creaRisorsa(manaMassimo(classe, caratteristiche)),
    inventario: dotazioneIniziale(classe),
    effetti: [],
    forzieriAperti: [],
    muriAperti: [],
    equipaggiamento: creaEquipaggiamento(classe.arma),
    preferiti: creaPreferiti(classe.manaBase > 0 ? ['pozione_vita', 'pozione_mana'] : ['pozione_vita']),
    monete: 0,
    compagni: creaStatoCompagni(),
    ricette: [],
    quest: {},
    porteAperte: [],
    bossSconfitti: [],
  };
}

/** Si parte con 2 pozioni di vita, più 2 di mana per chi usa il mana. */
function dotazioneIniziale(classe: DefinizioneClasse): Inventario {
  let inv = aggiungi(creaInventario(CAPACITA_INIZIALE), 'pozione_vita', 2, 2).inventario;
  if (classe.manaBase > 0) inv = aggiungi(inv, 'pozione_mana', 2, 2).inventario;
  return inv;
}

export interface EsitoEsperienza {
  partita: Partita;
  livelliGuadagnati: number;
}

/** Aggiunge esperienza; per ogni livello guadagnato c'è un punto da assegnare (§5). */
export function aggiungiEsperienza(
  p: Partita,
  quantita: number,
  classe: DefinizioneClasse,
  soglie: readonly number[],
  /** Punti dei pezzi leggendari indossati: contano per vita e mana massimi. */
  bonus: Partial<Caratteristiche> = {},
): EsitoEsperienza {
  const esperienza = p.esperienza + quantita;
  const livello = livelloDa(esperienza, soglie);
  const livelliGuadagnati = livello - p.personaggio.livello;
  const aggiornata: Partita = {
    ...p,
    esperienza,
    puntiDaAssegnare: p.puntiDaAssegnare + livelliGuadagnati,
    personaggio: { ...p.personaggio, livello },
  };
  return { partita: ricalcolaRisorse(aggiornata, classe, bonus), livelliGuadagnati };
}

export function assegnaPuntoPartita(
  p: Partita,
  nome: NomeCaratteristica,
  classe: DefinizioneClasse,
  bonus: Partial<Caratteristiche> = {},
): Partita {
  if (p.puntiDaAssegnare <= 0) throw new Error('Non ci sono punti da assegnare');
  const aggiornata: Partita = {
    ...p,
    puntiDaAssegnare: p.puntiDaAssegnare - 1,
    personaggio: { ...p.personaggio, caratteristiche: assegnaPunto(p.personaggio.caratteristiche, nome) },
  };
  return ricalcolaRisorse(aggiornata, classe, bonus);
}

/** Vita e mana pieni: si usa per la ricomparsa dopo una sconfitta. */
export function guarisci(p: Partita): Partita {
  return { ...p, vita: recupera(p.vita, p.vita.massima), mana: recupera(p.mana, p.mana.massima) };
}

/**
 * Se un massimo cresce (livello, COS, INT), cresce anche il valore attuale della
 * stessa quantità: salire di livello in mezzo a un combattimento deve aiutare,
 * non lasciare la barra "vuota" in proporzione.
 */
function ricalcolaRisorse(p: Partita, classe: DefinizioneClasse, bonus: Partial<Caratteristiche>): Partita {
  const { livello } = p.personaggio;
  const caratteristiche = conBonus(p.personaggio.caratteristiche, bonus);
  return {
    ...p,
    vita: adatta(p.vita, vitaMassima(classe, caratteristiche, livello), 1),
    mana: adatta(p.mana, manaMassimo(classe, caratteristiche), 0),
  };
}

function adatta(r: Risorsa, massima: number, minimo: number): Risorsa {
  const attuale = Math.min(massima, Math.max(minimo, r.attuale + (massima - r.massima)));
  return { attuale, massima };
}

// ---- oggetti e forzieri ----

export interface EsitoUso {
  /** La stessa partita (===) se non è cambiato nulla. */
  partita: Partita;
  /** Cosa dire al giocatore ("+12 vita", "Vita già piena"…), o null. */
  messaggio: string | null;
}

/** Usa l'oggetto nello spazio "indice" dello zaino. */
export function usaOggetto(
  p: Partita,
  indice: number,
  catalogo: Readonly<Record<string, DefinizioneOggetto>>,
  adesso: number,
): EsitoUso {
  const pila = p.inventario.spazi[indice];
  if (!pila) return { partita: p, messaggio: null };
  const definizione = catalogo[pila.id];
  const effetto = definizione?.effetto;
  if (!definizione || !effetto) return { partita: p, messaggio: 'Non si può usare' };

  // Prima si controlla se ha senso usarlo: una pozione non va sprecata.
  const consumato = (cambiamenti: Partial<Partita>, messaggio: string): EsitoUso => {
    const base = { ...p, ...cambiamenti };
    return { partita: { ...base, inventario: togli(base.inventario, indice, 1) }, messaggio };
  };
  switch (effetto.tipo) {
    case 'cura': {
      if (p.vita.attuale >= p.vita.massima) return { partita: p, messaggio: 'Vita già piena' };
      const vita = recupera(p.vita, effetto.quantita);
      return consumato({ vita }, `+${vita.attuale - p.vita.attuale} vita`);
    }
    case 'mana': {
      if (p.mana.massima === 0) return { partita: p, messaggio: 'Non usi il mana' };
      if (p.mana.attuale >= p.mana.massima) return { partita: p, messaggio: 'Mana già pieno' };
      const mana = recupera(p.mana, effetto.quantita);
      return consumato({ mana }, `+${Math.round(mana.attuale - p.mana.attuale)} mana`);
    }
    case 'temporaneo': {
      const effetti = aggiungiEffetto(p.effetti, effetto.effetto, effetto.valore, effetto.durataMs, adesso);
      return consumato({ effetti }, `${definizione.nome}: +${effetto.valore} per ${effetto.durataMs / 1000} s`);
    }
    case 'ricetta': {
      const appresa = impara(p.ricette, effetto.ricetta);
      if (!appresa.nuova) return { partita: p, messaggio: 'Conosci già questa ricetta' };
      return consumato({ ricette: appresa.ricette }, `Nuova ricetta per Bruno: ${definizione.nome.replace(/^Pergamena: /, '')}`);
    }
    case 'mappa':
      // La mappa non cambia la Partita: la scena mostra il disegno e avvia la quest.
      return { partita: p, messaggio: null };
    case 'capacita': {
      if (effetto.spazi <= p.inventario.capacita) return { partita: p, messaggio: 'Hai già uno zaino così grande' };
      return consumato({ inventario: amplia(p.inventario, effetto.spazi) }, `Zaino: ${effetto.spazi} spazi`);
    }
  }
}

export function forziereAperto(p: Partita, chiave: string): boolean {
  return p.forzieriAperti.includes(chiave);
}

export function apriForziere(p: Partita, chiave: string): Partita {
  return forziereAperto(p, chiave) ? p : { ...p, forzieriAperti: [...p.forzieriAperti, chiave] };
}

// ---- equipaggiamento ----

/** Caratteristiche di base più i bonus dei pezzi leggendari indossati. */
export function caratteristicheTotali(p: Partita, catalogo: CatalogoIndossabili): Caratteristiche {
  return conBonus(p.personaggio.caratteristiche, bonusCaratteristiche(p.equipaggiamento, catalogo));
}

export interface EsitoIndossa {
  /** La stessa partita (===) se non è cambiato nulla. */
  partita: Partita;
  /** Il motivo del rifiuto, oppure null se è andata bene. */
  messaggio: string | null;
}

/** Indossa (o impugna) l'oggetto in uno spazio dello zaino. Per le armi si può scegliere lo spazio. */
export function indossa(
  p: Partita,
  indice: number,
  catalogo: CatalogoIndossabili,
  classe: DefinizioneClasse,
  spazioScelto?: 'primaria' | 'secondaria',
): EsitoIndossa {
  return applica(p, equipaggia(p, indice, catalogo, { haMana: p.mana.massima > 0 }, spazioScelto), catalogo, classe);
}

/** Scambia tra loro l'arma primaria e quella secondaria. */
export function invertiArmi(p: Partita, catalogo: CatalogoIndossabili, classe: DefinizioneClasse): EsitoIndossa {
  return applica(p, scambiaArmi(p), catalogo, classe);
}

/** Toglie il pezzo di uno spazio e lo rimette nello zaino. */
export function togliIndossato(
  p: Partita,
  spazio: SpazioEquipaggiamento,
  catalogo: CatalogoIndossabili,
  classe: DefinizioneClasse,
): EsitoIndossa {
  return applica(p, togliDa(p, spazio), catalogo, classe);
}

/** Un pezzo leggendario può cambiare COS o INT: vita e mana massimi vanno ricalcolati. */
function applica(p: Partita, esito: EsitoEquipaggiamento, catalogo: CatalogoIndossabili, classe: DefinizioneClasse): EsitoIndossa {
  if (!esito.ok) return { partita: p, messaggio: esito.errore };
  const aggiornata: Partita = { ...p, ...esito.stato };
  const bonus = bonusCaratteristiche(aggiornata.equipaggiamento, catalogo);
  return { partita: ricalcolaRisorse(aggiornata, classe, bonus), messaggio: null };
}

export function muroAperto(p: Partita, chiave: string): boolean {
  return p.muriAperti.includes(chiave);
}

export function apriMuro(p: Partita, chiave: string): Partita {
  return muroAperto(p, chiave) ? p : { ...p, muriAperti: [...p.muriAperti, chiave] };
}

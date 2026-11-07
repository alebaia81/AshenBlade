// Registro dei comportamenti: dal nome scritto nei dati del nemico
// ("comportamento": "inseguitore") alla funzione che crea la sua mente.
// Come una tabella di "handler" per tipo di messaggio: per aggiungere il
// tiratore e il caricatore (fase 8b) è bastato aggiungere due righe qui.

import { creaStatoCaricatore, decidiCaricatore, type ParametriCarica } from './caricatore';
import { creaMenteInseguitore, type ParametriInseguitore, type Percezione } from './inseguitore';
import { creaStatoTiratore, decidiTiratore, type AzioneNemico, type ParametriTiro } from './tiratore';

/** Una mente: a ogni fotogramma riceve la percezione e dice cosa fare. */
export type Mente = (percezione: Percezione) => AzioneNemico;
export type { AzioneNemico, Percezione };

/** I parametri arrivano dalla definizione del nemico: tiro e carica servono solo ai loro comportamenti. */
export type ParametriComportamento = ParametriInseguitore & { tiro?: ParametriTiro; carica?: ParametriCarica };

/**
 * Le menti con memoria sono closure: ricordano il loro stato tra un fotogramma
 * e l'altro, mentre le regole (decidi…) restano funzioni pure e testate.
 */
const registro: Record<string, (parametri: ParametriComportamento) => Mente> = {
  inseguitore: (par) => {
    const mente = creaMenteInseguitore(par);
    return (p) => ({ velocita: mente(p) });
  },
  tiratore: (par) => {
    let stato = creaStatoTiratore();
    return (p) => {
      const esito = decidiTiratore(stato, p, { ...par, tiro: par.tiro! });
      stato = esito.stato;
      return esito.azione;
    };
  },
  caricatore: (par) => {
    let stato = creaStatoCaricatore();
    return (p) => {
      const esito = decidiCaricatore(stato, p, { ...par, carica: par.carica! });
      stato = esito.stato;
      return esito.azione;
    };
  },
};

/** Parametri in più che un comportamento richiede nei dati del nemico. */
export const RICHIESTE: Record<string, 'tiro' | 'carica' | undefined> = { tiratore: 'tiro', caricatore: 'carica' };

export function comportamentoEsiste(nome: string): boolean {
  // hasOwnProperty evita di trovare per sbaglio nomi come "toString", ereditati da ogni oggetto.
  return Object.prototype.hasOwnProperty.call(registro, nome);
}

export function creaMente(nome: string, parametri: ParametriComportamento): Mente {
  const fabbrica = registro[nome];
  if (!fabbrica || !comportamentoEsiste(nome)) {
    throw new Error(`Comportamento "${nome}" sconosciuto. Disponibili: ${Object.keys(registro).join(', ')}`);
  }
  return fabbrica(parametri);
}

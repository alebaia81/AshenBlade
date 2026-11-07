// Una "risorsa" è qualcosa che si consuma e si recupera fino a un massimo:
// la vita e (dalla fase 3c) il mana. Una sola implementazione per entrambi.
// Le funzioni non modificano l'oggetto ricevuto ma ne restituiscono uno nuovo
// (come con lo stato in React): così è facile capire se qualcosa è cambiato.

export interface Risorsa {
  attuale: number;
  massima: number;
}

export function creaRisorsa(massima: number): Risorsa {
  return { attuale: massima, massima };
}

export function consuma(r: Risorsa, quantita: number): Risorsa {
  return { ...r, attuale: Math.max(0, r.attuale - quantita) };
}

export function recupera(r: Risorsa, quantita: number): Risorsa {
  return { ...r, attuale: Math.min(r.massima, r.attuale + quantita) };
}

export function èEsaurita(r: Risorsa): boolean {
  return r.attuale <= 0;
}

export function basta(r: Risorsa, quantita: number): boolean {
  return r.attuale >= quantita;
}

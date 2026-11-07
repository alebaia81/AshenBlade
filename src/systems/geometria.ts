// Rettangoli allineati agli assi (AABB) e aree di colpo.
// Un'area di colpo ("hitbox") è un rettangolo invisibile che esiste solo
// mentre l'attacco è attivo: se tocca il corpo di un nemico, il colpo va a segno.

import type { Direzione, Vettore } from './tipi';

/** Rettangolo con l'angolo in alto a sinistra in (x, y). */
export interface Rettangolo {
  x: number;
  y: number;
  larghezza: number;
  altezza: number;
}

/**
 * Due rettangoli si sovrappongono se si sovrappongono sia in orizzontale sia in verticale.
 * È il test di collisione più semplice e veloce che esista: quattro confronti.
 */
export function intersecano(a: Rettangolo, b: Rettangolo): boolean {
  return (
    a.x < b.x + b.larghezza &&
    b.x < a.x + a.larghezza &&
    a.y < b.y + b.altezza &&
    b.y < a.y + a.altezza
  );
}

export function rettangoloDaCentro(centro: Vettore, larghezza: number, altezza: number): Rettangolo {
  return { x: centro.x - larghezza / 2, y: centro.y - altezza / 2, larghezza, altezza };
}

export interface FormaArea {
  /** Quanto si allunga davanti all'eroe. */
  portata: number;
  /** Quanto è larga di traverso. */
  larghezza: number;
}

/** Area di colpo appoggiata al lato dell'eroe verso cui guarda. */
export function areaDiColpo(centro: Vettore, latoEroe: number, direzione: Direzione, forma: FormaArea): Rettangolo {
  const mezzo = latoEroe / 2;
  const { portata, larghezza } = forma;
  switch (direzione) {
    case 'destra':
      return { x: centro.x + mezzo, y: centro.y - larghezza / 2, larghezza: portata, altezza: larghezza };
    case 'sinistra':
      return { x: centro.x - mezzo - portata, y: centro.y - larghezza / 2, larghezza: portata, altezza: larghezza };
    case 'su':
      return { x: centro.x - larghezza / 2, y: centro.y - mezzo - portata, larghezza, altezza: portata };
    case 'giu':
      return { x: centro.x - larghezza / 2, y: centro.y + mezzo, larghezza, altezza: portata };
  }
}

export interface Bersaglio<Id> {
  id: Id;
  rettangolo: Rettangolo;
}

/**
 * Bersagli toccati dall'area e non ancora colpiti in questo fendente.
 * Senza questo controllo un fendente che dura 10 fotogrammi colpirebbe 10 volte.
 */
export function nuoviColpiti<Id>(area: Rettangolo, bersagli: Bersaglio<Id>[], giàColpiti: ReadonlySet<Id>): Id[] {
  return bersagli.filter((b) => !giàColpiti.has(b.id) && intersecano(area, b.rettangolo)).map((b) => b.id);
}

/**
 * Vettore lungo 1 che punta da "da" verso "a": serve per la respinta
 * (il colpito vola via dalla parte opposta a chi l'ha colpito).
 * Se i due punti coincidono scegliamo "in giù", per non dividere per zero.
 */
export function direzioneDa(da: Vettore, a: Vettore): Vettore {
  const d = Math.hypot(a.x - da.x, a.y - da.y);
  return d === 0 ? { x: 0, y: 1 } : { x: (a.x - da.x) / d, y: (a.y - da.y) / d };
}

const VERSI: Record<Direzione, Vettore> = {
  su: { x: 0, y: -1 },
  giu: { x: 0, y: 1 },
  sinistra: { x: -1, y: 0 },
  destra: { x: 1, y: 0 },
};

/**
 * Prodotto scalare tra la direzione in cui si guarda e la direzione verso
 * l'altro: +1 = esattamente davanti, 0 = di lato, −1 = esattamente dietro.
 * È il modo più semplice per sapere "da che parte" arriva qualcosa.
 */
function allineamento(guarda: Vettore, da: Vettore, altro: Vettore): number {
  const verso = direzioneDa(da, altro);
  const lunghezza = Math.hypot(guarda.x, guarda.y) || 1;
  return (guarda.x * verso.x + guarda.y * verso.y) / lunghezza;
}

/** L'attaccante è alle spalle del bersaglio (entro circa 60° dalla schiena)? */
export function alleSpalle(guardaBersaglio: Vettore, bersaglio: Vettore, attaccante: Vettore): boolean {
  return allineamento(guardaBersaglio, bersaglio, attaccante) < -0.5;
}

/** Il nemico arriva davanti all'eroe (entro circa 60°)? Serve alla parata. */
export function arrivaDavanti(guardaEroe: Direzione, eroe: Vettore, nemico: Vettore): boolean {
  return allineamento(VERSI[guardaEroe], eroe, nemico) > 0.5;
}

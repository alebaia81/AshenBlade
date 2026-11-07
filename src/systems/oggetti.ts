// Oggetti: cosa sono (dati) e le loro rarità (design §8).
// Un oggetto NON è una classe con dei metodi: è un pezzo di dati in
// data/oggetti.json. Le regole che lo usano stanno nelle funzioni pure
// (inventario.ts, partita.ts): aggiungere una pozione nuova non richiede codice.

import type { Vettore } from './tipi';

export const RARITA = ['comune', 'non_comune', 'rara', 'leggendaria', 'esotica'] as const;
export type Rarita = (typeof RARITA)[number];

const COLORI: Record<Rarita, string> = {
  comune: '#c8c8c8', // grigio chiaro
  non_comune: '#5fd35f', // verde
  rara: '#5f9fff', // blu
  leggendaria: '#b46bff', // viola
  esotica: '#ffc94a', // oro
};

const NOMI: Record<Rarita, string> = {
  comune: 'Comune',
  non_comune: 'Non comune',
  rara: 'Rara',
  leggendaria: 'Leggendaria',
  esotica: 'Esotica',
};

export function colorePerRarita(r: Rarita): string {
  return COLORI[r];
}

export function nomeRarita(r: Rarita): string {
  return NOMI[r];
}

/** Positivo se a è più rara di b: utile per ordinare. */
export function confrontaRarita(a: Rarita, b: Rarita): number {
  return RARITA.indexOf(a) - RARITA.indexOf(b);
}

/** Cosa succede usando l'oggetto. */
export type EffettoOggetto =
  | { tipo: 'cura'; quantita: number }
  | { tipo: 'mana'; quantita: number }
  | { tipo: 'temporaneo'; effetto: 'forza' | 'resistenza'; valore: number; durataMs: number }
  | { tipo: 'capacita'; spazi: number }
  /** Pergamena: insegna una ricetta al fabbro (e si consuma). */
  | { tipo: 'ricetta'; ricetta: string }
  /** Mappa del tesoro (fase 7b): mostra il disegno e avvia una quest. Non si consuma. */
  | { tipo: 'mappa'; quest: string };

export const EFFETTI_OGGETTO = ['cura', 'mana', 'temporaneo', 'capacita', 'ricetta', 'mappa'] as const;

export interface DefinizioneOggetto {
  id: string;
  nome: string;
  descrizione: string;
  /** Armi e armature stanno nello zaino come gli altri oggetti (caricaDati le aggiunge al catalogo). */
  tipo: 'pozione' | 'borsa' | 'arma' | 'armatura' | 'monete' | 'materiale' | 'pergamena' | 'missione';
  rarita: Rarita;
  /** Quanti ne stanno in uno spazio dello zaino (1 = non si impila). */
  pila: number;
  /** Prezzo pieno in monete (il mercante ricompra a metà, §9). */
  prezzo: number;
  /** Colore dell'icona. */
  colore: string;
  effetto?: EffettoOggetto;
  /** Per armi e armature: che disegno usare per l'icona (spada, arco, elmo…). */
  forma?: string;
}

/**
 * Gli oggetti "di missione" (una lettera, una chiave) non si vendono e non si
 * gettano: perderli bloccherebbe una quest per sempre.
 */
export function èDiMissione(o: Pick<DefinizioneOggetto, 'tipo'> | undefined): boolean {
  return o?.tipo === 'missione';
}

export interface OpzioniCaduta {
  /** Punto da cui escono gli oggetti (es. il forziere o il nemico sconfitto). */
  origine: Vettore;
  /** Direzione preferita (es. la posizione dell'eroe che ha aperto il forziere). */
  verso?: Vettore;
  /** Distanza minima da "origine" (es. 14 px per non sovrapporsi al forziere). */
  distanzaMinima?: number;
  /** Punto valido? (cella calpestabile, lontana da alberi, muri e altri forzieri). */
  libero?: (punto: Vettore) => boolean;
}

/**
 * Calcola dove far atterrare "quanti" oggetti a terra in modo che:
 * - non si sovrappongano tra loro (almeno 11 px di distanza);
 * - non cadano sopra un forziere (se distanzaMinima > 0);
 * - non finiscano dentro o attaccati a un albero/muro dove l'eroe non può camminare.
 */
export function posizioniCaduta(quanti: number, opzioni: OpzioniCaduta): Vettore[] {
  if (quanti <= 0) return [];
  const { origine, verso, distanzaMinima = 0, libero = () => true } = opzioni;
  const angoloBase =
    verso && (verso.x !== origine.x || verso.y !== origine.y)
      ? Math.atan2(verso.y - origine.y, verso.x - origine.x)
      : Math.PI / 2;

  const scelti: Vettore[] = [];
  const DISTANZA_TRA_OGGETTI = 11;

  for (let i = 0; i < quanti; i++) {
    let trovato: Vettore | null = null;
    // Se distanzaMinima === 0 e c'è un solo oggetto, proviamo prima il centro esatto.
    if (quanti === 1 && distanzaMinima === 0 && libero(origine)) {
      trovato = { x: origine.x, y: origine.y };
    }
    const raggioIniziale = Math.max(distanzaMinima, quanti > 1 ? 10 : 0);
    for (let raggio = raggioIniziale; !trovato && raggio <= 48; raggio += 4) {
      if (raggio === 0) {
        if (libero(origine) && scelti.every((p) => Math.hypot(p.x - origine.x, p.y - origine.y) >= DISTANZA_TRA_OGGETTI)) {
          trovato = { x: origine.x, y: origine.y };
        }
        continue;
      }
      const passi = 16;
      const offsetIndice = quanti > 1 ? ((i - (quanti - 1) / 2) * 0.45) : 0;
      for (let p = 0; p < passi; p++) {
        // Alterna angoli a destra e a sinistra della direzione preferita (verso l'eroe).
        const segno = p % 2 === 0 ? 1 : -1;
        const scarto = Math.ceil(p / 2) * ((Math.PI * 2) / passi) * segno;
        const angolo = angoloBase + offsetIndice + scarto;
        const candidato = {
          x: Math.round(origine.x + Math.cos(angolo) * raggio),
          y: Math.round(origine.y + Math.sin(angolo) * raggio),
        };
        const distanteDagliAltri = scelti.every(
          (altro) => Math.hypot(altro.x - candidato.x, altro.y - candidato.y) >= DISTANZA_TRA_OGGETTI,
        );
        if (distanteDagliAltri && libero(candidato)) {
          trovato = candidato;
          break;
        }
      }
    }
    if (!trovato) {
      // Fallback: se tutti i punti vicini sono stretti, ignora la distanza tra oggetti ma rispetta i muri,
      // oppure usa la posizione verso l'eroe.
      for (let raggio = Math.max(distanzaMinima, 12); !trovato && raggio <= 48; raggio += 4) {
        for (let p = 0; p < 16; p++) {
          const angolo = angoloBase + (p * Math.PI * 2) / 16;
          const candidato = {
            x: Math.round(origine.x + Math.cos(angolo) * raggio),
            y: Math.round(origine.y + Math.sin(angolo) * raggio),
          };
          if (libero(candidato)) {
            trovato = candidato;
            break;
          }
        }
      }
    }
    scelti.push(trovato ?? (verso ? { x: verso.x, y: verso.y } : { x: origine.x, y: origine.y }));
  }
  return scelti;
}

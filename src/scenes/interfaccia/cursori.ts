// Cursori del mouse. Sono normali valori della proprietà CSS "cursor":
// la spada è una piccola immagine SVG scritta qui dentro (un "data URL"),
// quindi non serve scaricare nulla. "crosshair" è la riserva se il browser
// non accetta l'immagine.

const SVG_SPADA = [
  "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'>",
  "<path d='M3 3 L15 15' stroke='black' stroke-width='5' stroke-linecap='round'/>",
  "<path d='M3 3 L15 15' stroke='%23eef' stroke-width='2.5' stroke-linecap='round'/>",
  "<path d='M11 18 L18 11' stroke='black' stroke-width='5' stroke-linecap='round'/>",
  "<path d='M11 18 L18 11' stroke='%23d4a72c' stroke-width='2.5' stroke-linecap='round'/>",
  "<path d='M16 16 L21 21' stroke='black' stroke-width='5' stroke-linecap='round'/>",
  "<path d='M16 16 L21 21' stroke='%23704a20' stroke-width='2.5' stroke-linecap='round'/>",
  '</svg>',
].join('');

export const CURSORE_NORMALE = 'default';
/** Il punto attivo (3, 3) è la punta della lama. */
export const CURSORE_ATTACCO = `url("data:image/svg+xml;utf8,${SVG_SPADA}") 3 3, crosshair`;

/** Mirino per le abilità da mirare (palla di fuoco): il cursore a croce del sistema. */
export const CURSORE_MIRA = 'crosshair';

/** Mano: sopra ciò con cui si interagisce (forzieri; dalla fase 5 persone e porte). */
export const CURSORE_INTERAZIONE = 'pointer';

/** Fumetto: sopra una persona con cui parlare. */
const SVG_FUMETTO = [
  "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'>",
  "<path d='M3 4 h18 v11 h-10 l-5 5 v-5 h-3 z' fill='white' stroke='black' stroke-width='1.5' stroke-linejoin='round'/>",
  "<circle cx='8' cy='9.5' r='1.3'/><circle cx='12' cy='9.5' r='1.3'/><circle cx='16' cy='9.5' r='1.3'/>",
  '</svg>',
].join('');
export const CURSORE_PARLA = `url("data:image/svg+xml;utf8,${SVG_FUMETTO}") 3 4, pointer`;

// Le righe di testo che descrivono un oggetto (zaino e scheda le mostrano uguali).

import type { DatiGioco } from '../../data/caricaDati';
import { dannoBaseArma } from '../../systems/combattimento';
import { nomeRarita } from '../../systems/oggetti';
import { NOMI_EFFETTI_SPECIALI, NOMI_SPAZI, conSegno } from './testi';

const secondi = (ms: number) => `${(ms / 1000).toFixed(2).replace('.', ',')} s`;

/** Rarità, a cosa serve e i numeri importanti. */
export function righeOggetto(id: string, dati: DatiGioco): string[] {
  const o = dati.oggetti[id];
  if (!o) return [];
  const righe = [nomeRarita(o.rarita)];
  const arma = dati.armi[id];
  const armatura = dati.armature[id];
  if (arma) {
    const dBase = dannoBaseArma(arma, arma.potenziamento ?? 0);
    const liv = (arma.potenziamento ?? 0) + 1;
    righe.push(`${NOMI_SPAZI[arma.slot]} · danno base ${dBase} (Liv. ${liv}) + ${arma.caratteristica}`);
    if (arma.potenziamento) righe.push(`Potenziamento Liv. ${liv} (+${arma.potenziamento})`);
    if (arma.slot === 'secondaria') righe.push(`Ricarica ${secondi(arma.ricaricaMs)}${arma.proiettile?.costoMana ? ` · ${arma.proiettile.costoMana} mana` : ''}`);
    if (arma.bonusCritico > 0) righe.push(`Critico +${Math.round(arma.bonusCritico * 100)}%`);
    righe.push(...arma.effetti.map((e) => `★ ${NOMI_EFFETTI_SPECIALI[e] ?? e}`));
  }
  if (armatura) {
    righe.push(`${NOMI_SPAZI[armatura.pezzo]} · armatura +${armatura.armatura}`);
    for (const [nome, valore] of Object.entries(armatura.bonus ?? {})) righe.push(`${nome} ${conSegno(valore)}`);
    righe.push(...armatura.effetti.map((e) => `★ ${NOMI_EFFETTI_SPECIALI[e] ?? e}`));
  }
  if (o.tipo === 'missione') righe.push('Oggetto di una quest: non si vende e non si getta.');
  righe.push('', o.descrizione);
  return righe;
}

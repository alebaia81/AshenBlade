// Parata (Guerriero): per un attimo lo scudo è alzato verso il cursore.
// Che il colpo sia parato lo decide chi colpisce (scenes/mondo/gestisciContatti.ts):
// solo i colpi che arrivano davanti.

import type { EseguiAbilita } from './tipi';

export const parata: EseguiAbilita = ({ eroe, adesso }, punto) => eroe.alzaScudo(punto, adesso);

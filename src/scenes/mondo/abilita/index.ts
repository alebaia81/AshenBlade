// Registro delle abilità di classe: dal nome scritto in classi.json alla funzione
// che ne fa l'effetto. Come il registro dei comportamenti dei nemici.
// L'elenco dei nomi deve coincidere con ABILITA_CONOSCIUTE in systems/abilita.ts
// (che usa la validazione dei dati, senza dipendere da Phaser).

import type { ABILITA_CONOSCIUTE } from '../../../systems/abilita';
import { cura } from './cura';
import { pallaDiFuoco } from './pallaDiFuoco';
import { parata } from './parata';
import { scattoOmbra } from './scattoOmbra';
import type { EseguiAbilita } from './tipi';

// Il tipo Record<…> obbliga TypeScript a controllare che ci siano TUTTE le abilità conosciute.
export const ABILITA: Record<(typeof ABILITA_CONOSCIUTE)[number], EseguiAbilita> = {
  parata,
  palla_di_fuoco: pallaDiFuoco,
  scatto_ombra: scattoOmbra,
  cura,
};

export type { ContestoAbilita } from './tipi';

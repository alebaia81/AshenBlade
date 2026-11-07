// Scatto nell'ombra (Ladro): invisibile per qualche secondo. I nemici smettono
// di vederlo e tornano a casa (la scena passa loro "nessun bersaglio").
// L'invisibilità finisce se il Ladro attacca: è il momento giusto per colpire alle spalle.

import type { EseguiAbilita } from './tipi';

export const scattoOmbra: EseguiAbilita = ({ scena, eroe, abilita, adesso }) => {
  eroe.rendiInvisibile(adesso + (abilita.durataMs ?? 3000));
  const fumo = scena.add.circle(eroe.x, eroe.y, 8, 0x333344, 0.6).setDepth(13);
  scena.tweens.add({ targets: fumo, scale: 2, alpha: 0, duration: 350, onComplete: () => fumo.destroy() });
  return true;
};

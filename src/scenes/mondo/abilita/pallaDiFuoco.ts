// Palla di fuoco (Mago): un proiettile che esplode al primo impatto, o arrivato
// dove hai mirato, e ferisce tutti i nemici nel raggio dell'esplosione.

import { modificatore } from '../../../systems/caratteristiche';
import { direzioneDa } from '../../../systems/geometria';
import { nelRaggio } from '../../../systems/proiettili';
import type { Vettore } from '../../../systems/tipi';
import type { ContestoAbilita, EseguiAbilita } from './tipi';

const VELOCITA = 150;
const COLORE = '#ff8c32';

export const pallaDiFuoco: EseguiAbilita = (contesto, punto) => {
  const { eroe, proiettili, abilita } = contesto;
  const da = { x: eroe.x, y: eroe.y };
  const distanza = Math.hypot(punto.x - da.x, punto.y - da.y);
  proiettili.lancia({
    da,
    direzione: direzioneDa(da, punto),
    velocita: VELOCITA,
    // Esplode dove hai mirato, ma non oltre la gittata dell'abilità.
    gittata: Math.max(8, Math.min(abilita.gittata ?? 160, distanza)),
    raggio: 4,
    colore: COLORE,
    impattoAFineCorsa: true,
    impatto: (_nemico, dove) => esplodi(contesto, dove),
  });
  return true;
};

function esplodi(contesto: ContestoAbilita, centro: Vettore): void {
  const { scena, nemici, combattimento, abilita, caratteristiche } = contesto;
  const raggio = abilita.raggio ?? 24;

  // Il cerchio dell'esplosione: si allarga fino al raggio vero e svanisce.
  const lampo = scena.add.circle(centro.x, centro.y, raggio, 0xff8c32, 0.55).setDepth(13).setScale(0.3);
  scena.tweens.add({ targets: lampo, scale: 1, alpha: 0, duration: 380, onComplete: () => lampo.destroy() });

  const vivi = nemici.vivi();
  const colpiti = nelRaggio(centro, raggio, vivi.map((n) => ({ id: n.id, rettangolo: n.rettangolo() })));
  // L'ora viene letta adesso, non quando l'abilità è stata lanciata: il proiettile ha volato.
  const adesso = scena.time.now;
  for (const id of colpiti) {
    combattimento.infliggi(
      vivi.find((n) => n.id === id)!,
      {
        dado: abilita.dado ?? '2d6',
        modificatore: modificatore(caratteristiche.INT),
        probabilitaCritico: 0, // gli incantesimi ad area non fanno critici
        respinta: 140,
        da: centro,
        puòEssereAlleSpalle: false,
        effetti: [],
      },
      adesso,
    );
  }
}

// Controlli sull'insieme delle mappe: ogni mappa da sola può essere corretta,
// ma un'uscita può puntare a una mappa che non esiste o a un arrivo sbagliato.
// Restituiamo TUTTI gli errori insieme, così si correggono in un colpo solo.

import { celleForziere, celleNemico, trovaPunto, voceIn } from './mappa';
import type { Mappa } from './tipi';

export function validaMondo(
  mappe: Record<string, Mappa>,
  mappaIniziale: string,
  idNemici: readonly string[],
  idOggetti: readonly string[],
): string[] {
  const errori: string[] = [];

  const iniziale = mappe[mappaIniziale];
  if (!iniziale) {
    errori.push(`La mappa iniziale "${mappaIniziale}" non esiste`);
  } else if (!trovaSimboloDiTipo(iniziale, 'partenza')) {
    errori.push(`La mappa iniziale "${mappaIniziale}" non ha un punto di partenza`);
  }

  for (const mappa of Object.values(mappe)) {
    // Ogni nemico piazzato in mappa deve esistere in data/nemici.json.
    const sconosciuti = new Set(celleNemico(mappa).map((n) => n.idNemico).filter((id) => !idNemici.includes(id)));
    for (const id of sconosciuti) errori.push(`Mappa "${mappa.id}": il nemico "${id}" non esiste in nemici.json`);
    // Ogni oggetto in un forziere deve esistere tra gli oggetti (o, dalla fase 4b, tra le armi).
    for (const { cella, contenuto } of celleForziere(mappa)) {
      for (const id of contenuto.filter((o) => !idOggetti.includes(o))) {
        errori.push(`Mappa "${mappa.id}", forziere in (${cella.col}, ${cella.riga}): l'oggetto "${id}" non esiste`);
      }
    }

    for (const [simbolo, voce] of Object.entries(mappa.legenda)) {
      if (voce.tipo !== 'uscita' || !voce.verso || !voce.arrivo) continue;
      const prefisso = `Mappa "${mappa.id}", uscita "${simbolo}"`;

      const destinazione = mappe[voce.verso];
      if (!destinazione) {
        errori.push(`${prefisso}: la mappa di destinazione "${voce.verso}" non esiste`);
        continue;
      }
      const punto = trovaPunto(destinazione, voce.arrivo);
      if (!punto) {
        errori.push(`${prefisso}: l'arrivo "${voce.arrivo}" non c'è nella mappa "${voce.verso}"`);
      } else if (voceIn(destinazione, punto.col, punto.riga)?.tipo !== 'arrivo') {
        errori.push(`${prefisso}: "${voce.arrivo}" in "${voce.verso}" non è un punto d'arrivo`);
      }
    }
  }
  return errori;
}

/** Vero se nella griglia compare almeno un simbolo di quel tipo. */
function trovaSimboloDiTipo(mappa: Mappa, tipo: string): boolean {
  return Object.entries(mappa.legenda).some(
    ([simbolo, voce]) => voce.tipo === tipo && trovaPunto(mappa, simbolo) !== undefined,
  );
}

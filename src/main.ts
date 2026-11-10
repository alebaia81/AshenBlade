// Punto di ingresso: carica i dati, configura Phaser e avvia le scene.

import * as Phaser from 'phaser';
import { ALTEZZA_SCHERMO, LARGHEZZA_SCHERMO } from './costanti';
import { caricaDati } from './data/caricaDati';
import { installaGestoreErrori, mostraErrore } from './erroreVisibile';
import { ScenaCreazione } from './scenes/ScenaCreazione';
import { ScenaDialogo } from './scenes/ScenaDialogo';
import { ScenaFucina } from './scenes/ScenaFucina';
import { ScenaRegistro } from './scenes/ScenaRegistro';
import { ScenaMappaTesoro } from './scenes/ScenaMappaTesoro';
import { ScenaFinale } from './scenes/ScenaFinale';
import { ScenaInterfaccia } from './scenes/ScenaInterfaccia';
import { ScenaInventario } from './scenes/ScenaInventario';
import { ScenaMondo } from './scenes/ScenaMondo';
import { ScenaNegozio } from './scenes/ScenaNegozio';
import { ScenaScheda } from './scenes/ScenaScheda';
import { ScenaSviluppatore } from './scenes/ScenaSviluppatore';
import { ScenaTaverna } from './scenes/ScenaTaverna';
import { ScenaMenu } from './scenes/ScenaMenu';
import { ScenaCaricamento } from './scenes/ScenaCaricamento';
import { suoni } from './audio/Suoni';
import { archivioDelBrowser } from './scenes/browser';
import { leggiOpzioni } from './systems/opzioni';
import { ScenaIntro } from './scenes/ScenaIntro';
import { ScenaPausa } from './scenes/ScenaPausa';
import { ScenaOpzioni } from './scenes/ScenaOpzioni';

installaGestoreErrori();

try {
  // Se una mappa è sbagliata lo scopriamo qui, prima di avviare il gioco.
  const dati = caricaDati();

  // Fase 9c: il sintetizzatore, con i volumi scelti l'ultima volta. Suonerà dal primo clic.
  suoni.configura(dati.musica);
  const opzioni = leggiOpzioni(archivioDelBrowser());
  suoni.impostaVolumi(opzioni.volumeMusica, opzioni.volumeEffetti);
  (window as unknown as { suoni: typeof suoni }).suoni = suoni;

  const gioco = new Phaser.Game({
    type: Phaser.AUTO, // WebGL se disponibile
    parent: 'gioco',
    backgroundColor: '#000000',
    // pixelArt: niente sfocature quando si ingrandisce (importante con lo zoom ×3).
    pixelArt: true,
    roundPixels: true,
    input: {
      activePointers: 3,
    },
    scale: {
      // FIT: adatta il gioco alla finestra mantenendo le proporzioni 16:9.
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: LARGHEZZA_SCHERMO,
      height: ALTEZZA_SCHERMO,
    },
    physics: {
      default: 'arcade',
      arcade: { debug: false },
    },
    // La prima scena dell'elenco parte da sola: il caricamento delle immagini, poi il menu iniziale.
    // Le altre le avvia chi ne ha bisogno (il menu avvia la creazione o il mondo,
    // il mondo l'interfaccia…). L'ordine conta anche per il disegno: le scene
    // più in basso nell'elenco stanno sopra, per questo pausa e opzioni sono in fondo.
    scene: [
      new ScenaCaricamento(dati), // prima di tutto le immagini (fase 9b), poi il menu
      new ScenaMenu(dati),
      new ScenaIntro(dati),
      new ScenaCreazione(dati),
      new ScenaMondo(dati),
      new ScenaInterfaccia(dati),
      new ScenaScheda(dati),
      new ScenaInventario(dati),
      new ScenaSviluppatore(dati),
      new ScenaDialogo(dati),
      new ScenaNegozio(dati),
      new ScenaTaverna(dati),
      new ScenaFucina(dati),
      new ScenaRegistro(dati),
      new ScenaMappaTesoro(dati),
      new ScenaFinale(dati),
      new ScenaPausa(),
      new ScenaOpzioni(),
    ],
  });

  // Rendiamo il gioco raggiungibile dalla console del browser (F12): utile per
  // curiosare (es. gioco.scene.getScene('Mondo')) e per le verifiche automatiche.
  (window as unknown as { gioco: Phaser.Game }).gioco = gioco;

  window.addEventListener('resize', () => {
    gioco.scale.refresh();
  });
  window.addEventListener('orientationchange', () => {
    setTimeout(() => gioco.scale.refresh(), 200);
  });

  // Il gioco è partito: togliamo la scritta di caricamento e lo segnaliamo
  // al controllo di avvio scritto in gioco.html.
  gioco.events.once(Phaser.Core.Events.READY, () => {
    (window as unknown as { giocoPronto: boolean }).giocoPronto = true;
    document.getElementById('avvio')?.remove();
  });
} catch (errore) {
  mostraErrore(errore);
}

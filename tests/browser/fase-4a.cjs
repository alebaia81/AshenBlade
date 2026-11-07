// Prova nel browser della consegna 4a: zaino, pozioni, forzieri, bottino.
//
// Uso: node tests/browser/fase-4a.cjs <gioco.html> <cartella schermate>

const { apriGioco, BARRA } = require('./aiuti.cjs');

const T = 16;
const centro = (col, riga) => ({ x: col * T + 8, y: riga * T + 8 });
// Zaino: pannello con l'angolo in (100, 35); spazi da 56 px ogni 62.
const SPAZIO = (i) => [152 + (i % 4) * 62, 129 + Math.floor(i / 4) * 62];
const USA = [462, 325];
const GETTA = [592, 325];
const ICONA_ZAINO = [960 - 30 - 52, 30];
const INGRANAGGIO = [960 - 30 - 4 * 52, 30];
const VOCE = (i) => [700, 64 + 8 + (i + 1) * 22 + 9];

async function main() {
  const [percorso, cartella] = process.argv.slice(2);
  const g = await apriGioco(percorso, cartella);
  const { controlla, aspetta, schermata, pagina, clic, nelGioco } = g;
  const partita = () => nelGioco(() => window.gioco.registry.get('partita'));
  const conta = (p, id) => p.inventario.spazi.reduce((t, s) => t + (s && s.id === id ? s.quantita : 0), 0);
  const indiceDi = (p, id) => p.inventario.spazi.findIndex((s) => s && s.id === id);
  const metti = (p) => g.mondo((s, p) => s.eroe.forma.body.reset(p.x, p.y), p);
  const svuota = () => g.mondo((s) => { for (const n of s.nemici.vivi()) n.subisci(999, { x: 0, y: 0 }, 0, s.time.now); });
  const attiva = (n) => nelGioco((n) => window.gioco.scene.isActive(n), n);

  await g.creaPersonaggio(0, [0, 2]); // Guerriero
  await svuota();
  let p = await partita();
  controlla(p.inventario.capacita === 12 && conta(p, 'pozione_vita') === 2, 'si parte con 12 spazi e 2 pozioni di vita');

  // ---------------- lo zaino ----------------
  await clic(...ICONA_ZAINO);
  controlla((await attiva('Inventario')) && (await nelGioco(() => window.gioco.scene.isPaused('Mondo'))), 'clic sullo zaino: si apre, il mondo è in pausa');
  await pagina.mouse.move(...SPAZIO(0));
  await aspetta(150);
  await schermata('01-zaino');
  await pagina.keyboard.press('Escape');
  await aspetta(200);
  controlla(!(await attiva('Inventario')) && (await attiva('Mondo')), 'Esc chiude lo zaino');

  // ---------------- forziere ----------------
  await metti(centro(31, 3));
  await aspetta(300);
  let q = await g.schermoDa(centro(36, 3));
  await pagina.mouse.move(q.x, q.y);
  await aspetta(100);
  controlla((await nelGioco(() => window.gioco.canvas.style.cursor)) === 'pointer', 'sopra il forziere il cursore è una mano');
  await pagina.mouse.click(q.x, q.y);
  let aperto = false;
  for (let i = 0; i < 40 && !aperto; i++) {
    await aspetta(100);
    aperto = (await partita()).forzieriAperti.includes('radura:36:3');
  }
  controlla(aperto, 'clic sul forziere: l’eroe ci va e lo apre');
  await aspetta(150);
  await schermata('02-forziere', { ferma: true });
  controlla((await g.mondo((s) => s.oggettiATerra.quanti)) === 6, 'dal forziere escono 6 cose (dalla 4b anche un arco e una corazza, dalla 5a le monete)');
  // Gli oggetti sono sparpagliati a cerchio: passiamo sopra a ognuno.
  const caduti = await g.mondo((s) => s.oggettiATerra.oggetti.map((o) => ({ x: o.posizione.x, y: o.posizione.y })));
  for (const posizione of caduti) {
    await metti(posizione);
    await aspetta(250);
  }
  p = await partita();
  controlla(conta(p, 'pozione_vita') === 3 && conta(p, 'pozione_forza') === 1 && conta(p, 'borsa') === 1,
    `passandoci sopra si raccoglie tutto (vita ${conta(p, 'pozione_vita')}, forza ${conta(p, 'pozione_forza')}, borsa ${conta(p, 'borsa')})`);

  // Il forziere resta aperto anche cambiando mappa.
  await g.mondo((s) => s.vaiA('bosco'));
  await aspetta(900);
  await g.mondo((s) => s.vaiA('radura'));
  await aspetta(900);
  const ancoraAperto = await g.mondo((s) => s.forzieri.find((f) => f.chiave === 'radura:36:3').aperto);
  controlla(ancoraAperto, 'tornando nella Radura il forziere è ancora aperto');
  await svuota();

  // ---------------- pozioni ----------------
  await g.mondo((s) => s.eroe.impostaRisorse({ attuale: 2, massima: s.eroe.vita.massima }, s.eroe.mana));
  await clic(...BARRA.preferito(0)); // spazio 1: pozione di vita
  await aspetta(100);
  p = await partita();
  controlla(p.vita.attuale === 14 && conta(p, 'pozione_vita') === 2, `pulsante rapido: +12 vita (${p.vita.attuale}), pozioni rimaste ${conta(p, 'pozione_vita')}`);
  await g.mondo((s) => s.eroe.impostaRisorse({ attuale: 2, massima: s.eroe.vita.massima }, s.eroe.mana));
  await pagina.keyboard.press('1');
  await aspetta(100);
  controlla(conta(await partita(), 'pozione_vita') === 1, 'il tasto 1 usa una pozione di vita');
  await clic(...BARRA.preferito(1)); // spazio 2: vuoto per il Guerriero
  await aspetta(100);

  // Pozione di forza dallo zaino: seleziona e "Usa".
  const prima = await g.mondo((s) => s.statisticheArma(s.eroe.arma).modificatore);
  await clic(...ICONA_ZAINO);
  p = await partita();
  await clic(...SPAZIO(indiceDi(p, 'pozione_forza')));
  await clic(...USA);
  p = await partita();
  await pagina.keyboard.press('i');
  await aspetta(200);
  const dopo = await g.mondo((s) => s.statisticheArma(s.eroe.arma).modificatore);
  controlla(conta(p, 'pozione_forza') === 0 && dopo === prima + 2, `pozione di forza: modificatore ${prima} → ${dopo}`);
  const effetti = await nelGioco(() => window.gioco.scene.getScene('Interfaccia').effetti.text);
  controlla(/Forza \+2 · (59|60) s/.test(effetti), `l'interfaccia mostra l'effetto e il tempo: "${effetti}"`);
  await schermata('03-effetti-e-pozioni');

  // Borsa: clic destro nello zaino la usa al volo.
  await clic(...ICONA_ZAINO);
  p = await partita();
  q = SPAZIO(indiceDi(p, 'borsa'));
  await pagina.mouse.click(q[0], q[1], { button: 'right' });
  await aspetta(200);
  p = await partita();
  controlla(p.inventario.capacita === 16 && conta(p, 'borsa') === 0, `la borsa porta lo zaino a ${p.inventario.capacita} spazi`);
  await schermata('04-zaino-16');

  // Getta: l'oggetto va a terra e non torna subito nello zaino.
  await clic(...SPAZIO(indiceDi(p, 'pozione_vita')));
  await clic(...GETTA);
  await pagina.keyboard.press('i');
  await aspetta(300);
  controlla(conta(await partita(), 'pozione_vita') === 0 && (await g.mondo((s) => s.oggettiATerra.quanti)) === 1,
    'Getta: la pozione è a terra e non viene raccolta subito');
  const eroe = await g.mondo((s) => ({ x: s.eroe.x, y: s.eroe.y }));
  await metti({ x: eroe.x + 40, y: eroe.y });
  await aspetta(200);
  await metti({ x: eroe.x, y: eroe.y + 10 });
  await aspetta(300);
  controlla(conta(await partita(), 'pozione_vita') === 1, 'allontanandosi e tornando la si raccoglie di nuovo');

  // ---------------- bottino ----------------
  // Dalla 5a gli slime lasciano anche monete: qui le togliamo per provare solo il bottino.
  await g.mondo((s) => { s.dati.nemici.slime.bottino = [{ oggetto: 'pozione_mana', probabilita: 1 }]; s.dati.nemici.slime.monete = [0, 0]; });
  const idSlime = await g.mondo((s) => s.nemici.aggiungi(s.dati.nemici.slime, { x: s.eroe.x + 60, y: s.eroe.y }).id);
  await g.mondo((s, id) => {
    const n = s.nemici.lista.find((x) => x.id === id);
    s.combattimento.infliggi(n, { dado: '1d4', modificatore: 50, probabilitaCritico: 0, respinta: 0, da: { x: 0, y: 0 }, puòEssereAlleSpalle: false, effetti: [] }, s.time.now);
  }, idSlime);
  await aspetta(200);
  controlla((await g.mondo((s) => s.oggettiATerra.quanti)) === 1, 'lo slime sconfitto lascia il suo bottino a terra');

  // ---------------- zaino pieno ----------------
  await clic(...INGRANAGGIO);
  await clic(...VOCE(8)); // Riempi lo zaino
  await clic(...INGRANAGGIO);
  p = await partita();
  controlla(p.inventario.spazi.every((s) => s !== null), 'modalità sviluppatore: zaino pieno');
  const terra = await g.mondo((s) => { const o = s.oggettiATerra.oggetti[0]; return { x: o.posizione.x, y: o.posizione.y }; });
  await metti(terra);
  await aspetta(250);
  await schermata('05-zaino-pieno', { ferma: true });
  controlla(conta(await partita(), 'pozione_mana') === 0 && (await g.mondo((s) => s.oggettiATerra.quanti)) === 1,
    'zaino pieno: la pozione resta a terra');

  // ---------------- "Dai oggetto…" ----------------
  await clic(...INGRANAGGIO);
  await clic(...VOCE(7)); // Dai oggetto…
  await schermata('06-dai-oggetto');
  await clic(...VOCE(7)); // ultima voce dell'elenco (7 oggetti, poi ← Indietro)
  await clic(...VOCE(7));
  await clic(...VOCE(0)); // Dai: Pozione di vita
  await clic(...INGRANAGGIO);
  // Lo zaino è pieno di borse, ma la pozione di vita si impila su quella che c'è già.
  controlla(conta(await partita(), 'pozione_vita') === 2, '"Dai oggetto": la pozione si impila su quella già presente');

  controlla(g.errori.length === 0, `nessun errore ${g.errori.length ? JSON.stringify(g.errori) : ''}`);
  controlla(g.richiesteEsterne.length === 0, 'nessuna richiesta a internet');
  process.exitCode = (await g.chiudi()) > 0 ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exit(1); // esce subito: altrimenti il browser rimasto aperto terrebbe in vita il processo
});

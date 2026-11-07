// Prova nel browser della consegna 5a: Borgo Quercia, dialoghi, monete.
//
// Uso: node tests/browser/fase-5a.cjs <gioco.html> <cartella schermate>

const { apriGioco } = require('./aiuti.cjs');

const T = 16;
const centro = (col, riga) => ({ x: col * T + 8, y: riga * T + 8 });
const INGRANAGGIO = [960 - 30 - 4 * 52, 30];
const VOCE = (i) => [700, 64 + 8 + (i + 1) * 22 + 9];

async function main() {
  const [percorso, cartella] = process.argv.slice(2);
  const g = await apriGioco(percorso, cartella);
  const { controlla, aspetta, schermata, pagina, clic, nelGioco } = g;
  const partita = () => nelGioco(() => window.gioco.registry.get('partita'));
  const attiva = (n) => nelGioco((n) => window.gioco.scene.isActive(n), n);
  const inPausa = (n) => nelGioco((n) => window.gioco.scene.isPaused(n), n);
  const mappa = () => g.mondo((s) => s.mappa.id);
  const testoDialogo = () => nelGioco(() => window.gioco.scene.getScene('Dialogo').testo.text);
  /** Clic sulla risposta "i" del dialogo aperto, dove si trova davvero sullo schermo. */
  const rispondi = async (i) => {
    const p = await nelGioco((i) => { const r = window.gioco.scene.getScene('Dialogo').risposte.list[i]; return { x: r.x + 30, y: r.y + 9 }; }, i);
    await clic(p.x, p.y);
  };
  /** Clic su una persona: l'eroe ci va e si apre il dialogo. */
  const parlaCon = async (col, riga) => {
    // Prima ci si avvicina un po' (la persona deve essere sullo schermo per cliccarla).
    await g.mondo((s, p) => s.eroe.forma.body.reset(p.x, p.y), centro(col, riga + 4));
    await aspetta(150);
    const q = await g.schermoDa(centro(col, riga));
    await pagina.mouse.click(q.x, q.y);
    for (let i = 0; i < 60 && !(await attiva('Dialogo')); i++) await aspetta(100);
  };
  const metti = (p) => g.mondo((s, p) => s.eroe.forma.body.reset(p.x, p.y), p);

  await g.creaPersonaggio(0, [0, 2], 'borgo'); // Guerriero, si resta nel borgo

  // ---------------- il villaggio ----------------
  controlla((await mappa()) === 'borgo', 'la partita inizia a Borgo Quercia');
  const eroe = await g.mondo((s) => ({ col: Math.floor(s.eroe.x / 16), riga: Math.floor(s.eroe.y / 16) }));
  controlla(eroe.col === 19 && eroe.riga === 16, `l’eroe è nella piazza, sotto la Quercia Antica (${eroe.col}, ${eroe.riga})`);
  const nomi = await g.mondo((s) => s.abitanti.map((a) => a.definizione.nome));
  controlla(nomi.length === 6, `nel borgo ci sono 6 personaggi: ${nomi.join(', ')}`);
  controlla((await partita()).monete === 0, 'si parte con 0 monete');
  await schermata('01-borgo', { ferma: true });

  // ---------------- dialogo con nonna Rosalba ----------------
  const q = await g.schermoDa(centro(10, 12));
  await pagina.mouse.move(q.x, q.y);
  await aspetta(100);
  controlla((await nelGioco(() => window.gioco.canvas.style.cursor)).includes('svg'), 'sopra una persona il cursore è un fumetto');
  await parlaCon(10, 12);
  controlla((await attiva('Dialogo')) && (await inPausa('Mondo')), 'clic su nonna Rosalba: l’eroe ci va, si apre il dialogo e il mondo è in pausa');
  controlla(/storia/.test(await testoDialogo()), 'Rosalba saluta');
  await schermata('02-dialogo-rosalba');
  await rispondi(1); // "Conosci storie di tesori?"
  controlla(/ferita/.test(await testoDialogo()), 'risposta 2: la leggenda del muro con la "ferita"');
  await rispondi(0); // "Una ferita nel muro… una crepa!"
  controlla(/crepa/.test(await testoDialogo()), 'risposta 1: si va al nodo successivo');
  await schermata('03-dialogo-indizio');
  await rispondi(0); // "Grazie, nonna."
  await aspetta(150);
  controlla(!(await attiva('Dialogo')) && (await attiva('Mondo')), 'l’ultima risposta chiude il dialogo e il gioco riparte');

  // ---------------- Gemma: tasti e "apri" ----------------
  await parlaCon(31, 7);
  controlla(/Gemma/.test(await testoDialogo()), 'si parla con Gemma');
  await pagina.keyboard.press('1'); // "Fammi vedere la merce."
  await aspetta(200);
  // Dalla 5b la risposta apre la bottega (provata in fase-5b.cjs): qui la chiudiamo subito.
  controlla(!(await attiva('Dialogo')) && (await attiva('Negozio')), 'tasto 1: "Fammi vedere la merce" apre la bottega');
  await pagina.keyboard.press('Escape');
  await aspetta(150);
  // Esc chiude.
  await parlaCon(22, 7);
  controlla(/Berta/.test(await testoDialogo()), 'la sindaca Berta si presenta');
  await pagina.keyboard.press('Escape');
  await aspetta(150);
  controlla(!(await attiva('Dialogo')), 'Esc chiude il dialogo');

  // ---------------- monete ----------------
  await clic(...INGRANAGGIO);
  await clic(...VOCE(11)); // +100 monete
  await clic(...INGRANAGGIO);
  const hud = await nelGioco(() => window.gioco.scene.getScene('Interfaccia').children.list.filter((o) => o.type === 'Text').map((t) => t.text));
  controlla((await partita()).monete === 100 && hud.includes('100'), 'modalità sviluppatore: +100 monete, visibili nell’interfaccia');

  // ---------------- il cancello ----------------
  await metti(centro(34, 14));
  await aspetta(100);
  let c = await g.schermoDa(centro(39, 14));
  await pagina.mouse.click(c.x, c.y);
  for (let i = 0; i < 40 && (await mappa()) !== 'radura'; i++) await aspetta(100);
  await aspetta(500);
  const arrivo = await g.mondo((s) => ({ col: Math.floor(s.eroe.x / 16), riga: Math.floor(s.eroe.y / 16) }));
  controlla((await mappa()) === 'radura' && arrivo.col === 1 && arrivo.riga === 12, `dal cancello si esce nella Radura (${arrivo.col}, ${arrivo.riga})`);
  await g.mondo((s) => { for (const n of s.nemici.vivi()) n.subisci(999, { x: 0, y: 0 }, 0, s.time.now); });
  await aspetta(300);

  // Monete dai nemici: uno slime sconfitto ne lascia 1–3.
  const prima = (await partita()).monete;
  const id = await g.mondo((s) => s.nemici.aggiungi(s.dati.nemici.slime, { x: s.eroe.x + 50, y: s.eroe.y }).id);
  const dove = await g.mondo((s, id) => {
    const n = s.nemici.lista.find((x) => x.id === id);
    const p = { x: n.forma.x, y: n.forma.y };
    s.combattimento.infliggi(n, { dado: '1d4', modificatore: 50, probabilitaCritico: 0, respinta: 0, da: { x: 0, y: 0 }, puòEssereAlleSpalle: false, effetti: [] }, s.time.now);
    return p;
  }, id);
  await aspetta(200);
  const aTerra = await g.mondo((s) => s.oggettiATerra.oggetti.filter((o) => o.definizione.id === 'monete').map((o) => o.quantita));
  controlla(aTerra.length === 1 && aTerra[0] >= 1 && aTerra[0] <= 3, `lo slime lascia ${aTerra[0]} monete a terra`);
  await schermata('04-monete-a-terra', { ferma: true });
  // Anche con lo zaino pieno le monete si raccolgono.
  await clic(...INGRANAGGIO);
  await clic(...VOCE(8)); // Riempi lo zaino
  await clic(...INGRANAGGIO);
  await metti(dove);
  await aspetta(300);
  controlla((await partita()).monete === prima + aTerra[0], `passandoci sopra, anche a zaino pieno: ${prima} → ${(await partita()).monete} monete`);

  // Monete nel forziere della Radura.
  await g.mondo((s) => s.apriForziere(s.forzieri[0]));
  const nelForziere = await g.mondo((s) => s.oggettiATerra.oggetti.filter((o) => o.definizione.id === 'monete').map((o) => o.quantita));
  controlla(nelForziere[0] === 15, 'il forziere della Radura contiene 15 monete');

  // Ritorno al borgo dall'uscita a sinistra della Radura.
  await metti(centro(3, 12));
  await aspetta(100);
  c = await g.schermoDa(centro(0, 12));
  await pagina.mouse.click(c.x, c.y);
  for (let i = 0; i < 40 && (await mappa()) !== 'borgo'; i++) await aspetta(100);
  await aspetta(400);
  const ritorno = await g.mondo((s) => ({ col: Math.floor(s.eroe.x / 16), riga: Math.floor(s.eroe.y / 16) }));
  controlla((await mappa()) === 'borgo' && ritorno.col === 37 && ritorno.riga === 13, `e dalla Radura si torna al borgo, vicino al cancello (${ritorno.col}, ${ritorno.riga})`);
  await schermata('05-ritorno-al-borgo', { ferma: true });

  controlla(g.errori.length === 0, `nessun errore ${g.errori.length ? JSON.stringify(g.errori) : ''}`);
  controlla(g.richiesteEsterne.length === 0, 'nessuna richiesta a internet');
  process.exitCode = (await g.chiudi()) > 0 ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

// Prova nel browser della consegna 3b: punta e clicca.
// Camminare cliccando (con A*), tenere premuto, clic dentro il lago, attaccare
// cliccando un nemico, capriola col tasto destro, barra in basso, icone.
//
// Uso: node tests/browser/fase-3b.cjs <gioco.html> <cartella schermate>

const { apriGioco, BARRA } = require('./aiuti.cjs');

const TESSERA = 16;
const centro = (col, riga) => ({ x: col * TESSERA + 8, y: riga * TESSERA + 8 });

async function main() {
  const [percorsoGioco, cartella] = process.argv.slice(2);
  const g = await apriGioco(percorsoGioco, cartella);
  const { controlla, nelGioco, clic, aspetta, schermata, pagina } = g;
  const mondo = (f, arg) => nelGioco(new Function('arg', `const s = window.gioco.scene.getScene('Mondo'); return (${f})(s, arg);`), arg);
  const eroe = () => mondo((s) => ({ x: s.eroe.x, y: s.eroe.y, fendente: s.eroe.fendente, stato: s.eroe.stato.nome, mappa: s.mappa.id }));
  const inMovimento = () => mondo((s) => s.guida.inMovimento);
  /** Da un punto del mondo al punto dello schermo dove cliccare (dipende da dove guarda la telecamera). */
  const schermoDa = (p) => mondo((s, p) => {
    const c = s.cameras.main;
    return { x: (p.x - c.worldView.x) * c.zoom + c.x, y: (p.y - c.worldView.y) * c.zoom + c.y };
  }, p);
  const clicMondo = async (p, tasto = 'left') => {
    const q = await schermoDa(p);
    await pagina.mouse.click(q.x, q.y, { button: tasto });
    await aspetta(50);
  };
  const metti = (p) => mondo((s, p) => s.eroe.forma.body.reset(p.x, p.y), p);
  const aspettaArrivo = async (massimoMs) => {
    const inizio = Date.now();
    await aspetta(150);
    while ((await inMovimento()) && Date.now() - inizio < massimoMs) await aspetta(100);
  };

  // Personaggio: Guerriero, punti in FOR e COS, nome predefinito (dalla 9a si passa dal menu).
  await g.vaiAllaCreazione();
  await clic(125, 112);
  await clic(420, 222);
  await clic(420, 302);
  await clic(800, 492);
  await aspetta(800);
  controlla(await nelGioco(() => window.gioco.scene.isActive('Mondo')), 'partita iniziata (Guerriero)');
  // Dalla fase 5 si comincia nel borgo; questa prova è stata scritta per la Radura.
  await g.mondo((s) => s.vaiA('radura'));
  await aspetta(900);
  await schermata('01-barra-e-icone');

  // Via i nemici della radura: queste prove riguardano il movimento, e uno slime
  // che si avvicina e ci colpisce sposterebbe l'eroe falsando i risultati.
  const svuota = () => mondo((s) => { for (const n of s.nemici.vivi()) n.subisci(99, { x: 0, y: 0 }, 0, s.time.now); });
  await svuota();

  // ---------------- camminare cliccando ----------------
  await metti(centro(5, 8));
  await aspetta(300);
  const destinazione = { x: 10 * TESSERA + 5, y: 8 * TESSERA + 11 }; // un punto preciso, non il centro di una cella
  await clicMondo(destinazione);
  await aspettaArrivo(3000);
  let e = await eroe();
  // Si considera arrivato entro 2 px; a 60 fotogrammi al secondo l'ultimo passo può sforare di poco.
  controlla(Math.hypot(e.x - destinazione.x, e.y - destinazione.y) < 3.5,
    `clic sul terreno: l'eroe arriva esattamente dove hai cliccato (distanza ${Math.hypot(e.x - destinazione.x, e.y - destinazione.y).toFixed(1)} px)`);
  controlla(!(await inMovimento()), 'arrivato, si ferma');

  // Dall'altra parte del muro di pietra (colonna 26): si deve passare dal varco della riga 12.
  await clic(960 - 30 - 4 * 52, 30); // ingranaggio
  await clic(700, 64 + 8 + 1 * 22 + 9); // "Aree di colpo e corpi": mostra anche il percorso
  await clic(960 - 30 - 4 * 52, 30); // chiude il pannello
  await metti(centro(22, 6));
  await aspetta(400);
  await clicMondo(centro(30, 6));
  const punti = await mondo((s) => s.guida.percorsoRimasto());
  // Senza lisciatura sarebbero una quindicina di celle; lisciato restano pochi tratti dritti
  // (servono comunque punti prima e dopo il varco, e per girare attorno agli alberi).
  controlla(punti.length >= 2 && punti.length <= 6, `percorso lisciato: ${punti.length} tratti dritti`);
  controlla(punti.some((p) => Math.floor(p.x / TESSERA) >= 25 && Math.floor(p.x / TESSERA) <= 27 && Math.floor(p.y / TESSERA) === 12),
    'il percorso passa dal varco nel muro di pietra');
  await aspetta(900);
  await schermata('02-percorso', { ferma: true });
  await aspettaArrivo(6000);
  e = await eroe();
  controlla(Math.hypot(e.x - centro(30, 6).x, e.y - centro(30, 6).y) < 3.5, "l'eroe arriva dall'altra parte del muro");
  await clic(960 - 30 - 4 * 52, 30);
  await clic(700, 64 + 8 + 1 * 22 + 9); // nasconde di nuovo aree e percorso
  await clic(960 - 30 - 4 * 52, 30);

  // Clic dentro il laghetto: ci si ferma sulla riva più vicina.
  await metti(centro(9, 12));
  await aspetta(400);
  await clicMondo(centro(9, 17));
  await aspettaArrivo(3000);
  const riva = await mondo((s) => {
    const col = Math.floor(s.eroe.x / 16);
    const riga = Math.floor(s.eroe.y / 16);
    return { col, riga, simbolo: s.mappa.simboli[riga][col] };
  });
  controlla(riva.simbolo !== '~' && Math.hypot(riva.col - 9, riva.riga - 17) <= 3,
    `clic nel lago: l'eroe si ferma sulla riva, cella (${riva.col}, ${riva.riga}) "${riva.simbolo}"`);
  await schermata('03-riva');

  // ---------------- tenere premuto: l'eroe segue il cursore ----------------
  await metti(centro(10, 8));
  await aspetta(400);
  let q = await schermoDa(centro(13, 8));
  await pagina.mouse.move(q.x, q.y);
  await pagina.mouse.down();
  for (let i = 0; i < 10; i++) {
    q = await schermoDa(centro(13, 8 + Math.min(i, 4)));
    await pagina.mouse.move(q.x, q.y, { steps: 3 });
    await aspetta(120);
  }
  await aspetta(600);
  e = await eroe();
  await pagina.mouse.up();
  controlla(Math.floor(e.y / TESSERA) >= 10, `tenendo premuto l'eroe segue il cursore verso il basso (riga ${Math.floor(e.y / TESSERA)})`);

  // ---------------- la tastiera resta una scorciatoia ----------------
  await metti(centro(10, 8));
  await aspetta(300);
  await clicMondo(centro(18, 8));
  await aspetta(150);
  await pagina.keyboard.down('s');
  await aspetta(300);
  await pagina.keyboard.up('s');
  e = await eroe();
  controlla(!(await inMovimento()) && e.y > centro(10, 8).y + 10, 'premendo S il percorso del mouse si annulla e l’eroe va in giù');

  // ---------------- attaccare cliccando un nemico ----------------
  await svuota();
  await metti(centro(18, 6));
  await aspetta(400);
  // Lo slime resta fermo ("in pausa" per un minuto): qui proviamo il mouse, non l'inseguimento.
  await mondo((s) => { s.nemici.aggiungi(s.dati.nemici.slime, { x: s.eroe.x + 52, y: s.eroe.y + 6 }).dopoAttacco(s.time.now + 60000); });
  await aspetta(100);
  const fendentiPrima = (await eroe()).fendente;
  // Letta PRIMA del primo clic: con un buon tiro (1d8 + 3, o un critico) il Guerriero
  // può abbattere lo slime già al primo colpo.
  const espPrima = await nelGioco(() => window.gioco.registry.get('partita').esperienza);
  const posizioneSlime = await mondo((s) => { const n = s.nemici.vivi().at(-1); return { x: n.forma.x, y: n.forma.y }; });
  q = await schermoDa(posizioneSlime);
  await pagina.mouse.move(q.x, q.y);
  await aspetta(100);
  const cursore = await nelGioco(() => window.gioco.canvas.style.cursor);
  controlla(cursore.includes('data:image/svg'), 'sopra un nemico il cursore diventa una spada');
  await pagina.mouse.down();
  await aspetta(40);
  await pagina.mouse.up();
  let colpito = false;
  for (let i = 0; i < 30 && !colpito; i++) {
    await aspetta(50);
    colpito = (await eroe()).fendente > fendentiPrima;
    if (colpito) await schermata('04-attacco-col-mouse', { ferma: true });
  }
  await aspetta(600);
  e = await eroe();
  const slime = await mondo((s) => { const n = s.nemici.lista.at(-1); return { vita: n.vita.attuale, vivo: n.vivo }; });
  controlla(e.fendente === fendentiPrima + 1, `clic singolo sul nemico: l'eroe lo raggiunge e colpisce una volta (${e.fendente - fendentiPrima} fendente)`);
  controlla(slime.vita < 8, `lo slime è stato ferito (vita ${slime.vita}/8)`);

  // Tenendo premuto sul nemico si continua ad attaccare finché non cade.
  for (let i = 0; i < 25; i++) {
    const vivo = await mondo((s) => s.nemici.lista.at(-1).vivo);
    if (!vivo) break;
    const p = await mondo((s) => { const n = s.nemici.lista.at(-1); return { x: n.forma.x, y: n.forma.y }; });
    q = await schermoDa(p);
    await pagina.mouse.move(q.x, q.y);
    await pagina.mouse.down();
    await aspetta(250);
  }
  await pagina.mouse.up();
  const espDopo = await nelGioco(() => window.gioco.registry.get('partita').esperienza);
  const sconfitto = !(await mondo((s) => s.nemici.lista.at(-1).vivo));
  controlla(sconfitto && espDopo === espPrima + 5, `tenendo premuto lo slime viene sconfitto (+${espDopo - espPrima} esperienza in tutto)`);

  // ---------------- tasto destro: capriola verso il cursore ----------------
  await metti(centro(15, 8));
  await aspetta(1000);
  q = await schermoDa(centro(11, 8)); // a sinistra dell'eroe
  await pagina.mouse.click(q.x, q.y, { button: 'right' });
  await aspetta(40);
  const capriola = await mondo((s) => ({ stato: s.eroe.stato.nome, vx: s.eroe.forma.body.velocity.x }));
  controlla(capriola.stato === 'schivata' && capriola.vx < -150, `clic destro: capriola verso il cursore (vx ${capriola.vx.toFixed(0)})`);
  await schermata('05-capriola', { ferma: true });
  await aspetta(100);
  const vela = await nelGioco(() => window.gioco.scene.getScene('Interfaccia').capriola.vela.height);
  controlla(vela > 0, 'nella barra in basso il pulsante della capriola mostra la ricarica');
  await aspetta(1200);

  // ---------------- barra in basso e icone ----------------
  await metti(centro(15, 8));
  // Un percorso rimasto dalle prove precedenti farebbe sembrare che il clic sulla barra
  // abbia fatto partire l'eroe: si parte da fermi (prova a volte instabile, corretta nella 6b).
  await mondo((s) => s.guida.annulla());
  await aspetta(300);
  controlla(!(await inMovimento()), 'prima del clic l’eroe è fermo');
  await pagina.mouse.click(950, 520); // zona vuota della barra in basso
  await aspetta(300);
  controlla(!(await inMovimento()), 'un clic sulla barra in basso non fa camminare l’eroe');
  await pagina.mouse.click(...BARRA.capriola); // "Capriola" (il primo della barra)
  await aspetta(40);
  controlla((await eroe()).stato === 'schivata', 'il pulsante "Capriola" della barra fa la capriola');
  await aspetta(1000);
  await pagina.mouse.click(...BARRA.compagno); // "Compagno" (spento fino alla fase 5)
  await aspetta(200);
  controlla(!(await inMovimento()) && (await eroe()).stato === 'libero', 'i pulsanti spenti non fanno nulla');
  // Il dischetto (dalla 9a funziona: salva senza aprire pannelli né fermare il mondo).
  await pagina.mouse.move(960 - 30 - 3 * 52, 30); // sopra il dischetto
  await aspetta(150);
  const suggerimento = await nelGioco(() =>
    window.gioco.scene.getScene('Interfaccia').children.list.filter((o) => o.type === 'Text' && o.visible).map((t) => t.text).join(' | '));
  controlla(suggerimento.includes('Salva (F2)'), 'passando sopra il dischetto compare "Salva (F2)"');
  await schermata('06-icone');
  await pagina.mouse.click(960 - 30 - 3 * 52, 30);
  await aspetta(200);
  controlla(!(await nelGioco(() => window.gioco.scene.isActive('Scheda') || window.gioco.scene.isPaused('Mondo'))), 'il dischetto salva senza aprire pannelli');
  await pagina.mouse.click(960 - 30, 30);
  await aspetta(200);
  controlla(await nelGioco(() => window.gioco.scene.isActive('Scheda')), 'il ritratto apre la scheda');
  await pagina.keyboard.press('Escape');
  await aspetta(200);

  // ---------------- uscita cliccando, e il mouse funziona anche nella nuova mappa ----------------
  await metti(centro(33, 12));
  await aspetta(400);
  await clicMondo(centro(39, 12));
  await aspetta(2500);
  e = await eroe();
  controlla(e.mappa === 'bosco', 'cliccando sull’uscita si passa nel bosco');
  // Ci spostiamo lontano dall'uscita: un colpo subito proprio lì ci respingerebbe nella radura!
  await svuota();
  await metti(centro(15, 6));
  await aspetta(300);
  await mondo((s) => { s.nemici.aggiungi(s.dati.nemici.slime, { x: s.eroe.x + 40, y: s.eroe.y }).dopoAttacco(s.time.now + 60000); });
  await aspetta(100);
  const prima = (await eroe()).fendente;
  const p2 = await mondo((s) => { const n = s.nemici.vivi().at(-1); return { x: n.forma.x, y: n.forma.y }; });
  await clicMondo(p2);
  await aspetta(1500);
  controlla((await eroe()).fendente === prima + 1, 'nella nuova mappa un clic su un nemico vale ancora un solo attacco (nessun ascoltatore doppio)');

  controlla(g.errori.length === 0, `nessun errore nella console ${g.errori.length ? JSON.stringify(g.errori) : ''}`);
  controlla(g.richiesteEsterne.length === 0, 'nessuna richiesta a internet');
  process.exitCode = (await g.chiudi()) > 0 ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exit(1); // esce subito: altrimenti il browser rimasto aperto terrebbe in vita il processo
});

// Prova nel browser della consegna 7b: il mondo si allarga.
// Quest principale (Berta → cimitero → chiave), cancello e frana, la lettera di
// Bruno a Ugo nelle Colline Grigie, la mappa del cavaliere e il tesoro nascosto.
//
// Uso: node tests/browser/fase-7b.cjs <gioco.html> <cartella schermate>

const { apriGioco } = require('./aiuti.cjs');

const T = 16;
const centro = (col, riga) => ({ x: col * T + 8, y: riga * T + 8 });
const SPAZIO = (i) => [152 + (i % 4) * 62, 129 + Math.floor(i / 4) * 62];
const USA = [462, 325];

async function main() {
  const [percorso, cartella] = process.argv.slice(2);
  const g = await apriGioco(percorso, cartella);
  const { controlla, aspetta, schermata, pagina, clic, nelGioco } = g;
  const partita = () => nelGioco(() => window.gioco.registry.get('partita'));
  const attiva = (n) => nelGioco((n) => window.gioco.scene.isActive(n), n);
  const conta = (p, id) => p.inventario.spazi.reduce((t, s) => t + (s && s.id === id ? s.quantita : 0), 0);
  const indiceDi = (p, id) => p.inventario.spazi.findIndex((s) => s && s.id === id);
  const metti = (p) => g.mondo((s, p) => s.eroe.forma.body.reset(p.x, p.y), p);
  const avviso = () => nelGioco(() => window.gioco.registry.get('avviso')?.testo ?? '');
  const segno = (id) => g.mondo((s, id) => { const a = s.abitanti.find((a) => a.definizione.id === id); return a ? a.segnoAttuale : 'assente'; }, id);
  const svuota = () => g.mondo((s) => { for (const n of s.nemici.vivi()) n.subisci(999, { x: 0, y: 0 }, 0, s.time.now); });
  const mappa = () => g.mondo((s) => s.mappa.id);
  const vai = async (m) => { await g.mondo((s, m) => s.vaiA(m), m); await aspetta(1000); await svuota(); };
  const rispondi = async (testo) => {
    const punto = await nelGioco((testo) => {
      const t = window.gioco.scene.getScene('Dialogo').risposte.list.find((r) => r.text.includes(testo));
      return t ? { x: t.x + 30, y: t.y + 9 } : null;
    }, testo);
    if (!punto) throw new Error(`Risposta "${testo}" non trovata`);
    await clic(punto.x, punto.y);
    await aspetta(150);
  };
  const cliccaCella = async (cella) => {
    const q = await g.schermoDa(centro(...cella));
    await pagina.mouse.click(q.x, q.y);
  };
  const parlaCon = async (vicino, cella) => {
    await metti(centro(...vicino));
    await aspetta(200);
    await cliccaCella(cella);
    for (let i = 0; i < 50 && !(await attiva('Dialogo')); i++) await aspetta(100);
  };
  /** Clic su una cosa (cartello, uscita…) e attesa che succeda qualcosa. */
  const aspettaChe = async (condizione, max = 60) => { for (let i = 0; i < max && !(await condizione()); i++) await aspetta(100); };

  await g.creaPersonaggio(0, [0, 2], 'borgo'); // Guerriero, nel borgo
  await g.mondo((s) => s.impostaInvulnerabile(true));

  // ---------------- la quest principale ----------------
  controlla((await segno('berta')) === '!', 'sopra la sindaca Berta c’è un !');
  await parlaCon([22, 8], [22, 7]);
  await rispondi('Sono pronto');
  await rispondi('Vado');
  controlla((await partita()).quest.atto1_cimitero?.stato === 'attiva', 'Berta: «Atto I: il cimitero sulla collina» accettata');
  await rispondi('Arrivederci');
  await aspetta(200);

  // A piedi dal fondo del bosco: clic sull'uscita.
  await vai('bosco');
  await metti(centro(22, 36));
  await aspetta(200);
  await cliccaCella([22, 39]);
  await aspettaChe(async () => (await mappa()) === 'cimitero');
  await aspetta(800);
  controlla((await mappa()) === 'cimitero', 'in fondo al sentiero del bosco si arriva al Cimitero sulla collina');
  controlla(/fatto! Torna da Sindaca Berta/.test(await avviso()), `appena arrivati: "${await avviso()}"`);
  const scheletri = await g.mondo((s) => s.nemici.vivi().filter((n) => n.definizione.id === 'scheletro').length);
  controlla(scheletri >= 3, `tra le tombe ci sono ${scheletri} scheletri`);
  await svuota();
  await metti(centro(12, 10));
  await aspetta(300);
  await cliccaCella([12, 12]);
  await aspettaChe(async () => /Chiuso a chiave/.test(await avviso()));
  // Dalla fase 8a il cancello è una porta vera: senza chiave lo dice, con la chiave si apre.
  controlla(/Chiuso a chiave: il cancello della cripta/.test(await avviso()), `clic sul cancello della cripta: "${await avviso()}"`);
  await schermata('01-cimitero', { ferma: true });

  await vai('borgo');
  controlla((await segno('berta')) === '?', 'nel borgo, sopra Berta c’è un ? giallo');
  await parlaCon([22, 8], [22, 7]);
  await rispondi('Sono stato al cimitero');
  let p = await partita();
  controlla(p.quest.atto1_cimitero.stato === 'conclusa' && conta(p, 'chiave_cripta') === 1, 'Berta dà la chiave della cripta');
  await schermata('02-berta-chiave');
  await rispondi('Perché la tenevi');
  await rispondi('Arrivederci');
  await aspetta(200);

  // La chiave non si getta.
  await g.mondo((s, i) => s.gettaOggetto(i), indiceDi(p, 'chiave_cripta'));
  controlla(conta(await partita(), 'chiave_cripta') === 1, 'la chiave della cripta non si può gettare');
  await pagina.keyboard.press('l');
  await aspetta(200);
  const registro = await nelGioco(() => window.gioco.scene.getScene('Registro').contenuto.list.filter((o) => o.type === 'Text').map((o) => o.text).join(' | '));
  controlla(/Atto I: il cimitero sulla collina/.test(registro), 'registro: la quest principale conclusa');
  await schermata('03-registro-principale');
  await pagina.keyboard.press('l');
  await aspetta(200);

  await vai('cimitero');
  await metti(centro(12, 10));
  await aspetta(300);
  await cliccaCella([12, 12]);
  await aspettaChe(async () => /Apri il cancello/.test(await avviso()));
  controlla(/Apri il cancello della cripta con: Chiave della cripta/.test(await avviso()), `con la chiave (fase 8a): "${await avviso()}"`);

  // ---------------- la lettera di Bruno ----------------
  await g.mondo((s) => { const p = s.registry.get('partita'); s.registry.set('partita', { ...p, quest: { ...p.quest, carbone_bruno: { stato: 'conclusa', passo: 1, conteggio: 0 } } }); });
  await vai('borgo');
  controlla((await segno('bruno')) === '!', 'concluso il carbone, sopra Bruno c’è di nuovo un !');
  await parlaCon([8, 19], [8, 20]);
  await rispondi('Hai altro per me');
  await rispondi('La porto io');
  controlla(conta(await partita(), 'lettera_bruno') === 1, 'accettando, Bruno ti dà la lettera');
  await rispondi('Arrivederci');
  await aspetta(200);

  await vai('radura');
  await metti(centro(16, 22));
  await aspetta(200);
  await cliccaCella([16, 24]);
  await aspettaChe(async () => (await mappa()) === 'colline');
  await aspetta(800);
  await svuota();
  controlla((await mappa()) === 'colline', 'dal bordo sud della Radura si arriva nelle Colline Grigie');
  controlla((await segno('ugo')) === '?', 'sopra Ugo c’è un ?: è lui che aspetti');
  await parlaCon([16, 18], [17, 18]);
  p = await partita();
  controlla(conta(p, 'lettera_bruno') === 0, 'parlando con Ugo la lettera passa a lui');
  const resistenzaPrima = conta(p, 'pozione_resistenza');
  await rispondi('Ho una lettera');
  p = await partita();
  controlla(p.quest.lettera_bruno.stato === 'conclusa' && conta(p, 'pozione_resistenza') === resistenzaPrima + 1, 'Ugo: quest conclusa, una pozione di resistenza');
  await schermata('04-ugo');
  await rispondi('Grazie');
  await aspetta(200);

  // La frana sulla strada della miniera.
  await metti(centro(28, 6));
  await aspetta(200);
  await cliccaCella([30, 6]);
  await aspettaChe(async () => /frana/.test(await avviso()));
  controlla(/Una frana blocca la strada per la miniera/.test(await avviso()), 'clic sulla frana: la strada per la miniera è chiusa');
  await schermata('05-frana', { ferma: true });

  // ---------------- la mappa del cavaliere ----------------
  await g.mondo((s) => s.daiOggetto('mappa_cavaliere'));
  await pagina.keyboard.press('i');
  await aspetta(200);
  await clic(...SPAZIO(indiceDi(await partita(), 'mappa_cavaliere')));
  await clic(...USA);
  await aspetta(200);
  controlla(await attiva('MappaTesoro'), '"Usa" sulla mappa: si apre il disegno');
  controlla((await partita()).quest.tesoro_cavaliere?.stato === 'attiva', 'la quest della mappa è attiva');
  await schermata('06-mappa-tesoro');
  await clic(480, 270);
  await aspetta(200);
  controlla(!(await attiva('MappaTesoro')) && conta(await partita(), 'mappa_cavaliere') === 1, 'un clic chiude la mappa (che resta nello zaino)');
  await pagina.keyboard.press('i');
  await aspetta(200);
  await vai('borgo');
  controlla((await segno('gemma')) === null, 'sopra Gemma nessun segno: la quest della mappa non passa da lei');
  await vai('colline');

  // Il muro che non è un muro, poi il forziere.
  await metti(centro(4, 6));
  await aspetta(200);
  await cliccaCella([4, 4]);
  await aspettaChe(() => g.mondo((s) => s.muri.some((m) => m.aperto)));
  controlla(await g.mondo((s) => s.muri.some((m) => m.aperto)), 'il muro segreto si apre');
  await aspetta(300);
  await cliccaCella([3, 2]);
  await aspettaChe(async () => (await partita()).quest.tesoro_cavaliere?.stato === 'conclusa');
  controlla((await partita()).quest.tesoro_cavaliere?.stato === 'conclusa', 'aperto il forziere, la quest si conclude da sola');
  controlla(/La mappa del cavaliere» conclusa: \+80 esperienza/.test(await avviso()), `avviso: "${await avviso()}"`);
  await aspettaChe(async () => conta(await partita(), 'spada_cavaliere') === 1, 40);
  controlla(conta(await partita(), 'spada_cavaliere') === 1, 'la Spada del cavaliere è nello zaino');
  await schermata('07-tesoro', { ferma: true });

  controlla(g.errori.length === 0, `nessun errore ${g.errori.length ? JSON.stringify(g.errori) : ''}`);
  controlla(g.richiesteEsterne.length === 0, 'nessuna richiesta a internet');
  process.exitCode = (await g.chiudi()) > 0 ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

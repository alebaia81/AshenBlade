// Prova nel browser della consegna 8a: la Cripta dei Non Morti.
// Cancello con la chiave di Berta, porta d'ossa, forziere chiuso (chiave piccola e
// Volpe), il Re Scheletro con barriere, fasi ed evocazione, la verità di Anselmo.
//
// Uso: node tests/browser/fase-8a.cjs <gioco.html> <cartella schermate>

const { apriGioco, BARRA } = require('./aiuti.cjs');

const T = 16;
const centro = (col, riga) => ({ x: col * T + 8, y: riga * T + 8 });

async function main() {
  const [percorso, cartella] = process.argv.slice(2);
  const g = await apriGioco(percorso, cartella);
  const { controlla, aspetta, schermata, pagina, clic, nelGioco } = g;
  const partita = () => nelGioco(() => window.gioco.registry.get('partita'));
  const attiva = (n) => nelGioco((n) => window.gioco.scene.isActive(n), n);
  const conta = (p, id) => p.inventario.spazi.reduce((t, s) => t + (s && s.id === id ? s.quantita : 0), 0);
  const metti = (p) => g.mondo((s, p) => s.eroe.forma.body.reset(p.x, p.y), p);
  const avviso = () => nelGioco(() => window.gioco.registry.get('avviso')?.testo ?? '');
  const barraBoss = () => nelGioco(() => window.gioco.registry.get('boss'));
  const segno = (id) => g.mondo((s, id) => { const a = s.abitanti.find((a) => a.definizione.id === id); return a ? a.segnoAttuale : 'assente'; }, id);
  const svuota = () => g.mondo((s) => { for (const n of s.nemici.vivi()) if (!n.definizione.fasi) n.subisci(999, { x: 0, y: 0 }, 0, s.time.now); });
  const mappa = () => g.mondo((s) => s.mappa.id);
  const vai = async (m) => { await g.mondo((s, m) => s.vaiA(m), m); await aspetta(1000); await svuota(); };
  const aspettaChe = async (cond, max = 60) => { for (let i = 0; i < max && !(await cond()); i++) await aspetta(100); };
  const cliccaCella = async (cella) => { const q = await g.schermoDa(centro(...cella)); await pagina.mouse.click(q.x, q.y); };
  /** Va vicino, clicca, aspetta che l'avviso cambi. */
  const usa = async (vicino, cella) => {
    const prima = await nelGioco(() => window.gioco.registry.get('avviso')?.id ?? -1);
    await metti(centro(...vicino));
    await aspetta(200);
    await cliccaCella(cella);
    await aspettaChe(async () => (await nelGioco(() => window.gioco.registry.get('avviso')?.id ?? -1)) !== prima, 40);
    await aspetta(150);
  };
  const raccogliQui = async (cella) => { await metti({ x: cella[0] * T + 8, y: cella[1] * T + 8 + 14 }); await aspetta(400); };
  const rispondi = async (testo) => {
    const punto = await nelGioco((testo) => {
      const t = window.gioco.scene.getScene('Dialogo').risposte.list.find((r) => r.text.includes(testo));
      return t ? { x: t.x + 30, y: t.y + 9 } : null;
    }, testo);
    if (!punto) throw new Error(`Risposta "${testo}" non trovata`);
    await clic(punto.x, punto.y);
    await aspetta(150);
  };
  const parlaCon = async (vicino, cella) => {
    await metti(centro(...vicino));
    await aspetta(200);
    await cliccaCella(cella);
    for (let i = 0; i < 50 && !(await attiva('Dialogo')); i++) await aspetta(100);
  };
  const prendi = (id) => g.mondo((s, id) => {
    const p = s.registry.get('partita');
    s.registry.set('partita', { ...p, compagni: { ingaggiati: [...new Set([...p.compagni.ingaggiati, id])], attivo: id } });
    s.registry.set('abilitaCompagno', { prontaDa: 0 });
    s.creaCompagno();
  }, id);

  await g.creaPersonaggio(0, [0, 2], 'borgo'); // Guerriero
  await g.mondo((s) => s.impostaInvulnerabile(true));
  // Come alla fine della 7b: Atto I al cimitero concluso, chiave della cripta nello zaino.
  await g.mondo((s) => { const p = s.registry.get('partita'); s.registry.set('partita', { ...p, quest: { ...p.quest, atto1_cimitero: { stato: 'conclusa', passo: 1, conteggio: 0 } } }); });
  await g.mondo((s) => s.daiOggetto('chiave_cripta'));

  // ---------------- Berta ----------------
  controlla((await segno('berta')) === '!', 'sopra Berta c’è di nuovo un !');
  await parlaCon([22, 8], [22, 7]);
  await rispondi('E adesso');
  await rispondi('Ci vado');
  await rispondi('Arrivederci');
  await aspetta(200);
  controlla((await partita()).quest.atto1_cripta?.stato === 'attiva', 'Berta: «Atto I: la Cripta dei Non Morti» accettata');

  // ---------------- il cancello ----------------
  await vai('cimitero');
  await usa([12, 10], [12, 12]);
  controlla(/Apri il cancello della cripta con: Chiave della cripta/.test(await avviso()), `con la chiave di Berta: "${await avviso()}"`);
  controlla((await partita()).porteAperte.includes('cimitero:12:12'), 'la porta aperta resta nella Partita');
  await cliccaCella([12, 13]);
  await aspettaChe(async () => (await mappa()) === 'cripta_sale');
  await aspetta(800);
  await svuota();
  controlla((await mappa()) === 'cripta_sale', 'oltre il cancello: la Cripta dei Non Morti');
  controlla((await partita()).quest.atto1_cripta.passo === 1, 'passo 1 fatto: sei entrato nella cripta');
  const nemiciCripta = await g.mondo((s) => [...new Set(s.nemici.lista.map((n) => n.definizione.id))].sort().join(','));
  controlla(/pipistrello/.test(nemiciCripta) && /zombie/.test(nemiciCripta), `nella cripta: ${nemiciCripta}`);

  // ---------------- porta d'ossa e forzieri ----------------
  await usa([15, 11], [15, 13]);
  controlla(/Chiuso a chiave: la porta d'ossa\. Serve: Chiave d'ossa/.test(await avviso()), `senza chiave: "${await avviso()}"`);
  await usa([26, 7], [26, 5]);
  controlla(/Serve: Chiave piccola/.test(await avviso()), `il forziere chiuso, senza chiave: "${await avviso()}"`);
  await schermata('01-forziere-chiuso', { ferma: true });
  await usa([19, 11], [20, 11]);
  await raccogliQui([20, 11]);
  controlla(conta(await partita(), 'chiave_piccola') === 1, 'nel forziere della sala c’è una chiave piccola');
  await usa([26, 7], [26, 5]);
  let p = await partita();
  controlla(p.forzieriAperti.includes('cripta_sale:26:5') && conta(p, 'chiave_piccola') === 0, `con la chiave piccola si apre (e la chiave si consuma): "${await avviso()}"`);

  // Volpe: si richiude il forziere (solo per la prova) e lei lo apre senza chiave.
  await g.mondo((s) => { const p = s.registry.get('partita'); s.registry.set('partita', { ...p, forzieriAperti: p.forzieriAperti.filter((k) => k !== 'cripta_sale:26:5') }); });
  await vai('cripta_sale');
  await prendi('volpe');
  await metti(centro(25, 7));
  await aspetta(300);
  await clic(...BARRA.compagno);
  await aspetta(300);
  controlla((await partita()).forzieriAperti.includes('cripta_sale:26:5') && /Volpe fa scattare/.test(await avviso()), `Volpe apre il forziere chiuso: "${await avviso()}"`);
  await schermata('02-volpe', { ferma: true });

  await usa([3, 7], [3, 5]);
  await raccogliQui([3, 5]);
  controlla(conta(await partita(), 'chiave_ossa') === 1, 'nella stanza ovest: la chiave d’ossa');
  await usa([15, 11], [15, 13]);
  controlla(/Apri la porta d'ossa con: Chiave d'ossa/.test(await avviso()), `la porta d’ossa si apre: "${await avviso()}"`);
  await metti(centro(15, 17));
  await aspetta(200);
  await cliccaCella([15, 19]);
  await aspettaChe(async () => (await mappa()) === 'cripta_tomba');
  await aspetta(800);
  controlla((await mappa()) === 'cripta_tomba', 'dalle scale: la tomba del re');

  // ---------------- il Re Scheletro ----------------
  controlla((await barraBoss()) === null, 'dal corridoio il re non ti vede: niente barra');
  await metti(centro(12, 7));
  await aspettaChe(async () => (await barraBoss()) !== null, 30);
  let b = await barraBoss();
  controlla(b?.nome === 'Re Scheletro' && b.vita === b.massima, `entrato nella stanza: la barra del boss (${b?.nome} ${b?.vita}/${b?.massima})`);
  controlla(await g.mondo((s) => s.barriere.every((x) => x.chiusa)), 'le barriere si chiudono alle spalle');
  await schermata('03-re-scheletro', { ferma: true });
  // Sotto metà vita: la fase 2 evoca scheletri.
  await g.mondo((s) => { const re = s.nemici.vivi().find((n) => n.definizione.id === 're_scheletro'); re.subisci(60, { x: 0, y: 0 }, 0, s.time.now, false); });
  await aspetta(600);
  const evocati = await g.mondo((s) => s.nemici.vivi().filter((n) => n.definizione.id === 'scheletro').length);
  controlla(evocati >= 1 && /servitori/.test(await avviso()), `fase 2: «${await avviso()}», ${evocati} scheletri evocati`);
  await schermata('04-fase-2', { ferma: true });
  // Il colpo finale passa dal Combattimento, come un colpo vero.
  await g.mondo((s) => {
    const re = s.nemici.vivi().find((n) => n.definizione.id === 're_scheletro');
    s.combattimento.infliggi(re, s.combattimento.colpoArma(s.eroe.arma, 999, 0, { x: re.forma.x, y: re.forma.y - 20 }), s.time.now);
  });
  await aspetta(300);
  p = await partita();
  controlla(p.bossSconfitti.includes('re_scheletro') && (await barraBoss()) === null, 'il Re Scheletro è sconfitto: niente più barra');
  controlla(await g.mondo((s) => s.barriere.every((x) => !x.chiusa)), 'le barriere si riaprono');
  await svuota();
  const posto = await g.mondo((s) => s.oggettiATerra.oggetti.map((o) => ({ id: o.definizione.id, x: o.posizione.x, y: o.posizione.y })));
  controlla(['frammento_corona', 'elmo_corona', 'pagina_diario'].every((id) => posto.some((o) => o.id === id)), `bottino: ${posto.map((o) => o.id).join(', ')}`);
  for (const o of posto) { await metti({ x: o.x, y: o.y }); await aspetta(150); }
  p = await partita();
  controlla(conta(p, 'pagina_diario') === 1 && conta(p, 'elmo_corona') === 1 && p.quest.atto1_cripta.passo === 2, 'raccolti la pagina di diario e l’Elmo della corona; passo 2 fatto');
  await schermata('05-bottino', { ferma: true });
  await vai('cripta_tomba');
  controlla(!(await g.mondo((s) => s.nemici.lista.some((n) => n.definizione.id === 're_scheletro'))) && (await barraBoss()) === null, 'rientrando nella tomba il re non ricompare');

  // ---------------- la verità di Anselmo ----------------
  await vai('borgo');
  controlla((await segno('anselmo')) === '?', 'nel borgo, sopra Anselmo c’è un ?');
  await parlaCon([8, 9], [8, 8]);
  await rispondi('Ho trovato questa pagina');
  p = await partita();
  controlla(p.quest.atto1_cripta.stato === 'conclusa' && conta(p, 'pagina_diario') === 0, 'Anselmo prende la pagina: Atto I concluso');
  const testo = await nelGioco(() => window.gioco.scene.getScene('Dialogo').testo.text);
  controlla(/Orvald/.test(testo), `Anselmo: "${testo.slice(0, 60)}…"`);
  await rispondi('Cosa gli è successo');
  await schermata('06-anselmo');
  await rispondi('La negromanzia');
  await rispondi('Lo fermerò');
  await rispondi('Arrivederci');
  await aspetta(200);

  controlla(g.errori.length === 0, `nessun errore ${g.errori.length ? JSON.stringify(g.errori) : ''}`);
  controlla(g.richiesteEsterne.length === 0, 'nessuna richiesta a internet');
  process.exitCode = (await g.chiudi()) > 0 ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

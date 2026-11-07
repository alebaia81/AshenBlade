// Prova nel browser della consegna 8b: la Miniera dei Goblin.
// La frana sparita, i banditi, goblin arcieri che tirano, ragni che caricano, le
// vene di cristallo, il Troll delle Caverne (carica e crollo dei massi), la
// Quercia ferita e nonna Rosalba.
//
// Uso: node tests/browser/fase-8b.cjs <gioco.html> <cartella schermate>

const { apriGioco } = require('./aiuti.cjs');

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
  const segno = (id) => g.mondo((s, id) => { const a = s.abitanti.find((a) => a.definizione.id === id); return a ? a.segnoAttuale : 'assente'; }, id);
  const mappa = () => g.mondo((s) => s.mappa.id);
  const tranne = (ids) => g.mondo((s, ids) => { for (const n of s.nemici.vivi()) if (!n.definizione.fasi && !ids.includes(n.definizione.id)) n.subisci(999, { x: 0, y: 0 }, 0, s.time.now); }, ids);
  const vai = async (m, tieni = []) => { await g.mondo((s, m) => s.vaiA(m), m); await aspetta(1000); await tranne(tieni); };
  const aspettaChe = async (cond, max = 60) => { for (let i = 0; i < max && !(await cond()); i++) await aspetta(100); };
  const cliccaCella = async (cella) => { const q = await g.schermoDa(centro(...cella)); await pagina.mouse.click(q.x, q.y); };
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
  /** La velocità massima raggiunta da un nemico in un certo tempo. */
  const velocitaMassima = async (id, ms) => {
    let massima = 0;
    for (let t = 0; t < ms; t += 50) {
      await aspetta(50);
      const v = await g.mondo((s, id) => { const n = s.nemici.lista.find((x) => x.definizione.id === id && x.vivo); return n ? Math.hypot(n.forma.body.velocity.x, n.forma.body.velocity.y) : 0; }, id);
      massima = Math.max(massima, v);
    }
    return massima;
  };

  await g.creaPersonaggio(0, [0, 2], 'borgo'); // Guerriero
  await g.mondo((s) => s.impostaInvulnerabile(true));
  // Come alla fine della 8a: Atto I concluso, Re Scheletro sconfitto.
  await g.mondo((s) => {
    const p = s.registry.get('partita');
    const conclusa = { stato: 'conclusa', passo: 9, conteggio: 0 };
    s.registry.set('partita', { ...p, quest: { ...p.quest, atto1_cimitero: conclusa, atto1_cripta: conclusa }, bossSconfitti: ['re_scheletro'] });
  });

  // ---------------- Berta ----------------
  await vai('borgo');
  controlla((await segno('berta')) === '!', 'sopra Berta c’è un ! (Atto II)');
  await parlaCon([22, 8], [22, 7]);
  await rispondi('Anselmo mi ha raccontato');
  await rispondi('Ci vado');
  await rispondi('Arrivederci');
  await aspetta(200);
  controlla((await partita()).quest.atto2_miniera?.stato === 'attiva', 'Berta: «Atto II: la Miniera dei Goblin» accettata');

  // ---------------- Colline: frana sparita, banditi ----------------
  await vai('colline', ['bandito']);
  const frane = await g.mondo((s) => s.cartelli.filter((c) => c.dati.aspetto === 'frana').length);
  controlla(frane === 0, 'dopo l’Atto I la frana nelle Colline non c’è più');
  const banditi = await g.mondo((s) => s.nemici.vivi().filter((n) => n.definizione.id === 'bandito').length);
  controlla(banditi >= 3, `nelle Colline ci sono ${banditi} banditi`);
  await tranne([]);
  await metti(centro(29, 6));
  await aspetta(200);
  await cliccaCella([31, 6]);
  await aspettaChe(async () => (await mappa()) === 'miniera_gallerie');
  await aspetta(800);
  controlla((await mappa()) === 'miniera_gallerie' && (await partita()).quest.atto2_miniera.passo === 1, 'a est, oltre la frana: la Miniera dei Goblin (passo 1 fatto)');

  // ---------------- un goblin arciere tira ----------------
  await tranne(['goblin_arciere']);
  await g.mondo((s) => { for (const n of s.nemici.vivi()) if (n.forma.x > 300) n.subisci(999, { x: 0, y: 0 }, 0, s.time.now); });
  const arciere = await g.mondo((s) => { const n = s.nemici.vivi().find((x) => x.definizione.id === 'goblin_arciere'); return { x: n.forma.x, y: n.forma.y }; });
  await g.mondo((s) => { s.impostaInvulnerabile(false); s.vitaPiena(); });
  await metti({ x: arciere.x - 80, y: arciere.y + 16 });
  const vitaPrima = await g.mondo((s) => s.eroe.vita.attuale);
  let frecce = 0;
  for (let i = 0; i < 40 && frecce === 0; i++) { await aspetta(100); frecce = await g.mondo((s) => s.tiriNemici.inVolo.length); }
  controlla(frecce > 0, 'a distanza il goblin arciere tira una freccia');
  await schermata('01-freccia', { ferma: true });
  await aspettaChe(async () => (await g.mondo((s) => s.eroe.vita.attuale)) < vitaPrima, 30);
  controlla((await g.mondo((s) => s.eroe.vita.attuale)) < vitaPrima, 'la freccia colpisce l’eroe');
  await g.mondo((s) => { s.impostaInvulnerabile(true); s.vitaPiena(); });
  await tranne([]);

  // ---------------- un ragno carica ----------------
  await g.mondo((s, p) => { const n = s.nemici.aggiungi(s.dati.nemici.ragno, p); }, centro(14, 18));
  await metti({ x: centro(14, 18).x + 70, y: centro(14, 18).y });
  const vRagno = await velocitaMassima('ragno', 2000);
  controlla(vRagno > 150, `il ragno si ferma, mira e scatta (velocità massima ${Math.round(vRagno)})`);
  await tranne([]);

  // ---------------- cristallo e forzieri ----------------
  await usa([32, 4], [33, 4]);
  await aspettaChe(async () => conta(await partita(), 'cristallo_miniera') > 0, 30);
  controlla(conta(await partita(), 'cristallo_miniera') >= 1, 'dalla vena di cristallo: cristallo della miniera');
  await usa([9, 19], [9, 20]);
  await raccogliQui([9, 20]);
  await usa([19, 19], [20, 20]);
  await raccogliQui([20, 20]);
  controlla(conta(await partita(), 'pergamena_ascia_troll') === 1, 'nel forziere chiuso: la pergamena dell’Ascia del troll');

  // ---------------- il Troll delle Caverne ----------------
  await vai('miniera_tana');
  await metti(centro(13, 7));
  await aspettaChe(async () => (await nelGioco(() => window.gioco.registry.get('boss'))) !== null, 30);
  controlla((await nelGioco(() => window.gioco.registry.get('boss')))?.nome === 'Troll delle Caverne', 'nella tana: la barra del Troll delle Caverne');
  // L'eroe resta lontano dal troll (con l'eroe addosso il troll non carica: lo colpisce e basta).
  let vTroll = 0;
  for (let i = 0; i < 80 && vTroll <= 200; i++) {
    await g.mondo((s, punti) => {
      const t = s.nemici.vivi().find((n) => n.definizione.id === 'troll_caverne');
      if (Math.hypot(t.forma.x - s.eroe.x, t.forma.y - s.eroe.y) > 64) return;
      const lontano = punti.sort((a, b) => Math.hypot(b.x - t.forma.x, b.y - t.forma.y) - Math.hypot(a.x - t.forma.x, a.y - t.forma.y))[0];
      s.eroe.forma.body.reset(lontano.x, lontano.y);
    }, [centro(4, 8), centro(21, 8), centro(4, 17), centro(21, 17)]);
    vTroll = Math.max(vTroll, await velocitaMassima('troll_caverne', 100));
  }
  controlla(vTroll > 200, `il troll mira e carica in linea retta (velocità ${Math.round(vTroll)})`);
  await g.mondo((s) => { const t = s.nemici.vivi().find((n) => n.definizione.id === 'troll_caverne'); t.subisci(120, { x: 0, y: 0 }, 0, s.time.now, false); });
  await aspetta(300);
  controlla(/ruggisce/.test(await avviso()), `fase 2: "${await avviso()}"`);
  let ombre = 0;
  for (let i = 0; i < 90 && ombre === 0; i++) {
    await aspetta(100);
    ombre = await g.mondo((s) => s.children.list.filter((o) => o.type === 'Arc' && o.radius === 12 && o.fillColor === 0).length);
  }
  controlla(ombre >= 3, `crollo dei massi: ${ombre} ombre a terra prima che cadano`);
  await schermata('02-crollo-massi', { ferma: true });
  await g.mondo((s) => {
    const t = s.nemici.vivi().find((n) => n.definizione.id === 'troll_caverne');
    s.combattimento.infliggi(t, s.combattimento.colpoArma(s.eroe.arma, 999, 0, { x: t.forma.x, y: t.forma.y - 20 }), s.time.now);
  });
  await aspetta(300);
  let p = await partita();
  controlla(p.bossSconfitti.includes('troll_caverne') && p.quest.atto2_miniera.passo === 2, 'il troll è sconfitto (passo 2 fatto)');
  const bottino = await g.mondo((s) => s.oggettiATerra.oggetti.map((o) => ({ id: o.definizione.id, x: o.posizione.x, y: o.posizione.y })));
  for (const o of bottino) { await metti({ x: o.x, y: o.y }); await aspetta(150); }
  p = await partita();
  controlla(conta(p, 'zanna_troll') === 1 && conta(p, 'guanti_titano') === 1, 'bottino: zanna del troll e Guanti del titano');

  // ---------------- la Quercia ferita ----------------
  await vai('borgo');
  const quercia = await g.mondo((s) => ({ q: s.mappa.simboli.flat().filter((c) => c === 'Q').length, ramo: s.cartelli.some((c) => c.dati.aspetto === 'ramo') }));
  controlla(quercia.q === 0 && quercia.ramo, 'tornando nel borgo: la Quercia Antica è ferita, a terra un ramo tagliato');
  controlla((await partita()).quest.atto2_miniera.stato === 'attiva' && (await segno('rosalba')) === '?', 'passo 3 fatto: sopra nonna Rosalba c’è un ?');
  await metti(centro(19, 16));
  await aspetta(300);
  await schermata('03-quercia-ferita', { ferma: true });
  await parlaCon([11, 12], [10, 12]);
  await rispondi('un ramo è stato tagliato');
  controlla((await partita()).quest.atto2_miniera.stato === 'conclusa', 'Rosalba: Atto II concluso');
  await schermata('04-rosalba');
  await rispondi('Orvald ha tutto');
  await rispondi('Arrivederci');

  controlla(g.errori.length === 0, `nessun errore ${g.errori.length ? JSON.stringify(g.errori) : ''}`);
  controlla(g.richiesteEsterne.length === 0, 'nessuna richiesta a internet');
  process.exitCode = (await g.chiudi()) > 0 ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

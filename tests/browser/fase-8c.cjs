// Prova nel browser della consegna 8c: la Torre del Negromante e il finale.
// La nebbia sparita, la Brughiera di notte, la torre (chiave e cancello, forziere
// chiuso), il Negromante (teletrasporto, incantesimi, ombre), le pagine del
// finale, la confessione di Berta, il germoglio sulla tomba di Lia.
//
// Uso: node tests/browser/fase-8c.cjs <gioco.html> <cartella schermate>

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
  const svuota = () => g.mondo((s) => { for (const n of s.nemici.vivi()) if (!n.definizione.fasi) n.subisci(999, { x: 0, y: 0 }, 0, s.time.now); });
  const vai = async (m) => { await g.mondo((s, m) => s.vaiA(m), m); await aspetta(1000); await svuota(); };
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
  const apriForziere = async (vicino, cella) => {
    await metti(centro(...vicino));
    await aspetta(200);
    await cliccaCella(cella);
    await aspettaChe(() => g.mondo((s, k) => s.registry.get('partita').forzieriAperti.includes(k), `torre_piani:${cella[0]}:${cella[1]}`), 40);
    await metti({ x: cella[0] * T + 8, y: cella[1] * T + 8 + 14 });
    await aspetta(400);
  };
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

  await g.creaPersonaggio(0, [0, 2], 'borgo'); // Guerriero
  await g.mondo((s) => s.impostaInvulnerabile(true));
  // Come alla fine della 8b: Atti I e II conclusi, due boss sconfitti.
  await g.mondo((s) => {
    const p = s.registry.get('partita');
    const c = { stato: 'conclusa', passo: 9, conteggio: 0 };
    s.registry.set('partita', { ...p, quest: { ...p.quest, atto1_cimitero: c, atto1_cripta: c, atto2_miniera: c }, bossSconfitti: ['re_scheletro', 'troll_caverne'] });
  });
  await vai('borgo');

  // ---------------- Rosalba ----------------
  controlla((await segno('rosalba')) === '!', 'sopra nonna Rosalba c’è un ! (Atto III)');
  await parlaCon([11, 12], [10, 12]);
  await rispondi('La torre di Orvald');
  await rispondi('Vado alla torre');
  await rispondi('Arrivederci');
  await aspetta(200);
  controlla((await partita()).quest.atto3_torre?.stato === 'attiva', 'Rosalba: «Atto III: la Torre del Negromante» accettata');

  // ---------------- Colline → Brughiera ----------------
  await vai('colline');
  controlla(!(await g.mondo((s) => s.cartelli.some((c) => c.dati.aspetto === 'nebbia'))), 'dopo l’Atto II la nebbia a ovest delle Colline è sparita');
  await metti(centro(2, 12));
  await aspetta(200);
  await cliccaCella([0, 12]);
  await aspettaChe(async () => (await mappa()) === 'brughiera');
  await aspetta(800);
  controlla((await mappa()) === 'brughiera' && (await partita()).quest.atto3_torre.passo === 1, 'a ovest: la Brughiera della Torre (passo 1 fatto)');
  controlla(await g.mondo((s) => s.children.list.some((o) => o.type === 'Rectangle' && o.fillColor === 0x0a0a30)), 'la luna nera: un velo scuro sopra la Brughiera');
  const varianti = await g.mondo((s) => [...new Set(s.nemici.lista.map((n) => n.definizione.id))].sort().join(','));
  controlla(/lupo_brughiera/.test(varianti) && /bandito_brughiera/.test(varianti), `nemici più forti: ${varianti}`);
  await metti(centro(10, 12));
  await aspetta(300);
  await schermata('01-brughiera', { ferma: true });
  await metti(centro(8, 12));
  await aspetta(200);
  await cliccaCella([6, 12]);
  await aspettaChe(async () => (await mappa()) === 'torre_piani');
  await aspetta(800);
  await svuota();
  controlla((await mappa()) === 'torre_piani' && (await partita()).quest.atto3_torre.passo === 2, 'dentro la torre (passo 2 fatto)');

  // ---------------- i piani della torre ----------------
  await usa([14, 18], [14, 16]);
  controlla(/Chiuso a chiave: il cancello della scala/.test(await avviso()), `il cancello della scala è chiuso: "${await avviso()}"`);
  await apriForziere([3, 18], [3, 19]);
  controlla(conta(await partita(), 'chiave_torre') === 1, 'nella stanza del golem: la chiave della torre');
  await usa([14, 18], [14, 16]);
  controlla(/Apri il cancello della scala/.test(await avviso()), 'il cancello della scala si apre');
  await apriForziere([26, 16], [26, 15]);
  await apriForziere([21, 7], [21, 8]);
  controlla(conta(await partita(), 'pergamena_bastone_orvald') === 1, 'nel forziere chiuso: la pergamena del Bastone di Orvald');
  const spettro = await g.mondo((s) => s.dati.nemici.spettro.opacita);
  controlla(spettro < 1, `gli spettri sono trasparenti (opacità ${spettro})`);

  // ---------------- il Negromante ----------------
  await vai('torre_cima');
  await metti(centro(13, 7));
  await aspettaChe(async () => (await nelGioco(() => window.gioco.registry.get('boss'))) !== null, 30);
  controlla((await nelGioco(() => window.gioco.registry.get('boss')))?.nome === 'Il Negromante', 'in cima: la barra del Negromante');
  let salto = 0;
  let sfere = 0;
  let prima = await g.mondo((s) => { const n = s.boss.nemico; return { x: n.forma.x, y: n.forma.y }; });
  for (let i = 0; i < 90 && (salto < 40 || sfere < 3); i++) {
    await aspetta(100);
    const ora = await g.mondo((s) => { const n = s.boss.nemico; return { x: n.forma.x, y: n.forma.y, sfere: s.tiriNemici.inVolo.length }; });
    salto = Math.max(salto, Math.hypot(ora.x - prima.x, ora.y - prima.y));
    sfere = Math.max(sfere, ora.sfere);
    prima = ora;
  }
  controlla(salto >= 40, `il Negromante si teletrasporta (salto di ${Math.round(salto)} px in un attimo)`);
  controlla(sfere >= 3, `incantesimo: un ventaglio di ${sfere} sfere`);
  await schermata('02-negromante', { ferma: true });
  await g.mondo((s) => s.boss.nemico.subisci(160, { x: 0, y: 0 }, 0, s.time.now, false));
  await aspetta(500);
  const ombre = await g.mondo((s) => s.nemici.vivi().filter((n) => n.definizione.id === 'ombra').length);
  controlla(ombre >= 1 && /ombre/.test(await avviso()), `fase 2: «${await avviso()}», ${ombre} ombre`);
  await schermata('03-ombre', { ferma: true });
  await g.mondo((s) => {
    const n = s.boss.nemico;
    s.combattimento.infliggi(n, s.combattimento.colpoArma(s.eroe.arma, 999, 0, { x: n.forma.x, y: n.forma.y - 20 }), s.time.now);
  });
  await aspettaChe(() => attiva('Finale'), 40);
  controlla(await attiva('Finale'), 'sconfitto il Negromante: il finale');
  const prima_pagina = await nelGioco(() => window.gioco.scene.getScene('Finale').stato);
  controlla(/Orvald/.test(prima_pagina.testo), `prima pagina: "${prima_pagina.testo.slice(0, 50)}…"`);
  await clic(480, 270);
  await aspetta(700);
  await schermata('04-finale');
  for (let i = 1; i < prima_pagina.totale; i++) { await clic(480, 270); await aspetta(200); }
  controlla(!(await attiva('Finale')) && (await attiva('Mondo')), 'dopo l’ultima pagina si torna a giocare');
  controlla((await partita()).bossSconfitti.includes('negromante'), 'il Negromante è tra i boss sconfitti');

  // ---------------- Berta e il germoglio ----------------
  await vai('borgo');
  controlla((await segno('berta')) === '?', 'nel borgo, sopra Berta c’è un ?');
  await parlaCon([22, 8], [22, 7]);
  await rispondi('È finita');
  controlla((await partita()).quest.atto3_torre.stato === 'conclusa', 'Berta: Atto III concluso');
  await rispondi('Hai avuto paura');
  await schermata('05-berta');
  await rispondi('È un buon inizio');
  await rispondi('Arrivederci');
  await aspetta(200);
  await vai('cimitero');
  controlla(await g.mondo((s) => s.cartelli.some((c) => c.dati.aspetto === 'germoglio')), 'al cimitero, sulla tomba di Lia, c’è il germoglio');
  await metti(centro(19, 14));
  await aspetta(400);
  await schermata('06-germoglio', { ferma: true });

  controlla(g.errori.length === 0, `nessun errore ${g.errori.length ? JSON.stringify(g.errori) : ''}`);
  controlla(g.richiesteEsterne.length === 0, 'nessuna richiesta a internet');
  process.exitCode = (await g.chiudi()) > 0 ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

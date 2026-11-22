// Prova nel browser della consegna 10a: bottino dei boss, Altare ed Eco dei boss,
// ricette dei Sigilli dell'Eco e migrazione dei salvataggi v1 → v2.
//
// Uso: node tests/browser/fase-10a.cjs <gioco.html> <cartella schermate>

const { apriGioco } = require('./aiuti.cjs');

const T = 16;
const centro = (col, riga) => ({ x: col * T + 8, y: riga * T + 8 });

async function main() {
  const [percorso, cartella] = process.argv.slice(2);
  const g = await apriGioco(percorso, cartella);
  const { controlla, aspetta, schermata, pagina, clic, nelGioco } = g;
  const partita = () => nelGioco(() => window.gioco.registry.get('partita'));
  const attiva = (n) => nelGioco((n) => window.gioco.scene.isActive(n), n);
  const conta = (p, id) =>
    p.inventario.spazi.reduce((t, s) => t + (s && s.id === id ? s.quantita : 0), 0) +
    (p.tascaMissioni || []).reduce((t, s) => t + (s && s.id === id ? s.quantita : 0), 0);
  const metti = (p) => g.mondo((s, p) => s.eroe.forma.body.reset(p.x, p.y), p);
  const avviso = () => nelGioco(() => window.gioco.registry.get('avviso')?.testo ?? '');
  const barraBoss = () => nelGioco(() => window.gioco.registry.get('boss'));
  const svuota = () =>
    g.mondo((s) => {
      for (const n of s.nemici.vivi()) if (!n.definizione.fasi) n.subisci(999, { x: 0, y: 0 }, 0, s.time.now);
    });
  const vai = async (m) => {
    await g.mondo((s, m) => s.vaiA(m), m);
    await aspetta(1000);
    await svuota();
  };
  const aspettaChe = async (cond, max = 60) => {
    for (let i = 0; i < max && !(await cond()); i++) await aspetta(100);
  };
  const cliccaCella = async (cella) => {
    const q = await g.schermoDa(centro(...cella));
    await pagina.mouse.click(q.x, q.y);
  };

  await g.creaPersonaggio(0, [0, 2], 'borgo'); // Guerriero
  await g.mondo((s) => s.impostaInvulnerabile(true));

  // ---------------- 1. Sconfitta normale del Re Scheletro e bottino 10a ----------------
  await vai('cripta_tomba');
  await metti(centro(12, 7));
  await aspettaChe(async () => (await barraBoss()) !== null, 30);
  let b = await barraBoss();
  controlla(b?.nome === 'Re Scheletro' && b.vita === 110, `Re Scheletro normale: vita ${b?.vita}/110`);

  // Sconfiggiamo il Re Scheletro
  await g.mondo((s) => {
    const re = s.nemici.vivi().find((n) => n.definizione.id === 're_scheletro');
    s.combattimento.infliggi(re, s.combattimento.colpoArma(s.eroe.arma, 999, 0, { x: re.forma.x, y: re.forma.y - 20 }), s.time.now);
  });
  await aspetta(350);
  await svuota();

  const oggettiTerra = await g.mondo((s) => s.oggettiATerra.oggetti.map((o) => ({ id: o.definizione.id, x: o.posizione.x, y: o.posizione.y })));
  const idsTerra = oggettiTerra.map((o) => o.id);
  controlla(
    idsTerra.includes('frammento_eco') &&
      idsTerra.includes('frammento_corona') &&
      ['elmo_corona', 'stivali_re_sepolto'].some((id) => idsTerra.includes(id)),
    `bottino boss 10a (1 leggendario garantito + frammento_eco): ${idsTerra.join(', ')}`,
  );
  await schermata('01-bottino-e-altare', { ferma: true });

  // Raccogliamo tutto
  for (const o of oggettiTerra) {
    await metti({ x: o.x, y: o.y });
    await aspetta(150);
  }
  let p = await partita();
  controlla(conta(p, 'frammento_eco') === 1, 'Frammento d’eco raccolto nello zaino');

  // ---------------- 2. Altare dell'Eco senza sigillo ----------------
  const haAltare = await g.mondo((s) => Boolean(s.altareEco && s.altareEco.visibile));
  controlla(haAltare, 'nella stanza del boss sconfitto è comparso l’Altare dell’Eco');

  await metti(centro(12, 10));
  await aspetta(200);
  await cliccaCella([12, 11]);
  await aspetta(300);
  controlla(/Altare dell’Eco.*Serve: Sigillo dell’Eco: Re Scheletro/.test(await avviso()), `senza sigillo: "${await avviso()}"`);

  // ---------------- 3. Forgiare il Sigillo dell'Eco da Bruno ----------------
  await vai('borgo');
  await g.mondo((s) => {
    s.daiOggetto('osso_antico', 3);
    s.regalaMonete(150);
    s.apri('fucina');
  });
  await aspettaChe(() => attiva('Fucina'), 30);
  const ricetteBruno = await nelGioco(() => window.gioco.scene.getScene('Fucina').conosciute.map((r) => r.id));
  controlla(ricetteBruno.includes('sigillo_eco_re_scheletro'), `Bruno ha sbloccato la ricetta del sigillo: ${ricetteBruno.join(', ')}`);

  // Selezioniamo e creiamo il sigillo
  await nelGioco(() => {
    const f = window.gioco.scene.getScene('Fucina');
    f.scelta = 'sigillo_eco_re_scheletro';
    f.ridisegna();
    f.creaScelta();
  });
  await aspetta(250);
  await schermata('02-fucina-sigillo-eco', { ferma: true });
  p = await partita();
  controlla(conta(p, 'sigillo_eco_re_scheletro') === 1, 'Sigillo dell’Eco: Re Scheletro forgiato');
  await pagina.keyboard.press('Escape');
  await aspetta(300);

  // ---------------- 4. Evocare e sconfiggere l'Eco del Re Scheletro ----------------
  // Se nella prima vittoria era uscito lama_vuoto (25%), lo togliamo per verificare il 100% garantito dell'Eco
  await g.mondo((s) => {
    const p = s.registry.get('partita');
    const spazi = p.inventario.spazi.map((x) => (x && x.id === 'lama_vuoto' ? null : x));
    s.registry.set('partita', { ...p, inventario: { ...p.inventario, spazi } });
  });

  await vai('cripta_tomba');
  await metti(centro(12, 10));
  await aspetta(200);
  await cliccaCella([12, 11]);
  await aspetta(350);
  controlla(/appare Eco: Re Scheletro/.test(await avviso()), `il sigillo evoca l’Eco: "${await avviso()}"`);
  controlla(conta(await partita(), 'sigillo_eco_re_scheletro') === 0, 'il sigillo viene consumato all’attivazione');

  // Ingaggiamo l'Eco
  await metti(centro(12, 7));
  await aspettaChe(async () => (await barraBoss()) !== null, 30);
  b = await barraBoss();
  controlla(b?.nome === 'Eco: Re Scheletro' && b.vita === 176, `barra dell’Eco potenziata (vita ×1,6 = ${b?.vita})`);
  await schermata('03-eco-re-scheletro', { ferma: true });

  // Sconfiggiamo l'Eco
  await g.mondo((s) => {
    const eco = s.nemici.vivi().find((n) => n.definizione.id === 're_scheletro');
    s.combattimento.infliggi(eco, s.combattimento.colpoArma(s.eroe.arma, 999, 0, { x: eco.forma.x, y: eco.forma.y - 20 }), s.time.now);
  });
  await aspetta(350);
  await svuota();

  p = await partita();
  controlla(p.ecoSconfitti.includes('re_scheletro'), 're_scheletro registrato in ecoSconfitti');
  const bottinoEco = await g.mondo((s) => s.oggettiATerra.oggetti.map((o) => o.definizione.id));
  controlla(bottinoEco.includes('lama_vuoto'), `la prima vittoria contro l’Eco garantisce l’esotico firma (lama_vuoto): ${bottinoEco.join(', ')}`);
  await schermata('04-bottino-eco', { ferma: true });

  controlla(g.errori.length === 0, `nessun errore ${g.errori.length ? JSON.stringify(g.errori) : ''}`);
  controlla(g.richiesteEsterne.length === 0, 'nessuna richiesta a internet');
  process.exitCode = (await g.chiudi()) > 0 ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

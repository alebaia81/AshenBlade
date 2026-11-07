// Prova nel browser della consegna 6a: materiali, vene, ricette e fucina di Bruno.
//
// Uso: node tests/browser/fase-6a.cjs <gioco.html> <cartella schermate>

const { apriGioco } = require('./aiuti.cjs');

const T = 16;
const centro = (col, riga) => ({ x: col * T + 8, y: riga * T + 8 });
// Fucina: angolo del pannello in (30, 30).
const RICETTA = (i) => [200, 122 + i * 46];
const CREA = [510, 400];
// Zaino: angolo del pannello in (100, 35).
const SPAZIO = (i) => [152 + (i % 4) * 62, 129 + Math.floor(i / 4) * 62];
const USA = [462, 325];
const ICONA_ZAINO = [960 - 30 - 52, 30];

async function main() {
  const [percorso, cartella] = process.argv.slice(2);
  const g = await apriGioco(percorso, cartella);
  const { controlla, aspetta, schermata, pagina, clic, nelGioco } = g;
  const partita = () => nelGioco(() => window.gioco.registry.get('partita'));
  const attiva = (n) => nelGioco((n) => window.gioco.scene.isActive(n), n);
  const conta = (p, id) => p.inventario.spazi.reduce((t, s) => t + (s && s.id === id ? s.quantita : 0), 0);
  const indiceDi = (p, id) => p.inventario.spazi.findIndex((s) => s && s.id === id);
  const metti = (p) => g.mondo((s, p) => s.eroe.forma.body.reset(p.x, p.y), p);
  const dai = (id, n = 1) => g.mondo((s, a) => s.daiOggetto(a.id, a.n), { id, n });
  const svuota = () => g.mondo((s) => { for (const n of s.nemici.vivi()) n.subisci(999, { x: 0, y: 0 }, 0, s.time.now); });
  const pulsanteCrea = () => nelGioco(() => {
    const p = window.gioco.scene.getScene('Fucina').contenuto.list.find((o) => o.type === 'Container' && o.list[1]?.text === 'Crea');
    return p ? p.alpha : null;
  });

  await g.creaPersonaggio(0, [0, 2]); // Guerriero, nella Radura
  await g.mondo((s) => s.impostaInvulnerabile(true));
  await svuota();

  // ---------------- una vena di ferro ----------------
  const vene = await g.mondo((s) => s.vene.map((v) => ({ materiale: v.materiale, col: v.cella.col, riga: v.cella.riga })));
  controlla(vene.length === 2, `nella Radura ci sono 2 vene: ${vene.map((v) => v.materiale).join(', ')}`);
  await metti(centro(23, 6));
  await aspetta(300);
  const q = await g.schermoDa(centro(26, 6));
  await pagina.mouse.move(q.x, q.y);
  await aspetta(100);
  controlla((await nelGioco(() => window.gioco.canvas.style.cursor)) === 'pointer', 'sopra la vena il cursore è una mano');
  await schermata('01-vena', { ferma: true });
  await pagina.mouse.click(q.x, q.y);
  // I pezzi cadono ai piedi dell'eroe, che li raccoglie subito.
  let presi = 0;
  for (let i = 0; i < 40 && presi === 0; i++) {
    await aspetta(100);
    presi = conta(await partita(), 'minerale_ferro');
  }
  controlla(presi >= 1 && presi <= 2, `clic: l’eroe scava e raccoglie ${presi} pezzi di minerale di ferro`);
  controlla(await g.mondo((s) => s.vene.find((v) => v.materiale === 'minerale_ferro').esaurita), 'la vena è esaurita');
  await aspetta(100);
  await schermata('02-vena-esaurita', { ferma: true });
  await pagina.mouse.move(q.x, q.y);
  await aspetta(100);
  controlla((await nelGioco(() => window.gioco.canvas.style.cursor)) !== 'pointer', 'sopra una vena esaurita il cursore torna normale');
  await g.mondo((s) => s.vaiA('bosco'));
  await aspetta(900);
  await g.mondo((s) => s.vaiA('radura'));
  await aspetta(900);
  controlla(!(await g.mondo((s) => s.vene.find((v) => v.materiale === 'minerale_ferro').esaurita)), 'tornando nella zona la vena è di nuovo piena');

  // ---------------- la fucina di Bruno ----------------
  await dai('minerale_ferro', 6);
  await dai('carbone', 2);
  await dai('pelle_lupo', 3);
  await dai('gelatina_slime', 2);
  await g.mondo((s) => s.regalaMonete(100));
  await g.mondo((s) => s.vaiA('borgo'));
  await aspetta(1000);
  await metti(centro(8, 17));
  await aspetta(200);
  const b = await g.schermoDa(centro(8, 20));
  await pagina.mouse.click(b.x, b.y);
  for (let i = 0; i < 50 && !(await attiva('Dialogo')); i++) await aspetta(100);
  controlla(/forgia è di nuovo accesa/.test(await nelGioco(() => window.gioco.scene.getScene('Dialogo').testo.text)), 'Bruno: "La forgia è di nuovo accesa"');
  await pagina.keyboard.press('1'); // "Lavoriamo."
  await aspetta(300);
  controlla(await attiva('Fucina'), '"Lavoriamo": si apre la fucina');
  let nomi = await nelGioco(() => window.gioco.scene.getScene('Fucina').conosciute.map((r) => r.id));
  controlla(nomi.join(',') === 'spada_lunga,balestra,pugnali_lancio', `Bruno conosce 3 ricette: ${nomi.join(', ')}`);
  await schermata('03-fucina');

  let p = await partita();
  const prima = { ferro: conta(p, 'minerale_ferro'), carbone: conta(p, 'carbone'), monete: p.monete };
  await clic(...RICETTA(0)); // Spada lunga
  await clic(...CREA);
  p = await partita();
  controlla(conta(p, 'spada_lunga') === 1 && conta(p, 'minerale_ferro') === prima.ferro - 3 && conta(p, 'carbone') === prima.carbone - 1 && p.monete === prima.monete - 20,
    `Spada lunga creata: −3 ferro, −1 carbone, −20 monete (ferro ${prima.ferro} → ${conta(p, 'minerale_ferro')})`);
  await clic(...RICETTA(1)); // Balestra: servono 2 ferro e 2 pelle → ci sono
  await clic(...CREA);
  p = await partita();
  controlla(conta(p, 'balestra') === 1 && conta(p, 'pelle_lupo') === 1, 'Balestra creata con la pelle di lupo');
  await clic(...RICETTA(1)); // di nuovo: ora manca la pelle
  controlla((await pulsanteCrea()) < 1, 'senza materiali il pulsante Crea è spento');
  await schermata('04-mancano-materiali');
  await pagina.keyboard.press('Escape');
  await aspetta(200);

  // ---------------- una pergamena ----------------
  await dai('pergamena_arco_cacciatore', 2);
  await clic(...ICONA_ZAINO);
  await clic(...SPAZIO(indiceDi(await partita(), 'pergamena_arco_cacciatore')));
  await clic(...USA);
  const esito = await nelGioco(() => window.gioco.scene.getScene('Inventario').esito.text);
  p = await partita();
  controlla(p.ricette.includes('arco_cacciatore') && conta(p, 'pergamena_arco_cacciatore') === 1, `"Usa" sulla pergamena: ${esito}`);
  await clic(...USA);
  const ancora = await nelGioco(() => window.gioco.scene.getScene('Inventario').esito.text);
  controlla(conta(await partita(), 'pergamena_arco_cacciatore') === 1 && /già/.test(ancora), `la seconda copia non si consuma: "${ancora}"`);
  await pagina.keyboard.press('i');
  await aspetta(200);
  await dai('pelle_lupo', 2);
  await g.mondo((s) => s.apri('fucina'));
  await aspetta(300);
  nomi = await nelGioco(() => window.gioco.scene.getScene('Fucina').conosciute.map((r) => r.id));
  controlla(nomi.includes('arco_cacciatore'), 'la nuova ricetta compare nella fucina');
  await clic(...RICETTA(3));
  await schermata('05-ricetta-imparata');
  await clic(...CREA);
  controlla(conta(await partita(), 'arco_cacciatore') === 1, 'Arco del cacciatore creato');
  await pagina.keyboard.press('Escape');
  await aspetta(200);

  const merce = await nelGioco(() => window.gioco.registry.get('partita') && window.gioco.scene.getScene('Mondo').dati.negozi.gemma.merce);
  controlla(merce.includes('pergamena_mazza_gelo'), 'Gemma vende la pergamena della Mazza del gelo');

  controlla(g.errori.length === 0, `nessun errore ${g.errori.length ? JSON.stringify(g.errori) : ''}`);
  controlla(g.richiesteEsterne.length === 0, 'nessuna richiesta a internet');
  process.exitCode = (await g.chiudi()) > 0 ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

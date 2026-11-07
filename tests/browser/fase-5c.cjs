// Prova nel browser della consegna 5c: la taverna e i compagni.
//
// Uso: node tests/browser/fase-5c.cjs <gioco.html> <cartella schermate>

const { apriGioco, BARRA } = require('./aiuti.cjs');

const T = 16;
const centro = (col, riga) => ({ x: col * T + 8, y: riga * T + 8 });
// Taverna: angolo del pannello in (20, 25); quattro schede larghe 205 ogni 220.
const INGAGGIA = (i) => [20 + 24 + i * 220 + 102, 25 + 72 + 360 - 54];

async function main() {
  const [percorso, cartella] = process.argv.slice(2);
  const g = await apriGioco(percorso, cartella);
  const { controlla, aspetta, schermata, pagina, clic, nelGioco } = g;
  const partita = () => nelGioco(() => window.gioco.registry.get('partita'));
  const attiva = (n) => nelGioco((n) => window.gioco.scene.isActive(n), n);
  const metti = (p) => g.mondo((s, p) => s.eroe.forma.body.reset(p.x, p.y), p);
  const compagno = () => g.mondo((s) => s.compagno && ({ id: s.compagno.definizione.id, x: s.compagno.x, y: s.compagno.y, alTappeto: s.compagno.alTappeto, vita: s.compagno.vita.attuale, eroe: { x: s.eroe.x, y: s.eroe.y } }));
  const distanza = (c) => Math.hypot(c.x - c.eroe.x, c.y - c.eroe.y);
  const svuota = () => g.mondo((s) => { for (const n of s.nemici.vivi()) n.subisci(999, { x: 0, y: 0 }, 0, s.time.now); });
  /** Cambia compagno "da fuori" (come se fossimo passati dalla taverna). */
  const prendi = (id) => g.mondo((s, id) => {
    const p = s.registry.get('partita');
    s.registry.set('partita', { ...p, compagni: { ingaggiati: [...new Set([...p.compagni.ingaggiati, id])], attivo: id } });
    s.registry.set('abilitaCompagno', { prontaDa: 0 });
    s.creaCompagno();
  }, id);

  await g.creaPersonaggio(0, [0, 2], 'borgo'); // Guerriero
  await g.mondo((s) => s.regalaMonete(200));
  controlla((await g.mondo((s) => s.compagno)) === null, 'all’inizio nessun compagno');

  // ---------------- la taverna ----------------
  await metti(centro(30, 17));
  await aspetta(150);
  const q = await g.schermoDa(centro(30, 20));
  await pagina.mouse.click(q.x, q.y);
  for (let i = 0; i < 60 && !(await attiva('Dialogo')); i++) await aspetta(100);
  await pagina.keyboard.press('1'); // "Cerco qualcuno che combatta con me."
  await aspetta(300);
  controlla(await attiva('Taverna'), 'Tobia: "Cerco qualcuno che combatta con me" apre la taverna');
  await schermata('01-taverna');
  await clic(...INGAGGIA(0)); // Corrado, 80
  let p = await partita();
  controlla(p.monete === 120 && p.compagni.attivo === 'corrado', `Corrado ingaggiato: 200 → ${p.monete} monete`);
  await clic(...INGAGGIA(1)); // Elisa, 100
  p = await partita();
  controlla(p.monete === 20 && p.compagni.attivo === 'elisa', `Elisa al suo posto: ${p.monete} monete (uno solo alla volta)`);
  await clic(...INGAGGIA(2)); // Volpe, 100: non bastano
  p = await partita();
  controlla(p.monete === 20 && p.compagni.attivo === 'elisa', 'Volpe costa 100: monete insufficienti, rifiutato');
  await clic(...INGAGGIA(0)); // di nuovo Corrado: gratis
  p = await partita();
  controlla(p.monete === 20 && p.compagni.attivo === 'corrado', 'si torna da Corrado gratis (già pagato)');
  await schermata('02-taverna-ingaggiati');
  await pagina.keyboard.press('Escape');
  await aspetta(300);
  let c = await compagno();
  controlla((await attiva('Mondo')) && c?.id === 'corrado', 'chiusa la taverna, Corrado è nel mondo accanto all’eroe');
  controlla((await g.mondo((s) => s.armaturaEroe())) === 1, 'bonus di Corrado: +1 armatura');

  // ---------------- ti segue ----------------
  await metti(centro(19, 17));
  await aspetta(2500);
  c = await compagno();
  controlla(distanza(c) < 48, `l’eroe si sposta: Corrado lo raggiunge (distanza ${Math.round(distanza(c))})`);
  await g.mondo((s) => s.vaiA('radura'));
  await aspetta(1000);
  c = await compagno();
  controlla(c?.id === 'corrado' && distanza(c) < 40, 'cambiando mappa il compagno ricompare accanto all’eroe');
  await svuota();
  await metti(centro(14, 12));
  await aspetta(1500);

  // ---------------- combatte ----------------
  await g.mondo((s) => s.impostaInvulnerabile(true));
  const bersaglio = await g.mondo((s) => {
    const n = s.nemici.aggiungi({ ...s.dati.nemici.slime, vita: 40 }, { x: s.eroe.x + 30, y: s.eroe.y + 20 });
    n.pausaFino = 1e12;
    return n.id;
  });
  let ferito = false;
  for (let i = 0; i < 50 && !ferito; i++) {
    await aspetta(100);
    ferito = await g.mondo((s, id) => s.nemici.lista.find((x) => x.id === id).vita.attuale < 40, bersaglio);
  }
  controlla(ferito, 'Corrado attacca da solo lo slime vicino all’eroe');
  await schermata('03-corrado-combatte', { ferma: true });
  await svuota();

  // ---------------- al tappeto e rialzo ----------------
  await g.mondo((s) => s.compagno.subisci(999));
  c = await compagno();
  controlla(c.alTappeto, 'con la vita a zero Corrado va al tappeto');
  await aspetta(3600);
  c = await compagno();
  controlla(!c.alTappeto && c.vita === 15, `nessun nemico per 3 s: si rialza con metà vita (${c.vita}/30)`);

  // ---------------- abilità: Corrado para un colpo ----------------
  await g.mondo((s) => { s.impostaInvulnerabile(false); s.vitaPiena(); });
  await pagina.keyboard.press('q');
  await aspetta(50);
  controlla((await g.mondo((s) => s.protezione?.tipo)) === 'parata', 'tasto Q: Corrado si prepara a parare');
  const vitaPiena = await g.mondo((s) => s.eroe.vita.attuale);
  // Qui si prova la parata: Corrado non attacca, altrimenti respinge il lupo prima del morso
  // (da quando colpisce anche in diagonale, vedi la correzione della 6b).
  await g.mondo((s) => { s.compagno.prontoAttacco = 1e12; s.nemici.aggiungi(s.dati.nemici.lupo, { x: s.eroe.x + 14, y: s.eroe.y }); });
  let parato = false;
  for (let i = 0; i < 100 && !parato; i++) { await aspetta(50); parato = (await g.mondo((s) => s.protezione)) === null; }
  controlla(parato && (await g.mondo((s) => s.eroe.vita.attuale)) === vitaPiena, 'il primo morso del lupo è parato: nessun danno');
  await g.mondo((s) => { s.impostaInvulnerabile(true); s.compagno.prontoAttacco = 0; });
  await svuota();
  const ricarica = await g.mondo((s) => s.statoPulsanteCompagno().frazione);
  // La parata può arrivare dopo qualche secondo (il lupo deve avvicinarsi): basta che la ricarica sia ben avviata.
  controlla(ricarica > 0.5, `poi l’abilità è in ricarica (${ricarica.toFixed(2)})`);
  await clic(...BARRA.compagno);
  controlla((await g.mondo((s) => s.protezione)) === null, 'pulsante del compagno in ricarica: non fa nulla');

  // ---------------- le altre abilità ----------------
  await prendi('agata');
  await g.mondo((s) => s.eroe.impostaRisorse({ attuale: 3, massima: s.eroe.vita.massima }, s.eroe.mana));
  await clic(...BARRA.compagno);
  controlla((await g.mondo((s) => s.eroe.vita.attuale)) === 11, 'Sorella Agata (pulsante nella barra): +8 vita');
  await pagina.mouse.move(...BARRA.compagno);
  await aspetta(150);
  await schermata('04-agata-e-barra');

  await prendi('elisa');
  await pagina.keyboard.press('q');
  await aspetta(50);
  const scudo = await g.mondo((s) => s.protezione);
  controlla(scudo?.tipo === 'scudo' && scudo.resto === 10, 'Elisa: scudo magico da 10 punti');
  const assorbito = await g.mondo((s) => s.proteggiEroe(4));
  controlla(assorbito === 0 && (await g.mondo((s) => s.protezione.resto)) === 6, 'un colpo da 4 viene assorbito: allo scudo restano 6 punti');
  await schermata('05-scudo-elisa', { ferma: true });

  await prendi('volpe');
  await g.mondo((s) => s.vaiA('bosco'));
  await aspetta(1000);
  await svuota();
  await metti(centro(18, 8));
  await aspetta(200);
  const primaDelFiuto = await g.mondo((s) => s.muri[0].luccichio.visible);
  await pagina.keyboard.press('q');
  await aspetta(200);
  const conFiuto = await g.mondo((s) => s.muri[0].luccichio.visible);
  controlla(!primaDelFiuto && conFiuto, 'Volpe: col suo fiuto il muro segreto brilla anche da 9 tessere');
  await schermata('06-fiuto-volpe', { ferma: true });
  const crit = await g.mondo((s) => s.statisticheArma(s.eroe.arma).probabilitaCritico);
  controlla(Math.abs(crit - 0.11) < 1e-9, `bonus di Volpe: critico ${Math.round(crit * 100)}% (5% + 1% DES + 5%)`);

  controlla(g.errori.length === 0, `nessun errore ${g.errori.length ? JSON.stringify(g.errori) : ''}`);
  controlla(g.richiesteEsterne.length === 0, 'nessuna richiesta a internet');
  process.exitCode = (await g.chiudi()) > 0 ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

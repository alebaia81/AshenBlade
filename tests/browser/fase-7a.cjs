// Prova nel browser della consegna 7a: il sistema delle quest.
// Dario e i lupi (elimina), frate Anselmo e le erbe (raccogli), Bruno e il carbone
// (con lo zaino pieno: la ricompensa cade a terra), segni sopra le persone, registro.
//
// Uso: node tests/browser/fase-7a.cjs <gioco.html> <cartella schermate>

const { apriGioco } = require('./aiuti.cjs');

const T = 16;
const centro = (col, riga) => ({ x: col * T + 8, y: riga * T + 8 });
const ICONA_REGISTRO = [960 - 30 - 2 * 52, 30];

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
  const svuota = () => g.mondo((s) => { for (const n of s.nemici.vivi()) n.subisci(999, { x: 0, y: 0 }, 0, s.time.now); });
  const vai = async (mappa) => { await g.mondo((s, m) => s.vaiA(m), mappa); await aspetta(1000); };
  const risposte = () => nelGioco(() => window.gioco.scene.getScene('Dialogo').risposte.list.map((t) => t.text.replace(/^\d\. /, '')));
  /** Clic con il mouse sulla risposta che contiene "testo". */
  const rispondi = async (testo) => {
    const punto = await nelGioco((testo) => {
      const t = window.gioco.scene.getScene('Dialogo').risposte.list.find((r) => r.text.includes(testo));
      return t ? { x: t.x + 30, y: t.y + 9 } : null;
    }, testo);
    if (!punto) throw new Error(`Risposta "${testo}" non trovata`);
    await clic(punto.x, punto.y);
    await aspetta(150);
  };
  /** L'eroe va da una persona (clic) e il dialogo si apre. */
  const parlaCon = async (vicino, cella) => {
    await metti(centro(...vicino));
    await aspetta(200);
    const q = await g.schermoDa(centro(...cella));
    await pagina.mouse.click(q.x, q.y);
    for (let i = 0; i < 50 && !(await attiva('Dialogo')); i++) await aspetta(100);
  };
  const testiRegistro = () => nelGioco(() => window.gioco.scene.getScene('Registro').contenuto.list.filter((o) => o.type === 'Text').map((o) => o.text).join(' | '));

  await g.creaPersonaggio(0, [0, 2]); // Guerriero, nella Radura
  await g.mondo((s) => s.impostaInvulnerabile(true));
  await svuota();

  // ---------------- Dario: i lupi ----------------
  controlla((await segno('dario')) === '!', 'sopra Dario c’è un ! giallo: ha una quest');
  await metti(centro(27, 20));
  await aspetta(300);
  await schermata('01-dario', { ferma: true });
  await parlaCon([27, 21], [29, 21]);
  controlla(await attiva('Dialogo'), 'clic su Dario: si apre il dialogo');
  let r = await risposte();
  controlla(r.includes('Cosa è successo al gregge?') && !r.some((t) => /non torneranno/.test(t)), `si vedono solo le risposte giuste: ${r.join(' / ')}`);
  await rispondi('gregge');
  await schermata('02-offerta');
  await rispondi('Me ne occupo');
  let p = await partita();
  controlla(p.quest.lupi_dario?.stato === 'attiva', 'accettata: la quest è attiva');
  controlla(/Nuova quest: «I lupi di Dario»/.test(await avviso()), `avviso: "${await avviso()}"`);
  await rispondi('Arrivederci');
  await aspetta(200);
  controlla((await segno('dario')) === '?attiva', 'ora sopra Dario c’è un ? grigio (quest in corso)');

  // Registro (icona della pergamena).
  await clic(...ICONA_REGISTRO);
  await aspetta(200);
  controlla(await attiva('Registro'), 'l’icona della pergamena apre il registro');
  let testi = await testiRegistro();
  controlla(/I lupi di Dario/.test(testi) && /Sconfiggi 4 lupi nel bosco\s+0 \/ 4/.test(testi), 'registro: la quest con il passo e il progresso 0 / 4');
  await schermata('03-registro');
  await pagina.keyboard.press('l');
  await aspetta(200);
  controlla(!(await attiva('Registro')) && (await attiva('Mondo')), 'L chiude il registro');

  // Nel bosco: 4 lupi sconfitti davvero (passando dal Combattimento, come un colpo vero).
  await vai('bosco');
  const lupi = await g.mondo((s) => s.nemici.vivi().filter((n) => n.definizione.id === 'lupo').map((n) => n.id));
  controlla(lupi.length >= 4, `nel bosco ci sono ${lupi.length} lupi`);
  for (const [i, id] of lupi.slice(0, 4).entries()) {
    await g.mondo((s, id) => {
      const n = s.nemici.lista.find((x) => x.id === id);
      s.combattimento.infliggi(n, s.combattimento.colpoArma(s.eroe.arma, 999, 0, { x: n.forma.x - 10, y: n.forma.y }), s.time.now);
    }, id);
    await aspetta(100);
    if (i === 2) controlla((await avviso()) === 'Sconfiggi 4 lupi nel bosco: 3 / 4', `avviso dopo il terzo lupo: "${await avviso()}"`);
  }
  controlla(/fatto! Torna da Dario il pastore/.test(await avviso()), `dopo il quarto: "${await avviso()}"`);
  await schermata('04-avviso-fatto', { ferma: true });

  await vai('radura');
  await svuota();
  controlla((await segno('dario')) === '?', 'nella Radura, sopra Dario c’è un ? giallo');
  p = await partita();
  const prima = { monete: p.monete, esperienza: p.esperienza, inventario: p.inventario, forza: conta(p, 'pozione_forza') };
  // Zaino pieno: la pozione della ricompensa deve cadere a terra, non sparire.
  await g.mondo((s) => s.riempiZaino());
  await parlaCon([27, 21], [29, 21]);
  r = await risposte();
  controlla(r.includes('I lupi non torneranno.') && !r.includes('Cosa è successo al gregge?'), `ora c’è la risposta per consegnare: ${r.join(' / ')}`);
  await rispondi('non torneranno');
  p = await partita();
  const car = await g.mondo((s) => s.caratteristiche.CAR);
  controlla(p.quest.lupi_dario.stato === 'conclusa' && p.monete > prima.monete && p.esperienza === prima.esperienza + 60,
    `conclusa: +${p.monete - prima.monete} monete (CAR ${car}), +60 esperienza`);
  const aTerra = await g.mondo((s) => s.oggettiATerra.oggetti.map((o) => o.definizione.id));
  controlla(aTerra.includes('pozione_forza'), 'zaino pieno: la pozione di forza della ricompensa è a terra, ai piedi dell’eroe');
  await schermata('05-ricompensa');
  await rispondi('Grazie');
  await aspetta(200);
  // Si libera lo zaino (com'era prima); l'eroe si allontana e ripassa sulla pozione.
  await g.mondo((s, inv) => s.registry.set('partita', { ...s.registry.get('partita'), inventario: inv }), prima.inventario);
  const qui = await g.mondo((s) => ({ x: s.eroe.x, y: s.eroe.y }));
  await metti({ x: qui.x - 40, y: qui.y });
  await aspetta(200);
  await metti(qui);
  await aspetta(300);
  controlla(conta(await partita(), 'pozione_forza') === prima.forza + 1, 'con lo zaino libero la pozione viene raccolta');
  controlla((await segno('dario')) === null, 'quest conclusa: sopra Dario non c’è più nessun segno');

  // ---------------- Anselmo: le erbe ----------------
  await vai('borgo');
  controlla((await segno('anselmo')) === '!' && (await segno('bruno')) === '!', 'nel borgo: ! sopra Anselmo e Bruno');
  await parlaCon([8, 9], [8, 8]);
  await rispondi('Posso aiutarti');
  await rispondi('Te le porto');
  await rispondi('Arrivederci');
  await aspetta(200);
  controlla((await partita()).quest.erbe_anselmo?.stato === 'attiva', 'Anselmo: quest delle erbe accettata');

  await vai('bosco');
  await svuota();
  const cespuglio = await g.mondo((s) => { const v = s.vene.find((v) => v.aspetto === 'cespuglio'); return { col: v.cella.col, riga: v.cella.riga }; });
  await metti(centro(cespuglio.col + 1, cespuglio.riga + 1));
  await aspetta(300);
  await schermata('06-cespuglio', { ferma: true });
  const q = await g.schermoDa(centro(cespuglio.col, cespuglio.riga));
  await pagina.mouse.click(q.x, q.y);
  let erbe = 0;
  for (let i = 0; i < 40 && erbe === 0; i++) { await aspetta(100); erbe = conta(await partita(), 'erba_medicinale'); }
  controlla(erbe >= 1, `clic sul cespuglio: ${erbe} erbe nello zaino`);
  controlla((await avviso()) === `Raccogli 5 erbe medicinali nel bosco: ${erbe} / 5`, `avviso del progresso: "${await avviso()}"`);
  await g.mondo((s, n) => s.daiOggetto('erba_medicinale', n), 6 - erbe); // 6: una in più
  await vai('borgo');
  controlla((await segno('anselmo')) === '?', 'con 5 erbe nello zaino, sopra Anselmo c’è un ? giallo');
  p = await partita();
  const vitaPrima = conta(p, 'pozione_vita');
  await parlaCon([8, 9], [8, 8]);
  await rispondi('Ho trovato le erbe');
  p = await partita();
  controlla(conta(p, 'erba_medicinale') === 1 && conta(p, 'pozione_vita') === vitaPrima + 2 && p.quest.erbe_anselmo.stato === 'conclusa',
    'consegnate: tolte 5 erbe (ne resta 1), +2 pozioni di vita');
  await rispondi('Arrivederci');
  await aspetta(200);

  // ---------------- Bruno: il carbone, con lo zaino pieno ----------------
  await parlaCon([8, 19], [8, 20]);
  await rispondi('Ti serve qualcosa');
  await rispondi('Affare fatto');
  await rispondi('Arrivederci');
  await aspetta(200);
  const esito = await g.mondo((s) => s.completaQuest());
  controlla(/Il carbone di Bruno/.test(esito) && conta(await partita(), 'carbone') >= 5, `modalità sviluppatore: "${esito}"`);
  await parlaCon([8, 19], [8, 20]);
  await rispondi('Ti ho portato il carbone');
  p = await partita();
  controlla(p.quest.carbone_bruno.stato === 'conclusa' && conta(p, 'carbone') === 0 && conta(p, 'pergamena_arco_lungo') === 1,
    'Bruno: carbone consegnato, la pergamena dell’Arco lungo è nello zaino');
  await schermata('07-bruno');
  await rispondi('Arrivederci');
  await aspetta(200);

  await pagina.keyboard.press('l');
  await aspetta(200);
  testi = await testiRegistro();
  controlla(/conclusa/.test(testi) && /Il carbone di Bruno/.test(testi), 'registro: le tre quest concluse');
  await schermata('08-registro-concluse');
  await pagina.keyboard.press('Escape');
  await aspetta(200);

  controlla(g.errori.length === 0, `nessun errore ${g.errori.length ? JSON.stringify(g.errori) : ''}`);
  controlla(g.richiesteEsterne.length === 0, 'nessuna richiesta a internet');
  process.exitCode = (await g.chiudi()) > 0 ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

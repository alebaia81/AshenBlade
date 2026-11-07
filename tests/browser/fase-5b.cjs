// Prova nel browser della consegna 5b: la bottega di Gemma.
//
// Uso: node tests/browser/fase-5b.cjs <gioco.html> <cartella schermate>

const { apriGioco } = require('./aiuti.cjs');

const T = 16;
const centro = (col, riga) => ({ x: col * T + 8, y: riga * T + 8 });
// Negozio: angolo del pannello in (30, 30).
const MERCE = (i) => [230, 108 + i * 23];
const SPAZIO = (i) => [513 + (i % 4) * 52, 125 + Math.floor(i / 4) * 52];
const AZIONE = [810, 382];

async function main() {
  const [percorso, cartella] = process.argv.slice(2);
  const g = await apriGioco(percorso, cartella);
  const { controlla, aspetta, schermata, pagina, clic, nelGioco } = g;
  const partita = () => nelGioco(() => window.gioco.registry.get('partita'));
  const attiva = (n) => nelGioco((n) => window.gioco.scene.isActive(n), n);
  const conta = (p, id) => p.inventario.spazi.reduce((t, s) => t + (s && s.id === id ? s.quantita : 0), 0);
  const indiceDi = (p, id) => p.inventario.spazi.findIndex((s) => s && s.id === id);
  const merce = () => nelGioco(() => window.gioco.scene.getScene('Negozio').negozio.merce);
  const esito = () => nelGioco(() => window.gioco.scene.getScene('Negozio').esito.text);
  const pulsante = () => nelGioco(() => window.gioco.scene.getScene('Negozio').azione.list[1].text);
  /** Modifica la Partita "da fuori" (come farebbe la modalità sviluppatore). */
  const cambiaPartita = (f) => nelGioco(new Function(`const r = window.gioco.registry; r.set('partita', (${f})(r.get('partita')));`));

  await g.creaPersonaggio(0, [0, 2], 'borgo'); // Guerriero, CAR 10
  await g.mondo((s) => s.regalaMonete(100));

  // ---------------- dal dialogo alla bottega ----------------
  await g.mondo((s, p) => s.eroe.forma.body.reset(p.x, p.y), centro(31, 11));
  await aspetta(150);
  const q = await g.schermoDa(centro(31, 7));
  await pagina.mouse.click(q.x, q.y);
  for (let i = 0; i < 60 && !(await attiva('Dialogo')); i++) await aspetta(100);
  await pagina.keyboard.press('1');
  await aspetta(300);
  controlla((await attiva('Negozio')) && (await nelGioco(() => window.gioco.scene.isPaused('Mondo'))), '"Fammi vedere la merce": si apre la bottega, il mondo è in pausa');
  const elenco = await merce();
  controlla(elenco.length === 16, `Gemma vende ${elenco.length} oggetti`);
  await pagina.mouse.move(...MERCE(elenco.indexOf('balestra')));
  await aspetta(100);
  await schermata('01-bottega');

  // ---------------- comprare ----------------
  await clic(...MERCE(0)); // pozione di vita
  controlla((await pulsante()) === 'Compra (15)', `selezionata la pozione di vita: "${await pulsante()}"`);
  await clic(...AZIONE);
  let p = await partita();
  controlla(p.monete === 85 && conta(p, 'pozione_vita') === 3, `comprata: 100 → ${p.monete} monete, pozioni di vita ${conta(p, 'pozione_vita')}`);
  await pagina.mouse.click(...MERCE(elenco.indexOf('arco')), { button: 'right' });
  await aspetta(150);
  p = await partita();
  controlla(p.monete === 55 && conta(p, 'arco') === 1, `clic destro: arco comprato al volo (${p.monete} monete)`);
  await clic(...MERCE(elenco.indexOf('zaino_24')));
  await clic(...AZIONE);
  p = await partita();
  controlla(p.monete === 55 && /monete/.test(await esito()), `zaino da 300 monete: rifiutato ("${await esito()}")`);
  await schermata('02-troppo-caro');

  // ---------------- vendere ----------------
  await clic(...SPAZIO(indiceDi(p, 'arco')));
  controlla((await pulsante()) === 'Vendi (15)', `l’arco si rivende a metà: "${await pulsante()}"`);
  await clic(...AZIONE);
  p = await partita();
  controlla(p.monete === 70 && conta(p, 'arco') === 0, `venduto: ${p.monete} monete`);
  await pagina.mouse.click(...SPAZIO(indiceDi(p, 'pozione_vita')), { button: 'right' });
  await aspetta(150);
  p = await partita();
  controlla(p.monete === 78 && conta(p, 'pozione_vita') === 2, `una pozione dalla pila: +8 (${p.monete} monete, ne restano ${conta(p, 'pozione_vita')})`);
  controlla(p.equipaggiamento.primaria === 'spada_e_scudo', 'l’arma in mano non è nello zaino: non si può vendere per sbaglio');

  // ---------------- Carisma ----------------
  await cambiaPartita((p) => ({ ...p, personaggio: { ...p.personaggio, caratteristiche: { ...p.personaggio.caratteristiche, CAR: 18 } } }));
  await aspetta(100);
  await clic(...MERCE(0));
  controlla((await pulsante()) === 'Compra (12)', `CAR 18 (+4): la pozione costa 12 invece di 15 ("${await pulsante()}")`);
  await clic(...SPAZIO(indiceDi(await partita(), 'pozione_vita')));
  controlla((await pulsante()) === 'Vendi (9)', `…e si rivende a 9 invece di 8 ("${await pulsante()}")`);
  await pagina.mouse.move(400, 470);
  await aspetta(100);
  await schermata('03-carisma');

  // ---------------- zaino pieno ----------------
  await cambiaPartita((p) => ({ ...p, inventario: { ...p.inventario, spazi: p.inventario.spazi.map((s) => s ?? { id: 'borsa', quantita: 1 }) } }));
  await aspetta(100);
  const prima = (await partita()).monete;
  await clic(...MERCE(elenco.indexOf('pozione_forza')));
  await clic(...AZIONE);
  controlla((await partita()).monete === prima && /[Zz]aino pieno/.test(await esito()), `zaino pieno: "${await esito()}", nessuna moneta spesa`);

  await pagina.keyboard.press('Escape');
  await aspetta(200);
  controlla(!(await attiva('Negozio')) && (await attiva('Mondo')), 'Esc chiude la bottega e il gioco riparte');
  const hud = await nelGioco(() => window.gioco.scene.getScene('Interfaccia').children.list.filter((o) => o.type === 'Text').map((t) => t.text));
  controlla(hud.includes(String(prima)), `l’interfaccia mostra le monete rimaste (${prima})`);

  controlla(g.errori.length === 0, `nessun errore ${g.errori.length ? JSON.stringify(g.errori) : ''}`);
  controlla(g.richiesteEsterne.length === 0, 'nessuna richiesta a internet');
  process.exitCode = (await g.chiudi()) > 0 ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

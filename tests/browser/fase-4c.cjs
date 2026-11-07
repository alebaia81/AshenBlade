// Prova nel browser della consegna 4c: la barra dei preferiti.
// Barra a icone, tasti 1–6, trascinamento dallo zaino, cambio rapido d'arma.
//
// Uso: node tests/browser/fase-4c.cjs <gioco.html> <cartella schermate>

const { apriGioco, BARRA } = require('./aiuti.cjs');

// Zaino: angolo del pannello in (100, 35); colonna destra da x = 402.
const SPAZIO = (i) => [152 + (i % 4) * 62, 129 + Math.floor(i / 4) * 62];
const RIGA_PREFERITI = (i) => [425 + i * 54, 423];
const PULSANTE_PREFERITI = [722, 325];
const ICONA_ZAINO = [960 - 30 - 52, 30];

async function main() {
  const [percorso, cartella] = process.argv.slice(2);
  const g = await apriGioco(percorso, cartella);
  const { controlla, aspetta, schermata, pagina, clic, nelGioco } = g;
  const partita = () => nelGioco(() => window.gioco.registry.get('partita'));
  const conta = (p, id) => p.inventario.spazi.reduce((t, s) => t + (s && s.id === id ? s.quantita : 0), 0);
  const indiceDi = (p, id) => p.inventario.spazi.findIndex((s) => s && s.id === id);
  const svuota = () => g.mondo((s) => { for (const n of s.nemici.vivi()) n.subisci(999, { x: 0, y: 0 }, 0, s.time.now); });
  const dai = (id) => g.mondo((s, id) => s.daiOggetto(id), id);
  const esito = () => nelGioco(() => window.gioco.scene.getScene('Inventario').esito.text);
  /** Trascina col mouse, a piccoli passi, come farebbe una persona. */
  const trascina = async (da, a) => {
    await pagina.mouse.move(...da);
    await pagina.mouse.down();
    await pagina.mouse.move(da[0] + 10, da[1] + 10, { steps: 4 });
    await pagina.mouse.move(...a, { steps: 8 });
    await aspetta(50);
    await pagina.mouse.up();
    await aspetta(150);
  };
  const trascinaDalloZaino = async (id, spazio) => trascina(SPAZIO(indiceDi(await partita(), id)), RIGA_PREFERITI(spazio));

  await g.creaPersonaggio(1, [3, 2]); // Mago
  await g.mondo((s) => s.impostaInvulnerabile(true));
  await svuota();

  // ---------------- la barra all'inizio ----------------
  let p = await partita();
  controlla(JSON.stringify(p.preferiti) === JSON.stringify(['pozione_vita', 'pozione_mana', null, null, null, null]),
    'il Mago parte con pozione di vita (1) e di mana (2) nei preferiti');
  await pagina.mouse.move(...BARRA.preferito(0));
  await aspetta(150);
  await schermata('01-barra');

  // Tasto 1: pozione di vita.
  await g.mondo((s) => s.eroe.impostaRisorse({ attuale: 2, massima: s.eroe.vita.massima }, s.eroe.mana));
  await pagina.keyboard.press('1');
  await aspetta(100);
  p = await partita();
  controlla(p.vita.attuale > 2 && conta(p, 'pozione_vita') === 1, `tasto 1: pozione di vita bevuta (vita ${p.vita.attuale}, ne resta ${conta(p, 'pozione_vita')})`);
  const quantitaBarra = await nelGioco(() => window.gioco.scene.getScene('Interfaccia').preferiti[0].quantita.text);
  controlla(quantitaBarra === '1', `lo spazio 1 mostra quante ne restano (${quantitaBarra})`);

  // ---------------- trascinamento dallo zaino ----------------
  for (const id of ['pozione_forza', 'mazza', 'arco', 'elmo_ferro']) await dai(id);
  await clic(...ICONA_ZAINO);
  await trascinaDalloZaino('pozione_forza', 2);
  await trascinaDalloZaino('mazza', 3);
  await trascinaDalloZaino('arco', 4);
  p = await partita();
  controlla(p.preferiti[2] === 'pozione_forza' && p.preferiti[3] === 'mazza' && p.preferiti[4] === 'arco',
    `trascinando: forza nel 3, mazza nel 4, arco nel 5 (${JSON.stringify(p.preferiti)})`);
  controlla(conta(p, 'mazza') === 1 && conta(p, 'arco') === 1, 'gli oggetti restano nello zaino: la barra contiene solo collegamenti');
  await trascinaDalloZaino('elmo_ferro', 5);
  controlla((await partita()).preferiti[5] === null && /scheda/.test(await esito()), `un’armatura viene rifiutata: "${await esito()}"`);
  // Un trascinamento non deve selezionare: dopo, nessun oggetto è selezionato.
  controlla((await nelGioco(() => window.gioco.scene.getScene('Inventario').selezionato)) === null, 'trascinare non seleziona l’oggetto');
  await pagina.mouse.move(...SPAZIO(0));
  await schermata('02-zaino-con-preferiti');
  // Lo stesso oggetto trascinato in un altro spazio si sposta.
  await trascina(RIGA_PREFERITI(2), RIGA_PREFERITI(5));
  p = await partita();
  controlla(p.preferiti[2] === null && p.preferiti[5] === 'pozione_forza', 'dalla barra a un altro spazio: la pozione si sposta dal 3 al 6');
  // Fuori dalla barra: lo spazio si svuota.
  await trascina(RIGA_PREFERITI(5), SPAZIO(5));
  p = await partita();
  controlla(p.preferiti[5] === null && conta(p, 'pozione_forza') === 1, 'trascinata fuori dalla barra: lo spazio si svuota, la pozione resta nello zaino');
  // Pulsante "Preferiti": primo spazio libero.
  await clic(...SPAZIO(indiceDi(await partita(), 'pozione_forza')));
  await clic(...PULSANTE_PREFERITI);
  p = await partita();
  controlla(p.preferiti[2] === 'pozione_forza', `pulsante "Preferiti": nel primo spazio libero (${await esito()})`);
  // Clic destro su uno spazio della riga: si svuota.
  await pagina.mouse.click(...RIGA_PREFERITI(2), { button: 'right' });
  await aspetta(150);
  controlla((await partita()).preferiti[2] === null, 'clic destro su uno spazio dei preferiti: si svuota');
  await trascinaDalloZaino('pozione_forza', 2);
  await pagina.keyboard.press('i');
  await aspetta(200);

  // ---------------- cambio rapido d'arma ----------------
  await pagina.keyboard.press('4');
  await aspetta(50);
  const cambio = await g.mondo((s) => ({ arma: s.eroe.arma.id, attesa: s.eroe.stato.attaccoPronto - s.time.now }));
  p = await partita();
  controlla(cambio.arma === 'mazza' && p.equipaggiamento.primaria === 'mazza' && conta(p, 'bastone') === 1,
    'tasto 4: impugni la mazza, il bastone torna nello zaino');
  controlla(cambio.attesa > 300 && cambio.attesa <= 500, `dopo il cambio non si attacca per mezzo secondo (mancano ${Math.round(cambio.attesa)} ms)`);
  controlla(await nelGioco(() => window.gioco.scene.getScene('Interfaccia').preferiti[3].evidenziato === 'inMano'), 'lo spazio 4 ha il bordo verde "in mano"');
  await pagina.mouse.click(...BARRA.preferito(4)); // arco: va nello spazio dell'arma secondaria
  await aspetta(30);
  const pronta = await g.mondo((s) => s.secondariaPronta - s.time.now);
  p = await partita();
  controlla(p.equipaggiamento.secondaria === 'arco' && pronta > 300 && pronta <= 500, 'clic sullo spazio 5: l’arco diventa l’arma secondaria (e aspetta mezzo secondo)');
  await pagina.mouse.move(...BARRA.preferito(3));
  await aspetta(150);
  await schermata('03-barra-armi');

  // ---------------- pozioni finite: lo spazio resta ----------------
  await g.mondo((s) => s.eroe.impostaRisorse({ attuale: 2, massima: s.eroe.vita.massima }, s.eroe.mana));
  await clic(...BARRA.preferito(0));
  p = await partita();
  const spento = await nelGioco(() => window.gioco.scene.getScene('Interfaccia').preferiti[0].alpha);
  controlla(conta(p, 'pozione_vita') === 0 && p.preferiti[0] === 'pozione_vita' && spento < 1, 'pozioni di vita finite: lo spazio 1 resta, grigio, con 0');
  await schermata('04-pozioni-finite');
  await dai('pozione_vita');
  await aspetta(100);
  const riacceso = await nelGioco(() => window.gioco.scene.getScene('Interfaccia').preferiti[0].alpha);
  controlla(riacceso === 1, 'raccogliendone una lo spazio si riaccende');

  // Pozione di forza dalla barra (tasto 3).
  await pagina.keyboard.press('3');
  await aspetta(100);
  controlla(conta(await partita(), 'pozione_forza') === 0, 'tasto 3: pozione di forza bevuta');

  controlla(g.errori.length === 0, `nessun errore ${g.errori.length ? JSON.stringify(g.errori) : ''}`);
  controlla(g.richiesteEsterne.length === 0, 'nessuna richiesta a internet');
  process.exitCode = (await g.chiudi()) > 0 ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

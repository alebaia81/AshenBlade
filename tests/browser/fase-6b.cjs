// Prova nel browser della consegna 6b: potenziamenti delle armi nella fucina di Bruno.
//
// Uso: node tests/browser/fase-6b.cjs <gioco.html> <cartella schermate>

const { apriGioco } = require('./aiuti.cjs');

// Fucina: angolo del pannello in (30, 30).
const SCHEDA_POTENZIA = [580, 60];
const SCHEDA_CREA = [450, 60];
const RIGA = (i) => [200, 122 + i * 46];
const POTENZIA = [510, 400];

async function main() {
  const [percorso, cartella] = process.argv.slice(2);
  const g = await apriGioco(percorso, cartella);
  const { controlla, aspetta, schermata, pagina, clic, nelGioco } = g;
  const partita = () => nelGioco(() => window.gioco.registry.get('partita'));
  const attiva = (n) => nelGioco((n) => window.gioco.scene.isActive(n), n);
  const conta = (p, id) => p.inventario.spazi.reduce((t, s) => t + (s && s.id === id ? s.quantita : 0), 0);
  const indiceDi = (p, id) => p.inventario.spazi.findIndex((s) => s && s.id === id);
  const dai = (id, n = 1) => g.mondo((s, a) => s.daiOggetto(a.id, a.n), { id, n });
  const svuota = () => g.mondo((s) => { for (const n of s.nemici.vivi()) n.subisci(999, { x: 0, y: 0 }, 0, s.time.now); });
  const fucina = (f) => nelGioco(f);
  const elenco = () => fucina(() => window.gioco.scene.getScene('Fucina').armiDisponibili().map((a) => a.id));
  const pulsante = () => fucina(() => {
    const p = window.gioco.scene.getScene('Fucina').contenuto.list.find((o) => o.type === 'Container' && o.list[1]?.text === 'Potenzia');
    return p ? p.alpha : null;
  });
  const testiFucina = () => fucina(() => window.gioco.scene.getScene('Fucina').contenuto.list.filter((o) => o.type === 'Text').map((o) => o.text).join(' | '));
  /** Un colpo con il dado più basso e senza critico: si vede solo il bonus. */
  const dannoMinimo = () => g.mondo((s) => {
    const n = s.nemici.aggiungi({ ...s.dati.nemici.slime, vita: 100, armatura: 0 }, { x: s.eroe.x + 30, y: s.eroe.y });
    n.pausaFino = 1e12;
    s.combattimento.casuale = () => 0;
    s.combattimento.infliggi(n, s.combattimento.colpoArma(s.eroe.arma, 0, 0, { x: s.eroe.x, y: s.eroe.y }), s.time.now);
    s.combattimento.casuale = Math.random;
    const danno = 100 - n.vita.attuale;
    n.subisci(999, { x: 0, y: 0 }, 0, s.time.now);
    return danno;
  });

  await g.creaPersonaggio(0, [0, 2]); // Guerriero, nella Radura
  await g.mondo((s) => s.impostaInvulnerabile(true));
  await svuota();
  const dannoBase = await dannoMinimo();
  controlla(dannoBase >= 1, `con la Spada e scudo base, il colpo minimo fa ${dannoBase}`);

  await dai('minerale_ferro', 20);
  await dai('carbone', 10);
  await dai('spada_lunga');
  await dai('pugnali+5');
  await g.mondo((s) => s.regalaMonete(1000));
  await g.mondo((s) => s.impostaPreferito(2, 'spada_e_scudo'));

  // ---------------- la scheda Potenzia ----------------
  await g.mondo((s) => s.apri('fucina'));
  await aspetta(300);
  controlla(await attiva('Fucina'), 'la fucina è aperta');
  await clic(...SCHEDA_POTENZIA);
  const armi = await elenco();
  controlla(armi[0] === 'spada_e_scudo' && armi.includes('spada_lunga') && armi.includes('pugnali+5'), `elenco: prima l’arma in mano, poi lo zaino (${armi.join(', ')})`);
  let testi = await testiFucina();
  controlla(/Diventa Spada e scudo \+1/.test(testi) && /1 × Minerale di ferro/.test(testi), 'dettagli: com’è ora, come diventa, cosa serve');
  await schermata('01-potenzia');

  let p = await partita();
  const prima = { ferro: conta(p, 'minerale_ferro'), carbone: conta(p, 'carbone'), monete: p.monete };
  await clic(...RIGA(0));
  await clic(...POTENZIA);
  await clic(...POTENZIA);
  await clic(...POTENZIA);
  p = await partita();
  controlla(p.equipaggiamento.primaria === 'spada_e_scudo+3', `tre clic: l’arma in mano diventa ${p.equipaggiamento.primaria}`);
  controlla(conta(p, 'minerale_ferro') === prima.ferro - 6 && conta(p, 'carbone') === prima.carbone - 3,
    `materiali consumati: ferro ${prima.ferro} → ${conta(p, 'minerale_ferro')}, carbone ${prima.carbone} → ${conta(p, 'carbone')}`);
  const speso = prima.monete - p.monete;
  controlla(speso > 0 && speso % 105 === 0, `monete spese: ${speso} (15 + 30 + 60, per la rarità dell’arma)`);
  controlla(p.preferiti[2] === 'spada_e_scudo+3', 'la barra dei preferiti segue l’arma potenziata');

  // +4 chiede il cristallo della miniera, che non abbiamo.
  testi = await testiFucina();
  controlla(/✘ 1 × Cristallo/.test(testi) && (await pulsante()) < 1, 'per +4 manca il cristallo della miniera: pulsante spento');
  await schermata('02-manca-cristallo');
  await clic(...POTENZIA);
  controlla((await partita()).equipaggiamento.primaria === 'spada_e_scudo+3', 'il clic sul pulsante spento non fa nulla');

  // Un'arma nello zaino resta nello stesso spazio.
  const spazio = indiceDi(p, 'spada_lunga');
  await clic(...RIGA((await elenco()).indexOf('spada_lunga')));
  await clic(...POTENZIA);
  p = await partita();
  controlla(p.inventario.spazi[spazio]?.id === 'spada_lunga+1', `Spada lunga → +1, nello stesso spazio dello zaino (${spazio + 1})`);
  const esito = await fucina(() => window.gioco.scene.getScene('Fucina').esito.text);
  controlla(/Spada lunga \+1/.test(esito), `messaggio: "${esito}"`);
  await schermata('03-zaino');

  // Al massimo.
  await clic(...RIGA((await elenco()).indexOf('pugnali+5')));
  testi = await testiFucina();
  controlla(/già al massimo/.test(testi) && (await pulsante()) === null, 'Pugnali +5: "è già al massimo", nessun pulsante');
  await schermata('04-al-massimo');

  // La scheda Crea funziona ancora.
  await clic(...SCHEDA_CREA);
  controlla((await fucina(() => window.gioco.scene.getScene('Fucina').scheda)) === 'crea', 'si torna alla scheda Crea');
  await pagina.keyboard.press('Escape');
  await aspetta(300);

  // ---------------- in gioco ----------------
  const arma = await g.mondo((s) => s.eroe.arma.id);
  controlla(arma === 'spada_e_scudo+3', `chiusa la fucina, l’eroe impugna ${arma}`);
  const dannoPotenziato = await dannoMinimo();
  controlla(dannoPotenziato === dannoBase + 3, `il colpo minimo ora fa ${dannoPotenziato} (era ${dannoBase}): +3 al danno`);
  // Nello zaino la descrizione della Spada lunga +1 mostra il potenziamento.
  await pagina.keyboard.press('i');
  await aspetta(300);
  const i = indiceDi(await partita(), 'spada_lunga+1');
  await clic(152 + (i % 4) * 62, 129 + Math.floor(i / 4) * 62);
  const testiZaino = await nelGioco(() => {
    const t = (l) => l.flatMap((o) => (o.type === 'Text' ? [o.text] : o.list ? t(o.list) : []));
    return t(window.gioco.scene.getScene('Inventario').children.list).join(' | ');
  });
  controlla(/Potenziamento \+1/.test(testiZaino), 'nello zaino la Spada lunga +1 dice "Potenziamento +1"');
  await schermata('05-zaino');
  await pagina.keyboard.press('i');
  await aspetta(200);

  // Prezzo: vale di più da Gemma.
  const prezzi = await g.mondo((s) => [s.dati.oggetti['spada_lunga'].prezzo, s.dati.oggetti['spada_lunga+1'].prezzo]);
  controlla(prezzi[1] > prezzi[0], `una Spada lunga +1 vale di più (${prezzi[0]} → ${prezzi[1]} monete)`);

  controlla(g.errori.length === 0, `nessun errore ${g.errori.length ? JSON.stringify(g.errori) : ''}`);
  controlla(g.richiesteEsterne.length === 0, 'nessuna richiesta a internet');
  process.exitCode = (await g.chiudi()) > 0 ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

// Prova nel browser della consegna 4b: armi e armature.
// Muro segreto e forziere nascosto, scheda "Equipaggiamento", limite delle
// esotiche, blocco in combattimento, arma secondaria ed effetti speciali.
//
// Uso: node tests/browser/fase-4b.cjs <gioco.html> <cartella schermate>

const { apriGioco, BARRA } = require('./aiuti.cjs');

const T = 16;
const centro = (col, riga) => ({ x: col * T + 8, y: riga * T + 8 });
// Zaino: angolo del pannello in (100, 35).
const SPAZIO = (i) => [152 + (i % 4) * 62, 129 + Math.floor(i / 4) * 62];
const USA = [462, 325];
const ICONA_ZAINO = [960 - 30 - 52, 30];
const ICONA_SCHEDA = [960 - 30, 30];
// Scheda: angolo del pannello in (140, 35).
const SCHEDA_EQUIP = [748, 67];
const SPAZIO_EQUIP = (i) => [314, 185 + i * 50]; // 0 primaria … 5 stivali
const CANDIDATO = (i) => [650, 271 + i * 34];
const TOGLI = [745, 147];

async function main() {
  const [percorso, cartella] = process.argv.slice(2);
  const g = await apriGioco(percorso, cartella);
  const { controlla, aspetta, schermata, pagina, clic, nelGioco } = g;
  const partita = () => nelGioco(() => window.gioco.registry.get('partita'));
  const conta = (p, id) => p.inventario.spazi.reduce((t, s) => t + (s && s.id === id ? s.quantita : 0), 0);
  const indiceDi = (p, id) => p.inventario.spazi.findIndex((s) => s && s.id === id);
  const metti = (p) => g.mondo((s, p) => s.eroe.forma.body.reset(p.x, p.y), p);
  const svuota = () => g.mondo((s) => { for (const n of s.nemici.vivi()) n.subisci(999, { x: 0, y: 0 }, 0, s.time.now); });
  const attiva = (n) => nelGioco((n) => window.gioco.scene.isActive(n), n);
  const dai = (id) => g.mondo((s, id) => s.daiOggetto(id), id);
  // Tutti i testi della pagina Equipaggiamento, anche quelli dentro i pulsanti (che sono Container).
  const testoScheda = () => nelGioco(() => {
    const testi = (lista) => lista.flatMap((o) => (o.type === 'Text' ? [o.text] : o.list ? testi(o.list) : []));
    return testi(window.gioco.scene.getScene('Scheda').paginaEquipaggiamento.list).join(' | ');
  });
  /** Un nemico robusto e fermo, per provare gli effetti senza che scappi o muoia subito. */
  const fantoccio = (dx, dy, id = 'slime', vita = 100) =>
    g.mondo((s, a) => {
      const n = s.nemici.aggiungi({ ...s.dati.nemici[a.id], vita: a.vita, armatura: 0 }, { x: s.eroe.x + a.dx, y: s.eroe.y + a.dy });
      n.pausaFino = 1e12; // resta fermo
      return n.id;
    }, { dx, dy, id, vita });
  const vitaNemico = (id) => g.mondo((s, id) => { const n = s.nemici.lista.find((x) => x.id === id); return n.vita.attuale; }, id);
  const colpisci = (id, critico = 0) =>
    g.mondo((s, a) => {
      const n = s.nemici.lista.find((x) => x.id === a.id);
      s.combattimento.infliggi(n, s.combattimento.colpoArma(s.eroe.arma, 0, a.critico, { x: s.eroe.x, y: s.eroe.y }), s.time.now);
    }, { id, critico });
  const apriScheda = async () => { await clic(...ICONA_SCHEDA); await clic(...SCHEDA_EQUIP); };
  const chiudiScheda = async () => { await pagina.keyboard.press('Escape'); await aspetta(200); };
  const NOMI_SPAZI = ['primaria', 'secondaria', 'elmo', 'corazza', 'guanti', 'stivali'];
  /** Dalla scheda: clic sullo spazio, poi sull'oggetto "id" tra quelli adatti dello zaino. */
  const indossaDallaScheda = async (spazio, id) => {
    const adatti = await g.mondo((s, nome) => s.registry.get('partita').inventario.spazi
      .filter((p) => p && s.dati.indossabili[p.id]?.spazio === nome).map((p) => p.id), NOMI_SPAZI[spazio]);
    await apriScheda();
    await clic(...SPAZIO_EQUIP(spazio));
    await clic(...CANDIDATO(adatti.indexOf(id)));
    const t = await testoScheda();
    await chiudiScheda();
    return t;
  };
  const impugnaDalloZaino = async (id) => {
    await clic(...ICONA_ZAINO);
    await clic(...SPAZIO(indiceDi(await partita(), id)));
    await clic(...USA);
    const esito = await nelGioco(() => window.gioco.scene.getScene('Inventario').esito.text);
    await pagina.keyboard.press('i');
    await aspetta(200);
    return esito;
  };

  await g.creaPersonaggio(0, [0, 2]); // Guerriero
  await g.mondo((s) => s.impostaInvulnerabile(true));
  await svuota();

  // ---------------- la scheda: due pagine ----------------
  await apriScheda();
  controlla(await attiva('Scheda'), 'la scheda si apre');
  let t = await testoScheda();
  controlla(/Spada e scudo/.test(t) && (t.match(/— vuoto —/g) || []).length === 5 && /Armatura totale: 0/.test(t),
    'pagina Equipaggiamento: spada e scudo in mano, 5 spazi vuoti, armatura 0');
  await schermata('01-scheda-equipaggiamento');
  await chiudiScheda();

  // ---------------- muro segreto nel bosco ----------------
  await g.mondo((s) => s.vaiA('bosco'));
  await aspetta(900);
  await svuota();
  controlla((await g.mondo((s) => s.mappa.id)) === 'bosco', 'siamo nel bosco');
  // Prima con l'Elmo del veggente: il muro brilla da vicino.
  await dai('elmo_veggente');
  t = await indossaDallaScheda(2, 'elmo_veggente');
  controlla((await partita()).equipaggiamento.elmo === 'elmo_veggente', `dalla scheda si indossa l'Elmo del veggente (${t.split(' | ').pop()})`);
  await metti(centro(26, 7));
  await aspetta(300);
  controlla(await g.mondo((s) => s.muri[0].luccichio.visible), 'con l’Elmo del veggente il muro segreto brilla');
  await schermata('02-muro-segreto-veggente', { ferma: true });
  await metti(centro(26, 5));
  await aspetta(200);
  let q = await g.schermoDa(centro(26, 4));
  await pagina.mouse.move(q.x, q.y);
  await aspetta(100);
  controlla((await nelGioco(() => window.gioco.canvas.style.cursor)) === 'pointer', 'sopra il muro con la crepa il cursore è una mano');
  await pagina.mouse.click(q.x, q.y);
  let aperto = false;
  for (let i = 0; i < 30 && !aperto; i++) { await aspetta(100); aperto = (await partita()).muriAperti.includes('bosco:26:4'); }
  controlla(aperto, 'clic sul muro: si apre un passaggio segreto');
  await aspetta(400);
  // Il forziere nascosto: ci si arriva a piedi passando dal varco.
  q = await g.schermoDa(centro(26, 2));
  await pagina.mouse.click(q.x, q.y);
  let forziere = false;
  for (let i = 0; i < 50 && !forziere; i++) { await aspetta(100); forziere = (await partita()).forzieriAperti.includes('bosco:26:2'); }
  controlla(forziere, 'l’eroe passa dal varco e apre il forziere nascosto');
  await aspetta(200);
  await schermata('03-forziere-nascosto', { ferma: true });
  for (const o of await g.mondo((s) => s.oggettiATerra.oggetti.map((o) => ({ x: o.posizione.x, y: o.posizione.y })))) { await metti(o); await aspetta(250); }
  let p = await partita();
  controlla(conta(p, 'arco_lungo') === 1 && conta(p, 'corazza_maglia') === 1, 'dentro: Arco lungo e Cotta di maglia, ora nello zaino');
  await metti(centro(14, 12)); // di nuovo all'aperto

  // ---------------- armature dalla scheda ----------------
  const armaturaPrima = await g.mondo((s) => s.armaturaEroe());
  t = await indossaDallaScheda(3, 'corazza_maglia');
  const armaturaDopo = await g.mondo((s) => s.armaturaEroe());
  controlla((await partita()).equipaggiamento.corazza === 'corazza_maglia' && armaturaDopo === armaturaPrima + 3,
    `Cotta di maglia indossata: armatura ${armaturaPrima} → ${armaturaDopo}`);
  await apriScheda();
  await clic(...SPAZIO_EQUIP(3));
  await schermata('04-scheda-corazza');
  await chiudiScheda();
  // Nello zaino le armature non si indossano.
  await dai('stivali_cuoio');
  await clic(...ICONA_ZAINO);
  await clic(...SPAZIO(indiceDi(await partita(), 'stivali_cuoio')));
  await clic(...USA);
  await schermata('05-zaino-armatura');
  const dettagliZaino = await nelGioco(() => window.gioco.scene.getScene('Inventario').dettagli.text);
  await pagina.keyboard.press('i');
  await aspetta(200);
  controlla((await partita()).equipaggiamento.stivali === null && /dalla scheda/.test(dettagliZaino), 'nello zaino gli stivali non si indossano: “Si indossa dalla scheda”');

  // ---------------- non durante un combattimento ----------------
  await g.mondo((s) => s.nemici.aggiungi(s.dati.nemici.lupo, { x: s.eroe.x + 40, y: s.eroe.y }));
  await aspetta(100);
  await apriScheda();
  await clic(...SPAZIO_EQUIP(5));
  t = await testoScheda();
  controlla(/Non durante un combattimento/.test(t), 'con un lupo vicino gli spazi delle armature sono bloccati');
  await schermata('06-bloccato-in-combattimento');
  await clic(...SPAZIO_EQUIP(1)); // le armi invece si cambiano
  t = await testoScheda();
  controlla(/Arco lungo/.test(t) && !/Non durante/.test(t), 'le armi si possono cambiare anche col lupo vicino');
  await clic(...CANDIDATO(0));
  await chiudiScheda();
  controlla((await partita()).equipaggiamento.secondaria === 'arco_lungo', 'Arco lungo come arma secondaria');
  await svuota();

  // ---------------- arma secondaria ----------------
  let bersaglio = await fantoccio(70, 0);
  let vitaPrima = await vitaNemico(bersaglio);
  await clic(...BARRA.secondaria);
  controlla(await g.mondo((s) => s.mira === 'secondaria'), 'clic sul pulsante dell’arma secondaria: mirino attivo');
  q = await g.schermoDa(await g.mondo((s, id) => { const n = s.nemici.lista.find((x) => x.id === id); return { x: n.forma.x, y: n.forma.y }; }, bersaglio));
  await pagina.mouse.click(q.x, q.y);
  await aspetta(60);
  await schermata('07-freccia', { ferma: true });
  await aspetta(600);
  controlla((await vitaNemico(bersaglio)) < vitaPrima, `la freccia colpisce il bersaglio (${vitaPrima} → ${await vitaNemico(bersaglio)})`);
  const ricarica = await g.mondo((s) => s.statoPulsanteSecondaria().frazione);
  controlla(ricarica === 0 || ricarica < 1, 'la ricarica dell’arma secondaria scorre');
  await svuota();

  // ---------------- limite delle esotiche ----------------
  await dai('lama_vuoto');
  await dai('arco_rimbalzo');
  let esito = await impugnaDalloZaino('lama_vuoto');
  controlla((await partita()).equipaggiamento.primaria === 'lama_vuoto', `"Impugna" dallo zaino: ${esito}`);
  controlla((await g.mondo((s) => s.eroe.arma.id)) === 'lama_vuoto', 'l’eroe ha davvero la Lama del vuoto in mano');
  esito = await impugnaDalloZaino('arco_rimbalzo');
  p = await partita();
  controlla(p.equipaggiamento.secondaria === 'arco_lungo' && /una sola arma esotica/.test(esito), `seconda arma esotica rifiutata: "${esito}"`);
  await clic(...ICONA_ZAINO);
  await schermata('08-seconda-esotica-rifiutata');
  await pagina.keyboard.press('i');
  await aspetta(200);
  // Un’armatura esotica in più va bene (una per tipo). Prima togliamo l’elmo esotico.
  await apriScheda();
  await clic(...SPAZIO_EQUIP(2));
  await clic(...TOGLI);
  await chiudiScheda();
  await dai('stivali_vento');
  await g.mondo((s) => { for (const n of s.nemici.vivi()) n.subisci(999, { x: 0, y: 0 }, 0, s.time.now); });
  await indossaDallaScheda(5, 'stivali_vento');
  p = await partita();
  controlla(p.equipaggiamento.stivali === 'stivali_vento' && p.equipaggiamento.primaria === 'lama_vuoto', 'arma esotica + stivali esotici insieme: permesso');
  await dai('corazza_spine');
  t = await indossaDallaScheda(3, 'corazza_spine');
  controlla((await partita()).equipaggiamento.corazza === 'corazza_maglia' && /un solo pezzo d’armatura esotico/.test(t), 'secondo pezzo d’armatura esotico rifiutato');

  // ---------------- effetti ----------------
  // Risucchio: la Lama del vuoto cura colpendo.
  await g.mondo((s) => s.eroe.impostaRisorse({ attuale: 5, massima: s.eroe.vita.massima }, s.eroe.mana));
  bersaglio = await fantoccio(30, 0);
  await colpisci(bersaglio);
  const vitaEroe = await g.mondo((s) => s.eroe.vita.attuale);
  controlla(vitaEroe > 5, `Lama del vuoto: colpendo l’eroe si cura (5 → ${vitaEroe})`);
  await svuota();

  // Stivali del vento: due capriole di fila (clic destro, il comando principale).
  await metti(centro(14, 12));
  await aspetta(100);
  // La ricarica della capriola dura circa 0,8 s: le tre capriole stanno dentro quel tempo.
  const verso = await g.schermoDa(await g.mondo((s) => ({ x: s.eroe.x, y: s.eroe.y + 30 })));
  const capriola = async () => {
    await pagina.mouse.click(verso.x, verso.y, { button: 'right' });
    await aspetta(30);
    const nome = await g.mondo((s) => s.eroe.stato.nome);
    await aspetta(220);
    return nome;
  };
  const c1 = await capriola();
  const c2 = await capriola();
  const c3 = await capriola();
  controlla(c1 === 'schivata' && c2 === 'schivata' && c3 !== 'schivata', `due capriole di fila, la terza aspetta (${c1}, ${c2}, ${c3})`);

  // Fuoco: la Spada di brace (sostituisce la Lama: stessa esotica, stesso spazio).
  await dai('spada_brace');
  await impugnaDalloZaino('spada_brace');
  bersaglio = await fantoccio(30, 0);
  await colpisci(bersaglio);
  const dopoColpo = await vitaNemico(bersaglio);
  await aspetta(2300);
  const dopoFuoco = await vitaNemico(bersaglio);
  controlla(dopoFuoco <= dopoColpo - 2, `Spada di brace: il nemico brucia (${dopoColpo} → ${dopoFuoco})`);
  await schermata('09-fuoco', { ferma: true });
  await svuota();

  // Pugnale dell’ombra: invisibile dopo un’uccisione.
  await dai('pugnale_ombra');
  await impugnaDalloZaino('pugnale_ombra');
  bersaglio = await fantoccio(30, 0, 'slime', 1);
  await colpisci(bersaglio);
  controlla(await g.mondo((s) => s.eroe.invisibile(s.time.now)), 'Pugnale dell’ombra: dopo l’uccisione l’eroe è invisibile');

  // Mazza del gelo (rara, effetto rallentamento): niente limite, non è esotica.
  await dai('mazza_gelo');
  await impugnaDalloZaino('mazza_gelo');
  bersaglio = await fantoccio(30, 0);
  await colpisci(bersaglio);
  controlla(await g.mondo((s, id) => s.nemici.lista.find((x) => x.id === id).coloreEffetto(s.time.now) === 0x8fd3ff, bersaglio), 'Mazza del gelo: il nemico è rallentato (bordo azzurro)');
  await svuota();

  // Arco del rimbalzo: ora non ci sono armi esotiche in mano, si può equipaggiare.
  await impugnaDalloZaino('arco_rimbalzo');
  controlla((await partita()).equipaggiamento.secondaria === 'arco_rimbalzo', 'Arco del rimbalzo equipaggiato come secondaria');
  await metti(centro(14, 12));
  await aspetta(100);
  const tre = [await fantoccio(50, 0), await fantoccio(80, 0), await fantoccio(110, 0)];
  const viteRimbalzo = [];
  for (const id of tre) viteRimbalzo.push(await vitaNemico(id));
  q = await g.schermoDa(await g.mondo((s) => ({ x: s.eroe.x + 50, y: s.eroe.y })));
  await pagina.mouse.move(q.x, q.y);
  await pagina.keyboard.press('k');
  await aspetta(1200);
  let colpiti = 0;
  for (let i = 0; i < 3; i++) if ((await vitaNemico(tre[i])) < viteRimbalzo[i]) colpiti++;
  controlla(colpiti === 3, `tasto K con l’Arco del rimbalzo: una freccia colpisce ${colpiti} nemici su 3`);
  await svuota();

  // Guanti del predatore: i critici curano. Via gli stivali esotici, su i guanti.
  await apriScheda();
  await clic(...SPAZIO_EQUIP(5));
  await clic(...TOGLI);
  await chiudiScheda();
  await dai('guanti_predatore');
  await indossaDallaScheda(4, 'guanti_predatore');
  await g.mondo((s) => s.eroe.impostaRisorse({ attuale: 5, massima: s.eroe.vita.massima }, s.eroe.mana));
  bersaglio = await fantoccio(30, 0);
  await colpisci(bersaglio, 1);
  controlla((await g.mondo((s) => s.eroe.vita.attuale)) === 7, 'Guanti del predatore: un critico cura 2 punti vita');
  await svuota();

  // Corazza di spine: via i guanti, su la corazza; un lupo che colpisce si fa male.
  await apriScheda();
  await clic(...SPAZIO_EQUIP(4));
  await clic(...TOGLI);
  await chiudiScheda();
  await indossaDallaScheda(3, 'corazza_spine');
  controlla((await partita()).equipaggiamento.corazza === 'corazza_spine', 'Corazza di spine indossata');
  await g.mondo((s) => s.impostaInvulnerabile(false));
  await g.mondo((s) => s.vitaPiena());
  const lupo = await g.mondo((s) => s.nemici.aggiungi({ ...s.dati.nemici.lupo, vita: 100 }, { x: s.eroe.x + 20, y: s.eroe.y }).id);
  let ferito = false;
  for (let i = 0; i < 40 && !ferito; i++) { await aspetta(100); ferito = (await vitaNemico(lupo)) < 100; }
  controlla(ferito, `Corazza di spine: il lupo che morde perde vita (${await vitaNemico(lupo)}/100)`);
  await g.mondo((s) => s.impostaInvulnerabile(true));
  await svuota();

  // Scheda finale con tutto l’equipaggiamento.
  await apriScheda();
  await schermata('10-scheda-finale');
  await chiudiScheda();
  // Pagina caratteristiche: l’armatura totale compare anche lì.
  await clic(...ICONA_SCHEDA);
  const derivati = await nelGioco(() => window.gioco.scene.getScene('Scheda').derivati.text);
  controlla(/Armatura: 2/.test(derivati) && /Arma: Mazza del gelo/.test(derivati), `pagina Caratteristiche: ${derivati.split('\n').filter((r) => /Arma|Armatura/.test(r)).join(', ')}`);
  await chiudiScheda();

  controlla(g.errori.length === 0, `nessun errore ${g.errori.length ? JSON.stringify(g.errori) : ''}`);
  controlla(g.richiesteEsterne.length === 0, 'nessuna richiesta a internet');
  process.exitCode = (await g.chiudi()) > 0 ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

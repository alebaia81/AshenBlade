// Prova nel browser della consegna 3c: mana, dardi magici, le quattro abilità
// di classe, capacità passive (alle spalle, contro i non morti), scheletro.
//
// Uso: node tests/browser/fase-3c.cjs <gioco.html> <cartella schermate>
//
// Ogni classe ha la sua partita (si ricarica la pagina). Per rendere i danni
// prevedibili alcune prove sostituiscono il generatore di numeri casuali del
// combattimento con uno fisso: è la stessa "iniezione" che usano i test Vitest.

const { apriGioco, BARRA } = require('./aiuti.cjs');

const T = 16;
const centro = (col, riga) => ({ x: col * T + 8, y: riga * T + 8 });
const PULSANTE_ABILITA = BARRA.abilita; // secondo spazio della barra

/** Toglie i nemici della mappa, così ogni prova controlla solo ciò che prepara. */
const svuota = (g) => g.mondo((s) => { for (const n of s.nemici.vivi()) n.subisci(999, { x: 0, y: 0 }, 0, s.time.now); });
/** Un nemico fermo ("in pausa" per un minuto) in una posizione precisa. */
const nemicoFermo = (g, id, p) => g.mondo((s, [id, p]) => {
  const n = s.nemici.aggiungi(s.dati.nemici[id], p);
  n.dopoAttacco(s.time.now + 60000);
  return n.id;
}, [id, p]);
const vitaNemico = (g, idNemico) => g.mondo((s, id) => s.nemici.lista.find((n) => n.id === id).vita.attuale, idNemico);
const metti = (g, p) => g.mondo((s, p) => s.eroe.forma.body.reset(p.x, p.y), p);

/** Preme J e aspetta che il fendente parta davvero (fino a 5 tentativi). */
async function colpisciConJ(g) {
  const prima = await g.mondo((s) => s.eroe.fendente);
  for (let i = 0; i < 5; i++) {
    await g.pagina.keyboard.press('j');
    for (let k = 0; k < 10; k++) {
      await g.aspetta(30);
      if ((await g.mondo((s) => s.eroe.fendente)) > prima) return;
    }
  }
}

async function mago(percorso, cartella) {
  const g = await apriGioco(percorso, cartella);
  const { controlla, aspetta, schermata, pagina } = g;
  await g.creaPersonaggio(1, [3, 2]); // INT e COS
  await svuota(g);
  let p = await g.nelGioco(() => window.gioco.registry.get('partita'));
  // INT 16 (+3): mana 10 + 2 × 3 = 16
  controlla(p.mana.massima === 16 && p.mana.attuale === 16, `Mago: mana ${p.mana.attuale}/${p.mana.massima}`);
  // I testi dei pulsanti stanno DENTRO i loro Container: li cerchiamo anche lì.
  const testi = await g.nelGioco(() => {
    const raccogli = (oggetti) => oggetti.flatMap((o) => (o.list ? raccogli(o.list) : o.type === 'Text' ? [o.text] : []));
    return raccogli(window.gioco.scene.getScene('Interfaccia').children.list).join(' | ');
  });
  controlla(testi.includes('16/16') && testi.includes('Palla di fuoco') && testi.includes('6 mana'), 'interfaccia: barra del mana e pulsante "Palla di fuoco · 6 mana"');

  // Dardi magici: clic su uno slime lontano, l'eroe tira da dove si trova.
  await metti(g, centro(10, 8));
  await aspetta(300);
  const slime = await nemicoFermo(g, 'slime', centro(15, 8)); // 80 px
  await g.mondo((s, id) => { s.nemici.lista.find((n) => n.id === id).vita = { attuale: 100, massima: 100 }; }, slime);
  let q = await g.schermoDa(centro(15, 8));
  await pagina.mouse.click(q.x, q.y);
  let fotografato = false;
  let manaAlTiro = 16;
  for (let i = 0; i < 20 && !fotografato; i++) {
    await aspetta(20);
    const volo = await g.mondo((s) => ({ quanti: s.proiettili.quanti, mana: s.eroe.mana.attuale }));
    if (volo.quanti > 0) {
      manaAlTiro = volo.mana;
      await schermata('01-dardo-magico', { ferma: true });
      fotografato = true;
    }
  }
  await aspetta(700);
  const eroe = await g.mondo((s) => ({ x: s.eroe.x }));
  controlla(fotografato, 'clic sul nemico: parte un dardo magico');
  controlla(Math.abs(eroe.x - centro(10, 8).x) < 2, 'il Mago tira da lontano, senza avvicinarsi');
  controlla((await vitaNemico(g, slime)) < 100, 'il dardo colpisce lo slime');
  // Il mana si ricarica in fretta: lo leggiamo nell'istante del tiro.
  controlla(manaAlTiro < 15.5, `ogni dardo costa 1 mana (${manaAlTiro.toFixed(2)}/16 appena tirato)`);

  // Senza mana i dardi non partono; il mana torna da solo.
  await g.mondo((s) => s.eroe.impostaRisorse(s.eroe.vita, { attuale: 0, massima: 16 }));
  await pagina.keyboard.press('j');
  await aspetta(50);
  controlla((await g.mondo((s) => s.proiettili.quanti)) === 0, 'a mana zero il dardo non parte');
  await aspetta(2000);
  const rigenerato = await g.mondo((s) => s.eroe.mana.attuale);
  // SAG 12 (+1): 1,25 mana al secondo
  controlla(rigenerato > 2 && rigenerato < 3.2, `il mana si ricarica da solo (${rigenerato.toFixed(2)} in 2 secondi)`);

  // Palla di fuoco: pulsante, poi clic sul gruppo di nemici.
  await svuota(g);
  await g.mondo((s) => s.eroe.impostaRisorse(s.eroe.vita, { attuale: 16, massima: 16 }));
  await metti(g, centro(10, 8));
  await aspetta(300);
  const gruppo = [];
  for (const [dc, dr] of [[0, 0], [1, 0], [0, 1]]) gruppo.push(await nemicoFermo(g, 'slime', { x: 15 * T + 8 + dc * 14, y: 8 * T + 8 + dr * 14 }));
  const lontano = await nemicoFermo(g, 'slime', centro(15, 12)); // 4 tessere più in basso: fuori dal raggio
  await pagina.mouse.click(...PULSANTE_ABILITA);
  await aspetta(100);
  controlla(await g.mondo((s) => s.mira === 'abilita'), 'clic sul pulsante: si attiva il mirino');
  q = await g.schermoDa({ x: 15 * T + 15, y: 8 * T + 15 });
  await pagina.mouse.move(q.x, q.y);
  await aspetta(100);
  controlla((await g.nelGioco(() => window.gioco.canvas.style.cursor)) === 'crosshair', 'col mirino il cursore è una croce');
  await schermata('02-mirino');
  const manaPrima = await g.mondo((s) => s.eroe.mana.attuale);
  await pagina.mouse.click(q.x, q.y);
  const manaSubito = await g.mondo((s) => s.eroe.mana.attuale);
  let esploso = false;
  for (let i = 0; i < 60 && !esploso; i++) {
    await aspetta(15);
    esploso = (await g.mondo((s) => s.proiettili.quanti)) === 0;
  }
  await aspetta(60);
  await schermata('03-palla-di-fuoco', { ferma: true });
  await aspetta(300);
  const colpiti = [];
  for (const id of gruppo) colpiti.push(await vitaNemico(g, id));
  controlla(colpiti.every((v) => v < 8), `l'esplosione colpisce tutti e tre gli slime vicini (vita ${colpiti.join(', ')})`);
  controlla((await vitaNemico(g, lontano)) === 8, 'lo slime lontano dall’esplosione resta illeso');
  const dopo = await g.mondo((s) => ({ inMira: s.mira !== null, ricarica: s.statoPulsanteAbilita().frazione }));
  controlla(manaPrima - manaSubito > 5.5 && !dopo.inMira && dopo.ricarica > 0,
    `costo 6 mana (${manaPrima.toFixed(1)} → ${manaSubito.toFixed(1)}), mirino spento, ricarica in corso`);
  await pagina.keyboard.press('e');
  await aspetta(50);
  const ancora = await g.mondo((s) => s.proiettili.quanti);
  controlla(ancora === 0, 'durante la ricarica E non lancia nulla');

  controlla(g.errori.length === 0, `Mago: nessun errore ${g.errori.length ? JSON.stringify(g.errori) : ''}`);
  return g.chiudi();
}

async function guerriero(percorso, cartella) {
  const g = await apriGioco(percorso, cartella);
  const { controlla, aspetta, schermata, pagina } = g;
  await g.creaPersonaggio(0, [0, 2]);
  await svuota(g);
  await metti(g, centro(12, 8));
  await aspetta(300);
  const p0 = await g.nelGioco(() => window.gioco.registry.get('partita'));
  controlla(p0.mana.massima === 0 && (await g.nelGioco(() => !window.gioco.scene.getScene('Interfaccia').children.list.some((o) => o.type === 'Text' && /^\d+\/0$/.test(o.text)))),
    'il Guerriero non ha mana (nessuna barra del mana)');

  // Parata verso destra; un lupo arriva da destra.
  let q = await g.schermoDa(centro(15, 8));
  await pagina.mouse.move(q.x, q.y);
  // Un lupo fermo a un passo dall'eroe, sulla destra. Appena lo scudo è alzato lo
  // "sblocchiamo" nello stesso istante: così arriva di sicuro durante la parata,
  // qualunque sia la lentezza del browser automatico.
  const lupo = await g.mondo((s) => {
    const n = s.nemici.aggiungi(s.dati.nemici.lupo, { x: s.eroe.x + 15, y: s.eroe.y });
    n.dopoAttacco(s.time.now + 60000);
    return n.id;
  });
  await pagina.keyboard.press('e');
  let scudo = false;
  for (let i = 0; i < 25 && !scudo; i++) {
    await aspetta(20);
    scudo = await g.mondo((s, id) => {
      if (s.eroe.stato.nome !== 'parata') return false;
      s.nemici.lista.find((n) => n.id === id).pausaFino = 0; // via!
      return true;
    }, lupo);
  }
  controlla(scudo, 'E: il Guerriero alza lo scudo');
  await aspetta(150);
  await schermata('04-parata', { ferma: true });
  await aspetta(300);
  let vita = await g.mondo((s) => s.eroe.vita.attuale);
  controlla(vita === p0.vita.massima, `il lupo che attacca davanti viene parato: nessun danno (vita ${vita}/${p0.vita.massima})`);

  // Dopo la ricarica, parata verso destra ma il lupo arriva da sinistra: passa.
  await svuota(g);
  await aspetta(3100);
  const lupo2 = await g.mondo((s) => {
    const n = s.nemici.aggiungi(s.dati.nemici.lupo, { x: s.eroe.x - 15, y: s.eroe.y });
    n.dopoAttacco(s.time.now + 60000);
    return n.id;
  });
  await pagina.keyboard.press('e');
  let colpitoDuranteParata = false;
  for (let i = 0; i < 25; i++) {
    await aspetta(20);
    const r = await g.mondo((s, id) => {
      if (s.eroe.stato.nome === 'parata') s.nemici.lista.find((n) => n.id === id).pausaFino = 0;
      return { stato: s.eroe.stato.nome, vita: s.eroe.vita.attuale };
    }, lupo2);
    if (r.vita < p0.vita.massima) {
      colpitoDuranteParata = true;
      break;
    }
  }
  controlla(colpitoDuranteParata, 'da dietro la parata non protegge: il lupo alle spalle ferisce');
  controlla(g.errori.length === 0, `Guerriero: nessun errore ${g.errori.length ? JSON.stringify(g.errori) : ''}`);
  return g.chiudi();
}

async function ladro(percorso, cartella) {
  const g = await apriGioco(percorso, cartella);
  const { controlla, aspetta, schermata, pagina } = g;
  await g.creaPersonaggio(2, [1, 2]); // DES 16 (+3)
  await svuota(g);
  await metti(g, centro(12, 8));
  await aspetta(300);

  // Scatto nell'ombra: un lupo che ci inseguiva ci perde e torna a casa.
  // Lo controlliamo in un solo passaggio dentro la pagina, perché i tempi tra
  // una richiesta e l'altra del browser automatico possono essere lunghi.
  await g.mondo((s) => s.nemici.aggiungi(s.dati.nemici.lupo, { x: s.eroe.x + 100, y: s.eroe.y }));
  let insegue = false;
  for (let i = 0; i < 20 && !insegue; i++) {
    await aspetta(40);
    insegue = (await g.mondo((s) => s.nemici.vivi().at(-1).forma.body.velocity.x)) < 0;
  }
  controlla(insegue, 'il lupo ci vede e ci insegue');
  await pagina.keyboard.press('e');
  // Prima l'invisibilità (dura 3 secondi: va controllata subito), poi il lupo.
  let nascosto = { invisibile: false, alfa: 1 };
  for (let i = 0; i < 20 && !nascosto.invisibile; i++) {
    await aspetta(30);
    nascosto = await g.mondo((s) => ({ invisibile: s.eroe.invisibile(s.time.now), alfa: s.eroe.forma.alpha }));
  }
  controlla(nascosto.invisibile && nascosto.alfa < 0.5, 'E: il Ladro diventa semitrasparente');
  let torna = false;
  for (let i = 0; i < 20 && !torna; i++) {
    await aspetta(40);
    torna = await g.mondo((s) => (s.nemici.vivi().at(-1)?.forma.body.velocity.x ?? 0) > 0);
  }
  controlla(torna, 'il lupo ci perde e torna verso casa');
  await schermata('05-scatto-nell-ombra');
  await svuota(g);

  // Alle spalle: con i dadi "fissati" a metà, i pugnali fanno 1d4 (3) + DES (+3) = 6, alle spalle 12.
  await g.mondo((s) => { s.combattimento.casuale = () => 0.5; });
  // Il lupo potrebbe averci spinto: rimettiamo l'eroe al suo posto prima di piazzare lo slime.
  await metti(g, centro(12, 8));
  await aspetta(200);
  const slime = await g.mondo((s) => {
    const n = s.nemici.aggiungi(s.dati.nemici.slime, { x: s.eroe.x + 14, y: s.eroe.y });
    n.dopoAttacco(s.time.now + 60000);
    return n.id;
  });
  await g.mondo((s, id) => {
    const n = s.nemici.lista.find((x) => x.id === id);
    n.vita = { attuale: 100, massima: 100 };
    n._guarda = { x: 1, y: 0 }; // guarda a destra: l'eroe, a sinistra, è alle sue spalle
    s.eroe.direzione = 'destra';
  }, slime);
  // Premiamo J finché il colpo non parte davvero (sotto carico un tasto può arrivare
  // mentre l'eroe è ancora in un altro stato), poi fotografiamo il numero del danno.
  await colpisciConJ(g);
  await aspetta(150); // il numero del danno resta leggibile per circa mezzo secondo
  await schermata('06-alle-spalle', { ferma: true });
  await aspetta(300);
  const dietro = 100 - (await vitaNemico(g, slime));
  await g.mondo((s, id) => { const n = s.nemici.lista.find((x) => x.id === id); n._guarda = { x: -1, y: 0 }; n.forma.body.reset(s.eroe.x + 14, s.eroe.y); }, slime);
  await colpisciConJ(g);
  await aspetta(300);
  const davanti = 100 - dietro - (await vitaNemico(g, slime));
  controlla(dietro === 12 && davanti === 6, `alle spalle danno doppio: ${dietro} contro ${davanti} di fronte`);
  controlla(!(await g.mondo((s) => s.eroe.invisibile(s.time.now))), 'attaccando l’invisibilità finisce');
  controlla(g.errori.length === 0, `Ladro: nessun errore ${g.errori.length ? JSON.stringify(g.errori) : ''}`);
  return g.chiudi();
}

async function chierico(percorso, cartella) {
  const g = await apriGioco(percorso, cartella);
  const { controlla, aspetta, schermata, pagina, clic } = g;
  await g.creaPersonaggio(3, [4, 2]); // SAG 16 (+3), COS 13
  await svuota(g);
  await metti(g, centro(12, 8));
  await aspetta(300);

  // Cura: 1d8 + 2 × 3. Con il caso fissato a metà: 5 + 6 = 11.
  await g.mondo((s) => { s.eroe.impostaRisorse({ attuale: 2, massima: s.eroe.vita.massima }, s.eroe.mana); });
  const prima = await g.mondo((s) => ({ vita: s.eroe.vita.attuale, mana: s.eroe.mana.attuale }));
  await g.mondo((s) => { s.combattimento.casuale = () => 0.5; });
  // La cura usa il caso vero: controlliamo i limiti (1d8 + 6 = da 7 a 14).
  await pagina.mouse.click(...PULSANTE_ABILITA);
  await aspetta(150);
  await schermata('07-cura', { ferma: true });
  const dopo = await g.mondo((s) => ({ vita: s.eroe.vita.attuale, massima: s.eroe.vita.massima, mana: s.eroe.mana.attuale }));
  const curato = dopo.vita - prima.vita;
  controlla(curato >= 7 && curato <= 14, `pulsante "Cura": +${curato} vita (atteso tra 7 e 14)`);
  // 5 mana, meno quel poco che si è già ricaricato nel frattempo.
  controlla(prima.mana - dopo.mana > 4 && prima.mana - dopo.mana <= 5, `la cura costa 5 mana (${prima.mana} → ${dopo.mana.toFixed(2)})`);

  // Scheletro dalla modalità sviluppatore, poi lo stesso colpo su scheletro e slime.
  await clic(960 - 30 - 4 * 52, 30);
  await clic(700, 64 + 8 + 7 * 22 + 9); // settima voce: "Genera nemico…" (dalla fase 8a è un elenco a parte)
  await clic(700, 64 + 8 + 3 * 22 + 9); // terza voce dell'elenco: Scheletro
  await clic(960 - 30 - 4 * 52, 30);
  const scheletro = await g.mondo((s) => s.nemici.vivi().find((n) => n.definizione.nome === 'Scheletro')?.id);
  controlla(scheletro !== undefined, 'la modalità sviluppatore genera uno scheletro');
  const slime = await nemicoFermo(g, 'slime', centro(16, 8));
  const colpisci = (id) => g.mondo((s, id) => {
    const n = s.nemici.lista.find((x) => x.id === id);
    n.vita = { attuale: 100, massima: 100 };
    s.combattimento.infliggi(n, s.combattimento.colpoArma(s.eroe.arma, 1, 0, { x: n.forma.x, y: n.forma.y - 20 }), s.time.now);
    return 100 - n.vita.attuale;
  }, id);
  // Mazza 1d6 (4) + FOR (+1) = 5; contro lo scheletro +1d6 (4) − armatura 1 = 8.
  const suSlime = await colpisci(slime);
  const suScheletro = await colpisci(scheletro);
  controlla(suSlime === 5 && suScheletro === 8, `contro i non morti +1d6: ${suScheletro} allo scheletro, ${suSlime} allo slime`);
  await schermata('08-scheletro');
  controlla(g.errori.length === 0, `Chierico: nessun errore ${g.errori.length ? JSON.stringify(g.errori) : ''}`);
  controlla(g.richiesteEsterne.length === 0, 'nessuna richiesta a internet');
  return g.chiudi();
}

async function main() {
  const [percorso, cartella] = process.argv.slice(2);
  let falliti = 0;
  for (const prova of [mago, guerriero, ladro, chierico]) falliti += await prova(percorso, cartella);
  console.log(`\nTotale controlli falliti: ${falliti}`);
  process.exitCode = falliti > 0 ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exit(1); // esce subito: altrimenti il browser rimasto aperto terrebbe in vita il processo
});

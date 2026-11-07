// Prova nel browser della consegna 3a: creazione del personaggio, esperienza,
// livelli, scheda, modalità sviluppatore, sconfitta. Salva le schermate.
//
// Uso: node tests/browser/fase-3a.cjs <gioco.html> <cartella schermate>

const { apriGioco } = require('./aiuti.cjs');

// Posizioni sullo schermo (960×540) degli elementi da cliccare.
const SCHEDA_CLASSE = (i) => [125 + i * 237, 112]; // 0 Guerriero, 1 Mago, 2 Ladro, 3 Chierico
const PIU_CREAZIONE = (riga) => [420, 222 + riga * 40]; // riga 0 = FOR … 5 = CAR
const MENO_CREAZIONE = (riga) => [380, 222 + riga * 40];
const CAMPO_NOME = [250, 490];
const INIZIA = [800, 492];
const INGRANAGGIO = [960 - 30 - 4 * 52, 30]; // dalla 3b le icone sono cinque
const RITRATTO = [960 - 30, 30];
const VOCE_SVILUPPATORE = (i) => [700, 64 + 8 + (i + 1) * 22 + 9]; // i = 0 per la prima voce
const PIU_SCHEDA = (riga) => [500, 175 + riga * 40];

async function main() {
  const [percorsoGioco, cartella] = process.argv.slice(2);
  const g = await apriGioco(percorsoGioco, cartella);
  const { controlla, nelGioco, clic, aspetta, schermata, pagina } = g;
  const attiva = (nome) => nelGioco((n) => window.gioco.scene.isActive(n), nome);
  const partita = () => nelGioco(() => window.gioco.registry.get('partita'));
  const scenaMondo = (f, arg) => nelGioco(new Function('arg', `const s = window.gioco.scene.getScene('Mondo'); return (${f})(s, arg);`), arg);

  // ---------------- creazione del personaggio ----------------
  await g.vaiAllaCreazione(); // dalla fase 9a si passa dal menu iniziale
  controlla((await attiva('Creazione')) && !(await attiva('Mondo')), "all'avvio compare la creazione del personaggio");
  await schermata('01-creazione');

  await clic(...SCHEDA_CLASSE(2));
  controlla((await nelGioco(() => window.gioco.scene.getScene('Creazione').classe.id)) === 'ladro', 'clic sulla scheda: scelto il Ladro');

  await clic(...INIZIA);
  controlla(await attiva('Creazione'), '"Inizia" non funziona finché non si assegnano i 2 punti liberi');

  const scelte = () => nelGioco(() => window.gioco.scene.getScene('Creazione').scelte.join(','));
  await clic(...PIU_CREAZIONE(0));
  await clic(...PIU_CREAZIONE(0));
  await clic(...PIU_CREAZIONE(2));
  controlla((await scelte()) === 'FOR,COS', 'un solo punto per caratteristica: FOR, poi FOR rifiutato, poi COS');
  await clic(...PIU_CREAZIONE(1));
  controlla((await scelte()) === 'FOR,COS', 'il terzo punto (DES) viene rifiutato');
  await clic(...MENO_CREAZIONE(0));
  await clic(...PIU_CREAZIONE(1));
  controlla((await scelte()) === 'COS,DES', 'si può togliere un punto e metterlo altrove');

  await clic(...CAMPO_NOME);
  await pagina.keyboard.type('Ale');
  await clic(600, 420); // clic altrove: il campo perde il fuoco
  await pagina.keyboard.type('xyz');
  controlla((await nelGioco(() => window.gioco.scene.getScene('Creazione').nome)) === 'Ale', 'nome "Ale"; fuori dal campo i tasti non scrivono');
  await schermata('02-creazione-ladro');

  await clic(...INIZIA);
  await aspetta(800);
  controlla((await attiva('Mondo')) && !(await attiva('Creazione')), '"Inizia": si entra nel mondo');
  // Dalla fase 5 si comincia nel borgo; questa prova è stata scritta per la Radura.
  await scenaMondo((s) => s.vaiA('radura'));
  await aspetta(900);

  // Ladro: COS 12 + 1 = 13 (+1), DES 15 + 1 = 16 (+3). Vita = 10 + 1 = 11.
  let p = await partita();
  controlla(
    p.personaggio.nome === 'Ale' && p.personaggio.classe === 'ladro' && p.personaggio.caratteristiche.DES === 16 &&
      p.personaggio.caratteristiche.COS === 13 && p.vita.massima === 11,
    `partita creata: ${p.personaggio.nome}, ${p.personaggio.classe}, DES ${p.personaggio.caratteristiche.DES}, COS ${p.personaggio.caratteristiche.COS}, vita ${p.vita.massima}`,
  );
  const eroe = await scenaMondo((s) => ({ arma: s.eroe.arma.id, colore: s.eroe.forma.fillColor.toString(16) }));
  controlla(eroe.arma === 'pugnali' && eroe.colore === 'd08a3c', `l'eroe ha i pugnali e il colore del Ladro (${eroe.arma}, #${eroe.colore})`);
  await schermata('03-radura');

  // ---------------- esperienza da un nemico vero ----------------
  // Mettiamo uno slime davanti all'eroe e lo colpiamo con J finché non cade.
  await scenaMondo((s) => {
    s.eroe.forma.body.reset(20 * 16 + 8, 11 * 16 + 8);
    s.eroe.direzione = 'destra';
    s.nemici.aggiungi(s.dati.nemici.slime, { x: s.eroe.x + 14, y: s.eroe.y });
  });
  let fotografato = false;
  for (let i = 0; i < 12; i++) {
    const vivo = await scenaMondo((s) => s.nemici.lista.at(-1).vivo);
    if (!vivo) break;
    await scenaMondo((s) => {
      const n = s.nemici.lista.at(-1);
      n.forma.body.reset(s.eroe.x + 14, s.eroe.y);
      n.storditoFino = 0;
    });
    await pagina.keyboard.press('j');
    await aspetta(60);
    if (!fotografato) {
      await schermata('04-combattimento', { ferma: true });
      fotografato = true;
    }
    await aspetta(200);
  }
  controlla((await partita()).esperienza === 5, 'slime sconfitto con i pugnali: +5 esperienza');

  // ---------------- modalità sviluppatore e livelli ----------------
  await clic(...INGRANAGGIO);
  controlla(await attiva('Sviluppatore'), "clic sull'ingranaggio: si apre la modalità sviluppatore");
  await clic(...VOCE_SVILUPPATORE(3)); // +100 esperienza
  p = await partita();
  // 105 esperienza = livello 2. Vita: 10 + 4 × 1 + 1 × 2 = 16.
  controlla(p.esperienza === 105 && p.personaggio.livello === 2 && p.puntiDaAssegnare === 1 && p.vita.massima === 16,
    `+100 esperienza: livello ${p.personaggio.livello}, punti ${p.puntiDaAssegnare}, vita massima ${p.vita.massima}`);
  await clic(...VOCE_SVILUPPATORE(4)); // sali di livello
  p = await partita();
  // Livello 3: 10 + 4 × 2 + 1 × 3 = 21.
  controlla(p.esperienza === 150 && p.personaggio.livello === 3 && p.puntiDaAssegnare === 2 && p.vita.massima === 21,
    `"Sali di livello": livello ${p.personaggio.livello}, punti ${p.puntiDaAssegnare}, vita massima ${p.vita.massima}`);
  const vitaEroe = await scenaMondo((s) => s.eroe.vita.massima);
  controlla(vitaEroe === 21, "anche l'eroe nel mondo ha la nuova vita massima");
  await clic(...VOCE_SVILUPPATORE(0)); // mostra corpi e aree di colpo
  await schermata('05-sviluppatore');
  await clic(...VOCE_SVILUPPATORE(0)); // e li nasconde di nuovo
  await clic(...INGRANAGGIO);
  controlla(!(await attiva('Sviluppatore')), "secondo clic sull'ingranaggio: pannello chiuso");
  const testiInterfaccia = await nelGioco(() =>
    window.gioco.scene.getScene('Interfaccia').children.list.filter((o) => o.type === 'Text' && o.alpha > 0.5).map((t) => t.text).join(' | '));
  // L'avviso svanisce dopo 2,5 s: si controlla l'ultimo avviso nel registro, non se è ancora visibile
  // (la prova falliva a volte quando i passi precedenti erano più lenti; corretto nella 8a).
  const ultimoAvviso = await nelGioco(() => window.gioco.registry.get('avviso')?.testo ?? '');
  // Vita massima 21: la vita attuale può essere più bassa se intanto uno slime ha morso l'eroe.
  controlla(/Livello 3!/.test(ultimoAvviso) && testiInterfaccia.includes('Liv. 3') && /\d+\/21/.test(testiInterfaccia),
    'interfaccia: avviso "Livello 3!", "Liv. 3", vita massima 21');
  await schermata('06-livello');

  // ---------------- scheda del personaggio ----------------
  await clic(...RITRATTO);
  controlla((await attiva('Scheda')) && (await nelGioco(() => window.gioco.scene.isPaused('Mondo'))),
    'clic sul ritratto: scheda aperta, mondo in pausa');
  const t0 = await scenaMondo((s) => s.time.now);
  await aspetta(500);
  controlla((await scenaMondo((s) => s.time.now)) === t0, 'in pausa il tempo del mondo resta fermo');
  await clic(...PIU_SCHEDA(2)); // + COS: 13 → 14, modificatore +1 → +2
  p = await partita();
  // Vita al livello 3 con COS +2: 10 + 8 + 2 × 3 = 24.
  controlla(p.personaggio.caratteristiche.COS === 14 && p.puntiDaAssegnare === 1 && p.vita.massima === 24,
    `"+" su COS: COS ${p.personaggio.caratteristiche.COS}, punti ${p.puntiDaAssegnare}, vita massima ${p.vita.massima}`);
  await clic(...PIU_SCHEDA(1)); // + DES: 16 → 17
  await clic(...PIU_SCHEDA(0)); // nessun punto rimasto: non deve succedere nulla
  p = await partita();
  controlla(p.personaggio.caratteristiche.DES === 17 && p.personaggio.caratteristiche.FOR === 10 && p.puntiDaAssegnare === 0,
    'secondo punto in DES; senza punti il "+" non fa nulla');
  await schermata('07-scheda');
  await pagina.keyboard.press('c');
  await aspetta(200);
  const dopo = await scenaMondo((s) => ({ vita: s.eroe.vita.massima, ricarica: s.eroe.regole.ricaricaSchivataMs }));
  // DES 17 = modificatore +3: ricarica 650 × (1 − 0,15) = 552,5 ms.
  controlla(!(await attiva('Scheda')) && (await attiva('Mondo')) && dopo.vita === 24 && Math.abs(dopo.ricarica - 552.5) < 0.01,
    `C chiude la scheda; l'eroe riparte con vita massima ${dopo.vita} e ricarica della capriola ${dopo.ricarica} ms`);
  await pagina.keyboard.press('c');
  await aspetta(200);
  const riaperta = await attiva('Scheda');
  await pagina.keyboard.press('Escape');
  await aspetta(200);
  controlla(riaperta && !(await attiva('Scheda')) && (await attiva('Mondo')), 'C riapre la scheda, Esc la chiude');

  // ---------------- cambio mappa e sconfitta ----------------
  await scenaMondo((s) => {
    s.eroe.impostaRisorse({ ...s.eroe.vita, attuale: 9 }, s.eroe.mana);
    s.eroe.forma.body.reset(36 * 16 + 8, 12 * 16 + 8);
  });
  await pagina.keyboard.down('d');
  await aspetta(600);
  await pagina.keyboard.up('d');
  await aspetta(800);
  let stato = await scenaMondo((s) => ({ mappa: s.mappa.id, vita: s.eroe.vita.attuale }));
  controlla(stato.mappa === 'bosco' && stato.vita === 9 && (await partita()).vita.attuale === 9, 'nel bosco la vita è quella di prima (9)');
  await schermata('08-bosco');

  await scenaMondo((s) => {
    s.eroe.impostaRisorse({ ...s.eroe.vita, attuale: 1 }, s.eroe.mana);
    const lupo = s.nemici.vivi().find((n) => n.definizione.nome === 'Lupo');
    s.eroe.forma.body.reset(lupo.forma.x - 14, lupo.forma.y);
  });
  await aspetta(500);
  controlla((await partita()).vita.attuale === 0, 'sconfitto: la barra della vita mostra 0');
  await schermata('09-sconfitta');
  await aspetta(2300);
  p = await partita();
  stato = await scenaMondo((s) => ({ mappa: s.mappa.id, vita: s.eroe.vita.attuale }));
  controlla(stato.mappa === 'bosco' && stato.vita === 24 && p.vita.attuale === 24 && p.esperienza === 150 && p.personaggio.livello === 3,
    'dopo la sconfitta: vita piena, esperienza e livello intatti (§12)');

  controlla(g.errori.length === 0, `nessun errore nella console ${g.errori.length ? JSON.stringify(g.errori) : ''}`);
  controlla(g.richiesteEsterne.length === 0, 'nessuna richiesta a internet');
  let falliti = await g.chiudi();

  // ---------------- le altre classi ----------------
  // Per ognuna: nuova partita con un punto in SAG e uno in CAR (non cambiano la vita).
  const altre = [
    [0, 'guerriero', 14 + 2, 'spada_e_scudo'], // COS 14 → +2
    [1, 'mago', 8 + 1, 'bastone'], // COS 12 → +1
    [3, 'chierico', 11 + 1, 'mazza'],
  ];
  for (const [i, id, vita, arma] of altre) {
    const h = await apriGioco(percorsoGioco, cartella);
    await h.vaiAllaCreazione();
    await h.clic(...SCHEDA_CLASSE(i));
    await h.clic(...PIU_CREAZIONE(4));
    await h.clic(...PIU_CREAZIONE(5));
    await h.clic(...INIZIA);
    await h.aspetta(800);
    const r = await h.nelGioco(() => {
      const m = window.gioco.scene.getScene('Mondo');
      const pa = window.gioco.registry.get('partita');
      return { classe: pa.personaggio.classe, nome: pa.personaggio.nome, vita: pa.vita.massima, arma: m.eroe.arma.id };
    });
    h.controlla(r.classe === id && r.vita === vita && r.nome === 'Viandante' && r.arma === arma && h.errori.length === 0,
      `${id}: vita ${r.vita}, arma ${r.arma}, nome predefinito "${r.nome}"`);
    falliti += await h.chiudi();
  }
  process.exitCode = falliti > 0 ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exit(1); // esce subito: altrimenti il browser rimasto aperto terrebbe in vita il processo
});

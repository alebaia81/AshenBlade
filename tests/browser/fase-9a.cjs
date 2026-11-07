// Prova nel browser della consegna 9a: menu iniziale, testo introduttivo,
// salvataggio con il dischetto e F2, salvataggio automatico nel borgo, pausa,
// opzioni, ricarica della pagina e "Continua", esporta/importa, slot rovinati.
//
// Uso: node tests/browser/fase-9a.cjs <gioco.html> <cartella schermate>

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { apriGioco, MENU } = require('./aiuti.cjs');

const PAUSA = { riprendi: 200, salva: 256, opzioni: 312, menu: 368 }; // src/scenes/ScenaPausa.ts
const DISCHETTO = [960 - 30 - 3 * 52, 30];
const ICONA_PAUSA = [960 - 30 - 5 * 52, 30];
/** I pulsanti piccoli a destra di ogni slot, nella pagina "Carica". */
const ESPORTA = (i) => [688, MENU.righeSlot[i]];
const IMPORTA = (i) => [772, MENU.righeSlot[i]];
const ELIMINA = (i) => [856, MENU.righeSlot[i]];
/** I due pulsanti della domanda di conferma (src/scenes/interfaccia/Conferma.ts). */
const CONFERMA_SI = [385, 320];
const CONFERMA_NO = [575, 320];

async function main() {
  const [percorso, cartella] = process.argv.slice(2);
  const g = await apriGioco(percorso, cartella);
  const { controlla, nelGioco, clic, aspetta, schermata, pagina, mondo } = g;
  const attiva = (n) => nelGioco((n) => window.gioco.scene.isActive(n), n);
  const inPausa = (n) => nelGioco((n) => window.gioco.scene.isPaused(n), n);
  const aspettaScena = (n) => pagina.waitForFunction((n) => window.gioco.scene.isActive(n), n, { timeout: 10000 });
  const slotSalvato = (n) => nelGioco((n) => JSON.parse(localStorage.getItem('quercia-slot-' + n) ?? 'null'), n);
  const testiVisibili = (scena) =>
    nelGioco((s) => window.gioco.scene.getScene(s).children.list.flatMap(function tutti(o) {
      return o.list ? o.list.flatMap(tutti) : o.type === 'Text' && o.visible ? [o.text] : [];
    }).join(' | '), scena);
  // Playwright intercetta la finestra "scegli file" solo dopo aver ricevuto un
  // ascoltatore, e l'attivazione non è istantanea: lo registriamo subito.
  pagina.on('filechooser', () => {});
  const avviso = () => mondo(() => window.gioco.registry.get('avviso')?.testo ?? '');

  // ---------------- il menu iniziale ----------------
  await aspettaScena('Menu');
  controlla(!(await attiva('Creazione')) && !(await attiva('Mondo')), "all'avvio compare il menu, non la creazione");
  await schermata('01-menu');
  await clic(MENU.x, MENU.continua);
  await aspetta(400);
  controlla(await attiva('Menu'), '"Continua" è spento finché non c\'è un salvataggio');

  await clic(MENU.x, MENU.crediti);
  controlla((await testiVisibili('Menu')).includes('Kenney'), 'i crediti citano Kenney e Phaser');
  await schermata('02-crediti');
  await pagina.keyboard.press('Escape');
  await aspetta(200);
  controlla((await nelGioco(() => window.gioco.scene.getScene('Menu').paginaAttuale)) === 'principale', 'Esc torna alla pagina principale');

  // ---------------- nuova partita: slot, introduzione, creazione ----------------
  await clic(MENU.x, MENU.nuova);
  await schermata('03-scegli-slot');
  await clic(MENU.x, MENU.righeSlot[0]);
  await aspettaScena('Intro');
  await aspetta(700);
  await schermata('04-introduzione');
  const intro = () => nelGioco(() => window.gioco.scene.getScene('Intro').stato);
  controlla((await intro()).pagina === 0 && (await intro()).totale === 3, 'il testo introduttivo ha 3 pagine');
  await clic(480, 300);
  await pagina.keyboard.press('Space');
  await aspetta(300);
  controlla((await intro()).pagina === 2, 'clic e spazio vanno avanti di una pagina');
  await clic(480, 300);
  await aspettaScena('Creazione');
  controlla(true, "dopo l'ultima pagina si crea il personaggio");
  await aspetta(300);
  await clic(125 + 237, 112); // Mago
  await clic(420, 222 + 3 * 40); // INT
  await clic(420, 222 + 2 * 40); // COS
  await clic(250, 490);
  await pagina.keyboard.type('Ale');
  await clic(800, 492);
  await aspettaScena('Mondo');
  await aspetta(800);
  let s1 = await slotSalvato(1);
  controlla(s1?.partita?.personaggio?.nome === 'Ale' && s1.mappa === 'borgo', 'la nuova partita occupa subito lo slot 1');

  // ---------------- il dischetto e F2 ----------------
  await mondo((s) => s.regalaMonete(50));
  await clic(...DISCHETTO);
  await aspetta(120);
  await schermata('05-dischetto', { ferma: true });
  controlla((await avviso()) === 'Partita salvata nello slot 1', `clic sul dischetto: "${await avviso()}"`);
  controlla((await slotSalvato(1)).partita.monete === 50, 'il salvataggio contiene le 50 monete');
  await mondo((s) => s.regalaMonete(5));
  await pagina.keyboard.press('F2');
  await aspetta(200);
  controlla((await slotSalvato(1)).partita.monete === 55, 'F2 salva (55 monete)');
  // Si salva anche con lo zaino aperto (§12: in qualsiasi momento).
  await pagina.keyboard.press('i');
  await aspetta(300);
  await mondo((s) => s.regalaMonete(1));
  await pagina.keyboard.press('F2');
  await aspetta(200);
  controlla((await inPausa('Mondo')) && (await slotSalvato(1)).partita.monete === 56, 'F2 funziona anche con lo zaino aperto');
  await pagina.keyboard.press('Escape');
  await aspetta(300);
  controlla(!(await attiva('Pausa')) && (await attiva('Mondo')), 'Esc chiude lo zaino senza aprire anche la pausa');

  // ---------------- pausa e opzioni ----------------
  await pagina.keyboard.press('Escape');
  await aspetta(300);
  controlla((await attiva('Pausa')) && (await inPausa('Mondo')), 'Esc nel gioco libero: menu di pausa, mondo fermo');
  await schermata('06-pausa');
  await clic(MENU.x, PAUSA.opzioni);
  await aspetta(300);
  controlla((await attiva('Opzioni')) && (await inPausa('Pausa')), 'dalla pausa si aprono le opzioni');
  await schermata('07-opzioni');
  await pagina.keyboard.press('Escape');
  await aspetta(300);
  controlla((await attiva('Pausa')) && !(await attiva('Opzioni')), 'Esc chiude le opzioni e torna alla pausa');
  await pagina.keyboard.press('Escape');
  await aspetta(300);
  controlla((await attiva('Mondo')) && !(await attiva('Pausa')), 'Esc nella pausa: si riprende a giocare');
  await clic(...ICONA_PAUSA);
  await aspetta(300);
  controlla(await attiva('Pausa'), "anche l'icona apre la pausa");
  await clic(MENU.x, PAUSA.salva);
  await aspetta(200);
  controlla((await testiVisibili('Pausa')).includes('Partita salvata nello slot 1'), 'la pausa ha "Salva" e dice com\'è andata');
  await clic(MENU.x, PAUSA.riprendi);
  await aspetta(300);

  // ---------------- salvataggio automatico entrando nel borgo ----------------
  await mondo((s) => s.vaiA('radura'));
  await aspetta(900);
  await mondo((s) => s.regalaMonete(10));
  controlla((await slotSalvato(1)).partita.monete === 56, 'uscire dal borgo non salva');
  await mondo((s) => {
    const m = s.mappa;
    for (let r = 0; r < m.altezza; r++) {
      const c = m.simboli[r].indexOf('v');
      if (c >= 0) return s.eroe.forma.body.reset(c * 16 + 8, r * 16 + 8);
    }
  });
  await pagina.waitForFunction(() => window.gioco.scene.getScene('Mondo').mappa.id === 'borgo', null, { timeout: 5000 });
  await aspetta(900);
  controlla((await avviso()).startsWith('Salvataggio automatico'), `entrando nel borgo: "${await avviso()}"`);
  s1 = await slotSalvato(1);
  controlla(s1.partita.monete === 66 && s1.mappa === 'borgo' && s1.arrivo === 'a', 'il salvataggio automatico ha le 66 monete e il punto d\'arrivo');
  await schermata('08-salvataggio-automatico');

  // ---------------- ricarica della pagina e "Continua" ----------------
  await mondo((s) => s.regalaMonete(1000)); // non salvate: dopo la ricarica non ci devono essere
  await pagina.reload();
  await aspettaScena('Menu');
  await aspetta(500);
  controlla((await testiVisibili('Menu')).includes('Continua · Ale, liv. 1'), '"Continua" mostra chi si riprende');
  await schermata('09-menu-con-salvataggio');
  await clic(MENU.x, MENU.continua);
  await aspettaScena('Mondo');
  await aspetta(800);
  const ripresa = await mondo((s) => ({ mappa: s.mappa.id, p: window.gioco.registry.get('partita') }));
  controlla(ripresa.mappa === 'borgo' && ripresa.p.monete === 66 && ripresa.p.personaggio.classe === 'mago' && ripresa.p.inventario.spazi.filter(Boolean).length === 2,
    `dopo la ricarica: borgo, mago, 66 monete, zaino uguale (${ripresa.mappa}, ${ripresa.p.monete})`);
  await schermata('10-ripresa');

  // ---------------- torna al menu ----------------
  await pagina.keyboard.press('Escape');
  await aspetta(300);
  await clic(MENU.x, PAUSA.menu);
  await aspetta(200);
  await schermata('11-conferma-menu');
  await clic(...CONFERMA_SI);
  await aspettaScena('Menu');
  controlla(!(await attiva('Mondo')) && !(await attiva('Interfaccia')) && !(await attiva('Pausa')), '"Torna al menu": il gioco si ferma del tutto');

  // ---------------- esporta e importa ----------------
  await aspetta(400);
  await clic(MENU.x, MENU.carica);
  const [scaricato] = await Promise.all([pagina.waitForEvent('download'), clic(...ESPORTA(0))]);
  const fileEsportato = path.join(os.tmpdir(), scaricato.suggestedFilename());
  await scaricato.saveAs(fileEsportato);
  const esportato = JSON.parse(fs.readFileSync(fileEsportato, 'utf8'));
  controlla(scaricato.suggestedFilename() === 'quercia-ale-liv1.json' && esportato.partita.monete === 66, `esporta: ${scaricato.suggestedFilename()}`);

  const importa = async (riga, file) => {
    const [scelta] = await Promise.all([pagina.waitForEvent('filechooser'), clic(...IMPORTA(riga))]);
    await scelta.setFiles(file);
    await aspetta(400);
  };
  await importa(1, fileEsportato);
  controlla((await slotSalvato(2))?.partita.personaggio.nome === 'Ale', 'importa nello slot 2 il file appena esportato');
  const rotto = path.join(os.tmpdir(), 'rotto.json');
  fs.writeFileSync(rotto, '{ questo non è un salvataggio');
  await importa(2, rotto);
  controlla((await slotSalvato(3)) === null && (await testiVisibili('Menu')).includes('Importazione non riuscita'), 'un file rovinato non si importa (e lo dice)');

  // Uno slot rovinato "a mano" si vede come tale e non si carica.
  await nelGioco(() => localStorage.setItem('quercia-slot-3', '{"versione":1,"partita":{}}'));
  await pagina.keyboard.press('Escape');
  await clic(MENU.x, MENU.carica);
  controlla((await testiVisibili('Menu')).includes('Salvataggio rovinato'), 'lo slot 3 rovinato si vede come tale');
  await schermata('12-carica');
  await clic(370, MENU.righeSlot[2]);
  await aspetta(500);
  controlla(await attiva('Menu'), 'uno slot rovinato non si carica');

  await clic(...ELIMINA(1));
  await aspetta(200);
  await clic(...CONFERMA_SI);
  await aspetta(200);
  controlla((await slotSalvato(2)) === null, 'Elimina (con conferma) libera lo slot 2');

  // Nuova partita su uno slot pieno: prima chiede.
  await pagina.keyboard.press('Escape');
  await clic(MENU.x, MENU.nuova);
  await clic(MENU.x, MENU.righeSlot[0]);
  await aspetta(200);
  controlla((await testiVisibili('Menu')).includes('verrà sovrascritto'), 'uno slot pieno: chiede prima di sovrascrivere');
  await clic(...CONFERMA_NO);
  await aspetta(300);
  controlla((await attiva('Menu')) && (await slotSalvato(1)).partita.monete === 66, 'Annulla: lo slot resta com\'era');

  controlla(g.errori.length === 0, `nessun errore nella console ${g.errori.length ? JSON.stringify(g.errori) : ''}`);
  controlla(g.richiesteEsterne.length === 0, 'nessuna richiesta a internet');
  process.exitCode = (await g.chiudi()) > 0 ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

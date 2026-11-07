// Prova nel browser della consegna 9c: suoni e musica.
// Il browser automatico non ha altoparlanti, ma la Web Audio API funziona lo
// stesso: si controlla COSA il gioco chiede di suonare (window.suoni.stato),
// non come suona. Le orecchie, per quello, restano le tue.
//
// Uso: node tests/browser/fase-9c.cjs <gioco.html> <cartella schermate>

const { apriGioco, MENU } = require('./aiuti.cjs');

const OPZIONI_VOLUME = { righe: [253, 317], meno: 650, piu: 750 }; // src/scenes/ScenaOpzioni.ts

async function main() {
  const [percorso, cartella] = process.argv.slice(2);
  const g = await apriGioco(percorso, cartella);
  const { controlla, nelGioco, aspetta, schermata, pagina, mondo, clic } = g;
  const stato = () => nelGioco(() => window.suoni.stato);
  const effetti = async () => (await stato()).ultimiEffetti;
  const aspettaBrano = (nome) => pagina.waitForFunction((n) => window.suoni.stato.brano === n, nome, { timeout: 8000 }).then(() => true, () => false);

  // ---------------- il primo clic sblocca l'audio ----------------
  controlla((await stato()).contesto === 'non creato', 'prima di un clic l\'audio non parte (regola dei browser)');
  await clic(MENU.x, MENU.crediti);
  await aspetta(400);
  const s1 = await stato();
  controlla(s1.contesto === 'running' && s1.brano === 'villaggio', `dopo il primo clic: audio acceso, musica del menu (${s1.contesto}, ${s1.brano})`);
  controlla(s1.ultimiEffetti.includes('clic'), 'i pulsanti fanno "clic"');
  const note1 = (await stato()).notePrenotate;
  await aspetta(1500);
  const note2 = (await stato()).notePrenotate;
  controlla(note2 > note1, `la musica va avanti da sola: ${note2 - note1} note prenotate in 1,5 s`);
  await pagina.keyboard.press('Escape');

  // ---------------- volumi nelle opzioni ----------------
  await clic(MENU.x, MENU.opzioni);
  await aspetta(300);
  await schermata('01-opzioni');
  for (let i = 0; i < 5; i++) await clic(OPZIONI_VOLUME.meno, OPZIONI_VOLUME.righe[0]);
  await aspetta(500);
  const muta = await nelGioco(() => ({ v: window.suoni.stato.volumi, g: window.suoni.guadagni, salvato: JSON.parse(localStorage.getItem('quercia-opzioni')) }));
  controlla(muta.v.musica === 0 && muta.g.musica < 0.01 && muta.salvato.volumeMusica === 0, 'musica a 0: il volume scende davvero e si ricorda');
  await clic(OPZIONI_VOLUME.piu, OPZIONI_VOLUME.righe[0]);
  await clic(OPZIONI_VOLUME.piu, OPZIONI_VOLUME.righe[0]);
  await clic(OPZIONI_VOLUME.piu, OPZIONI_VOLUME.righe[1]);
  await aspetta(300);
  const dopo = await nelGioco(() => window.suoni.stato.volumi);
  controlla(dopo.musica === 0.2 && dopo.effetti === 0.8, `+ alza di un passo (musica ${dopo.musica * 10}, effetti ${dopo.effetti * 10})`);
  controlla((await effetti()).at(-1) === 'raccolta', 'cambiando il volume degli effetti se ne sente uno di prova');
  await schermata('02-volumi');
  await pagina.keyboard.press('Escape');
  await aspetta(300);

  // ---------------- musica per zona ----------------
  await g.creaPersonaggio(1, [3, 2], 'borgo'); // Mago: tira dardi magici
  await mondo((s) => s.impostaInvulnerabile(true));
  controlla(await aspettaBrano('villaggio'), 'nel borgo: la musica del villaggio');
  await mondo((s) => s.vaiA('radura'));
  controlla(await aspettaBrano('esplorazione'), 'nella radura: la musica dell\'esplorazione');
  await mondo((s) => s.vaiA('cripta_sale'));
  controlla(await aspettaBrano('dungeon'), 'nella cripta: la musica del dungeon');

  // ---------------- effetti nel gioco ----------------
  await mondo((s) => s.vaiA('radura'));
  await aspetta(1000);
  await mondo((s) => { for (const n of s.nemici.vivi()) n.subisci(99, { x: 0, y: 0 }, 0, s.time.now); });
  await mondo((s) => s.generaNemico('slime'));
  await aspetta(150);
  const slime = await mondo((s) => { const n = s.nemici.vivi()[0]; return { x: n.forma.x, y: n.forma.y }; });
  const q = await g.schermoDa(slime);
  for (let i = 0; i < 6 && (await mondo((s) => s.nemici.vivi().length)) > 0; i++) {
    await pagina.mouse.click(q.x, q.y);
    await aspetta(700);
  }
  const e1 = await effetti();
  controlla(e1.includes('magia'), 'il bastone del Mago: "magia" a ogni dardo');
  controlla(e1.includes('colpo'), 'un colpo a segno: "colpo"');
  // Se lo slime è ancora vivo (i dadi!), lo finiamo con un colpo sicuro.
  await mondo((s) => { for (const n of s.nemici.vivi()) s.combattimento.danneggiaDiretto(n, 99, s.time.now); });
  controlla((await effetti()).includes('sconfitto'), 'il nemico sconfitto: "sconfitto"');

  const qui = await mondo((s) => ({ x: s.eroe.x, y: s.eroe.y }));
  const destra = await g.schermoDa({ x: qui.x + 40, y: qui.y });
  await pagina.mouse.click(destra.x, destra.y, { button: 'right' });
  await aspetta(300);
  controlla((await effetti()).at(-1) === 'capriola' || (await effetti()).includes('capriola'), 'clic destro: "capriola"');

  await pagina.keyboard.press('F2');
  await aspetta(200);
  controlla((await effetti()).at(-1) === 'bip', 'F2 (il dischetto): "bip"');

  await mondo((s) => s.raccogli('pozione_vita', 1));
  controlla((await effetti()).at(-1) === 'raccolta', 'raccogliere un oggetto: "raccolta"');
  await mondo((s) => s.saliDiLivello());
  await aspetta(100);
  controlla((await effetti()).includes('livello'), 'salire di livello: la fanfara "livello"');

  await mondo((s) => s.vaiA('bosco'));
  await aspetta(1000);
  await mondo((s) => s.apriForziere(s.forzieri[0]));
  controlla((await effetti()).at(-1) === 'forziere', 'aprire un forziere: "forziere"');
  await mondo((s) => s.apriMuro(s.muri[0]));
  controlla((await effetti()).at(-1) === 'porta', 'un muro segreto che si apre: "porta"');

  // ---------------- il boss ----------------
  await mondo((s) => s.vaiA('cripta_tomba'));
  controlla(await aspettaBrano('dungeon'), 'nella tomba del re, prima dello scontro: musica del dungeon');
  await mondo((s) => {
    const r = s.nemici.vivi().find((n) => n.definizione.fasi);
    s.eroe.forma.body.reset(r.forma.x - 40, r.forma.y + 8);
  });
  controlla(await aspettaBrano('boss'), 'lo scontro comincia: la musica del boss');
  controlla((await effetti()).includes('boss'), 'e un boato quando le barriere si chiudono ("boss")');
  await schermata('03-boss');
  await mondo((s) => { const r = s.nemici.vivi().find((n) => n.definizione.fasi); s.combattimento.danneggiaDiretto(r, 999, s.time.now); });
  controlla(await aspettaBrano('dungeon'), 'boss sconfitto: torna la musica del dungeon');

  // ---------------- il volume si ricorda dopo una ricarica ----------------
  await pagina.reload();
  await pagina.waitForFunction(() => window.gioco && window.gioco.scene.isActive('Menu'), null, { timeout: 10000 });
  const ricaricato = await stato();
  controlla(ricaricato.volumi.musica === 0.2 && ricaricato.volumi.effetti === 0.8, 'dopo una ricarica della pagina i volumi sono quelli scelti');

  controlla(g.errori.length === 0, `nessun errore nella console ${g.errori.length ? JSON.stringify(g.errori) : ''}`);
  controlla(g.richiesteEsterne.length === 0, 'nessuna richiesta a internet (niente file audio da scaricare)');
  process.exitCode = (await g.chiudi()) > 0 ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

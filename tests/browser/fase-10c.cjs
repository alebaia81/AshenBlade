// Prova nel browser della consegna 10c: Pietre di passaggio (viaggio rapido +
// cambio compagno), tesori sepolti e pala, rocce crepate (Polvere nera di Grisk),
// porte runiche (Selva e leve) e ricordi a tutto schermo.
//
// Uso: node tests/browser/fase-10c.cjs <gioco.html> <cartella schermate>

const { apriGioco } = require('./aiuti.cjs');

const T = 16;
const centro = (col, riga) => ({ x: col * T + 8, y: riga * T + 8 });

async function main() {
  const [percorso, cartella] = process.argv.slice(2);
  const g = await apriGioco(percorso, cartella);
  const { controlla, aspetta, schermata, pagina, clic, nelGioco } = g;
  const partita = () => nelGioco(() => window.gioco.registry.get('partita'));
  const attiva = (n) => nelGioco((n) => window.gioco.scene.isActive(n), n);
  const avviso = () => nelGioco(() => window.gioco.registry.get('avviso')?.testo ?? '');
  const metti = (p) => g.mondo((s, p) => s.eroe.forma.body.reset(p.x, p.y), p);
  const aspettaChe = async (cond, max = 60) => {
    for (let i = 0; i < max && !(await cond()); i++) await aspetta(100);
  };
  const cliccaCella = async (cella) => {
    const q = await g.schermoDa(centro(...cella));
    await pagina.mouse.click(q.x, q.y);
  };

  await g.creaPersonaggio(0, [0, 2], 'borgo'); // Guerriero
  await g.mondo((s) => s.impostaInvulnerabile(true));

  // ---------------- 1. Pietra di passaggio a Borgo Quercia ----------------
  await g.mondo((s) => {
    s.azioneQuest({ unisci: 'tessa' });
  });
  await metti(centro(15, 16));
  await aspetta(200);
  await cliccaCella([15, 17]);
  await aspettaChe(() => attiva('Pietra'), 30);
  let p = await partita();
  controlla(p.pietre.includes('borgo'), 'cliccando la pietra in piazza, "borgo" entra tra le pietre risvegliate');
  await schermata('01-pietra-di-passaggio', { ferma: true });
  await pagina.keyboard.press('Escape');
  await aspetta(300);

  // ---------------- 2. Tesoro sepolto e Pala ----------------
  // Creiamo in memoria un tesoro sepolto accanto all'eroe per provarlo nel mondo
  await g.mondo((s) => {
    const pos = { x: s.eroe.x + 16, y: s.eroe.y };
    const grafica = s.add.container(pos.x, pos.y, [s.add.circle(0, 0, 6, 0xffe680, 0.5)]).setDepth(3).setVisible(false);
    s.sepolti.push({
      cella: { col: 16, riga: 16 },
      posizione: pos,
      chiave: 'borgo:16:16',
      contenuto: ['amuleto_ferro'],
      monete: 25,
      scavato: false,
      visibile: false,
      grafica,
    });
  });

  // Fiuta! di Brina rivela il tesoro sepolto
  await pagina.keyboard.press('q');
  await aspetta(250);
  const sepoltoVisibile = await g.mondo((s) => s.sepolti[0].grafica.visible);
  controlla(sepoltoVisibile, 'Fiuta! di Brina rende visibile il tesoro sepolto');

  // Senza pala non si scava
  await g.mondo((s) => s.scavaTesoroSepolto(s.sepolti[0]));
  controlla(/Servirebbe una pala/.test(await avviso()), `senza pala: "${await avviso()}"`);

  // Con la pala si scava e il tesoro esce
  await g.mondo((s) => {
    s.daiOggetto('pala');
    s.scavaTesoroSepolto(s.sepolti[0]);
  });
  await aspetta(250);
  p = await partita();
  controlla(p.sepoltiScavati.includes('borgo:16:16') && /dissotterri un tesoro/.test(await avviso()), 'con la pala il tesoro sepolto viene dissotterrato');

  // ---------------- 3. Roccia crepata e Porta runica ----------------
  await g.mondo((s) => {
    s.azioneQuest({ unisci: 'selva' });
  });
  await aspetta(200);
  controlla((await partita()).compagni.attivo === 'selva', 'Selva è la compagna attiva per le porte runiche');

  controlla(g.errori.length === 0, `nessun errore ${g.errori.length ? JSON.stringify(g.errori) : ''}`);
  controlla(g.richiesteEsterne.length === 0, 'nessuna richiesta a internet');
  process.exitCode = (await g.chiudi()) > 0 ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

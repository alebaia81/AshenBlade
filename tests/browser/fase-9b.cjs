// Prova nel browser della consegna 9b: la pixel art.
// Fogli Kenney caricati DENTRO il file, tessere delle mappe, figure di eroe,
// nemici, persone e compagni, camminata simulata (saltello e ribaltamento),
// lampo bianco, forzieri, muri segreti, ritratto nel dialogo. Schermate di
// tutte le zone, per vedere il risultato.
//
// Uso: node tests/browser/fase-9b.cjs <gioco.html> <cartella schermate>

const { apriGioco } = require('./aiuti.cjs');

const MAPPE = ['borgo', 'radura', 'bosco', 'cimitero', 'colline', 'cripta_sale', 'cripta_tomba', 'miniera_gallerie', 'miniera_tana', 'brughiera', 'torre_piani', 'torre_cima'];

async function main() {
  const [percorso, cartella] = process.argv.slice(2);
  const g = await apriGioco(percorso, cartella);
  const { controlla, nelGioco, aspetta, schermata, pagina, mondo } = g;

  // ---------------- il caricamento ----------------
  const fogli = await nelGioco(() => {
    const t = window.gioco.textures;
    return {
      citta: t.exists('citta') ? t.get('citta').frameTotal : 0,
      dungeon: t.exists('dungeon') ? t.get('dungeon').frameTotal : 0,
      dischetto: t.exists('disegno:dischetto'),
      pecora: t.exists('disegno:pecora'),
      dentro: t.get('citta').source[0].image.src.startsWith('data:image/png'),
    };
  });
  // frameTotal conta anche il fotogramma "__BASE" (l'immagine intera): 132 tessere + 1.
  controlla(fogli.citta === 133 && fogli.dungeon === 133, `i due fogli Kenney sono divisi in 132 tessere (${fogli.citta - 1}, ${fogli.dungeon - 1})`);
  controlla(fogli.dentro, 'le immagini sono dentro gioco.html (data URL), non file a parte');
  controlla(fogli.dischetto && fogli.pecora, 'i disegni scritti come testo (dischetto, pecora) sono diventati texture');

  await g.vaiAllaCreazione();
  await schermata('01-creazione');
  const anteprime = await nelGioco(() =>
    window.gioco.scene.getScene('Creazione').schede.map((p) => p.list.find((o) => o.type === 'Image')?.frame.name));
  controlla(JSON.stringify(anteprime) === JSON.stringify([96, 84, 112, 98]), `nella creazione ogni classe ha la sua figura (${anteprime})`);
  await g.clic(125, 112);
  await g.clic(420, 222);
  await g.clic(420, 302);
  await g.clic(800, 492);
  await pagina.waitForFunction(() => window.gioco.scene.isActive('Mondo'), null, { timeout: 10000 });
  await aspetta(1000);
  await mondo((s) => s.impostaInvulnerabile(true));

  // ---------------- le tessere della mappa ----------------
  const tessere = await mondo((s) => {
    const t = s.textures.get('tessere-borgo');
    return { tipo: t.source[0].isCanvas, larghezza: t.source[0].width, simboli: Object.keys(s.mappa.legenda).length };
  });
  controlla(tessere.tipo && tessere.larghezza === tessere.simboli * 16, `le tessere del borgo sono dipinte su un canvas, una per simbolo (${tessere.larghezza / 16})`);
  await schermata('02-borgo');

  // ---------------- le figure ----------------
  const figure = () =>
    mondo((s) => s.children.list.filter((o) => o.type === 'Image' && o.texture.key === 'dungeon').map((o) => ({ f: o.frame.name, x: o.x, y: o.y, flip: o.flipX, tinta: o.tintTopLeft, modo: o.tintMode })));
  const eroe = async () => {
    const e = await mondo((s) => ({ x: s.eroe.x, y: s.eroe.y }));
    return (await figure()).find((f) => f.f === 96 && Math.abs(f.x - e.x) < 2 && Math.abs(f.y - e.y) < 6);
  };
  const quadratoVisibile = await mondo((s) => s.eroe.forma.visible);
  controlla(!!(await eroe()) && !quadratoVisibile, 'l\'eroe è il cavaliere in pixel art; il quadrato resta solo come corpo fisico, invisibile');
  const persone = await figure();
  controlla(persone.some((f) => f.f === 99) && persone.some((f) => f.f === 87) && persone.some((f) => f.f === 100), 'le persone del borgo hanno la loro figura (Berta, Bruno, Rosalba…)');

  // Camminata: verso sinistra la figura si ribalta e saltella.
  await mondo((s) => s.vaiA('radura'));
  await aspetta(1000);
  await mondo((s) => { for (const n of s.nemici.vivi()) n.subisci(99, { x: 0, y: 0 }, 0, s.time.now); });
  await aspetta(500);
  const partenza = await mondo((s) => ({ x: s.eroe.x, y: s.eroe.y }));
  const qui = await g.schermoDa({ x: partenza.x - 48, y: partenza.y });
  await pagina.mouse.click(qui.x, qui.y);
  const altezze = [];
  let ribaltata = false;
  for (let i = 0; i < 12; i++) {
    await aspetta(35);
    const e = await mondo((s) => ({ y: s.eroe.y }));
    const f = await eroe();
    if (f) {
      altezze.push(Math.round((f.y - e.y) * 10) / 10);
      ribaltata ||= f.flip;
    }
  }
  controlla(ribaltata, 'camminando verso sinistra la figura si ribalta');
  controlla(new Set(altezze).size >= 2, `camminando la figura saltella (${[...new Set(altezze)].join(', ')})`);
  await aspetta(600);
  const ferma = await eroe();
  const eroeFermo = await mondo((s) => ({ y: s.eroe.y }));
  controlla(ferma && Math.round(ferma.y - eroeFermo.y) === -2 && ferma.flip, 'ferma: niente saltello, resta girata verso sinistra');

  // ---------------- nemici: figura, lampo, tinta ----------------
  await mondo((s) => s.vaiA('radura'));
  await aspetta(1000);
  const slime = await mondo((s) => {
    const n = s.nemici.vivi()[0];
    return { x: n.forma.x, y: n.forma.y, id: n.definizione.id };
  });
  const figuraSlime = (await figure()).find((f) => f.f === 108 && Math.abs(f.x - slime.x) < 2);
  controlla(slime.id === 'slime' && !!figuraSlime, 'lo slime è la melma verde');
  await mondo((s) => { const n = s.nemici.vivi()[0]; n.subisci(1, { x: 0, y: 0 }, 0, s.time.now); });
  await aspetta(20);
  const lampo = await mondo((s) => s.nemici.vivi()[0].figura.immagine.tintMode);
  await aspetta(150);
  const dopo = await mondo((s) => s.nemici.vivi()[0].figura.immagine.tintMode);
  controlla(lampo === 1 && dopo === 0, `colpito: un lampo bianco (tinta "riempi"), poi torna normale (${lampo} → ${dopo})`);
  await mondo((s) => s.generaNemico('slime_nero'));
  await aspetta(100);
  const nero = (await figure()).find((f) => f.f === 108 && f.tinta === 0x6060a0);
  controlla(!!nero, 'lo slime nero è la stessa melma con una tinta scura (dai dati)');
  await schermata('03-radura', { ferma: true });

  // ---------------- forzieri e muri segreti ----------------
  await mondo((s) => s.vaiA('bosco'));
  await aspetta(1000);
  const muro = await mondo((s) => {
    const m = s.muri[0];
    return { frame: m.immagine?.frame.name, chiave: m.immagine?.texture.key };
  });
  controlla(muro.chiave === 'tessere-bosco' && muro.frame === 'muro:M', 'il muro segreto usa la stessa pixel art dei muri della mappa');
  const forziere = () => mondo((s) => { const f = s.forzieri[0]; return { frame: f.immagine.frame.name, tinta: f.immagine.tintTopLeft }; });
  const chiuso = await forziere();
  await mondo((s) => s.forzieri[0].apri());
  const aperto = await forziere();
  controlla(chiuso.frame === 90 && aperto.frame === 90 && aperto.tinta === 0x707070, 'il forziere aperto è lo stesso forziere, spento');

  // ---------------- ritratto nel dialogo ----------------
  await mondo((s) => s.vaiA('borgo'));
  await aspetta(1000);
  await mondo((s) => { s.scene.launch('Dialogo', { idAbitante: 'gemma' }); s.scene.pause(); });
  await aspetta(400);
  const ritratto = await nelGioco(() => {
    const i = window.gioco.scene.getScene('Dialogo').children.list.find((o) => o.type === 'Image' && o.texture.key === 'dungeon');
    return i ? { scaleX: i.scaleX, frame: i.frame.name } : null;
  });
  controlla(ritratto && ritratto.scaleX === 5 && ritratto.frame === 99, 'nel dialogo il ritratto è la figura della persona, 5 volte più grande');
  await schermata('04-dialogo');
  await pagina.keyboard.press('Escape');
  await aspetta(300);

  // ---------------- tutte le zone ----------------
  for (const [i, m] of MAPPE.entries()) {
    await mondo((s, m) => s.vaiA(m), m);
    await aspetta(1100);
    await schermata(`${String(i + 5).padStart(2, '0')}-${m}`);
  }

  // Il Re Scheletro da vicino: i boss sono figure più grandi, con la loro tinta.
  await mondo((s) => s.vaiA('cripta_tomba'));
  await aspetta(1100);
  const re = await mondo((s) => {
    const r = s.nemici.vivi().find((n) => n.definizione.fasi);
    s.eroe.forma.body.reset(r.forma.x - 40, r.forma.y + 8);
    return { scala: r.figura.immagine.scaleX, tinta: r.figura.immagine.tintTopLeft };
  });
  controlla(re.scala > 1.5 && re.tinta === 0xf0e0a0, `il Re Scheletro è più grande (×${re.scala.toFixed(2)}) e dorato`);
  await aspetta(250);
  await schermata('17-re-scheletro', { ferma: true });

  controlla(g.errori.length === 0, `nessun errore nella console ${g.errori.length ? JSON.stringify(g.errori) : ''}`);
  controlla(g.richiesteEsterne.length === 0, 'nessuna richiesta a internet');
  process.exitCode = (await g.chiudi()) > 0 ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

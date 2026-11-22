// Prova nel browser della consegna 10b: compagni di viaggio (Tessa e Brina, Grisk,
// Selva), commenti contestuali per mappa, quinto slot Amuleto nella Scheda e i
// 3 banchi di crafting (fucina, armature, alchimia).
//
// Uso: node tests/browser/fase-10b.cjs <gioco.html> <cartella schermate>

const { apriGioco, BARRA } = require('./aiuti.cjs');

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
  const svuota = () =>
    g.mondo((s) => {
      for (const n of s.nemici.vivi()) if (!n.definizione.fasi) n.subisci(999, { x: 0, y: 0 }, 0, s.time.now);
    });
  const vai = async (m) => {
    await g.mondo((s, m) => s.vaiA(m), m);
    await aspetta(1000);
    await svuota();
  };
  const aspettaChe = async (cond, max = 60) => {
    for (let i = 0; i < max && !(await cond()); i++) await aspetta(100);
  };

  await g.creaPersonaggio(0, [0, 2], 'borgo'); // Guerriero
  await g.mondo((s) => s.impostaInvulnerabile(true));

  // ---------------- 1. Quinto slot Amuleto nella Scheda ----------------
  await g.mondo((s) => {
    s.daiOggetto('amuleto_quercia');
    s.daiOggetto('ciondolo_lia');
    s.daiOggetto('stivali_vento');
    s.apriScheda();
  });
  await aspettaChe(() => attiva('Scheda'), 30);
  await nelGioco(() => window.gioco.scene.getScene('Scheda').mostra('equipaggiamento'));
  await aspetta(200);
  await nelGioco(() => window.gioco.scene.getScene('Scheda').scegliSpazio('amuleto'));
  await aspetta(200);
  await schermata('01-scheda-amuleto', { ferma: true });

  // Indossiamo Ciondolo di Lia (amuleto esotico) e verifichiamo il limite di 1 pezzo esotico con Stivali del vento
  const msgLia = await g.mondo((s) => {
    const idx = s.partita.inventario.spazi.findIndex((p) => p && p.id === 'ciondolo_lia');
    return s.indossaDaZaino(idx);
  });
  controlla(/Indossi: Ciondolo di Lia/.test(msgLia) && (await partita()).equipaggiamento.amuleto === 'ciondolo_lia', `amuleto esotico indossato: "${msgLia}"`);
  const msgStivali = await g.mondo((s) => {
    const idx = s.partita.inventario.spazi.findIndex((p) => p && p.id === 'stivali_vento');
    return s.indossaDaZaino(idx);
  });
  controlla(/un solo pezzo d’armatura esotico/.test(msgStivali), `limite esotiche condiviso con amuleto: "${msgStivali}"`);
  await pagina.keyboard.press('Escape');
  await aspetta(300);

  // Effetto salvavita del Ciondolo di Lia: scendendo sotto il 25% di vita cura del 50%
  await g.mondo((s) => {
    s.eroe.impostaRisorse({ attuale: 3, massima: 20 }, s.eroe.mana);
  });
  await aspetta(200);
  const vitaDopoLia = await g.mondo((s) => s.eroe.vita.attuale);
  controlla(vitaDopoLia === 13 && /Ciondolo di Lia/.test(await avviso()), `Ciondolo di Lia (salvavita): 3/20 → ${vitaDopoLia}/20`);

  // ---------------- 2. Compagni di viaggio e abilità (Tessa e Brina, Grisk, Selva) ----------------
  const msgUnisci = await g.mondo((s) => s.azioneQuest({ unisci: 'tessa' }));
  controlla(/Tessa e Brina si unisce/.test(msgUnisci ?? ''), `azione dialogo unisci: "${msgUnisci}"`);
  const haBrina = await g.mondo((s) => Boolean(s.compagno && s.compagno.definizione.id === 'tessa' && s.compagno.brina));
  controlla(haBrina, 'Tessa è nel mondo con il cane Brina accanto a lei');

  // Entrando nel bosco con Tessa compare il suo commento contestuale una sola volta
  await vai('bosco');
  await aspetta(600);
  let p = await partita();
  controlla(p.commentiVisti.includes('tessa:bosco') && /mio padre tagliava la legna/.test(await avviso()), `commento di Tessa nel bosco: "${await avviso()}"`);

  // Abilità Fiuta! di Tessa e Brina: fa brillare il muro segreto del bosco entro 12 tessere
  await metti(centro(18, 6));
  await aspetta(200);
  await clic(...BARRA.compagno);
  await aspetta(200);
  const muroBrilla = await g.mondo((s) => s.muri[0].luccichio.visible);
  controlla(muroBrilla && /Brina fiuta/.test(await avviso()), 'Fiuta! di Brina: rivela il muro segreto fino a 12 tessere');
  await schermata('02-tessa-e-brina', { ferma: true });

  // Grisk e Polvere nera
  await g.mondo((s) => {
    s.azioneQuest({ unisci: 'grisk' });
    s.registry.set('abilitaCompagno', { prontaDa: 0 });
  });
  const idSlime = await g.mondo((s) => {
    const n = s.nemici.aggiungi({ ...s.dati.nemici.slime, vita: 20 }, { x: s.eroe.x + 18, y: s.eroe.y });
    n.pausaFino = 1e12;
    return n.id;
  });
  await pagina.keyboard.press('q');
  await aspetta(250);
  const vitaSlime = await g.mondo((s, id) => s.nemici.lista.find((x) => x.id === id).vitaAttuale.attuale, idSlime);
  controlla(vitaSlime === 8, `Polvere nera di Grisk: bomba ad area (20 → ${vitaSlime} vita)`);
  await svuota();

  // Selva e Velo d'ombra
  await g.mondo((s) => {
    s.azioneQuest({ unisci: 'selva' });
    s.registry.set('abilitaCompagno', { prontaDa: 0 });
  });
  await pagina.keyboard.press('q');
  await aspetta(200);
  controlla(await g.mondo((s) => s.eroe.invisibile(s.time.now)), 'Velo d’ombra di Selva: eroe invisibile per 6 secondi');

  // ---------------- 3. I tre banchi di crafting ----------------
  await g.mondo((s) => {
    const p = s.registry.get('partita');
    s.registry.set('partita', { ...p, bossSconfitti: ['re_scheletro', 'troll_caverne', 'negromante'] });
    s.apri('armature');
  });
  await aspettaChe(() => attiva('Fucina'), 30);
  const ricetteUgo = await nelGioco(() => window.gioco.scene.getScene('Fucina').conosciute.map((r) => r.id));
  controlla(ricetteUgo.includes('sigillo_eco_troll_caverne') && !ricetteUgo.includes('spada_lunga'), `banco armature di Ugo: ${ricetteUgo.join(', ')}`);
  await schermata('03-banco-armature-ugo', { ferma: true });

  controlla(g.errori.length === 0, `nessun errore ${g.errori.length ? JSON.stringify(g.errori) : ''}`);
  controlla(g.richiesteEsterne.length === 0, 'nessuna richiesta a internet');
  process.exitCode = (await g.chiudi()) > 0 ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

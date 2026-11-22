// Prova nel browser per la consegna 12c: clan Pietrarossa, negozio di Krak, Pietra lunare e secondarie Colline.
const { avviaGioco, chiudi } = require('./comune.cjs');

(async () => {
  const { page } = await avviaGioco();
  try {
    const esito = await page.evaluate(() => {
      const mondo = window.__gioco?.scene?.getScene('ScenaMondo');
      if (!mondo) return { ok: false, motivo: 'ScenaMondo non attiva' };
      return {
        ok: true,
        krak: Boolean(mondo.dati?.abitanti?.krak),
        negozioKrak: Boolean(mondo.dati?.negozi?.krak),
        pietraLunare: Boolean(mondo.dati?.oggetti?.pietra_lunare),
        pugnaliPietrarossa: Boolean(mondo.dati?.armi?.pugnali_pietrarossa),
        questClan: Boolean(mondo.dati?.quest?.grisk_clan),
      };
    });
    if (!esito.ok || !esito.krak || !esito.negozioKrak || !esito.pietraLunare || !esito.pugnaliPietrarossa || !esito.questClan) {
      throw new Error('Verifica 12c fallita: ' + JSON.stringify(esito));
    }
    console.log('fase-12c: OK', esito);
  } finally {
    await chiudi();
  }
})();

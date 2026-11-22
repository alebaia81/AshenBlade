// Prova nel browser per la consegna 11a: Strada Maestra, Teodoro, Fausto e cancello del borgo.
const { avviaGioco, chiudi } = require('./comune.cjs');

(async () => {
  const { page } = await avviaGioco();
  try {
    const esito = await page.evaluate(() => {
      const mondo = window.__gioco?.scene?.getScene('ScenaMondo');
      if (!mondo) return { ok: false, motivo: 'ScenaMondo non attiva' };
      return {
        ok: true,
        mappa: mondo.mappa?.id,
        questPrologo: mondo.partita?.quest?.prologo_strada?.stato,
        negozioTeodoro: Boolean(mondo.dati?.negozi?.teodoro),
      };
    });
    if (!esito.ok || esito.mappa !== 'strada_maestra' || esito.questPrologo !== 'attiva' || !esito.negozioTeodoro) {
      throw new Error('Verifica 11a fallita: ' + JSON.stringify(esito));
    }
    console.log('fase-11a: OK', esito);
  } finally {
    await chiudi();
  }
})();

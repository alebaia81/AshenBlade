// Prova nel browser per la consegna 14c: premi 12 Ghiande d'oro e commissioni bacheca di Tobia.
const { avviaGioco, chiudi } = require('./comune.cjs');

(async () => {
  const { page } = await avviaGioco();
  try {
    const esito = await page.evaluate(() => {
      const mondo = window.__gioco?.scene?.getScene('ScenaMondo');
      if (!mondo) return { ok: false, motivo: 'ScenaMondo non attiva' };
      return {
        ok: true,
        ghiande3: Boolean(mondo.dati?.quest?.ghiande_3),
        ghiande12: Boolean(mondo.dati?.quest?.ghiande_12),
        commSpada: Boolean(mondo.dati?.quest?.commissione_spada),
        commCorazza: Boolean(mondo.dati?.quest?.commissione_corazza),
        commPozioni: Boolean(mondo.dati?.quest?.commissione_pozioni),
      };
    });
    if (!esito.ok || !esito.ghiande3 || !esito.ghiande12 || !esito.commSpada || !esito.commCorazza || !esito.commPozioni) {
      throw new Error('Verifica 14c fallita: ' + JSON.stringify(esito));
    }
    console.log('fase-14c: OK', esito);
  } finally {
    await chiudi();
  }
})();

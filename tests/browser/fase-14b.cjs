// Prova nel browser per la consegna 14b: Le Radici (due piani) e La Radice Marcia.
const { avviaGioco, chiudi } = require('./comune.cjs');

(async () => {
  const { page } = await avviaGioco();
  try {
    const esito = await page.evaluate(() => {
      const mondo = window.__gioco?.scene?.getScene('ScenaMondo');
      if (!mondo) return { ok: false, motivo: 'ScenaMondo non attiva' };
      return {
        ok: true,
        radiciAlte: Boolean(mondo.dati?.mappe?.radici_alte),
        radiciCuore: Boolean(mondo.dati?.mappe?.radici_cuore),
        radiceMarcia: Boolean(mondo.dati?.nemici?.radice_marcia),
        questRadici: Boolean(mondo.dati?.quest?.radici_quercia),
      };
    });
    if (!esito.ok || !esito.radiciAlte || !esito.radiciCuore || !esito.radiceMarcia || !esito.questRadici) {
      throw new Error('Verifica 14b fallita: ' + JSON.stringify(esito));
    }
    console.log('fase-14b: OK', esito);
  } finally {
    await chiudi();
  }
})();

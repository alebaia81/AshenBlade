// Prova nel browser per la consegna 13a: Guado delle Lanterne, Palude delle Lanterne, Mamma Orsola e Fuoco fatuo.
const { avviaGioco, chiudi } = require('./comune.cjs');

(async () => {
  const { page } = await avviaGioco();
  try {
    const esito = await page.evaluate(() => {
      const mondo = window.__gioco?.scene?.getScene('ScenaMondo');
      if (!mondo) return { ok: false, motivo: 'ScenaMondo non attiva' };
      return {
        ok: true,
        guado: Boolean(mondo.dati?.mappe?.guado),
        palude: Boolean(mondo.dati?.mappe?.palude_lanterne),
        orsola: Boolean(mondo.dati?.abitanti?.orsola),
        fuocoFatuo: Boolean(mondo.dati?.nemici?.fuoco_fatuo),
        questTraghetto: Boolean(mondo.dati?.quest?.traghetto_orsola),
      };
    });
    if (!esito.ok || !esito.guado || !esito.palude || !esito.orsola || !esito.fuocoFatuo || !esito.questTraghetto) {
      throw new Error('Verifica 13a fallita: ' + JSON.stringify(esito));
    }
    console.log('fase-13a: OK', esito);
  } finally {
    await chiudi();
  }
})();

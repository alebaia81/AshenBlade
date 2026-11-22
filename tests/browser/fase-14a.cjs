// Prova nel browser per la consegna 14a: Pozzo Profondo e sfide degli Echi regionali.
const { avviaGioco, chiudi } = require('./comune.cjs');

(async () => {
  const { page } = await avviaGioco();
  try {
    const esito = await page.evaluate(() => {
      const mondo = window.__gioco?.scene?.getScene('ScenaMondo');
      if (!mondo) return { ok: false, motivo: 'ScenaMondo non attiva' };
      return {
        ok: true,
        pozzoProfondo: Boolean(mondo.dati?.mappe?.miniera_profonda),
        ecoValle: Boolean(mondo.dati?.quest?.eco_valle),
        ecoColline: Boolean(mondo.dati?.quest?.eco_colline),
        ecoBrughiera: Boolean(mondo.dati?.quest?.eco_brughiera),
      };
    });
    if (!esito.ok || !esito.pozzoProfondo || !esito.ecoValle || !esito.ecoColline || !esito.ecoBrughiera) {
      throw new Error('Verifica 14a fallita: ' + JSON.stringify(esito));
    }
    console.log('fase-14a: OK', esito);
  } finally {
    await chiudi();
  }
})();

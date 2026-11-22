// Prova nel browser per la consegna 12a: Passo del Corvo, Cave di Zolfo, Ferrante e Matteo.
const { avviaGioco, chiudi } = require('./comune.cjs');

(async () => {
  const { page } = await avviaGioco();
  try {
    const esito = await page.evaluate(() => {
      const mondo = window.__gioco?.scene?.getScene('ScenaMondo');
      if (!mondo) return { ok: false, motivo: 'ScenaMondo non attiva' };
      const ferrante = mondo.dati?.nemici?.ferrante;
      return {
        ok: true,
        passoCorvo: Boolean(mondo.dati?.mappe?.passo_corvo),
        caveZolfo: Boolean(mondo.dati?.mappe?.cave_zolfo),
        matteo: Boolean(mondo.dati?.abitanti?.matteo),
        ferranteEsotico: ferrante?.esoticoFirma,
        questMatteo: Boolean(mondo.dati?.quest?.ritorno_matteo),
      };
    });
    if (!esito.ok || !esito.passoCorvo || !esito.caveZolfo || !esito.matteo || esito.ferranteEsotico !== 'balestra_zolfo' || !esito.questMatteo) {
      throw new Error('Verifica 12a fallita: ' + JSON.stringify(esito));
    }
    console.log('fase-12a: OK', esito);
  } finally {
    await chiudi();
  }
})();

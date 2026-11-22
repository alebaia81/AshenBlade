// Prova nel browser per la consegna 13b: Casa sul Colle (ricordi), Osservatorio di Orvald e Selva.
const { avviaGioco, chiudi } = require('./comune.cjs');

(async () => {
  const { page } = await avviaGioco();
  try {
    const esito = await page.evaluate(() => {
      const mondo = window.__gioco?.scene?.getScene('ScenaMondo');
      if (!mondo) return { ok: false, motivo: 'ScenaMondo non attiva' };
      return {
        ok: true,
        casaColle: Boolean(mondo.dati?.mappe?.casa_colle),
        osservatorio: Boolean(mondo.dati?.mappe?.osservatorio),
        selvaAbitante: Boolean(mondo.dati?.abitanti?.selva),
        selvaBoss: Boolean(mondo.dati?.nemici?.selva_boss),
        illusione: Boolean(mondo.dati?.nemici?.illusione),
        questSelva: Boolean(mondo.dati?.quest?.selva_liberata),
      };
    });
    if (!esito.ok || !esito.casaColle || !esito.osservatorio || !esito.selvaAbitante || !esito.selvaBoss || !esito.illusione || !esito.questSelva) {
      throw new Error('Verifica 13b fallita: ' + JSON.stringify(esito));
    }
    console.log('fase-13b: OK', esito);
  } finally {
    await chiudi();
  }
})();

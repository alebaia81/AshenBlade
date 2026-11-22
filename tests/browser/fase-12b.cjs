// Prova nel browser per la consegna 12b: Pietrafonda, banco armature di Ugo e Grisk.
const { avviaGioco, chiudi } = require('./comune.cjs');

(async () => {
  const { page } = await avviaGioco();
  try {
    const esito = await page.evaluate(() => {
      const mondo = window.__gioco?.scene?.getScene('ScenaMondo');
      if (!mondo) return { ok: false, motivo: 'ScenaMondo non attiva' };
      return {
        ok: true,
        pietrafonda: Boolean(mondo.dati?.mappe?.pietrafonda),
        grisk: Boolean(mondo.dati?.abitanti?.grisk),
        questPietrafonda: Boolean(mondo.dati?.quest?.atto2_pietrafonda),
        questGrisk: Boolean(mondo.dati?.quest?.grisk_liberato),
        corazzaArgento: mondo.dati?.ricette?.corazza_argento?.banco,
      };
    });
    if (!esito.ok || !esito.pietrafonda || !esito.grisk || !esito.questPietrafonda || !esito.questGrisk || esito.corazzaArgento !== 'armature') {
      throw new Error('Verifica 12b fallita: ' + JSON.stringify(esito));
    }
    console.log('fase-12b: OK', esito);
  } finally {
    await chiudi();
  }
})();

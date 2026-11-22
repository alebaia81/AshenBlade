// Prova nel browser per la consegna 11c: Tessa e Brina, Radura nascosta, secondarie e Ghiande d'oro.
const { avviaGioco, chiudi } = require('./comune.cjs');

(async () => {
  const { page } = await avviaGioco();
  try {
    const esito = await page.evaluate(() => {
      const mondo = window.__gioco?.scene?.getScene('ScenaMondo');
      if (!mondo) return { ok: false, motivo: 'ScenaMondo non attiva' };
      return {
        ok: true,
        raduraNascosta: Boolean(mondo.dati?.mappe?.radura_nascosta),
        tessa: Boolean(mondo.dati?.abitanti?.tessa),
        questTracce: Boolean(mondo.dati?.quest?.tessa_tracce),
        questAscia: Boolean(mondo.dati?.quest?.tessa_ascia),
        arcoAldo: Boolean(mondo.dati?.armi?.arco_aldo),
      };
    });
    if (!esito.ok || !esito.raduraNascosta || !esito.tessa || !esito.questTracce || !esito.questAscia || !esito.arcoAldo) {
      throw new Error('Verifica 11c fallita: ' + JSON.stringify(esito));
    }
    console.log('fase-11c: OK', esito);
  } finally {
    await chiudi();
  }
})();

// Prova nel browser per la consegna 11b: Mulino del Ponte, Cantine del Mulino, Re Melma e Ottone.
const { avviaGioco, chiudi } = require('./comune.cjs');

(async () => {
  const { page } = await avviaGioco();
  try {
    const esito = await page.evaluate(() => {
      const mondo = window.__gioco?.scene?.getScene('ScenaMondo');
      if (!mondo) return { ok: false, motivo: 'ScenaMondo non attiva' };
      const reMelma = mondo.dati?.nemici?.re_melma;
      return {
        ok: true,
        mulino: Boolean(mondo.dati?.mappe?.mulino_ponte),
        cantine: Boolean(mondo.dati?.mappe?.cantine_mulino),
        ottone: Boolean(mondo.dati?.abitanti?.ottone),
        reMelmaEsotico: reMelma?.esoticoFirma,
        questBecchino: Boolean(mondo.dati?.quest?.atto1_becchino),
      };
    });
    if (!esito.ok || !esito.mulino || !esito.cantine || !esito.ottone || esito.reMelmaEsotico !== 'bastone_melma' || !esito.questBecchino) {
      throw new Error('Verifica 11b fallita: ' + JSON.stringify(esito));
    }
    console.log('fase-11b: OK', esito);
  } finally {
    await chiudi();
  }
})();

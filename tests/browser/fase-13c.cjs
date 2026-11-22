// Prova nel browser per la consegna 13c: confronto con Berta, Quaderno di Lia, Alchimia e Finale esteso.
const { avviaGioco, chiudi } = require('./comune.cjs');

(async () => {
  const { page } = await avviaGioco();
  try {
    const esito = await page.evaluate(() => {
      const mondo = window.__gioco?.scene?.getScene('ScenaMondo');
      if (!mondo) return { ok: false, motivo: 'ScenaMondo non attiva' };
      return {
        ok: true,
        confrontoBerta: Boolean(mondo.dati?.quest?.confronto_berta),
        selvaQuaderno: Boolean(mondo.dati?.quest?.selva_quaderno),
        ultimeLettere: Boolean(mondo.dati?.quest?.ultime_lettere),
        erbePalude: Boolean(mondo.dati?.quest?.erbe_palude),
        tesoroLuna: Boolean(mondo.dati?.quest?.tesoro_luna),
        alchimiaVita: Boolean(mondo.dati?.ricette?.alchimia_pozione_vita),
      };
    });
    if (!esito.ok || !esito.confrontoBerta || !esito.selvaQuaderno || !esito.ultimeLettere || !esito.erbePalude || !esito.tesoroLuna || !esito.alchimiaVita) {
      throw new Error('Verifica 13c fallita: ' + JSON.stringify(esito));
    }
    console.log('fase-13c: OK', esito);
  } finally {
    await chiudi();
  }
})();

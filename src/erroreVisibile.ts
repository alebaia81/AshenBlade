// Il gioco non deve bloccarsi in silenzio (design §14): ogni errore non gestito
// compare in un riquadro rosso leggibile e finisce anche nella console del browser.

export function mostraErrore(errore: unknown): void {
  console.error(errore);
  const riquadro = document.getElementById('errore');
  if (!riquadro) return;
  const messaggio = errore instanceof Error ? errore.message : String(errore);
  riquadro.textContent =
    'Si è verificato un errore e il gioco si è fermato.\n\n' +
    messaggio +
    '\n\n(Dettagli nella console del browser: F12 → Console)';
  riquadro.style.display = 'block';
  document.getElementById('avvio')?.remove();
}

/**
 * Intercetta gli errori che nessuno ha gestito, anche quelli che avvengono
 * dentro il ciclo di gioco di Phaser (che gira fuori dal nostro try/catch).
 */
export function installaGestoreErrori(): void {
  window.addEventListener('error', (evento) => mostraErrore(evento.error ?? evento.message));
  window.addEventListener('unhandledrejection', (evento) => mostraErrore(evento.reason));
}

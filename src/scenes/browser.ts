// Le parti del browser che il salvataggio usa: localStorage e file.
// Stanno qui, fuori da systems/, perché toccano window e document; le regole
// (cosa si salva, come si controlla) restano in systems/salvataggio.ts.

import type { Archivio } from '../systems/salvataggio';

let archivio: Archivio | null = null;
/** Vero se il browser non ci lascia usare il localStorage: si salva solo finché la pagina resta aperta. */
export let soloInMemoria = false;

/**
 * Il localStorage del browser. Alcuni browser lo vietano (per esempio certe
 * modalità private): in quel caso si usa una Map, così il gioco funziona lo
 * stesso e il menu può avvisare che i salvataggi spariranno chiudendo la pagina.
 */
export function archivioDelBrowser(): Archivio {
  if (archivio) return archivio;
  try {
    const prova = '__quercia_prova__';
    window.localStorage.setItem(prova, '1');
    window.localStorage.removeItem(prova);
    archivio = window.localStorage;
  } catch {
    soloInMemoria = true;
    const dati = new Map<string, string>();
    archivio = { getItem: (k) => dati.get(k) ?? null, setItem: (k, v) => void dati.set(k, v), removeItem: (k) => void dati.delete(k) };
  }
  return archivio;
}

/**
 * Fa scaricare un file di testo, come il pulsante "Esporta" di un'app web:
 * un Blob (il contenuto), un URL temporaneo e un <a download> cliccato dal codice.
 */
export function scaricaFile(nome: string, testo: string): void {
  const url = URL.createObjectURL(new Blob([testo], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = nome;
  link.click();
  // Lo togliamo poco dopo: il download è già partito.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Apre la finestra "scegli un file" del sistema e restituisce il testo del file.
 * È un <input type="file"> invisibile, creato al volo: Phaser disegna su un
 * canvas e non ha campi di questo tipo.
 */
export function scegliFile(alCaricamento: (testo: string) => void): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.style.display = 'none';
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    input.remove();
    if (file) void file.text().then(alCaricamento);
  });
  // Alcuni browser aprono la finestra solo se il campo fa parte della pagina.
  document.body.appendChild(input);
  input.click();
}

/** Interfaccia per l'evento nativo beforeinstallprompt dei browser Chromium. */
export interface EventoBeforeInstallPrompt extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

/** Controlla se il prompt nativo di installazione PWA è disponibile. */
export function promptInstallazioneDisponibile(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as unknown as { eventoInstallazionePwa?: EventoBeforeInstallPrompt }).eventoInstallazionePwa;
}

/** Mostra il prompt nativo di installazione dell'applicazione. */
export async function avviaInstallazionePwa(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as { eventoInstallazionePwa?: EventoBeforeInstallPrompt };
  if (!w.eventoInstallazionePwa) return false;
  try {
    await w.eventoInstallazionePwa.prompt();
    const scelta = await w.eventoInstallazionePwa.userChoice;
    if (scelta.outcome === 'accepted') {
      w.eventoInstallazionePwa = undefined;
      return true;
    }
  } catch {
    // Ignora errori o chiusura del dialogo
  }
  return false;
}

/** Verifica se il dispositivo attuale è iOS (iPhone/iPad/iPod). */
export function eDispositivoIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/** Verifica se l'app è già avviata in modalità standalone / schermo intero (PWA installata). */
export function inModalitaStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    !!(navigator as unknown as { standalone?: boolean }).standalone
  );
}

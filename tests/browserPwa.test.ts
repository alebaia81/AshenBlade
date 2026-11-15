import { describe, expect, it } from 'vitest';
import { avviaInstallazionePwa, eDispositivoIos, inModalitaStandalone, promptInstallazioneDisponibile } from '../src/scenes/browser';

describe('PWA Install Helpers', () => {
  it('promptInstallazioneDisponibile restituisce false se eventoInstallazionePwa non è presente', () => {
    (globalThis as any).window = {};
    expect(promptInstallazioneDisponibile()).toBe(false);
  });

  it('promptInstallazioneDisponibile restituisce true se eventoInstallazionePwa è presente', () => {
    (globalThis as any).window = {
      eventoInstallazionePwa: {
        prompt: async () => {},
        userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
      },
    };
    expect(promptInstallazioneDisponibile()).toBe(true);
  });

  it('avviaInstallazionePwa esegue il prompt e resetta l evento quando accettato', async () => {
    let prompted = false;
    (globalThis as any).window = {
      eventoInstallazionePwa: {
        prompt: async () => {
          prompted = true;
        },
        userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
      },
    };

    const result = await avviaInstallazionePwa();
    expect(prompted).toBe(true);
    expect(result).toBe(true);
    expect((globalThis as any).window.eventoInstallazionePwa).toBeUndefined();
  });

  it('avviaInstallazionePwa restituisce false se l utente rifiuta', async () => {
    let prompted = false;
    (globalThis as any).window = {
      eventoInstallazionePwa: {
        prompt: async () => {
          prompted = true;
        },
        userChoice: Promise.resolve({ outcome: 'dismissed', platform: 'web' }),
      },
    };

    const result = await avviaInstallazionePwa();
    expect(prompted).toBe(true);
    expect(result).toBe(false);
  });

  it('eDispositivoIos identifica correttamente iPhone e iPad', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)', platform: 'iPhone' },
      configurable: true,
    });
    expect(eDispositivoIos()).toBe(true);

    Object.defineProperty(globalThis, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 (Linux; Android 13)', platform: 'Linux' },
      configurable: true,
    });
    expect(eDispositivoIos()).toBe(false);
  });

  it('inModalitaStandalone verifica display-mode e navigator.standalone', () => {
    (globalThis as any).window = {
      matchMedia: (query: string) => ({ matches: query.includes('standalone') }),
    };
    Object.defineProperty(globalThis, 'navigator', {
      value: { standalone: false },
      configurable: true,
    });
    expect(inModalitaStandalone()).toBe(true);

    (globalThis as any).window = {
      matchMedia: () => ({ matches: false }),
    };
    Object.defineProperty(globalThis, 'navigator', {
      value: { standalone: false },
      configurable: true,
    });
    expect(inModalitaStandalone()).toBe(false);
  });
});

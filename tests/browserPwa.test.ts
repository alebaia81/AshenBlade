import { describe, expect, it } from 'vitest';
import { avviaInstallazionePwa, promptInstallazioneDisponibile } from '../src/scenes/browser';

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
});

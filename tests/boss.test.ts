import { describe, expect, it } from 'vitest';
import { attacchiPronti, faseDi, quantiEvocare, validaBoss, type FaseBoss } from '../src/systems/boss';

const fasi: FaseBoss[] = [
  { sottoVita: 1, attacchi: [] },
  { sottoVita: 0.5, avviso: 'Il re chiama i suoi servi!', attacchi: [{ tipo: 'evoca', nemico: 'scheletro', quanti: 3, massimo: 4, ricaricaMs: 8000 }] },
];

describe('fasi del boss', () => {
  it('sopra metà vita è in fase 0, da metà in giù in fase 1', () => {
    expect(faseDi(fasi, 100, 100)).toBe(0);
    expect(faseDi(fasi, 51, 100)).toBe(0);
    expect(faseDi(fasi, 50, 100)).toBe(1);
    expect(faseDi(fasi, 1, 100)).toBe(1);
  });

  it('usa solo gli attacchi della sua fase, quando la ricarica è finita', () => {
    expect(attacchiPronti(fasi[0]!, {}, 0)).toEqual([]);
    expect(attacchiPronti(fasi[1]!, {}, 0)).toEqual([0]);
    expect(attacchiPronti(fasi[1]!, { 0: 1000 }, 5000)).toEqual([]);
    expect(attacchiPronti(fasi[1]!, { 0: 1000 }, 9000)).toEqual([0]);
  });

  it('evoca fino al massimo di servitori vivi', () => {
    const evoca = fasi[1]!.attacchi[0]! as Extract<FaseBoss['attacchi'][number], { tipo: 'evoca' }>;
    expect(quantiEvocare(evoca, 0)).toBe(3);
    expect(quantiEvocare(evoca, 2)).toBe(2);
    expect(quantiEvocare(evoca, 4)).toBe(0);
  });

  it('supporta l’attacco dividi del Re Melma (fase 11b)', () => {
    const fasiMelma: FaseBoss[] = [
      { sottoVita: 1, attacchi: [] },
      { sottoVita: 0.5, attacchi: [{ tipo: 'dividi', nemico: 'melma_piccola', quanti: 2, massimo: 4, ricaricaMs: 6500, probabilita: 0.5 }] },
    ];
    expect(validaBoss('re_melma', fasiMelma, ['melma_piccola'])).toEqual([]);
    expect(validaBoss('re_melma', fasiMelma, []).join('\n')).toContain('melma_piccola');
  });

  it('supporta l’attacco bomba di Ferrante e ne scala il danno in versione Eco (fase 12a)', async () => {
    const { creaDefinizioneEco } = await import('../src/systems/boss');
    const fasiFerrante: FaseBoss[] = [
      { sottoVita: 1, attacchi: [{ tipo: 'bomba', ricaricaMs: 6000, quanti: 2, preavvisoMs: 1000, raggio: 14, danno: '1d6' }] },
    ];
    expect(validaBoss('ferrante', fasiFerrante, [])).toEqual([]);
    const eco = creaDefinizioneEco({
      id: 'ferrante',
      nome: 'Ferrante',
      comportamento: 'inseguitore',
      vita: 165,
      armatura: 2,
      danno: '1d10',
      velocita: 38,
      raggioVista: 96,
      raggioAbbandono: 600,
      dimensione: 18,
      colore: '#c87030',
      storditoMs: 50,
      pausaDopoAttaccoMs: 950,
      esperienza: 280,
      etichette: [],
      bottino: [],
      monete: [80, 120],
      fasi: fasiFerrante,
    });
    const attaccoEco = eco.fasi![0]!.attacchi[0]!;
    expect(attaccoEco.tipo === 'bomba' && attaccoEco.danno).toBe('1d8');
  });
});

describe('validazione', () => {
  it('fasi in ordine, la prima da vita piena, attacchi noti, nemici evocati esistenti', () => {
    expect(validaBoss('re', fasi, ['scheletro'])).toEqual([]);
    const rotte: FaseBoss[] = [
      { sottoVita: 0.5, attacchi: [] },
      { sottoVita: 0.8, attacchi: [{ tipo: 'evoca', nemico: 'drago', quanti: 1, massimo: 1, ricaricaMs: 1 }] },
    ];
    const errori = validaBoss('re', rotte, ['scheletro']).join('\n');
    expect(errori).toContain('vita piena');
    expect(errori).toContain('ordine');
    expect(errori).toContain('drago');
  });
});

describe('crollo dei massi (fase 8b)', () => {
  it('il primo masso cade sull’eroe, gli altri intorno e solo dove si cammina', async () => {
    const { puntiCrollo } = await import('../src/systems/boss');
    let i = 0;
    const sequenza = [0, 0.5, 0.25, 0.5, 0.5, 0.5, 0.75, 0.5];
    const casuale = () => sequenza[i++ % sequenza.length]!;
    const punti = puntiCrollo({ x: 100, y: 100 }, 4, casuale, (x) => x >= 100); // a sinistra c'è un muro
    expect(punti[0]).toEqual({ x: 100, y: 100 });
    expect(punti.length).toBeLessThanOrEqual(4);
    for (const p of punti) {
      expect(p.x).toBeGreaterThanOrEqual(100);
      expect(Math.hypot(p.x - 100, p.y - 100)).toBeLessThanOrEqual(64);
    }
  });

  it('carica e crollo dei massi sono attacchi validi', async () => {
    const { validaBoss } = await import('../src/systems/boss');
    const troll: FaseBoss[] = [
      { sottoVita: 1, attacchi: [{ tipo: 'carica', ricaricaMs: 5000, miraMs: 700, velocita: 220, durataMs: 900, stordimentoMs: 1200 }] },
      { sottoVita: 0.5, attacchi: [{ tipo: 'crollo_massi', ricaricaMs: 7000, quanti: 5, preavvisoMs: 1000, raggio: 12, danno: '1d8' }] },
    ];
    expect(validaBoss('troll', troll, [])).toEqual([]);
  });
});

describe('il Negromante (fase 8c)', () => {
  it('il teletrasporto sceglie un punto nella sua stanza e lontano dall’eroe', async () => {
    const { puntoTeletrasporto } = await import('../src/systems/boss');
    const casa = { x: 100, y: 100 };
    const candidati = [{ x: 100, y: 110 }, { x: 400, y: 100 }, { x: 160, y: 100 }, { x: 40, y: 100 }];
    const eroe = { x: 100, y: 100 };
    // (100,110) è troppo vicino all'eroe, (400,100) è fuori dalla stanza.
    const scelti = [0, 0.5, 0.99].map((c) => puntoTeletrasporto(casa, eroe, candidati, 96, 48, () => c));
    for (const p of scelti) expect([{ x: 160, y: 100 }, { x: 40, y: 100 }]).toContainEqual(p);
    expect(puntoTeletrasporto(casa, eroe, [{ x: 100, y: 110 }], 96, 48, () => 0)).toBeNull();
  });

  it('il ventaglio: colpi distribuiti in modo simmetrico intorno alla direzione', async () => {
    const { ventaglio } = await import('../src/systems/boss');
    const tre = ventaglio({ x: 1, y: 0 }, 3, 60);
    expect(tre[1]!.x).toBeCloseTo(1);
    expect(tre[1]!.y).toBeCloseTo(0);
    expect(tre[0]!.y).toBeCloseTo(-tre[2]!.y);
    expect(Math.atan2(tre[2]!.y, tre[2]!.x)).toBeCloseTo(Math.PI / 6);
    expect(ventaglio({ x: 0, y: 1 }, 1, 60)[0]!.y).toBeCloseTo(1);
  });
});

describe('Eco dei boss (fase 10a)', () => {
  it('scalaDado moltiplica facce e bonus mantenendo un formato di dado valido', async () => {
    const { scalaDado } = await import('../src/systems/boss');
    expect(scalaDado('1d10', 1.3)).toBe('1d13');
    expect(scalaDado('2d6+2', 1.5)).toBe('2d9+3');
  });

  it('creaDefinizioneEco potenzia vita, danno e ricariche degli attacchi speciali e disattiva il finale', async () => {
    const { creaDefinizioneEco } = await import('../src/systems/boss');
    const base = {
      id: 'negromante',
      nome: 'Il Negromante',
      comportamento: 'tiratore',
      vita: 300,
      armatura: 2,
      danno: '1d10',
      velocita: 40,
      raggioVista: 110,
      raggioAbbandono: 700,
      dimensione: 20,
      colore: '#9a6ad0',
      storditoMs: 40,
      pausaDopoAttaccoMs: 800,
      esperienza: 800,
      etichette: [],
      bottino: [],
      monete: [200, 300] as [number, number],
      finale: true,
      fasi: [
        {
          sottoVita: 1,
          attacchi: [
            { tipo: 'teletrasporto' as const, ricaricaMs: 6000, raggio: 112, distanzaMin: 64 },
            { tipo: 'incantesimo' as const, ricaricaMs: 4000, colpi: 3, ventaglioGradi: 40, velocita: 150, gittata: 200, dimensione: 3, colore: '#b46bff', danno: '1d8' },
          ],
        },
      ],
    };
    const eco = creaDefinizioneEco(base);
    expect(eco.èEco).toBe(true);
    expect(eco.finale).toBe(false);
    expect(eco.vita).toBe(480); // 300 * 1.6
    expect(eco.danno).toBe('1d13'); // 1d10 * 1.3
    expect(eco.tintaEco).toBe('#a0e0ff');
    expect(eco.fasi![0]!.attacchi[0]!.ricaricaMs).toBe(4200); // 6000 * 0.7
    const inc = eco.fasi![0]!.attacchi[1]!;
    if (inc.tipo === 'incantesimo') expect(inc.danno).toBe('1d10'); // 1d8 * 1.3
  });
});

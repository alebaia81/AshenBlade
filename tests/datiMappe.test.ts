import { describe, expect, it } from 'vitest';
import { caricaDati } from '../src/data/caricaDati';
import { PEZZI_ARMATURA } from '../src/systems/equipaggiamento';
import { applicaCondizioni } from '../src/systems/condizioniMappa';
import { chiConclude } from '../src/systems/quest';
import { celleAbitante, celleBarriera, celleCartello, cellePorte, celleForziere, celleNemico, celleSegrete, celleVena, èCalpestabile, grigliaDellaMappa, trovaPunto } from '../src/systems/mappa';
import type { Griglia } from '../src/systems/percorso';
import type { Cella } from '../src/systems/tipi';

/** Celle raggiungibili a piedi da un punto (visita in ampiezza, solo 4 direzioni). */
function raggiungibili(g: Griglia, da: Cella): Set<string> {
  const visti = new Set([`${da.col},${da.riga}`]);
  const coda = [da];
  while (coda.length > 0) {
    const c = coda.shift()!;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const n = { col: c.col + dc, riga: c.riga + dr };
      const chiave = `${n.col},${n.riga}`;
      if (!visti.has(chiave) && g.calpestabile(n.col, n.riga)) {
        visti.add(chiave);
        coda.push(n);
      }
    }
  }
  return visti;
}

// Questo test controlla i DATI veri del gioco, non il codice:
// un errore di battitura in una mappa fa fallire i test prima di arrivare nel browser.
describe('dati del gioco', () => {
  const mondo = caricaDati();

  it('ci sono almeno le due mappe della fase 1', () => {
    expect(Object.keys(mondo.mappe)).toEqual(expect.arrayContaining(['radura', 'bosco']));
  });

  it('la partenza è su una cella calpestabile', () => {
    const iniziale = mondo.mappe[mondo.mappaIniziale]!;
    const partenza = trovaPunto(iniziale, '@')!;
    expect(èCalpestabile(iniziale, partenza.col, partenza.riga)).toBe(true);
  });

  it('ogni mappa è chiusa da muri sul bordo, tranne le uscite', () => {
    for (const mappa of Object.values(mondo.mappe)) {
      for (let r = 0; r < mappa.altezza; r++) {
        for (let c = 0; c < mappa.larghezza; c++) {
          const bordo = r === 0 || c === 0 || r === mappa.altezza - 1 || c === mappa.larghezza - 1;
          if (!bordo) continue;
          const tipo = mappa.legenda[mappa.simboli[r]![c]!]!.tipo;
          // Se il bordo fosse aperto l'eroe potrebbe uscire dal mondo.
          expect(['muro', 'uscita'], `${mappa.id} (${c},${r})`).toContain(tipo);
        }
      }
    }
  });

  it('ci sono slime e lupi, e compaiono nelle mappe', () => {
    expect(Object.keys(mondo.nemici)).toEqual(expect.arrayContaining(['slime', 'lupo']));
    const usati = Object.values(mondo.mappe).flatMap((m) => Object.values(m.legenda).map((v) => v.nemico));
    expect(usati).toEqual(expect.arrayContaining(['slime', 'lupo']));
  });

  it('nessun nemico nasce troppo vicino a un punto d’ingresso', () => {
    // Altrimenti l'eroe verrebbe colpito appena entra nella mappa.
    for (const mappa of Object.values(mondo.mappe)) {
      const ingressi = Object.entries(mappa.legenda)
        .filter(([, v]) => v.tipo === 'partenza' || v.tipo === 'arrivo')
        .map(([s]) => trovaPunto(mappa, s)!);
      for (const { cella } of celleNemico(mappa)) {
        for (const ingresso of ingressi) {
          const distanza = Math.hypot(cella.col - ingresso.col, cella.riga - ingresso.riga);
          expect(distanza, `${mappa.id} (${cella.col},${cella.riga})`).toBeGreaterThan(6);
        }
      }
    }
  });

  it('ci sono le 4 classi del design, ognuna con un’arma esistente', () => {
    expect(Object.keys(mondo.classi).sort()).toEqual(['chierico', 'guerriero', 'ladro', 'mago']);
    for (const classe of Object.values(mondo.classi)) expect(mondo.armi[classe.arma]).toBeDefined();
  });

  it('i valori iniziali delle classi sono quelli del design §6', () => {
    expect(mondo.classi['guerriero']!.caratteristiche).toEqual({ FOR: 15, DES: 12, COS: 14, INT: 8, SAG: 10, CAR: 10 });
    expect(mondo.classi['mago']!.caratteristiche).toEqual({ FOR: 8, DES: 12, COS: 12, INT: 15, SAG: 12, CAR: 10 });
    expect(mondo.classi['ladro']!.caratteristiche).toEqual({ FOR: 10, DES: 15, COS: 12, INT: 10, SAG: 10, CAR: 12 });
    expect(mondo.classi['chierico']!.caratteristiche).toEqual({ FOR: 12, DES: 10, COS: 12, INT: 10, SAG: 15, CAR: 10 });
  });

  it('vita base: Guerriero > Chierico > Ladro > Mago (design §6)', () => {
    const v = (id: string) => mondo.classi[id]!.vitaBase;
    expect(v('guerriero')).toBeGreaterThan(v('chierico'));
    expect(v('chierico')).toBeGreaterThan(v('ladro'));
    expect(v('ladro')).toBeGreaterThan(v('mago'));
  });

  it('solo Mago e Chierico usano il mana', () => {
    const conMana = Object.values(mondo.classi).filter((c) => c.manaBase > 0).map((c) => c.id).sort();
    expect(conMana).toEqual(['chierico', 'mago']);
  });

  it('ogni nemico dà esperienza', () => {
    for (const n of Object.values(mondo.nemici)) expect(n.esperienza).toBeGreaterThan(0);
  });

  it('le passive delle classi: Ladro alle spalle, Chierico contro i non morti', () => {
    expect(mondo.classi['ladro']!.passive).toEqual(['alle_spalle']);
    expect(mondo.classi['chierico']!.passive).toEqual(['contro_nonmorti']);
    expect(mondo.classi['guerriero']!.passive).toEqual([]);
  });

  it('il bastone del Mago lancia dardi magici che costano 1 mana', () => {
    expect(mondo.armi['bastone']!.proiettile).toMatchObject({ costoMana: 1 });
    expect(mondo.armi['bastone']!.caratteristica).toBe('INT');
  });

  it('lo scheletro è un non morto (pronto per la Cripta della fase 8)', () => {
    expect(mondo.nemici['scheletro']!.etichette).toContain('nonMorto');
  });

  it('le abilità con il mirino sono quelle che lanciano qualcosa', () => {
    const conMira = Object.values(mondo.classi).filter((c) => c.abilita.mira).map((c) => c.abilita.id);
    expect(conMira).toEqual(['palla_di_fuoco']);
  });

  it('le pozioni del design §8 ci sono, e si impilano', () => {
    for (const id of ['pozione_vita', 'pozione_mana', 'pozione_forza', 'pozione_resistenza']) {
      expect(mondo.oggetti[id]!.pila).toBeGreaterThan(1);
    }
    expect(mondo.oggetti['borsa']!.pila).toBe(1);
  });

  it('ogni mappa delle zone aperte ha almeno un forziere', () => {
    for (const id of ['radura', 'bosco']) expect(celleForziere(mondo.mappe[id]!).length).toBeGreaterThan(0);
  });

  it('i bottini dei nemici citano oggetti esistenti', () => {
    for (const n of Object.values(mondo.nemici)) {
      for (const voce of n.bottino) expect(mondo.oggetti[voce.oggetto], voce.oggetto).toBeDefined();
    }
  });

  it('armi e armature stanno nello zaino come oggetti, uno per spazio', () => {
    for (const id of [...Object.keys(mondo.armi), ...Object.keys(mondo.armature)]) {
      expect(mondo.oggetti[id]!.pila, id).toBe(1);
      expect(mondo.indossabili[id], id).toBeDefined();
    }
  });

  it('c’è un pezzo d’armatura esotico per ogni spazio (design §8)', () => {
    for (const pezzo of PEZZI_ARMATURA) {
      const esotici = Object.values(mondo.armature).filter((a) => a.pezzo === pezzo && a.rarita === 'esotica');
      expect(esotici.length, pezzo).toBeGreaterThan(0);
    }
  });

  it('le armi secondarie del design §7 ci sono e tirano proiettili', () => {
    const tipi = Object.values(mondo.armi).filter((a) => a.slot === 'secondaria').map((a) => a.tipo);
    for (const tipo of ['arco', 'balestra', 'pugnale_lancio', 'bacchetta']) expect(tipi).toContain(tipo);
  });

  it('gli esempi di esotiche del design: arco che rimbalza, spada di fuoco, pugnale che rende invisibili', () => {
    const effetti = Object.values(mondo.armi).filter((a) => a.rarita === 'esotica').flatMap((a) => a.effetti);
    for (const e of ['rimbalzo', 'fuoco', 'invisibile_dopo_uccisione']) expect(effetti).toContain(e);
  });

  it('nel bosco un forziere è nascosto dietro un muro segreto', () => {
    const bosco = mondo.mappe['bosco']!;
    const segreti = celleSegrete(bosco);
    expect(segreti.length).toBe(1);
    const ingresso = trovaPunto(bosco, 'a')!;
    const chiave = (c: Cella) => `${c.col},${c.riga}`;
    // Le celle accanto ai forzieri da cui li si può aprire.
    const accanto = (c: Cella) => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dc, dr]) => chiave({ col: c.col + dc!, riga: c.riga + dr! }));
    const nascosto = celleForziere(bosco).find((f) => {
      const chiuso = raggiungibili(grigliaDellaMappa(bosco), ingresso);
      return !accanto(f.cella).some((k) => chiuso.has(k));
    });
    expect(nascosto, 'forziere irraggiungibile senza aprire il muro').toBeDefined();
    const s = segreti[0]!;
    const aperto = raggiungibili(grigliaDellaMappa(bosco, (c, r) => c === s.col && r === s.riga), ingresso);
    expect(accanto(nascosto!.cella).some((k) => aperto.has(k))).toBe(true);
  });

  it('la partita inizia nella piazza di Borgo Quercia (design §3)', () => {
    expect(mondo.mappaIniziale).toBe('borgo');
  });

  it('il borgo ha i sei personaggi del design, ognuno con il suo dialogo', () => {
    const presenti = celleAbitante(mondo.mappe['borgo']!).map((a) => a.idAbitante).sort();
    expect(presenti).toEqual(['anselmo', 'berta', 'bruno', 'gemma', 'rosalba', 'tobia']);
    for (const id of presenti) expect(mondo.dialoghi[mondo.abitanti[id]!.dialogo], id).toBeDefined();
  });

  it('ogni personaggio si raggiunge a piedi dalla partenza, e anche il cancello', () => {
    const borgo = mondo.mappe['borgo']!;
    const visti = raggiungibili(grigliaDellaMappa(borgo), trovaPunto(borgo, '@')!);
    const accanto = (c: Cella) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dc, dr]) => visti.has(`${c.col + dc!},${c.riga + dr!}`));
    for (const { cella, idAbitante } of celleAbitante(borgo)) expect(accanto(cella), idAbitante).toBe(true);
    expect(accanto(trovaPunto(borgo, 'g')!)).toBe(true);
  });

  it('borgo e Radura sono collegati nei due sensi', () => {
    expect(mondo.mappe['borgo']!.legenda['g']).toMatchObject({ tipo: 'uscita', verso: 'radura' });
    expect(Object.values(mondo.mappe['radura']!.legenda).some((v) => v.tipo === 'uscita' && v.verso === 'borgo')).toBe(true);
  });

  it('ogni nemico lascia monete, e le monete esistono come oggetto a terra', () => {
    for (const n of Object.values(mondo.nemici)) expect(n.monete[1]).toBeGreaterThan(0);
    expect(mondo.oggetti['monete']!.tipo).toBe('monete');
  });

  it('Gemma vende pozioni, armi, armature e zaini fino a 24 spazi (design §8–9)', () => {
    const merce = mondo.negozi['gemma']!.merce.map((id) => mondo.oggetti[id]!);
    for (const tipo of ['pozione', 'arma', 'armatura', 'borsa']) expect(merce.some((o) => o.tipo === tipo), tipo).toBe(true);
    const spazi = merce.flatMap((o) => (o.effetto?.tipo === 'capacita' ? [o.effetto.spazi] : []));
    expect(Math.max(...spazi)).toBe(24);
  });

  it('in taverna c’è un compagno per ciascuna delle 4 classi (design §10)', () => {
    const classi = Object.values(mondo.compagni).map((c) => c.classe).sort();
    expect(classi).toEqual(['chierico', 'guerriero', 'ladro', 'mago']);
    const abilita = Object.values(mondo.compagni).map((c) => c.abilita.id).sort();
    expect(abilita).toEqual(['cura_eroe', 'para_colpo', 'scudo_magico', 'segnala_tesori']);
  });

  it('i compagni fanno meno danni dell’eroe della stessa classe (circa la metà)', () => {
    const valoreDanno = (d: number | string) =>
      typeof d === 'number' ? d : (() => { const [n, f] = d.split('d').map(Number); return n! * f!; })();
    for (const c of Object.values(mondo.compagni)) {
      const arma = mondo.armi[mondo.classi[c.classe]!.arma]!;
      const dannoEroe = arma.dannoBase ?? 8;
      expect(valoreDanno(c.danno), c.id).toBeLessThanOrEqual(dannoEroe);
    }
  });

  it('Bruno conosce 3 ricette di base; le altre si imparano dalle pergamene', () => {
    const base = Object.values(mondo.ricette).filter((r) => r.conosciutaDallInizio).map((r) => r.id).sort();
    expect(base).toEqual(['balestra', 'pugnali_lancio', 'spada_lunga']);
    expect(mondo.oggetti['pergamena_arco_cacciatore']).toBeDefined();
  });

  it('ogni materiale di oggi si trova: da un nemico, da una vena o in un forziere', () => {
    const fonti = new Set([
      ...Object.values(mondo.nemici).flatMap((n) => n.bottino.map((b) => b.oggetto)),
      ...Object.values(mondo.mappe).flatMap((m) => celleVena(m).map((v) => v.materiale)),
      ...Object.values(mondo.mappe).flatMap((m) => celleForziere(m).flatMap((f) => f.contenuto)),
    ]);
    // Cristallo e frammento della corona arriveranno con la miniera e il Re Scheletro (fase 8).
    const piuAvanti = ['cristallo_miniera', 'frammento_corona'];
    for (const o of Object.values(mondo.oggetti).filter((x) => x.tipo === 'materiale' && !piuAvanti.includes(x.id))) {
      expect(fonti.has(o.id), o.id).toBe(true);
    }
  });

  it('ci sono vene di ferro e di carbone nelle zone aperte', () => {
    const materiali = Object.values(mondo.mappe).flatMap((m) => celleVena(m).map((v) => v.materiale));
    expect(materiali).toContain('minerale_ferro');
    expect(materiali).toContain('carbone');
  });

  it('la pergamena dell’Arco del cacciatore è nel forziere nascosto del bosco', () => {
    const nascosto = celleForziere(mondo.mappe['bosco']!).find((f) => f.contenuto.includes('arco_lungo'));
    expect(nascosto?.contenuto).toContain('pergamena_arco_cacciatore');
  });
});

describe('dati dei potenziamenti (fase 6b)', () => {
  const dati = caricaDati();
  const basi = Object.values(dati.armi).filter((a) => !a.potenziamento);

  it('ogni arma ha le varianti +1…+5, con il bonus giusto e un prezzo più alto', () => {
    for (const a of basi) {
      for (let l = 1; l <= 5; l++) {
        const v = dati.armi[`${a.id}+${l}`];
        expect(v, `${a.id}+${l}`).toBeDefined();
        expect(v!.potenziamento).toBe(l);
        expect(v!.dado).toBe(a.dado);
        expect(v!.nome).toBe(`${a.nome} +${l}`);
        expect(v!.prezzo).toBeGreaterThan(a.prezzo);
        expect(dati.oggetti[v!.id]?.tipo).toBe('arma');
        expect(dati.indossabili[v!.id]?.spazio).toBe(a.slot);
      }
      expect(dati.armi[`${a.id}+6`]).toBeUndefined();
    }
  });

  it('la tabella copre i 5 livelli con materiali veri, e +4/+5 chiedono il cristallo della miniera', () => {
    expect(dati.potenziamenti.livelli.map((l) => l.livello)).toEqual([1, 2, 3, 4, 5]);
    for (const l of dati.potenziamenti.livelli) for (const m of Object.keys(l.materiali)) expect(dati.oggetti[m]?.tipo).toBe('materiale');
    expect(dati.potenziamenti.livelli[3]!.materiali['cristallo_miniera']).toBeGreaterThan(0);
    expect(dati.potenziamenti.livelli[2]!.materiali['cristallo_miniera']).toBeUndefined();
  });

  it('nessuna variante finisce nel negozio o nelle ricette (si ottengono solo dal fabbro)', () => {
    for (const n of Object.values(dati.negozi)) for (const m of n.merce) expect(m).not.toContain('+');
    for (const r of Object.values(dati.ricette)) expect(r.risultato).not.toContain('+');
  });
});

describe('dati delle quest (fase 7a)', () => {
  const dati = caricaDati();

  it('le tre secondarie della 7a ci sono, con chi le affida', () => {
    expect(dati.quest['lupi_dario']?.daChi).toBe('dario');
    expect(dati.quest['erbe_anselmo']?.daChi).toBe('anselmo');
    expect(dati.quest['carbone_bruno']?.daChi).toBe('bruno');
  });

  it('Dario sta nella Radura; nel bosco ci sono abbastanza lupi e cespugli di erbe', () => {
    expect(celleAbitante(dati.mappe['radura']!).map((a) => a.idAbitante)).toContain('dario');
    expect(celleNemico(dati.mappe['bosco']!).filter((n) => n.idNemico === 'lupo').length).toBeGreaterThanOrEqual(4);
    const erbe = celleVena(dati.mappe['bosco']!).filter((v) => v.materiale === 'erba_medicinale');
    expect(erbe.every((v) => v.aspetto === 'cespuglio')).toBe(true);
    // Anche con il raccolto minimo (1 per cespuglio) ne bastano per le 5 erbe di Anselmo.
    expect(erbe.reduce((t, v) => t + v.quantita[0], 0)).toBeGreaterThanOrEqual(5);
  });

  it('la ricompensa di Bruno è una pergamena che insegna una ricetta vera', () => {
    const pergamena = dati.oggetti['pergamena_arco_lungo']!;
    expect(pergamena.effetto).toEqual({ tipo: 'ricetta', ricetta: 'arco_lungo' });
    expect(dati.ricette['arco_lungo']?.conosciutaDallInizio).toBe(false);
  });

  it('ogni nemico conosce il proprio id', () => {
    for (const [id, n] of Object.entries(dati.nemici)) expect(n.id).toBe(id);
  });
});

describe('il mondo si allarga (fase 7b)', () => {
  const dati = caricaDati();
  const vicino = (visti: Set<string>, c: Cella) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dc, dr]) => visti.has(`${c.col + dc!},${c.riga + dr!}`));

  it('Cimitero e Colline Grigie esistono e si raggiungono: dal bosco e dalla Radura', () => {
    const uscite = (m: string) => Object.values(dati.mappe[m]!.legenda).filter((v) => v.tipo === 'uscita').map((v) => v.verso);
    expect(uscite('bosco')).toContain('cimitero');
    expect(uscite('radura')).toContain('colline');
    expect(uscite('cimitero')).toEqual(['bosco', 'cripta_sale']); // dalla fase 8a, dietro il cancello
    expect(uscite('colline')).toEqual(['radura', 'miniera_gallerie', 'brughiera']); // 8b oltre la frana, 8c oltre la nebbia
  });

  it('il cimitero ha scheletri e il cancello della cripta, che si apre con la chiave di Berta (fase 8a)', () => {
    const cimitero = dati.mappe['cimitero']!;
    expect(celleNemico(cimitero).filter((n) => n.idNemico === 'scheletro').length).toBeGreaterThanOrEqual(3);
    const cancello = cellePorte(cimitero).find((c) => c.aspetto === 'cancello');
    expect(cancello?.chiave).toBe('chiave_cripta');
    const visti = raggiungibili(grigliaDellaMappa(cimitero), trovaPunto(cimitero, 'a')!);
    expect(vicino(visti, cancello!.cella)).toBe(true);
    expect(dati.quest['atto1_cimitero']?.ricompensa.oggetti).toEqual([{ id: 'chiave_cripta', quantita: 1 }]);
  });

  it('nelle Colline: Ugo si raggiunge, la frana chiude la strada, il tesoro è dietro il muro segreto', () => {
    const colline = dati.mappe['colline']!;
    const ingresso = trovaPunto(colline, 'a')!;
    const chiuso = raggiungibili(grigliaDellaMappa(colline), ingresso);
    expect(vicino(chiuso, celleAbitante(colline).find((a) => a.idAbitante === 'ugo')!.cella)).toBe(true);
    expect(celleCartello(colline).some((c) => c.aspetto === 'frana')).toBe(true);
    const tesoro = celleForziere(colline).find((f) => f.contenuto.includes('spada_cavaliere'))!;
    expect(`colline:${tesoro.cella.col}:${tesoro.cella.riga}`).toBe('colline:3:2');
    expect(vicino(chiuso, tesoro.cella)).toBe(false);
    const s = celleSegrete(colline)[0]!;
    const aperto = raggiungibili(grigliaDellaMappa(colline, (c, r) => c === s.col && r === s.riga), ingresso);
    expect(vicino(aperto, tesoro.cella)).toBe(true);
  });

  it('la mappa del cavaliere: Gemma la vende, avvia la quest giusta, e lettera e chiave non si vendono', () => {
    expect(dati.negozi['gemma']!.merce).toContain('mappa_cavaliere');
    expect(dati.oggetti['mappa_cavaliere']!.effetto).toEqual({ tipo: 'mappa', quest: 'tesoro_cavaliere' });
    expect(dati.quest['tesoro_cavaliere']).toMatchObject({ siAccettaCon: 'mappa_cavaliere', automatica: true });
    expect(dati.oggetti['lettera_bruno']!.tipo).toBe('missione');
    expect(dati.oggetti['chiave_cripta']!.tipo).toBe('missione');
  });
});

describe('la Cripta dei Non Morti (fase 8a)', () => {
  const dati = caricaDati();
  const vicino = (visti: Set<string>, c: Cella) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dc, dr]) => visti.has(`${c.col + dc!},${c.riga + dr!}`));
  const sale = dati.mappe['cripta_sale']!;

  it('la chiave d’ossa si trova PRIMA della porta d’ossa; aperta la porta si arriva alle scale', () => {
    const chiuse = raggiungibili(grigliaDellaMappa(sale), trovaPunto(sale, 'a')!);
    const conChiave = celleForziere(sale).find((f) => f.contenuto.includes('chiave_ossa'))!;
    expect(vicino(chiuse, conChiave.cella)).toBe(true);
    const porta = cellePorte(sale).find((p) => p.chiave === 'chiave_ossa')!;
    const scale = trovaPunto(sale, 'd')!;
    expect(chiuse.has(`${scale.col},${scale.riga}`)).toBe(false);
    const aperte = raggiungibili(grigliaDellaMappa(sale, (c, r) => c === porta.cella.col && r === porta.cella.riga), trovaPunto(sale, 'a')!);
    expect(aperte.has(`${scale.col},${scale.riga}`)).toBe(true);
  });

  it('il forziere chiuso: la chiave piccola è in un forziere raggiungibile', () => {
    const chiuse = raggiungibili(grigliaDellaMappa(sale), trovaPunto(sale, 'a')!);
    const chiuso = celleForziere(sale).find((f) => f.chiusoCon === 'chiave_piccola')!;
    expect(vicino(chiuse, chiuso.cella)).toBe(true);
    const chiave = celleForziere(sale).find((f) => f.contenuto.includes('chiave_piccola'))!;
    expect(vicino(chiuse, chiave.cella)).toBe(true);
  });

  it('al massimo un’esotica nascosta nel dungeon (§8), dietro un muro segreto', () => {
    const esotiche = ['cripta_sale', 'cripta_tomba'].flatMap((m) =>
      celleForziere(dati.mappe[m]!).filter((f) => f.contenuto.some((id) => dati.oggetti[id]?.rarita === 'esotica')),
    );
    expect(esotiche.length).toBe(1);
    const chiuse = raggiungibili(grigliaDellaMappa(sale), trovaPunto(sale, 'a')!);
    expect(vicino(chiuse, esotiche[0]!.cella)).toBe(false);
  });

  it('il Re Scheletro: boss a fasi, lascia il frammento della corona, una leggendaria e la pagina di diario', () => {
    const re = dati.nemici['re_scheletro']!;
    expect(re.fasi?.length).toBe(2);
    const sicuri = re.bottino.filter((b) => b.probabilita === 1).map((b) => b.oggetto);
    expect(sicuri).toEqual(expect.arrayContaining(['frammento_corona', 'pagina_diario']));
    expect(sicuri.some((id) => dati.oggetti[id]?.rarita === 'leggendaria')).toBe(true);
  });

  it('lo scontro comincia solo DENTRO la stanza: da fuori le barriere nessun boss vede l’eroe (vale per ogni boss)', () => {
    for (const mappa of Object.values(dati.mappe)) {
      const barriere = celleBarriera(mappa);
      if (barriere.length === 0) continue;
      const fuori = raggiungibili(
        grigliaDellaMappa(mappa, undefined, (c, r) => barriere.some((b) => b.cella.col === c && b.cella.riga === r)),
        trovaPunto(mappa, 'a')!,
      );
      const boss = celleNemico(mappa).find((n) => dati.nemici[n.idNemico]?.fasi)!;
      const vista = dati.nemici[boss.idNemico]!.raggioVista;
      for (const k of fuori) {
        const [c, r] = k.split(',').map(Number);
        expect(Math.hypot((c! - boss.cella.col) * 16, (r! - boss.cella.riga) * 16), `${mappa.id} ${k}`).toBeGreaterThan(vista);
      }
    }
  });
});

describe('la Miniera dei Goblin (fase 8b)', () => {
  const dati = caricaDati();
  const vicino = (visti: Set<string>, c: Cella) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dc, dr]) => visti.has(`${c.col + dc!},${c.riga + dr!}`));
  const gallerie = dati.mappe['miniera_gallerie']!;

  it('la frana chiude la strada finché l’Atto I non è concluso; poi la miniera si raggiunge', () => {
    const colline = dati.mappe['colline']!;
    const uscita = (m: typeof colline) => {
      const visti = raggiungibili(grigliaDellaMappa(m), trovaPunto(m, 'a')!);
      const u = trovaPunto(m, 'm')!;
      return visti.has(`${u.col},${u.riga}`);
    };
    expect(uscita(colline)).toBe(false);
    expect(uscita(applicaCondizioni(colline, (c) => c.quest === 'atto1_cripta'))).toBe(true);
  });

  it('nelle gallerie: scale raggiungibili, chiave piccola prima del forziere chiuso, vene di cristallo', () => {
    const visti = raggiungibili(grigliaDellaMappa(gallerie), trovaPunto(gallerie, 'a')!);
    const scale = trovaPunto(gallerie, 'd')!;
    expect(visti.has(`${scale.col},${scale.riga}`)).toBe(true);
    const chiuso = celleForziere(gallerie).find((f) => f.chiusoCon)!;
    const conChiave = celleForziere(gallerie).find((f) => f.contenuto.includes('chiave_piccola'))!;
    expect(vicino(visti, chiuso.cella) && vicino(visti, conChiave.cella)).toBe(true);
    expect(chiuso.contenuto).toContain('pergamena_ascia_troll');
    expect(celleVena(gallerie).filter((v) => v.materiale === 'cristallo_miniera').length).toBeGreaterThanOrEqual(3);
  });

  it('una sola esotica nascosta nella miniera, dietro il muro segreto', () => {
    const esotiche = ['miniera_gallerie', 'miniera_tana'].flatMap((m) =>
      celleForziere(dati.mappe[m]!).filter((f) => f.contenuto.some((id) => dati.oggetti[id]?.rarita === 'esotica')),
    );
    expect(esotiche.length).toBe(1);
    expect(vicino(raggiungibili(grigliaDellaMappa(gallerie), trovaPunto(gallerie, 'a')!), esotiche[0]!.cella)).toBe(false);
  });

  it('il troll: fasi con carica e crollo dei massi; lascia la zanna (per l’Ascia del troll) e una leggendaria', () => {
    const troll = dati.nemici['troll_caverne']!;
    expect(troll.fasi!.flatMap((f) => f.attacchi.map((a) => a.tipo))).toEqual(expect.arrayContaining(['carica', 'crollo_massi']));
    const sicuri = troll.bottino.filter((b) => b.probabilita === 1).map((b) => b.oggetto);
    expect(sicuri).toContain('zanna_troll');
    expect(sicuri.some((id) => dati.oggetti[id]?.rarita === 'leggendaria')).toBe(true);
    expect(dati.ricette['ascia_troll']!.materiali['zanna_troll']).toBe(1);
  });

  it('nuovi nemici: arcieri che tirano, ragni che caricano, banditi nelle Colline', () => {
    expect(dati.nemici['goblin_arciere']!.comportamento).toBe('tiratore');
    expect(dati.nemici['ragno']!.comportamento).toBe('caricatore');
    expect(celleNemico(dati.mappe['colline']!).filter((n) => n.idNemico === 'bandito').length).toBeGreaterThanOrEqual(3);
  });

  it('dopo il troll la Quercia Antica del borgo è ferita (e compare il ramo tagliato)', () => {
    const borgo = dati.mappe['borgo']!;
    const dopo = applicaCondizioni(borgo, (c) => c.boss === 'troll_caverne');
    expect(dopo.simboli.flat().filter((s) => s === 'Q').length).toBe(0);
    expect(celleCartello(dopo).some((c) => c.aspetto === 'ramo')).toBe(true);
    expect(celleCartello(borgo).some((c) => c.aspetto === 'ramo')).toBe(false);
  });
});

describe('la Torre del Negromante (fase 8c)', () => {
  const dati = caricaDati();
  const vicino = (visti: Set<string>, c: Cella) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dc, dr]) => visti.has(`${c.col + dc!},${c.riga + dr!}`));
  const piani = dati.mappe['torre_piani']!;

  it('la nebbia chiude la Brughiera finché l’Atto II non è concluso', () => {
    const colline = dati.mappe['colline']!;
    const passa = (m: typeof colline) => {
      const u = trovaPunto(m, 'o')!;
      return raggiungibili(grigliaDellaMappa(m), trovaPunto(m, 'a')!).has(`${u.col},${u.riga}`);
    };
    expect(passa(colline)).toBe(false);
    expect(passa(applicaCondizioni(colline, (c) => c.quest === 'atto2_miniera'))).toBe(true);
  });

  it('Brughiera e Torre sono "di notte" (la luna nera)', () => {
    for (const id of ['brughiera', 'torre_piani', 'torre_cima']) expect(dati.mappe[id]!.notte, id).toBe(true);
    expect(dati.mappe['borgo']!.notte).toBeUndefined();
  });

  it('nella torre: la chiave prima del cancello, la scala dopo; la chiave piccola prima del forziere chiuso', () => {
    const chiuse = raggiungibili(grigliaDellaMappa(piani), trovaPunto(piani, 'a')!);
    const conChiave = celleForziere(piani).find((f) => f.contenuto.includes('chiave_torre'))!;
    expect(vicino(chiuse, conChiave.cella)).toBe(true);
    const scala = trovaPunto(piani, 'd')!;
    expect(chiuse.has(`${scala.col},${scala.riga}`)).toBe(false);
    const porta = cellePorte(piani)[0]!;
    const aperte = raggiungibili(grigliaDellaMappa(piani, (c, r) => c === porta.cella.col && r === porta.cella.riga), trovaPunto(piani, 'a')!);
    expect(aperte.has(`${scala.col},${scala.riga}`)).toBe(true);
    const piccola = celleForziere(piani).find((f) => f.contenuto.includes('chiave_piccola'))!;
    expect(vicino(chiuse, piccola.cella)).toBe(true);
    expect(celleForziere(piani).find((f) => f.chiusoCon)!.contenuto).toContain('pergamena_bastone_orvald');
  });

  it('una sola esotica nascosta nella torre, dietro un muro segreto', () => {
    const esotiche = ['brughiera', 'torre_piani', 'torre_cima'].flatMap((m) =>
      celleForziere(dati.mappe[m]!).filter((f) => f.contenuto.some((id) => dati.oggetti[id]?.rarita === 'esotica')),
    );
    expect(esotiche.length).toBe(1);
    const aperte = raggiungibili(grigliaDellaMappa(piani, (c, r) => cellePorte(piani).some((p) => p.cella.col === c && p.cella.riga === r)), trovaPunto(piani, 'a')!);
    expect(vicino(aperte, esotiche[0]!.cella)).toBe(false);
  });

  it('il Negromante: tiratore, teletrasporto e incantesimi; sotto metà vita evoca le ombre; fa partire il finale', () => {
    const n = dati.nemici['negromante']!;
    expect(n.comportamento).toBe('tiratore');
    expect(n.finale).toBe(true);
    expect(n.fasi![0]!.attacchi.map((a) => a.tipo)).toEqual(expect.arrayContaining(['teletrasporto', 'incantesimo']));
    expect(n.fasi![1]!.attacchi.some((a) => a.tipo === 'evoca' && a.nemico === 'ombra')).toBe(true);
    expect(n.bottino.filter((b) => b.probabilita === 1).map((b) => b.oggetto)).toEqual(expect.arrayContaining(['ossidiana_nera', 'corazza_quercia']));
    expect(dati.ricette['bastone_orvald']!.materiali['ossidiana_nera']).toBe(1);
    expect(dati.finale.length).toBeGreaterThanOrEqual(3);
  });

  it('dopo il Negromante, sulla tomba di Lia c’è il germoglio', () => {
    const cimitero = dati.mappe['cimitero']!;
    expect(celleCartello(cimitero).some((c) => c.aspetto === 'lapide')).toBe(true);
    const dopo = applicaCondizioni(cimitero, (c) => c.boss === 'negromante');
    expect(celleCartello(dopo).some((c) => c.aspetto === 'germoglio')).toBe(true);
  });

  it('la storia si chiude: l’Atto III si conclude da Berta, e non c’è un capitolo dopo', () => {
    const q = dati.quest['atto3_torre']!;
    expect(chiConclude(q)).toBe('berta');
    expect(q.prossimo).toBeUndefined();
  });
});

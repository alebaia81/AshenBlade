// Il registro delle quest (icona della pergamena o L), con il mondo in pausa.
// A sinistra l'elenco: prima la principale, poi quelle in corso, in fondo le
// concluse in grigio. A destra la quest scelta: storia, passi fatti (✔), il
// passo di adesso con il progresso, la ricompensa.
// Non decide nulla: legge la Partita e chiede a systems/quest.ts.

import * as Phaser from 'phaser';
import { ALTEZZA_SCHERMO, CHIAVE_PARTITA, LARGHEZZA_SCHERMO, SCENA_MONDO, SCENA_REGISTRO } from '../costanti';
import type { DatiGioco } from '../data/caricaDati';
import { chiConclude, progresso, statoDi, type DefinizioneQuest, type StatoVisibile } from '../systems/quest';
import { Pulsante } from './interfaccia/Pulsante';
import { STILE_TESTO, STILE_TITOLO } from './interfaccia/testi';
import { leggiPartita } from './statoCondiviso';

const PANNELLO = { larghezza: 900, altezza: 480 };
const RIGA = 46;
const RIGHE_VISIBILI = 7;
const GIALLO = '#ffe680';
const GRIGIO = '#8a8a8a';
const VERDE = '#8fe08f';

/** Come si legge lo stato nell'elenco. */
const ETICHETTE: Partial<Record<StatoVisibile, string>> = { attiva: 'in corso', pronta: 'pronta: torna a riscuotere', conclusa: 'conclusa' };
const ORDINE: Partial<Record<StatoVisibile, number>> = { pronta: 0, attiva: 1, conclusa: 2 };

export class ScenaRegistro extends Phaser.Scene {
  private scelta: string | null = null;
  private contenuto!: Phaser.GameObjects.Container;
  private sinistra = 0;
  private alto = 0;

  constructor(private readonly dati: DatiGioco) {
    super(SCENA_REGISTRO);
  }

  create(): void {
    const cx = LARGHEZZA_SCHERMO / 2;
    const cy = ALTEZZA_SCHERMO / 2;
    this.sinistra = cx - PANNELLO.larghezza / 2;
    this.alto = cy - PANNELLO.altezza / 2;
    this.scelta = null;
    this.add.rectangle(cx, cy, LARGHEZZA_SCHERMO, ALTEZZA_SCHERMO, 0x000000, 0.55).setInteractive();
    this.add.rectangle(cx, cy, PANNELLO.larghezza, PANNELLO.altezza, 0x2a2418, 0.97).setStrokeStyle(2, 0xc9b88a);
    this.add.text(this.sinistra + 24, this.alto + 16, 'Registro delle quest', { ...STILE_TITOLO, fontSize: '22px' });
    new Pulsante(this, this.sinistra + PANNELLO.larghezza - 90, this.alto + PANNELLO.altezza - 32, { larghezza: 150, altezza: 40, testo: 'Chiudi (L)', alClic: () => this.chiudi() });
    this.contenuto = this.add.container(0, 0);
    this.input.keyboard?.on('keydown-ESC', () => this.chiudi());
    this.input.keyboard?.on('keydown-L', () => this.chiudi());
    const ascolta = () => this.ridisegna();
    this.registry.events.on(`changedata-${CHIAVE_PARTITA}`, ascolta);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.registry.events.off(`changedata-${CHIAVE_PARTITA}`, ascolta));
    this.ridisegna();
  }

  /** Le quest iniziate, nell'ordine del registro. */
  elenco(): { d: DefinizioneQuest; stato: StatoVisibile }[] {
    const { quest, inventario } = leggiPartita(this);
    return Object.keys(quest)
      .flatMap((id) => {
        const d = this.dati.quest[id];
        return d ? [{ d, stato: statoDi(id, quest, this.dati.quest, inventario) }] : [];
      })
      .sort((a, b) => {
        const principale = Number(b.d.tipo === 'principale' && b.stato !== 'conclusa') - Number(a.d.tipo === 'principale' && a.stato !== 'conclusa');
        return principale || (ORDINE[a.stato] ?? 9) - (ORDINE[b.stato] ?? 9);
      });
  }

  private ridisegna(): void {
    const { sinistra, alto } = this;
    this.contenuto.removeAll(true);
    const voci = this.elenco();
    if (!this.scelta || !voci.some((v) => v.d.id === this.scelta)) this.scelta = voci[0]?.d.id ?? null;
    if (voci.length === 0) {
      this.contenuto.add(
        this.add.text(sinistra + 24, alto + 80, 'Nessuna quest, per ora.\n\nChi ha un ! giallo sopra la testa ha un lavoro per te: parlagli.', {
          ...STILE_TESTO,
          fontSize: '16px',
          wordWrap: { width: 600 },
        }),
      );
      return;
    }
    voci.slice(0, RIGHE_VISIBILI).forEach(({ d, stato }, i) => {
      const y = alto + 92 + i * RIGA;
      const scelta = d.id === this.scelta;
      const conclusa = stato === 'conclusa';
      const sfondo = this.add.rectangle(sinistra + 24 + 170, y, 340, RIGA - 4, scelta ? 0x4a4030 : 0x1a160e).setStrokeStyle(scelta ? 2 : 1, scelta ? 0xffd23f : 0x5a4a3a);
      sfondo.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        this.scelta = d.id;
        this.ridisegna();
      });
      const segno = stato === 'pronta' ? '?' : d.tipo === 'principale' ? '★' : conclusa ? '✔' : '•';
      this.contenuto.add([
        sfondo,
        this.add.text(sinistra + 40, y, segno, { ...STILE_TESTO, fontSize: '18px', color: conclusa ? GRIGIO : GIALLO, fontStyle: 'bold' }).setOrigin(0.5),
        this.add.text(sinistra + 58, y - 10, d.nome, { ...STILE_TESTO, fontSize: '15px', color: conclusa ? GRIGIO : '#ffffff' }).setOrigin(0, 0.5),
        this.add.text(sinistra + 58, y + 10, `${d.tipo === 'principale' ? 'Principale · ' : ''}${ETICHETTE[stato] ?? ''}`, { ...STILE_TESTO, fontSize: '12px', color: stato === 'pronta' ? GIALLO : '#9a8a7a' }).setOrigin(0, 0.5),
      ]);
    });
    if (voci.length > RIGHE_VISIBILI) {
      this.contenuto.add(this.add.text(sinistra + 24, alto + PANNELLO.altezza - 46, `E altre ${voci.length - RIGHE_VISIBILI} concluse.`, { ...STILE_TESTO, fontSize: '13px', color: GRIGIO }));
    }
    const voce = voci.find((v) => v.d.id === this.scelta);
    if (voce) this.dettagli(voce.d, voce.stato);
  }

  /** A destra: storia, passi, ricompensa. I passi futuri restano nascosti (sorprese della trama). */
  private dettagli(d: DefinizioneQuest, stato: StatoVisibile): void {
    const { quest, inventario } = leggiPartita(this);
    const q = quest[d.id]!;
    const x = this.sinistra + 400;
    const larghezza = 470;
    let y = this.alto + 72;
    const scrivi = (testo: string, stile: Phaser.Types.GameObjects.Text.TextStyle, spazio = 6) => {
      const t = this.add.text(x, y, testo, { ...STILE_TESTO, fontSize: '14px', wordWrap: { width: larghezza }, ...stile });
      this.contenuto.add(t);
      y += t.height + spazio;
    };
    const nome = (id: string) => this.dati.abitanti[id]?.nome ?? id;
    scrivi(d.nome, { ...STILE_TITOLO, fontSize: '19px', color: stato === 'conclusa' ? GRIGIO : GIALLO }, 2);
    scrivi(`Affidata da ${nome(d.daChi)}`, { fontSize: '12px', color: '#9a8a7a' }, 10);
    scrivi(d.descrizione, { color: '#d8d0c0' }, 14);
    d.passi.forEach((passo, i) => {
      if (i < q.passo || stato === 'conclusa') scrivi(`✔ ${passo.descrizione}`, { color: GRIGIO }, 4);
      else if (i === q.passo) {
        const p = progresso(d, q, inventario);
        scrivi(`▸ ${passo.descrizione}${p ? `   ${p.fatti} / ${p.servono}` : ''}`, { color: '#ffffff', fontStyle: 'bold' }, 4);
      }
    });
    if (stato === 'pronta') scrivi(`▸ Torna da ${nome(chiConclude(d))} per la ricompensa`, { color: GIALLO, fontStyle: 'bold' }, 4);
    // La quest principale mostra già il capitolo che verrà, ma "sbarrato".
    if (d.prossimo) scrivi(`▹ ${d.prossimo}`, { color: stato === 'conclusa' ? '#c8b8a0' : GRIGIO, fontStyle: 'italic' }, 4);
    y += 10;
    const r = d.ricompensa;
    const oggetti = (r.oggetti ?? []).map((o) => `${o.quantita > 1 ? `${o.quantita} × ` : ''}${this.dati.oggetti[o.id]?.nome ?? o.id}`);
    scrivi(`Ricompensa: ${[...(r.monete > 0 ? [`${r.monete} monete`] : []), `${r.esperienza} esperienza`, ...oggetti].join(', ')}`, { fontSize: '13px', color: stato === 'conclusa' ? GRIGIO : VERDE });
    if (r.monete > 0 && stato !== 'conclusa') scrivi('(le monete crescono con il Carisma)', { fontSize: '12px', color: '#9a8a7a' });
  }

  private chiudi(): void {
    this.scene.stop();
    this.scene.resume(SCENA_MONDO);
  }
}

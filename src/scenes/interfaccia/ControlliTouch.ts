// Controlli touch a schermo per smartphone e tablet (design responsive & mobile).
// Levetta virtuale in basso a sinistra per muoversi con il pollice sinistro,
// e pulsanti rapidi in basso a destra per attaccare e schivare con il pollice destro.

import * as Phaser from 'phaser';
import { Comandi } from '../../entities/Comandi';
import { leggiOpzioni } from '../../systems/opzioni';
import { archivioDelBrowser } from '../browser';

export class ControlliTouch extends Phaser.GameObjects.Container {
  private baseJoystick: Phaser.GameObjects.Arc;
  private pomelloJoystick: Phaser.GameObjects.Arc;
  private touchIdJoystick: number | null = null;
  private readonly centroX = 92;
  private readonly centroY = 432;
  private readonly raggioMax = 38;

  private btnAttacco: Phaser.GameObjects.Container;
  private btnSchivata: Phaser.GameObjects.Container;

  constructor(scena: Phaser.Scene) {
    super(scena, 0, 0);

    // 1. Base e pomello del joystick (in basso a sinistra)
    this.baseJoystick = scena.add
      .circle(this.centroX, this.centroY, 46, 0x111827, 0.45)
      .setStrokeStyle(2, 0x38bdf8, 0.55);
    this.add(this.baseJoystick);

    // Linee guida o decorazione levetta
    const mirino = scena.add.graphics();
    mirino.lineStyle(1, 0x38bdf8, 0.3);
    mirino.lineBetween(this.centroX - 35, this.centroY, this.centroX + 35, this.centroY);
    mirino.lineBetween(this.centroX, this.centroY - 35, this.centroX, this.centroY + 35);
    this.add(mirino);

    this.pomelloJoystick = scena.add
      .circle(this.centroX, this.centroY, 20, 0x38bdf8, 0.7)
      .setStrokeStyle(2, 0xffffff, 0.85);
    this.add(this.pomelloJoystick);

    // Area interattiva per catturare il tocco del joystick
    const areaTocco = scena.add
      .circle(this.centroX, this.centroY, 68, 0x000000, 0.001)
      .setInteractive({ useHandCursor: true });
    this.add(areaTocco);

    areaTocco.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.touchIdJoystick = p.id;
      this.aggiornaPosizioneJoystick(p.x, p.y);
    });

    scena.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.touchIdJoystick === p.id) {
        this.aggiornaPosizioneJoystick(p.x, p.y);
      }
    });

    const rilasciaJoystick = (p: Phaser.Input.Pointer) => {
      if (this.touchIdJoystick === p.id) {
        this.touchIdJoystick = null;
        this.pomelloJoystick.setPosition(this.centroX, this.centroY);
        Comandi.impostaMovimentoTouch(false, false, false, false);
      }
    };

    scena.input.on('pointerup', rilasciaJoystick);
    scena.input.on('gameout', () => {
      this.touchIdJoystick = null;
      this.pomelloJoystick.setPosition(this.centroX, this.centroY);
      Comandi.impostaMovimentoTouch(false, false, false, false);
      Comandi.rilasciaAttaccoTouch();
    });

    // 2. Pulsante Attacco (in basso a destra, grande)
    this.btnAttacco = this.creaPulsanteAzione(
      scena,
      870,
      432,
      28,
      0x991b1b,
      0xf87171,
      '⚔',
      20,
      () => Comandi.segnalaAttaccoTouch(true),
      () => Comandi.rilasciaAttaccoTouch(),
    );
    this.add(this.btnAttacco);

    // 3. Pulsante Schivata / Capriola (in basso a destra, accanto all'attacco)
    this.btnSchivata = this.creaPulsanteAzione(
      scena,
      796,
      456,
      22,
      0x1e3a8a,
      0x60a5fa,
      '💨',
      16,
      () => Comandi.segnalaSchivataTouch(),
      () => {},
    );
    this.add(this.btnSchivata);

    // Autodetect touch device
    const opzioni = leggiOpzioni(archivioDelBrowser());
    const haTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.setVisible(opzioni.controlliTouch && haTouch);

    // Se l'utente tocca lo schermo in qualsiasi momento, abilita i controlli se l'opzione è attiva
    scena.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const opz = leggiOpzioni(archivioDelBrowser());
      if (p.wasTouch && !this.visible && opz.controlliTouch) {
        this.setVisible(true);
      }
    });

    scena.add.existing(this);
  }

  private creaPulsanteAzione(
    scena: Phaser.Scene,
    x: number,
    y: number,
    raggio: number,
    colore: number,
    bordo: number,
    simbolo: string,
    dimensioneTesto: number,
    suPremi: () => void,
    suRilascia: () => void,
  ): Phaser.GameObjects.Container {
    const c = scena.add.container(x, y);
    const bg = scena.add.circle(0, 0, raggio, colore, 0.55).setStrokeStyle(2, bordo, 0.85);
    const txt = scena.add.text(0, 0, simbolo, {
      fontFamily: 'sans-serif',
      fontSize: `${dimensioneTesto}px`,
      color: '#ffffff',
    }).setOrigin(0.5);

    c.add([bg, txt]);
    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerdown', () => {
      c.setScale(0.92);
      bg.setAlpha(0.85);
      suPremi();
    });

    const termina = () => {
      c.setScale(1);
      bg.setAlpha(0.55);
      suRilascia();
    };

    bg.on('pointerup', termina);
    bg.on('pointerout', termina);

    return c;
  }

  private aggiornaPosizioneJoystick(px: number, py: number): void {
    const dx = px - this.centroX;
    const dy = py - this.centroY;
    const dist = Math.hypot(dx, dy);

    if (dist <= 0) {
      this.pomelloJoystick.setPosition(this.centroX, this.centroY);
      Comandi.impostaMovimentoTouch(false, false, false, false);
      return;
    }

    const ratio = Math.min(dist, this.raggioMax) / dist;
    const kx = this.centroX + dx * ratio;
    const ky = this.centroY + dy * ratio;
    this.pomelloJoystick.setPosition(kx, ky);

    // Calcolo direzioni con zona morta
    if (dist < 10) {
      Comandi.impostaMovimentoTouch(false, false, false, false);
      return;
    }

    const nx = dx / dist;
    const ny = dy / dist;
    const SOGLIA = 0.36;

    Comandi.impostaMovimentoTouch(
      ny < -SOGLIA,
      ny > SOGLIA,
      nx < -SOGLIA,
      nx > SOGLIA,
    );
  }
}

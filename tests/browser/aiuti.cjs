// Strumenti comuni alle prove nel browser.
// File .cjs (CommonJS) perché Playwright, nell'ambiente dove girano le prove,
// è installato globalmente e si trova con require() da qualsiasi cartella.

const { chromium } = require('playwright');
const path = require('node:path');
const fs = require('node:fs');

/** Avvia il browser e apre il gioco. Restituisce gli strumenti per la prova. */
async function apriGioco(percorsoGioco, cartellaSchermate) {
  const browser = await chromium.launch();
  const pagina = await browser.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 2 });
  fs.mkdirSync(cartellaSchermate, { recursive: true });

  // Raccogliamo errori e richieste di rete: un gioco sano non ne ha.
  const errori = [];
  const richiesteEsterne = [];
  pagina.on('pageerror', (e) => errori.push(e.message));
  pagina.on('console', (m) => m.type() === 'error' && errori.push(m.text()));
  pagina.on('request', (r) => !/^(file|data|blob):/.test(r.url()) && richiesteEsterne.push(r.url()));

  await pagina.goto('file://' + path.resolve(percorsoGioco));
  await pagina.waitForTimeout(1200);

  let riusciti = 0;
  let falliti = 0;

  return {
    pagina,
    errori,
    richiesteEsterne,

    /** Registra un controllo. */
    controlla(condizione, descrizione) {
      if (condizione) riusciti++;
      else falliti++;
      console.log(`${condizione ? 'OK     ' : 'ERRORE '} ${descrizione}`);
    },

    /** Esegue una funzione dentro la pagina (dove esiste window.gioco) e ne restituisce il risultato. */
    nelGioco(funzione, argomento) {
      return pagina.evaluate(funzione, argomento);
    },

    /** Clic in coordinate di gioco (960×540) e breve attesa perché il gioco reagisca. */
    async clic(x, y) {
      await pagina.mouse.click(x, y);
      await pagina.waitForTimeout(150);
    },

    async aspetta(ms) {
      await pagina.waitForTimeout(ms);
    },

    /** Schermata. Con "ferma" il ciclo di gioco viene sospeso per fotografare un istante preciso. */
    async schermata(nome, { ferma = false } = {}) {
      if (ferma) await pagina.evaluate(() => window.gioco.loop.sleep());
      await pagina.screenshot({ path: path.join(cartellaSchermate, `${nome}.png`) });
      if (ferma) await pagina.evaluate(() => window.gioco.loop.wake());
    },

    /**
     * Crea un personaggio dalla schermata iniziale: indice della classe
     * (0 Guerriero, 1 Mago, 2 Ladro, 3 Chierico) e le due righe dei punti liberi
     * (0 FOR … 5 CAR). Poi entra nel mondo.
     * Dalla fase 5 la partita inizia nel borgo: le prove delle fasi precedenti
     * sono state scritte per la Radura, quindi per comodità si va lì (mappa = 'radura').
     */
    async creaPersonaggio(indiceClasse, righePunti, mappa = 'radura') {
      await this.vaiAllaCreazione();
      await this.clic(125 + indiceClasse * 237, 112);
      for (const riga of righePunti) await this.clic(420, 222 + riga * 40);
      await this.clic(800, 492);
      await pagina.waitForFunction(() => window.gioco.scene.isActive('Mondo'), null, { timeout: 10000 });
      await pagina.waitForTimeout(800);
      if (mappa !== 'borgo') {
        await this.mondo((s, m) => s.vaiA(m), mappa);
        await pagina.waitForTimeout(900);
      }
    },

    /** Dalla fase 9a si parte dal menu: Nuova partita → slot 1 → si salta l'introduzione. */
    async vaiAllaCreazione() {
      // Si aspetta che ogni scena sia davvero partita: con il PC sotto sforzo le dissolvenze durano di più.
      const attiva = (nome) => pagina.waitForFunction((n) => window.gioco.scene.isActive(n), nome, { timeout: 10000 });
      await attiva('Menu');
      await this.clic(MENU.x, MENU.nuova);
      await this.clic(MENU.x, MENU.righeSlot[0]);
      await attiva('Intro');
      await pagina.waitForTimeout(200);
      await this.clic(MENU.salta[0], MENU.salta[1]);
      await attiva('Creazione');
      await pagina.waitForTimeout(200);
    },

    /** Esegue f(scenaMondo, argomento) dentro la pagina. */
    mondo(f, argomento) {
      return pagina.evaluate(new Function('arg', `const s = window.gioco.scene.getScene('Mondo'); return (${f})(s, arg);`), argomento);
    },

    /** Da un punto del mondo al punto dello schermo dove cliccare. */
    schermoDa(punto) {
      return this.mondo((s, p) => {
        const c = s.cameras.main;
        return { x: (p.x - c.worldView.x) * c.zoom + c.x, y: (p.y - c.worldView.y) * c.zoom + c.y };
      }, punto);
    },

    async chiudi() {
      await browser.close();
      console.log(`\nRiepilogo: ${riusciti} riusciti, ${falliti} falliti`);
      return falliti;
    },
  };
}

/** Il menu iniziale (src/scenes/ScenaMenu.ts, costante MENU) e il pulsante "Salta" dell'introduzione. */
const MENU = {
  x: 480,
  continua: 250,
  nuova: 306,
  carica: 362,
  opzioni: 418,
  crediti: 474,
  righeSlot: [170, 270, 370],
  indietro: 492,
  salta: [880, 34],
};

/**
 * La barra in basso (dalla fase 4c): 4 azioni fisse e 6 preferiti, quadrati ogni
 * 52 px, centrati nello schermo, con uno stacco di 40 px tra i due gruppi.
 */
const xBarra = (i) => 226 + i * 52 + (i >= 4 ? 40 : 0);
const BARRA = {
  capriola: [xBarra(0), 512],
  abilita: [xBarra(1), 512],
  secondaria: [xBarra(2), 512],
  compagno: [xBarra(3), 512],
  /** n da 0 a 5 (tasti 1–6). */
  preferito: (n) => [xBarra(4 + n), 512],
};

module.exports = { apriGioco, BARRA, MENU };

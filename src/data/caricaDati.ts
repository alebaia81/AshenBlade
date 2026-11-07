// Carica e controlla TUTTI i dati del gioco: mappe, nemici, armi.
// import.meta.glob è una funzione di Vite: al momento della compilazione
// trova i file e li incolla nel bundle. Quindi:
// - per aggiungere una mappa basta creare un nuovo file JSON, senza toccare il codice;
// - nessun file viene scaricato mentre si gioca (tutto sta dentro gioco.html).

import { ABILITA_CONOSCIUTE, PASSIVE_CONOSCIUTE } from '../systems/abilita';
import type { Ricetta } from '../systems/crafting';
import { validaDialogo, type Dialogo } from '../systems/dialoghi';
import { NOMI_CARATTERISTICHE } from '../systems/caratteristiche';
import { leggiDado } from '../systems/dadi';
import { EFFETTI_ARMA, EFFETTI_ARMATURA } from '../systems/effettiArmi';
import { PEZZI_ARMATURA, type CatalogoIndossabili, type Indossabile } from '../systems/equipaggiamento';
import { comportamentoEsiste } from '../systems/ia/comportamenti';
import { validaNegozio } from '../systems/negozio';
import { analizzaMappa, celleAbitante, celleBarriera, celleForziere, celleNemico, cellePorte, celleVena } from '../systems/mappa';
import { validaBoss } from '../systems/boss';
import { validaCondizioni } from '../systems/condizioniMappa';
import { RICHIESTE } from '../systems/ia/comportamenti';
import { validaMondo } from '../systems/mondo';
import { validaSprite, type DatiSprite, type Strato } from '../systems/sprite';
import { EFFETTI_GIOCO, validaMusica, type DatiMusica } from '../systems/sequenze';
import { chiConclude, validaQuest, type CatalogoQuest } from '../systems/quest';
import { idPotenziato, MASSIMO_POTENZIAMENTO, type TabellaPotenziamenti } from '../systems/potenziamento';
import { colorePerRarita, EFFETTI_OGGETTO, RARITA, type DefinizioneOggetto } from '../systems/oggetti';
import type { DefinizioneClasse } from '../systems/personaggio';
import { ABILITA_COMPAGNO, BONUS_COMPAGNO } from '../systems/tipi';
import type { DefinizioneAbitante, DefinizioneArma, DefinizioneCompagno, DefinizioneArmatura, DefinizioneMappa, DefinizioneNemico, Mappa } from '../systems/tipi';
import datiAbitanti from './abitanti.json';
import datiArmature from './armature.json';
import datiArmi from './armi.json';
import datiClassi from './classi.json';
import datiCompagni from './compagni.json';
import datiDialoghi from './dialoghi.json';
import datiLivelli from './livelli.json';
import datiMondo from './mondo.json';
import datiNemici from './nemici.json';
import datiNegozi from './negozio.json';
import datiRicette from './ricette.json';
import datiPotenziamenti from './potenziamenti.json';
import datiQuest from './quest.json';
import datiBoss from './boss.json';
import datiFinale from './finale.json';
import datiIntro from './intro.json';
import datiOggetti from './oggetti.json';
import datiSprite from './sprite.json';
import datiMusica from './musica.json';

const fileMappe = import.meta.glob<DefinizioneMappa>('./mappe/*.json', {
  eager: true, // carica subito, non in modo asincrono
  import: 'default',
});

export interface DatiGioco {
  mappe: Record<string, Mappa>;
  mappaIniziale: string;
  nemici: Record<string, DefinizioneNemico>;
  armi: Record<string, DefinizioneArma>;
  classi: Record<string, DefinizioneClasse>;
  armature: Record<string, DefinizioneArmatura>;
  /**
   * TUTTO ciò che può stare nello zaino: pozioni e borse di oggetti.json, più
   * una voce per ogni arma e armatura. Così zaino, forzieri e bottino trattano
   * allo stesso modo una pozione e una spada.
   */
  oggetti: Record<string, DefinizioneOggetto>;
  /** Armi e armature viste dalle regole dell'equipaggiamento. */
  indossabili: CatalogoIndossabili;
  /** Le persone del villaggio e cosa dicono. */
  abitanti: Record<string, DefinizioneAbitante>;
  dialoghi: Record<string, Dialogo>;
  /** Cosa vende ogni mercante (per ora solo Gemma). */
  negozi: Record<string, DefinizioneNegozio>;
  /** I compagni della taverna. */
  compagni: Record<string, DefinizioneCompagno>;
  /** Le ricette del fabbro. */
  ricette: Record<string, Ricetta>;
  /** Quanto costa ogni livello di potenziamento (fase 6b). */
  potenziamenti: TabellaPotenziamenti;
  /** Le quest (fase 7). */
  quest: CatalogoQuest;
  /** Le pagine del finale (fase 8c). */
  finale: string[];
  /** Le pagine del testo introduttivo (fase 9a, design §3). */
  intro: string[];
  /** Le mappe in cui si salva da soli entrando (il villaggio, §12). */
  salvataggioAutomatico: string[];
  /** Quale pixel art per quale cosa (fase 9b). */
  sprite: DatiSprite;
  /** Musica ed effetti sonori (fase 9c). */
  musica: DatiMusica;
  /** Esperienza totale per ogni livello (indice 0 = livello 1). */
  soglieLivelli: number[];
}

export interface DefinizioneNegozio {
  nome: string;
  /** Id degli oggetti in vendita: la merce non finisce mai. */
  merce: string[];
}



/**
 * Analizza e valida tutti i dati. Se qualcosa non va lancia un errore
 * con l'elenco completo dei problemi, che il gioco mostrerà a schermo.
 */
export function caricaDati(): DatiGioco {
  // JSON importato: TypeScript lo vede come "string" dove noi abbiamo tipi più precisi (il foglio).
  const sprite = datiSprite as unknown as DatiSprite;
  const musica = datiMusica as unknown as DatiMusica;
  const mappe: Record<string, Mappa> = {};
  for (const [percorso, definizione] of Object.entries(fileMappe)) {
    const mappa = analizzaMappa(definizione);
    if (mappe[mappa.id]) throw new Error(`Due mappe hanno lo stesso id "${mappa.id}" (${percorso})`);
    mappe[mappa.id] = mappa;
  }

  // I JSON importati hanno un tipo "dedotto" da TypeScript; qui diciamo che
  // seguono le nostre interfacce, e i controlli sotto verificano i punti delicati.
  // L'id è la chiave del JSON: lo copiamo dentro, così un nemico sa "chi è".
  // I boss (fase 8a) sono nemici con le fasi: stanno in boss.json ma si usano come gli altri.
  const nemici = Object.fromEntries(Object.entries({ ...datiNemici, ...datiBoss }).map(([id, n]) => [id, { ...n, id }])) as unknown as Record<string, DefinizioneNemico>;
  const armiBase = datiArmi as Record<string, DefinizioneArma>;
  // Ogni arma esiste anche come +1…+5: oggetti a sé, così zaino, barra e
  // negozio non devono sapere nulla dei potenziamenti (vedi systems/potenziamento.ts).
  const armi = { ...armiBase, ...varianti(armiBase) };
  const potenziamenti = datiPotenziamenti as TabellaPotenziamenti;
  const quest = datiQuest as unknown as CatalogoQuest;
  const classi = datiClassi as unknown as Record<string, DefinizioneClasse>;
  const soglieLivelli = datiLivelli.soglie;
  const armature = datiArmature as unknown as Record<string, DefinizioneArmatura>;
  const soloOggetti = datiOggetti as unknown as Record<string, DefinizioneOggetto>;
  const oggetti: Record<string, DefinizioneOggetto> = { ...soloOggetti, ...voci(armi, voceArma), ...voci(armature, voceArmatura), monete: MONETE };
  const abitanti = datiAbitanti as Record<string, DefinizioneAbitante>;
  const dialoghi = datiDialoghi as unknown as Record<string, Dialogo>;
  const negozi = datiNegozi as Record<string, DefinizioneNegozio>;
  const compagni = datiCompagni as unknown as Record<string, DefinizioneCompagno>;
  const ricette = datiRicette as Record<string, Ricetta>;
  const indossabili = { ...voci(armi, indossabileArma), ...voci(armature, indossabileArmatura) };

  const errori = [
    ...idRipetuti(soloOggetti, armiBase, armature, { monete: MONETE }),
    ...controllaPotenziamenti(potenziamenti, oggetti),
    ...idRipetuti(datiNemici, datiBoss),
    ...Object.values(mappe).flatMap((m) => validaCondizioni(m)),
    ...Object.values(nemici).flatMap((n) => {
      const serve = RICHIESTE[n.comportamento];
      return serve && !n[serve] ? [`Nemico "${n.id}": il comportamento "${n.comportamento}" richiede "${serve}"`] : [];
    }),
    ...Object.values(nemici).flatMap((n) => (n.fasi ? validaBoss(n.id, n.fasi, Object.keys(nemici)) : [])),
    ...Object.values(mappe).flatMap((m) => [
      ...cellePorte(m).filter((p) => !oggetti[p.chiave]).map((p) => `Mappa "${m.id}": la porta in (${p.cella.col}, ${p.cella.riga}) si apre con "${p.chiave}", che non esiste`),
      ...celleForziere(m).filter((f) => f.chiusoCon && !oggetti[f.chiusoCon]).map((f) => `Mappa "${m.id}": il forziere in (${f.cella.col}, ${f.cella.riga}) chiede "${f.chiusoCon}", che non esiste`),
      ...celleBarriera(m)
        .filter((b) => !celleNemico(m).some((n) => n.idNemico === b.boss && nemici[b.boss]?.fasi))
        .map((b) => `Mappa "${m.id}": la barriera è del boss "${b.boss}", che non è in questa mappa`),
    ]),
    ...Object.entries(dialoghi).flatMap(([id, d]) => validaDialogo(id, d, Object.keys(quest))),
    ...validaQuest(quest, { nemici: Object.keys(nemici), oggetti: Object.keys(oggetti), abitanti: Object.keys(abitanti), mappe: Object.keys(mappe), forzieri: tuttiIForzieri(mappe) }),
    ...questSenzaDialogo(quest, dialoghi, abitanti, oggetti),
    ...Object.entries(negozi).flatMap(([id, n]) => validaNegozio(id, n.merce, oggetti)),
    ...Object.entries(compagni).flatMap(([id, c]) => controllaCompagno(id, c, classi)),
    ...controllaRicette(ricette, oggetti),
    ...Object.values(mappe).flatMap((m) =>
      celleVena(m)
        .filter(({ materiale }) => oggetti[materiale]?.tipo !== 'materiale')
        .map(({ materiale }) => `Mappa "${m.id}": la vena contiene "${materiale}", che non è un materiale`),
    ),
    ...Object.values(oggetti)
      .filter((o) => o.tipo !== 'monete' && o.tipo !== 'missione' && !(Number.isInteger(o.prezzo) && o.prezzo > 0))
      .map((o) => `"${o.id}": serve un "prezzo" (intero, in monete)`),
    ...Object.entries(abitanti).flatMap(([id, a]) => controllaAbitante(id, a, dialoghi)),
    ...Object.values(mappe).flatMap((m) =>
      celleAbitante(m)
        .filter(({ idAbitante }) => !abitanti[idAbitante])
        .map(({ idAbitante }) => `Mappa "${m.id}": l'abitante "${idAbitante}" non esiste in abitanti.json`),
    ),
    ...validaMondo(mappe, datiMondo.mappaIniziale, Object.keys(nemici), Object.keys(oggetti)),
    ...datiMondo.salvataggioAutomatico
      .filter((id) => !mappe[id])
      .map((id) => `mondo.json: la mappa "${id}" del salvataggio automatico non esiste`),
    ...(datiIntro.pagine.length === 0 || datiIntro.pagine.some((p) => !p.trim()) ? ['intro.json: servono pagine non vuote'] : []),
    ...Object.entries(nemici).flatMap(([id, n]) => controllaNemico(id, n, oggetti)),
    ...Object.entries(oggetti).flatMap(([id, o]) => controllaOggetto(id, o)),
    ...Object.entries(armi).flatMap(([id, a]) => controllaArma(id, a)),
    ...Object.entries(armature).flatMap(([id, a]) => controllaArmatura(id, a)),
    ...Object.entries(classi).flatMap(([id, c]) => controllaClasse(id, c, armi)),
    ...controllaSoglie(soglieLivelli),
    ...validaMusica(musica, Object.keys(mappe), EFFETTI_GIOCO).map((e) => `musica.json: ${e.replace(/^musica\.json: /, '')}`),
    ...validaSprite(sprite, {
      classi: Object.keys(classi),
      compagni: Object.keys(compagni),
      abitanti: Object.keys(abitanti),
      nemici: Object.keys(nemici),
      vene: [...new Set(Object.values(mappe).flatMap((m) => celleVena(m).map((v) => v.materiale)))],
      tessere: Object.fromEntries(
        Object.values(mappe).flatMap((m) =>
          Object.entries(m.legenda).flatMap(([s, v]): [string, Strato | Strato[] | undefined][] => [
            [`Mappa "${m.id}", simbolo "${s}"`, v.tessera],
            ...(v.tipo === 'segreto' ? [[`Mappa "${m.id}", muro segreto "${s}"`, v.tesseraMuro] as [string, Strato | Strato[] | undefined]] : []),
          ]),
        ),
      ),
    }),
  ];
  if (errori.length > 0) throw new Error('Errori nei dati:\n- ' + errori.join('\n- '));

  return { mappe, mappaIniziale: datiMondo.mappaIniziale, nemici, armi, armature, classi, soglieLivelli, oggetti, indossabili, abitanti, dialoghi, negozi, compagni, ricette, potenziamenti, quest, finale: datiFinale.pagine, intro: datiIntro.pagine, salvataggioAutomatico: datiMondo.salvataggioAutomatico, sprite, musica };
}

/**
 * Le monete a terra sono "oggetti" come gli altri (così bottino e forzieri le
 * trattano allo stesso modo), ma non vanno mai nello zaino: vedi ScenaMondo.raccogli.
 */
const MONETE: DefinizioneOggetto = {
  id: 'monete',
  nome: 'Monete',
  descrizione: 'Monete d’oro.',
  tipo: 'monete',
  rarita: 'comune',
  pila: 1_000_000,
  prezzo: 0,
  colore: '#ffc94a',
};

function controllaAbitante(id: string, a: DefinizioneAbitante, dialoghi: Record<string, Dialogo>): string[] {
  const errori: string[] = [];
  if (a.id !== id) errori.push(`Abitante "${id}": il campo id vale "${a.id}"`);
  if (!dialoghi[a.dialogo]) errori.push(`Abitante "${id}": il dialogo "${a.dialogo}" non esiste in dialoghi.json`);
  return errori;
}

/** Applica "trasforma" a ogni voce, tenendo le stesse chiavi. */
function voci<T, R>(dati: Record<string, T>, trasforma: (v: T) => R): Record<string, R> {
  return Object.fromEntries(Object.entries(dati).map(([id, v]) => [id, trasforma(v)]));
}

/** Tutti i forzieri del mondo, come "mappa:colonna:riga" (lo stesso formato della Partita). */
function tuttiIForzieri(mappe: Record<string, Mappa>): string[] {
  return Object.values(mappe).flatMap((m) => celleForziere(m).map(({ cella }) => `${m.id}:${cella.col}:${cella.riga}`));
}

/**
 * Ogni quest deve potersi ACCETTARE nel dialogo di chi la affida e CONCLUDERE
 * nel dialogo di chi la chiude: altrimenti resterebbe un "!" eterno.
 */
function questSenzaDialogo(
  quest: CatalogoQuest,
  dialoghi: Record<string, Dialogo>,
  abitanti: Record<string, DefinizioneAbitante>,
  oggetti: Record<string, DefinizioneOggetto>,
): string[] {
  const oggettoCheAvvia = (id: string) => {
    const e = oggetti[id]?.effetto;
    return e?.tipo === 'mappa' ? e.quest : null;
  };
  const azioni = (abitante: string) =>
    Object.values(dialoghi[abitanti[abitante]?.dialogo ?? '']?.nodi ?? {}).flatMap((n) => n.risposte.flatMap((r) => (r.azione ? [r.azione] : [])));
  const errori: string[] = [];
  for (const d of Object.values(quest)) {
    // La mappa del tesoro si accetta usandola e si chiude da sola: niente dialoghi.
    if (d.siAccettaCon) {
      if (oggettoCheAvvia(d.siAccettaCon) !== d.id) errori.push(`Quest "${d.id}": "${d.siAccettaCon}" non ha l'effetto "mappa" verso questa quest`);
    } else if (!azioni(d.daChi).some((a) => 'accetta' in a && a.accetta === d.id)) errori.push(`Quest "${d.id}": nel dialogo di "${d.daChi}" manca la risposta per accettarla`);
    if (!d.automatica && !azioni(chiConclude(d)).some((a) => 'concludi' in a && a.concludi === d.id)) errori.push(`Quest "${d.id}": nel dialogo di "${chiConclude(d)}" manca la risposta per concluderla`);
  }
  return errori;
}

/** "Spada lunga +2": stesso dado e stessi effetti, +2 al danno, vale il 20% in più per livello. */
function varianti(armi: Record<string, DefinizioneArma>): Record<string, DefinizioneArma> {
  const tutte: Record<string, DefinizioneArma> = {};
  for (const a of Object.values(armi)) {
    for (let livello = 1; livello <= MASSIMO_POTENZIAMENTO; livello++) {
      const id = idPotenziato(a.id, livello);
      tutte[id] = { ...a, id, nome: `${a.nome} +${livello}`, potenziamento: livello, prezzo: Math.round(a.prezzo * (1 + 0.2 * livello)) };
    }
  }
  return tutte;
}

/** Un livello per ogni passo da +1 a +5, materiali veri, un moltiplicatore per ogni rarità. */
function controllaPotenziamenti(t: TabellaPotenziamenti, oggetti: Record<string, DefinizioneOggetto>): string[] {
  const errori: string[] = [];
  for (let l = 1; l <= MASSIMO_POTENZIAMENTO; l++) {
    const voce = t.livelli.find((v) => v.livello === l);
    if (!voce) errori.push(`potenziamenti.json: manca il livello +${l}`);
    else
      for (const m of Object.keys(voce.materiali))
        if (oggetti[m]?.tipo !== 'materiale') errori.push(`potenziamenti.json: il livello +${l} chiede "${m}", che non è un materiale`);
  }
  for (const r of RARITA) if (!(t.moltiplicatoreRarita[r] > 0)) errori.push(`potenziamenti.json: manca il moltiplicatore per "${r}"`);
  return errori;
}

// Come un'arma o un'armatura appare nello zaino: un oggetto che non si impila.
function voceArma(a: DefinizioneArma): DefinizioneOggetto {
  return { id: a.id, nome: a.nome, descrizione: a.descrizione, tipo: 'arma', rarita: a.rarita, pila: 1, prezzo: a.prezzo, colore: colorePerRarita(a.rarita), forma: a.tipo };
}

function voceArmatura(a: DefinizioneArmatura): DefinizioneOggetto {
  return { id: a.id, nome: a.nome, descrizione: a.descrizione, tipo: 'armatura', rarita: a.rarita, pila: 1, prezzo: a.prezzo, colore: colorePerRarita(a.rarita), forma: a.pezzo };
}

function indossabileArma(a: DefinizioneArma): Indossabile {
  return {
    categoria: 'arma',
    spazio: a.slot,
    rarita: a.rarita,
    armatura: 0,
    effetti: a.effetti,
    usaMana: (a.proiettile?.costoMana ?? 0) > 0,
  };
}

function indossabileArmatura(a: DefinizioneArmatura): Indossabile {
  return { categoria: 'armatura', spazio: a.pezzo, rarita: a.rarita, armatura: a.armatura, bonus: a.bonus, effetti: a.effetti, usaMana: false };
}

/** Lo stesso id in due file creerebbe confusione nello zaino: vietato. */
function idRipetuti(...elenchi: Record<string, unknown>[]): string[] {
  const visti = new Set<string>();
  const errori: string[] = [];
  for (const id of elenchi.flatMap((e) => Object.keys(e))) {
    if (visti.has(id)) errori.push(`L'id "${id}" è usato in due file (oggetti, armi, armature)`);
    visti.add(id);
  }
  return errori;
}

function controllaNemico(id: string, n: DefinizioneNemico, oggetti: Record<string, DefinizioneOggetto>): string[] {
  const errori = controllaDado(`Nemico "${id}"`, n.danno);
  if (!comportamentoEsiste(n.comportamento)) errori.push(`Nemico "${id}": comportamento "${n.comportamento}" sconosciuto`);
  if (n.vita <= 0) errori.push(`Nemico "${id}": la vita deve essere maggiore di 0`);
  for (const voce of n.bottino ?? []) {
    if (!oggetti[voce.oggetto]) errori.push(`Nemico "${id}": nel bottino l'oggetto "${voce.oggetto}" non esiste`);
  }
  if (!Array.isArray(n.bottino)) errori.push(`Nemico "${id}": manca il "bottino" (anche vuoto: [])`);
  if (!Array.isArray(n.etichette)) errori.push(`Nemico "${id}": manca l'elenco "etichette" (anche vuoto: [])`);
  if (!(n.esperienza > 0)) errori.push(`Nemico "${id}": deve dare esperienza (campo "esperienza")`);
  const [minimo, massimo] = n.monete ?? [];
  if (!(Number.isInteger(minimo) && Number.isInteger(massimo) && minimo! >= 0 && massimo! >= minimo!)) {
    errori.push(`Nemico "${id}": "monete" deve essere [minimo, massimo], numeri interi`);
  }
  if (n.raggioAbbandono <= n.raggioVista) {
    errori.push(`Nemico "${id}": raggioAbbandono deve essere maggiore di raggioVista`);
  }
  return errori;
}

function controllaDado(chi: string, dado: string): string[] {
  try {
    leggiDado(dado);
    return [];
  } catch (e) {
    return [`${chi}: ${(e as Error).message}`];
  }
}

function controllaArma(id: string, a: DefinizioneArma): string[] {
  const errori = controllaDado(`Arma "${id}"`, a.dado);
  if (a.id !== id) errori.push(`Arma "${id}": il campo id vale "${a.id}"`);
  for (const e of a.effetti) {
    if (!(EFFETTI_ARMA as readonly string[]).includes(e)) errori.push(`Arma "${id}": effetto "${e}" sconosciuto`);
  }
  if (a.slot !== 'primaria' && a.slot !== 'secondaria') errori.push(`Arma "${id}": slot "${a.slot}" sconosciuto`);
  // Le armi secondarie sono tutte a distanza (design §7): arco, balestra, pugnali da lancio, bacchetta.
  if (a.slot === 'secondaria' && !a.proiettile) errori.push(`Arma "${id}": un'arma secondaria deve avere un "proiettile"`);
  if (!RARITA.includes(a.rarita)) errori.push(`Arma "${id}": rarità "${a.rarita}" sconosciuta`);
  if (!NOMI_CARATTERISTICHE.includes(a.caratteristica)) {
    errori.push(`Arma "${id}": caratteristica "${a.caratteristica}" sconosciuta`);
  }
  return errori;
}

function controllaClasse(id: string, c: DefinizioneClasse, armi: Record<string, DefinizioneArma>): string[] {
  const errori: string[] = [];
  if (c.id !== id) errori.push(`Classe "${id}": il campo id vale "${c.id}"`);
  for (const nome of NOMI_CARATTERISTICHE) {
    if (typeof c.caratteristiche[nome] !== 'number') errori.push(`Classe "${id}": manca la caratteristica ${nome}`);
  }
  if (!armi[c.arma]) errori.push(`Classe "${id}": l'arma "${c.arma}" non esiste in armi.json`);
  if (!(ABILITA_CONOSCIUTE as readonly string[]).includes(c.abilita.id)) {
    errori.push(`Classe "${id}": abilità "${c.abilita.id}" sconosciuta`);
  }
  if (c.abilita.dado) errori.push(...controllaDado(`Abilità "${c.abilita.id}"`, c.abilita.dado));
  if (c.abilita.costoMana > 0 && c.manaBase <= 0) {
    errori.push(`Classe "${id}": l'abilità costa mana ma la classe non ne ha (manaBase 0)`);
  }
  for (const passiva of c.passive) {
    if (!(PASSIVE_CONOSCIUTE as readonly string[]).includes(passiva)) errori.push(`Classe "${id}": passiva "${passiva}" sconosciuta`);
  }
  const arma = armi[c.arma];
  if (arma?.proiettile && arma.proiettile.costoMana > 0 && c.manaBase <= 0) {
    errori.push(`Classe "${id}": l'arma "${c.arma}" usa mana ma la classe non ne ha`);
  }
  return errori;
}

function controllaSoglie(soglie: number[]): string[] {
  if (soglie[0] !== 0) return ['livelli.json: la prima soglia (livello 1) deve essere 0'];
  const ok = soglie.every((s, i) => i === 0 || s > soglie[i - 1]!);
  return ok ? [] : ['livelli.json: le soglie devono essere crescenti'];
}

function controllaOggetto(id: string, o: DefinizioneOggetto): string[] {
  const errori: string[] = [];
  if (o.id !== id) errori.push(`Oggetto "${id}": il campo id vale "${o.id}"`);
  if (!RARITA.includes(o.rarita)) errori.push(`Oggetto "${id}": rarità "${o.rarita}" sconosciuta`);
  if (!(o.pila >= 1)) errori.push(`Oggetto "${id}": la pila deve essere almeno 1`);
  if (o.effetto && !(EFFETTI_OGGETTO as readonly string[]).includes(o.effetto.tipo)) {
    errori.push(`Oggetto "${id}": effetto "${o.effetto.tipo}" sconosciuto`);
  }
  return errori;
}

function controllaArmatura(id: string, a: DefinizioneArmatura): string[] {
  const errori: string[] = [];
  if (a.id !== id) errori.push(`Armatura "${id}": il campo id vale "${a.id}"`);
  if (!PEZZI_ARMATURA.includes(a.pezzo)) errori.push(`Armatura "${id}": pezzo "${a.pezzo}" sconosciuto`);
  if (!RARITA.includes(a.rarita)) errori.push(`Armatura "${id}": rarità "${a.rarita}" sconosciuta`);
  if (!(a.armatura >= 0)) errori.push(`Armatura "${id}": l'armatura non può essere negativa`);
  for (const e of a.effetti) {
    if (!(EFFETTI_ARMATURA as readonly string[]).includes(e)) errori.push(`Armatura "${id}": effetto "${e}" sconosciuto`);
  }
  if (a.rarita === 'esotica' && a.effetti.length === 0) errori.push(`Armatura "${id}": un pezzo esotico deve avere un effetto speciale`);
  for (const nome of Object.keys(a.bonus ?? {})) {
    if (!(NOMI_CARATTERISTICHE as readonly string[]).includes(nome)) errori.push(`Armatura "${id}": bonus a "${nome}", che non è una caratteristica`);
  }
  return errori;
}

function controllaCompagno(id: string, c: DefinizioneCompagno, classi: Record<string, DefinizioneClasse>): string[] {
  const errori = controllaDado(`Compagno "${id}"`, c.danno);
  if (c.id !== id) errori.push(`Compagno "${id}": il campo id vale "${c.id}"`);
  if (!classi[c.classe]) errori.push(`Compagno "${id}": la classe "${c.classe}" non esiste`);
  if (!(c.prezzo > 0)) errori.push(`Compagno "${id}": serve un "prezzo"`);
  if (!(BONUS_COMPAGNO as readonly string[]).includes(c.bonus.tipo)) errori.push(`Compagno "${id}": bonus "${c.bonus.tipo}" sconosciuto`);
  if (!(ABILITA_COMPAGNO as readonly string[]).includes(c.abilita.id)) errori.push(`Compagno "${id}": abilità "${c.abilita.id}" sconosciuta`);
  return errori;
}

/**
 * Le ricette: creano armi (mai esotiche, §8), con materiali veri. Ogni ricetta
 * non di base deve avere una pergamena che la insegna, altrimenti nessuno
 * potrebbe mai impararla; e ogni pergamena deve insegnare una ricetta esistente.
 */
function controllaRicette(ricette: Record<string, Ricetta>, oggetti: Record<string, DefinizioneOggetto>): string[] {
  const errori: string[] = [];
  const insegnate = Object.values(oggetti).flatMap((o) => (o.effetto?.tipo === 'ricetta' ? [o.effetto.ricetta] : []));
  for (const [id, r] of Object.entries(ricette)) {
    const risultato = oggetti[r.risultato];
    if (r.id !== id) errori.push(`Ricetta "${id}": il campo id vale "${r.id}"`);
    if (risultato?.tipo !== 'arma') errori.push(`Ricetta "${id}": "${r.risultato}" non è un'arma`);
    else if (risultato.rarita === 'esotica') errori.push(`Ricetta "${id}": le armi esotiche non si creano col crafting (§8)`);
    for (const [m, q] of Object.entries(r.materiali)) {
      if (oggetti[m]?.tipo !== 'materiale') errori.push(`Ricetta "${id}": "${m}" non è un materiale`);
      if (!(Number.isInteger(q) && q > 0)) errori.push(`Ricetta "${id}": quantità di "${m}" non valida`);
    }
    if (!r.conosciutaDallInizio && !insegnate.includes(id)) errori.push(`Ricetta "${id}": nessuna pergamena la insegna`);
    if (r.conosciutaDallInizio && insegnate.includes(id)) errori.push(`Ricetta "${id}": è di base, una pergamena non servirebbe`);
  }
  for (const i of insegnate) if (!ricette[i]) errori.push(`Una pergamena insegna "${i}", che non è una ricetta`);
  return errori;
}

# Espansione a 5–6 ore — manuale per chi sviluppa

> **A chi è rivolto.** A chi continua lo sviluppo del gioco dopo la fase 9, persona o AI. La storia (chi, cosa, dove) sta in `docs/storia.md`. Le regole del gioco stanno in `docs/design.md`, che resta la **fonte di verità**. Qui ci sono il *come*: le nuove fasi, i sistemi da costruire, i formati dei dati, il bilanciamento e le regole di lavoro.
>
> **Stato:** approvato con Ale il 22/11/2026. Le decisioni segnate **[deciso]** non si cambiano senza chiederlo ad Ale; il resto è una proposta ragionata, migliorabile.

## 1. Regole di lavoro (valgono per tutte le fasi)

Sono le stesse delle fasi 1–9, riassunte da `docs/prompt-cowork.md`:

- **Chi è Ale:** programma per il web (JavaScript) ma non ha mai fatto videogiochi. Spiegagli i concetti nuovi con **paragoni dal mondo web**. Parla e scrivi **sempre in italiano**: interfaccia, commenti nel codice, documenti.
- **Il design è la fonte di verità.** Se una richiesta lo contraddice, fallo notare; se Ale conferma, aggiorna **prima** `docs/design.md`, poi il codice.
- **Sul PC di Ale non si installa nulla.** Node, npm, Playwright e il resto esistono solo nell'ambiente di lavoro. Il gioco si consegna come **un solo file**, `dist/gioco.html`, che si apre con doppio clic, **senza internet**.
- **Stack:** Phaser 4, TypeScript strict, Vite (plugin single-file), Vitest. Nessuna dipendenza nuova senza chiedere.
- **Architettura:** `src/systems/` (regole pure, senza Phaser, sempre con test), `src/scenes/`, `src/entities/`, `src/audio/`, `src/data/` (contenuti in JSON). File piccoli con un compito solo. Commenti in italiano che spiegano il **perché**.
- **Comandi col mouse** prima di tutto; la tastiera offre solo scorciatoie (design §13).
- **Per ogni fase (o consegna):**
  1. **Piano** in `docs/piani/fase-N.md`, poi **fermati** e aspetta l'approvazione di Ale.
  2. **Sviluppo:** per i `systems`, prima i test e poi il codice.
  3. **Verifica:** `npx tsc --noEmit`, `npx vitest run`, `npx vite build`, e le **prove nel browser** (`tests/browser/`, vedi il loro `LEGGIMI.md`), comprese quelle vecchie. Non dire che una cosa funziona senza averla verificata.
  4. **Consegna:** `dist/gioco.html` aggiornato, schermate in `docs/schermate/fase-N…/`, lezione in `docs/lezioni/fase-N.md` (concetti nuovi con riferimenti `file:riga` ed esercizio facoltativo).
  5. **Riepilogo** breve, cosa provare giocando e la **tabella delle fasi aggiornata** (Ale la chiede sempre). Poi fermati.
- **I salvataggi esistenti non si rompono.** Ogni campo nuovo della Partita richiede di alzare `VERSIONE_SALVATAGGIO` e scrivere una **migrazione** in `src/systems/salvataggio.ts` (vedi §5.11), con il suo test.

## 2. Com'è fatto il gioco oggi (in breve)

| Cosa | Dove | Note |
|---|---|---|
| Mappe | `src/data/mappe/*.json` | griglia di caratteri + legenda; ogni simbolo ha `tipo` e `tessera` (pixel art); uscite con `verso`/`arrivo`; `cambiaCon`/`diventa` per le mappe che cambiano con la storia; `notte` |
| Nemici e boss | `src/data/nemici.json`, `boss.json` | comportamenti `inseguitore`, `tiratore`, `caricatore`; i boss hanno `fasi` con attacchi a etichetta (`evoca`, `carica`, `crollo_massi`, `teletrasporto`, `incantesimo`) e `bottino` con probabilità |
| Persone e dialoghi | `abitanti.json`, `dialoghi.json` | nodi con condizioni (`se`) e azioni (accetta/concludi quest) |
| Quest | `quest.json` | passi `elimina`, `raccogli`, `consegna`, `parla`, `raggiungi`, `trova`; `richiede`, `automatica`, `siAccettaCon` |
| Oggetti, armi, armature | `oggetti.json`, `armi.json`, `armature.json` | rarità da comune a esotica; effetti a etichetta (`effettiArmi.ts`) |
| Crafting | `ricette.json`, `potenziamenti.json` | un solo fabbro (Bruno, `ScenaFucina`), potenziamenti +1…+5 |
| Compagni | `compagni.json` | 4 a pagamento in taverna, uno alla volta |
| Grafica | `sprite.json` | fogli Kenney `citta`/`dungeon` (12×11 tessere da 16 px) + disegni scritti come testo |
| Musica ed effetti | `musica.json` | brani per zona (`zone`), effetti sonori |
| Controllo dei dati | `src/data/caricaDati.ts` | all'avvio controlla **tutto**: un errore nei dati ferma il gioco con un messaggio leggibile |

**Molto si fa solo con i dati.** Una mappa nuova con nemici, forzieri, persone, cartelli e porte è solo JSON: nessuna riga di codice. Il codice serve solo per i **sistemi nuovi** (§5).

## 3. Cosa richiede codice e cosa no

| Contenuto dell'espansione | Solo dati | Codice nuovo |
|---|---|---|
| 15 mappe nuove, villaggi, zone, dungeon | ✅ | — |
| Persone, dialoghi, quest (anche le commissioni) | ✅ | — |
| Nemici nuovi che riusano i comportamenti esistenti | ✅ | — |
| Armi e armature con effetti esistenti | ✅ | — |
| Musica per le zone nuove | ✅ | — |
| Bottino dei boss "uno tra" e l'Eco | — | §5.1, §5.2 |
| Compagni di viaggio che si uniscono con la storia, abilità nuove | — | §5.3 |
| Tesori sepolti e pala, rocce crepate, porte runiche | — | §5.4, §5.5 |
| Pietre di passaggio (viaggio rapido) | — | §5.6 |
| Amuleto (quinto pezzo dell'equipaggiamento) | — | §5.7 |
| Banchi di crafting diversi (Ugo, alchimia di Selva) | in parte | §5.8 |
| Ricordi della Casa sul Colle | quasi (un aspetto nuovo dei cartelli) | §5.9 |
| Re Melma che si divide, bombe di zolfo di Ferrante | — | §5.10 (nuovi attacchi dei boss) |
| Effetti esotici nuovi | — | uno per arma, in `effettiArmi.ts` |

## 4. Bottino dei boss ed Eco **[deciso]**

**Regola** (decisa con Ale):

- **Prima sconfitta:** 1 pezzo **leggendario garantito**, tirato a caso dalla lista `leggendari` del boss; **25%** di probabilità del suo **esotico "firma"**; pozioni e monete; 1 **frammento d'eco** (garantito, serve per il sigillo).
- **Eco:** il boss si riaffronta in versione potenziata dopo aver forgiato il suo **Sigillo dell'Eco** presso l'artigiano della sua regione (**Bruno** per la Valle, **Ugo** per le Colline, **Selva** per la Brughiera). La **prima vittoria contro l'Eco garantisce l'esotico firma**. Se lo si possiede già, si riceve un esotico "errante" a caso tra quelli non posseduti (Spada di brace, Pugnale dell'ombra, Stivali del vento, Elmo del veggente, Guanti del predatore); se si hanno tutti, monete e frammenti d'eco. Ogni tentativo costa un sigillo. Le vittorie successive danno di nuovo un leggendario della lista e monete, mai l'esotico.
- **Perché così:** gli esotici restano rari e speciali (se ne può indossare solo uno per tipo, design §8); l'Eco lega esplorazione (materiali rari), crafting (il sigillo) e bottino; niente "farmare" all'infinito.

**I boss e le loro tabelle** (proposta; ✅ = oggetto già esistente):

| Boss | Dove | Artigiano del Sigillo | Leggendari (uno garantito) | Esotico firma | Sigillo dell'Eco (ricetta proposta) |
|---|---|---|---|---|---|
| Re Melma 🆕 | Cantine del Mulino | Bruno (`fucina`) | Mazza del mugnaio 🆕, Guanti d'ambra 🆕 (+1 DES) | **Bastone della melma** 🆕: i dardi si dividono in due (effetto nuovo `dardo_diviso`) | 2 ambra, 3 gelatina, 1 frammento d'eco |
| Re Scheletro ✅ | Cripta | Bruno (`fucina`) | Elmo della corona ✅, Stivali del re sepolto 🆕 (+1 COS) | **Lama del vuoto** ✅ | 3 osso antico, 1 frammento di corona, 1 frammento d'eco |
| Ferrante 🆕 | Cave di Zolfo | Ugo (`armature`) | Balestra del contrabbandiere 🆕, Corazza di Ferrante 🆕 (+1 DES) | **Balestra di zolfo** 🆕: i dardi esplodono (effetto nuovo `esplosione`) | 3 zolfo, 2 argento, 1 frammento d'eco |
| Troll ✅ | Miniera | Ugo (`armature`) | Guanti del titano ✅, Elmo del troll 🆕 (+1 FOR) | **Corazza di spine** ✅ | 2 cristallo, 1 zanna di troll, 1 frammento d'eco |
| Selva 🆕 | Osservatorio | Selva (`alchimia`) | Bacchetta di Selva 🆕, Stivali della palude 🆕 (+1 SAG) | **Velo di Selva** 🆕 (corazza: dopo una capriola si è invisibili 1 s, effetto `capriola_ombra`) | 2 essenza d'ombra, 2 giunco, 1 frammento d'eco |
| Negromante ✅ | Torre | Selva (`alchimia`) | Mantello di Orvald 🆕 (corazza, +1 INT +1 SAG), Elmo della luna nera 🆕 (+1 INT) | **Arco del rimbalzo** ✅ | 1 ossidiana, 2 inchiostro di luna, 1 frammento d'eco |
| Radice Marcia 🆕 (facoltativo) | Le Radici | — | Arco della Quercia 🆕, Guanti di corteccia 🆕 (+1 COS) | **Ascia della radice** 🆕: i colpi bloccano il nemico 1 s (effetto `radici`) | si affronta solo nel dopo-storia; niente Eco |

Nota: oggi la **Corazza della Quercia** ✅ è il bottino sicuro del Negromante. Nell'espansione diventa il premio delle 6 ghiande d'oro (`storia.md` §8), e il Negromante lascia uno dei due leggendari qui sopra.

**Esotici fuori dai boss** (design §8: "al massimo uno nascosto per dungeon"):

- **Ciondolo di Lia** 🆕 (amuleto, §5.7): con il quaderno di Lia nel finale. Una volta per zona, sotto il 25% di vita, cura del 50%.
- **Cuore della Quercia** 🆕 (amuleto): 12 ghiande d'oro. Rigenera 1 vita ogni 5 secondi.
- Gli esotici "erranti" ✅ restano nascosti nei dungeon, come oggi.

**L'Eco in pratica:**

- Statistiche: vita ×1,6, danno ×1,3, ricariche degli attacchi speciali ×0,7, una tinta "fantasma" diversa.
- Livello consigliato: quello del boss + 6.
- Si sblocca quando la quest dell'atto è conclusa. Il sigillo si forgia dall'artigiano della regione corrispondente (**[deciso]**: Bruno → Valle, Ugo → Colline, Selva → Brughiera).

## 5. I sistemi nuovi

Ognuno descrive **cosa deve fare**, la **forma dei dati** proposta e i **test** minimi. I nomi dei campi sono proposte.

### 5.1 Bottino "uno tra" dei boss

- Nuovo campo nei boss: `"leggendari": ["mazza_mugnaio", "guanti_ambra"]` e `"esoticoFirma": "bastone_melma"`. Il `bottino` attuale resta per pozioni, monete e materiali.
- Funzione pura in `systems/bottino.ts`: `bottinoBoss(def, partita, casuale, eco: boolean)` → elenco di oggetti, applicando le regole del §4.
- Test: un leggendario sempre; l'esotico esce con probabilità 0,25 (casuale finto); l'Eco dà l'esotico firma se non c'è, altrimenti un errante non posseduto; mai due esotici uguali se già posseduto.

### 5.2 L'Eco dei boss

- Partita: `ecoSconfitti: string[]` (migrazione, §5.11).
- Oggetto `sigillo_eco_<boss>` (tipo `missione`), con la sua ricetta associata al banco della regione (`fucina`, `armature`, `alchimia`).
- Dove si attiva: nella stanza del boss sconfitto c'è un **altare** (nuova cella o cartello che "si usa"). Con il sigillo nello zaino, il boss ricompare in versione Eco e le barriere si chiudono come oggi.
- `boss.json`: un blocco `"eco": { "vita": 1.6, "danno": 1.3, "ricarica": 0.7, "tinta": "#a0e0ff" }`, oppure valori fissi per boss.
- Test: l'Eco parte solo con il sigillo, che viene consumato; `bossSconfitti` non cambia; `ecoSconfitti` sì.

### 5.3 Compagni di viaggio

- `compagni.json`: nuovo campo `"viaggio": true` (non si pagano, si sbloccano con una quest).
- Partita: `compagni.ingaggiati` già esiste; un'azione di dialogo o di quest `"unisci": "tessa"` lo aggiunge.
- Si cambia compagno dalla **taverna** (Tobia) e dalle **pietre di passaggio** (§5.6).
- Abilità nuove (codice in `scenes/mondo/` + regole in `systems/`):
  - **Fiuta!** (Tessa e Brina) **[deciso]**: Brina fiuta **tutto** entro 12 tessere per 10 s — mostra i tesori sepolti e segnala anche muri segreti, rocce crepate e forzieri chiusi/nascosti non ancora aperti.
  - **Polvere nera** (Grisk): bomba nel punto cliccato, danno ad area, rompe le rocce crepate entro 1 tessera.
  - **Velo d'ombra** (Selva): i nemici entro 6 tessere perdono l'eroe per 6 s. Le porte runiche le apre **in automatico** quando Selva è il compagno attivo e l'eroe ci clicca sopra.
- Dialoghi: ogni compagno di viaggio ha 3–5 **commenti** legati a luoghi o momenti (entrando in una mappa, dopo un boss). Proposta: un campo `"commenti": [{ "quando": { "mappa": "casa_colle" }, "testo": "…" }]` mostrato come avviso, una volta sola.

### 5.4 Tesori sepolti e pala

- Nuova cella di mappa `"tipo": "sepolto"`, con `contenuto` e `monete` come i forzieri. Si cammina sopra ed è **invisibile**.
- Si vede con: abilità **Fiuta!**, Elmo del veggente ✅ (estendere l'effetto `veggente`), oppure un indizio scritto (cartello, mappa del tesoro).
- Si scava cliccandoci sopra con la **pala** nello zaino (oggetto `pala`, si compra da Teodoro). Senza pala: "Qui la terra è smossa. Servirebbe una pala."
- Partita: `sepoltiScavati: string[]` ("mappa:col:riga", come i forzieri).
- Test: senza pala non si scava; scavato una volta, non ricompare.

### 5.5 Rocce crepate e porte runiche

- **Roccia crepata:** una cella `"tipo": "crepata"` che si comporta come un muro segreto, ma non si apre con l'arma: la apre solo la **Polvere nera**. Ricordata in `muriAperti` ✅.
- **Porta runica:** una `porta` ✅ con `"runica": true` invece di `chiave`. Si apre con Selva compagna attiva, oppure, nell'Osservatorio, con leve (cartello che "si usa" e apre la porta).

### 5.6 Pietre di passaggio (viaggio rapido)

- Una cella `"tipo": "pietra"` in ogni villaggio e avamposto (borgo, accampamento/Pietrafonda, Guado, ingresso delle Radici).
- Cliccandola si apre un pannello con le pietre già **attivate** (Partita: `pietre: string[]`). Scegliendone una si va al suo punto di arrivo.
- Dalla pietra si può anche **cambiare compagno di viaggio**.
- È necessaria: con ~27 mappe, tornare a piedi al borgo per una commissione richiederebbe minuti.

### 5.7 L'amuleto (quinto pezzo)

- Nuovo spazio nell'equipaggiamento: `amuleto`, accanto a elmo, corazza, guanti e stivali. Modifica il design §8 (aggiornarlo prima).
- Il limite di "un pezzo di armatura esotico" vale anche per l'amuleto: chi indossa il Ciondolo di Lia non può indossare anche gli Stivali del vento.
- Scheda del personaggio: un quinto riquadro per i pezzi difensivi/accessori (7 spazi totali con le 2 armi).

### 5.8 Banchi di crafting **[deciso]**

- Oggi `ScenaFucina` è legata a Bruno. Diventa generica: `"banco": "fucina" | "armature" | "alchimia"`, e ogni ricetta dice dove si fa (`"banco": "armature"`, default `"fucina"`).
- **Bruno** (borgo, `"fucina"`): armi, potenziamenti, sigilli dell'Eco della Valle (Re Melma, Re Scheletro).
- **Ugo** (Pietrafonda, `"armature"`): armature, sigilli dell'Eco delle Colline (Ferrante, Troll).
- **Selva** (Guado, `"alchimia"`): alchimia, cioè pozioni nuove (rigenerazione, velocità, antiveleno) e sigilli dell'Eco della Brughiera (Selva, Negromante).
- **Potenziamenti oltre +5?** No: il design dice +1…+5; il gioco più lungo si regge con armi nuove, non con numeri più alti.

### 5.9 Ricordi (Casa sul Colle)

- Un cartello con `"aspetto": "ricordo"`: un bagliore azzurro che pulsa. Cliccandolo, il testo appare **a tutto schermo** come le pagine del finale (si può riusare `ScenaFinale` con un altro testo).
- Partita: `ricordiVisti: string[]`. Una quest della Casa li conta: "raccogli 8 ricordi".

### 5.10 Nuovi attacchi dei boss

- `dividi` (Re Melma): sotto metà vita, a ogni colpo subito c'è una probabilità di generare una melma piccola (riusa `evoca`, con un innesco diverso).
- `bomba` (Ferrante): lancia una bomba su un punto vicino all'eroe; dopo 1 secondo, danno ad area e una nube che rallenta. Riusa la logica del `crollo_massi` (ombra a terra → impatto).
- `specchio` (Selva): crea 2 copie illusorie che sparano dardi deboli; colpite, spariscono. Riusa `evoca`, con nemici "illusione" a 1 vita.
- La Radice Marcia: radici che spuntano dal terreno (come i massi del troll) + evocazione di "eco" dei nemici.

### 5.11 Migrazione dei salvataggi

Ogni campo nuovo della Partita (`ecoSconfitti`, `sepoltiScavati`, `pietre`, `ricordiVisti`, `commentiVisti`, l'amuleto…) richiede:

1. alzare `VERSIONE_SALVATAGGIO` (da 1 a 2);
2. aggiungere `MIGRAZIONI[1]` in `src/systems/salvataggio.ts` con i valori iniziali;
3. un test che carica un salvataggio della versione precedente.

È il motivo per cui la versione esiste (lezione 9a, §4). Raggruppiamo tutti i campi nuovi della Fase 10 in **una sola** migrazione v1 → v2.

### 5.12 Nuovi nemici (solo dati + sprite)

| Nemico | Regione | Comportamento | Figura (sprite.json) |
|---|---|---|---|
| Ratto | I | inseguitore, veloce, fragile | `ratto` con tinta marrone |
| Melma piccola | I | inseguitore | `melma`, scala piccola |
| Corvo | II | inseguitore, molto veloce, fragile | `pipistrello` con tinta nera |
| Bandito balestriere | II | tiratore | `soldato` con tinta |
| Fuoco fatuo | III | tiratore, fragile | `fantasma` con tinta azzurra, alfa 0,7 |
| Illusione | III (Selva) | tiratore, 1 vita | `donna` con alfa 0,5 |
| Eco (versione di ogni nemico) | Radici | come l'originale, +50% vita | stesso sprite, tinta grigio-verde |

## 6. Le nuove fasi

Ogni fase ha 2–3 consegne e **ogni consegna lascia il gioco giocabile dall'inizio alla fine**. Le stime sono indicative (come le fasi 1–9).

| Fase | Contenuto | Dipende da |
|---|---|---|
| **10 — Fondamenta** | 10a bottino "uno tra" ed Eco (sistema, provato sui 3 boss esistenti) + migrazione v2. 10b compagni di viaggio (sistema) + amuleto + banchi di crafting. 10c tesori sepolti e pala, rocce crepate, porte runiche, pietre di passaggio, ricordi. Ogni sistema provato su una mappa esistente. | — |
| **11 — Prologo e Atto I** | 11a Strada Maestra, Teodoro, il cancello, nuova mappa iniziale. 11b Mulino del Ponte, Cantine, Re Melma, Ottone, quest del becchino. 11c Tessa e Brina, radura nascosta, secondarie I, mappa del mugnaio, prime ghiande. | 10 |
| **12 — Atto II** | 12a Accampamento, Passo del Corvo, Cave di Zolfo, Ferrante, Matteo. 12b Pietrafonda (occupata e liberata), Ugo e il banco delle armature, Grisk. 12c secondarie II, clan Pietrarossa, tesori e mappa di Ferrante. | 11 |
| **13 — Atto III** | 13a Guado delle Lanterne, Palude, traghetto. 13b Casa sul Colle (ricordi), Osservatorio, Selva. 13c il confronto con Berta, torre e finale aggiornati, alchimia, tesori III. | 12 |
| **14 — Dopo-storia** | 14a le Eco di tutti i boss. 14b Le Radici e la Radice Marcia. 14c ghiande d'oro (premi di Rosalba), commissioni della bacheca, miniera profonda. | 13 |
| **15 — Bilanciamento e durata** | Partita completa giocata e cronometrata, curve di esperienza, prezzi, vita dei nemici, testi. Obiettivo: 5–6 ore per un giocatore normale. | 14 |

## 7. Bilanciamento (punti di partenza)

**Livelli** (design §5: per arrivare al livello L servono 25 × L × (L−1) punti esperienza):

| Fine di… | Livello | Esperienza totale |
|---|---|---|
| Prologo | 2 | 50 |
| Atto I | 7 | 1.050 |
| Atto II | 12 | 3.300 |
| Atto III | 17 | 6.800 |
| Dopo-storia | 19–20 | 8.550–9.500 |

Quindi ogni atto deve dare circa **1.000 (I), 2.250 (II), 3.500 (III)** punti esperienza tra nemici e quest. Regola pratica: circa il 40% dalle quest, il 60% dai nemici.

**Nemici:** vita ed esperienza crescono di circa ×1,6 per regione (oggi: slime 8 vita / 5 esp., lupo della brughiera 26 / 24). Un nemico normale dovrebbe cadere in **3–5 colpi** dell'arma "giusta" per quel punto del gioco.

**Monete:** un'arma rara della regione deve costare circa quanto le monete di **una zona e mezza** ripulita. Le pozioni restano economiche.

**Durata:** come stimare senza giocare 6 ore? Una **prova nel browser cronometrata** che percorre la quest principale con l'eroe invulnerabile dà il tempo minimo. Moltiplicato per circa 2,5 (combattimenti veri, esplorazione, dialoghi letti) dà la stima reale. Va confermata giocando: Ale è il primo tester.

## 8. Checklist per ogni nuovo contenuto

**Mappa nuova:**

- [ ] `id` unico, `nome` leggibile, griglia rettangolare, legenda con `tipo` e `tessera` per ogni simbolo
- [ ] uscite con `verso`/`arrivo` in **entrambe** le mappe collegate
- [ ] la musica della zona in `musica.json` (`zone`)
- [ ] nemici lontani dagli ingressi (c'è già un test che lo controlla in `datiMappe.test.ts`)
- [ ] ogni segreto ha un indizio visibile (`storia.md` §8)
- [ ] la vede una prova nel browser (almeno una schermata)

**Quest nuova:**

- [ ] chi la dà, chi la conclude, passi, ricompensa, e `richiede` se fa parte di una catena
- [ ] i dialoghi hanno sempre almeno una risposta senza condizioni (c'è un controllo)
- [ ] se dà un oggetto di missione, dove lo si trova

**Boss nuovo:**

- [ ] barriere che non lo fanno vedere da fuori (test esistente per ogni boss)
- [ ] `leggendari`, `esoticoFirma`, ricetta del sigillo
- [ ] la musica "boss" parte da sola (la barra della vita la fa partire)

## 9. Rischi e attenzioni

- **Peso del file:** oggi ~1,7 MB (quasi tutto Phaser). 27 mappe in JSON aggiungono poco. Restare su pixel art e suoni generati dal codice; immagini grandi o file audio cambierebbero la consegna (design §2).
- **Mappe a mano:** 15 mappe a caratteri sono tanto lavoro. Lavorare una consegna alla volta e **provarle in gioco** (schermate) prima di passare alla successiva. Un editor esterno (Tiled) è escluso dal design (§2): proporlo ad Ale solo se diventa un problema vero.
- **Coerenza della storia:** prima di scrivere dialoghi nuovi, rileggere `storia.md` §3 (tono) e §5 (personaggi). Orvald non è mai un cattivo da fumetto.
- **Prove nel browser lente:** con tante prove, eseguirle due alla volta (vedi `tests/browser/LEGGIMI.md`).

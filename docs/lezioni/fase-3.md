# Lezione della fase 3: il personaggio

La fase 3 è divisa in tre consegne. Questa lezione cresce con loro: ora c'è la parte **3a – Chi sei**; le parti 3b e 3c si aggiungeranno qui sotto.

---

# 3a – Chi sei

## Cosa abbiamo costruito

All'avvio non sei più catapultato nella radura. Prima compare la **creazione del personaggio**:

- scegli una delle quattro classi cliccando la sua scheda;
- distribuisci i 2 punti liberi con i pulsanti "+" e "−" (al massimo uno per caratteristica, nessuna oltre 16);
- scrivi un nome, se vuoi, e clicchi "Inizia l'avventura".

A destra un'anteprima mostra vita, mana, arma, critico e abilità, e si aggiorna a ogni clic.

Nel gioco:

- l'eroe ha il **colore** e l'**arma** della sua classe (spada e scudo, bastone, pugnali, mazza). I danni usano il **modificatore** della caratteristica dell'arma e il critico usa la tua DES;
- ogni nemico sconfitto dà **esperienza** (il numero azzurro "+5 esp"). Sotto la barra della vita c'è quella dell'esperienza, con il livello;
- salendo di livello compare un avviso in basso, la vita massima cresce e sul **ritratto** in alto a destra appare un pallino giallo: hai punti da assegnare;
- cliccando il ritratto (o premendo **C**) si apre la **scheda del personaggio**. Il mondo si mette in pausa e assegni i punti con "+". Chiudi con il pulsante, con C o con Esc;
- l'**ingranaggio** apre la modalità sviluppatore (come F8). Ora le voci si cliccano, e ci sono "+100 esperienza" e "Sali di livello";
- la sconfitta non toglie nulla: esperienza, livello e caratteristiche restano, la vita torna piena.

Numeri: **141 test** (42 nuovi).

**Nota sul Mago:** in questa consegna il suo bastone colpisce da vicino. I dardi magici a distanza arrivano nella 3c, insieme a mana e proiettili.

---

## I concetti nuovi

### 1. Dati derivati: calcolare invece di memorizzare

Quanta vita massima ha l'eroe? Potremmo salvarla in un campo e aggiornarla ogni volta che cambia qualcosa. Ma "qualcosa" sono il livello, la COS, la classe… e prima o poi un aggiornamento si dimentica.

Invece la **calcoliamo** ogni volta che serve: `vitaMassima(classe, caratteristiche, livello)` (`src/systems/personaggio.ts:33`). Lo stesso vale per:

- `ricaricaSchivata` (riga 45);
- `modificatoreArma` (riga 50);
- `probabilitaCriticoDi`.

**Paragone web:** sono le *computed properties* di Vue, i selettori di Redux, `useMemo` in React. Si salva solo lo **stato minimo** (classe, caratteristiche, livello, esperienza) e tutto il resto ne deriva. Per questo assegnare un punto in COS aggiorna da solo la vita, il critico nella scheda e l'anteprima della creazione: usano tutti le stesse funzioni.

### 2. Lo stato della partita vive fuori dalle scene

La scena del mondo riparte da zero a ogni cambio di mappa: è il modo semplice per non portarsi dietro "avanzi". Ma il personaggio deve sopravvivere. Per questo esiste la **Partita** (`src/systems/partita.ts`): un oggetto TypeScript puro con personaggio, esperienza, punti e vita.

Sta nel **registro** di Phaser, l'archivio condiviso tra le scene. `src/scenes/statoCondiviso.ts` lo rende tipizzato con `leggiPartita` e `scriviPartita` (righe 10 e 17). È lo schema di uno **store globale** (Redux, Pinia, Zustand):

- chi vuole cambiare la partita ne crea una **nuova** (le funzioni di `partita.ts` non modificano mai quella ricevuta) e la scrive nel registro;
- chi la mostra si **iscrive** ai cambiamenti. L'interfaccia ascolta `changedata-partita` (`src/scenes/ScenaInterfaccia.ts:95`) e ridisegna barre, livello e pallino da sola. Il mondo non deve sapere che l'interfaccia esiste.

C'è un punto delicato: la vita cambia **dentro l'eroe** a ogni colpo, 60 volte al secondo di gioco. Non vogliamo scrivere nel registro a ogni fotogramma, quindi la scena fa da ponte (`src/scenes/ScenaMondo.ts`):

- `salvaVita` (riga 216) copia la vita dell'eroe nella Partita **solo se è cambiata**. Il confronto `!==` funziona perché ogni colpo crea un oggetto vita nuovo: la stessa idea per cui React confronta i riferimenti;
- `dallaPartita` (riga 221) fa il contrario, quando la Partita cambia da fuori: livello guadagnato, scheda, modalità sviluppatore.

Questa stessa Partita è ciò che il salvataggio della fase 9 scriverà nel browser.

### 3. La curva di progressione

`src/data/livelli.json` contiene le soglie della curva 25 × L × (L − 1): 50 per il livello 2, 150 per il 3, 9.500 per il 20. Il distacco tra un livello e il successivo cresce (50, 100, 150, 200…), quindi i primi livelli arrivano in fretta e gli ultimi richiedono impegno.

`livelloDa` (`src/systems/livelli.ts:13`) è un semplice ciclo che "sale" finché la soglia successiva è raggiunta. Gestisce da solo il caso di più livelli in un colpo (un boss che dà tanta esperienza): il test lo verifica passando da 40 a 160 di esperienza.

Quando il livello sale, `ricalcolaVita` (`src/systems/partita.ts:80`) aumenta **della stessa quantità** sia il massimo sia la vita attuale (riga 83). Salire di livello in mezzo a un combattimento ti rinforza davvero, invece di lasciarti con una barra "più vuota" in proporzione.

**Bilanciare** un gioco significa ritoccare numeri come questi giocando. Per questo stanno nei file JSON e non nel codice.

### 4. Il modificatore e gli arrotondamenti

Il modificatore D&D è `Math.floor((valore − 10) / 2)` (`src/systems/caratteristiche.ts:18`). Con 9 viene −0,5: `Math.floor` dà −1 (corretto), mentre `Math.trunc` o `| 0` darebbero 0. È un bug classico, e i test lo coprono (`modificatore(9)` deve valere −1).

### 5. Interfacce di gioco cliccabili

In un gioco non ci sono `<button>` né `<input>`: si costruiscono con forme e testi.

- **`Pulsante`** (`src/scenes/interfaccia/Pulsante.ts:25`) è un `Container`, un oggetto che raggruppa altri oggetti (sfondo, testo, icona) e li muove insieme, come un `<div>` con dei figli. L'interattività sta sul rettangolo (riga 59). `useHandCursor` mostra la manina, come `cursor: pointer`. Gli eventi `pointerover`, `pointerout` e `pointerdown` sono gli equivalenti di `mouseenter`, `mouseleave` e `mousedown`.
- **Il campo del nome** (`src/scenes/ScenaCreazione.ts:103–110`) imita un `<input>`:
  - un clic gli dà il "fuoco" (bordo giallo);
  - un clic altrove glielo toglie;
  - i tasti premuti vengono aggiunti al testo, Backspace cancella;
  - `stopPropagation` (riga 106) impedisce che lo stesso clic, risalendo alla scena, tolga subito il fuoco appena dato. È lo stesso problema, con la stessa soluzione, del bubbling degli eventi DOM.
- **Gli overlay modali:** la scheda mette un velo scuro **interattivo** su tutto lo schermo (`src/scenes/ScenaScheda.ts:36`), che "assorbe" i clic e non li lascia passare al gioco sotto.

### 6. Mettere in pausa una scena

`this.scene.pause()` (`ScenaMondo.ts:133`) ferma il mondo: niente `update`, niente fisica, niente tempo che scorre. La verifica automatica ha controllato che l'orologio della scena resti identico per tutta la durata della pausa. Quindi anche l'invulnerabilità e le ricariche "aspettano".

`this.scene.resume(...)` (`ScenaScheda.ts:79`) lo fa ripartire esattamente da dove era.

Al risveglio il mondo riceve l'evento `RESUME` e rilegge la Partita (`ScenaMondo.ts:113`). Attenzione: `this.events` **sopravvive ai riavvii** della scena, quindi l'ascoltatore va tolto alla chiusura (riga 114). Altrimenti dopo dieci cambi di mappa ce ne sarebbero dieci. È l'equivalente di dimenticare il `removeEventListener` nel cleanup di un componente.

### 7. Il flusso tra le scene

La prima scena dell'elenco in `main.ts` parte da sola: ora è la creazione. Quando clicchi "Inizia", `this.scene.start(SCENA_MONDO)` (`ScenaCreazione.ts:137`) chiude la creazione e avvia il mondo. Il mondo avvia l'interfaccia, che apre la scheda e il pannello sviluppatore quando servono.

È come il routing di una single-page app, con una differenza: più "pagine" possono essere visibili **una sopra l'altra**.

---

## Esercizio facoltativo (3a)

**Ribilancia la progressione senza toccare il codice.**

1. In `src/data/nemici.json` porta l'esperienza dello slime da 5 a 15.
2. Gioca: in quanti slime arrivi al livello 2? E al 3?
3. Ora prova a rendere il Mago meno fragile: in `src/data/classi.json` porta il suo `vitaPerLivello` da 3 a 4. Quanta vita ha al livello 5 con COS 12? Calcolalo con la formula del design §6, poi verifica con la modalità sviluppatore ("Sali di livello" quattro volte) e la scheda.

Ricordati di rimettere i valori originali, oppure tienili se ti piacciono di più: il test `livelli.test.ts` controlla solo la curva, non l'esperienza dei nemici.

---

# 3b – Punta e clicca

## Cosa abbiamo costruito

Da ora il gioco si gioca **col mouse** (design §2 e §13):

- **clic sinistro sul terreno**: l'eroe ci va. Aggira alberi, acqua e il muro di pietra (passa dal varco da solo) e arriva esattamente dove hai cliccato. Un piccolo cerchio conferma il clic;
- **clic dentro il lago o un albero**: l'eroe si ferma nel punto raggiungibile più vicino;
- **tenendo premuto** l'eroe segue il cursore;
- **sopra un nemico** il cursore diventa una spada. Un clic: l'eroe lo raggiunge e colpisce una volta (cerchio rosso). Tenendo premuto continua a colpire finché il nemico non cade;
- **clic destro**: capriola verso il cursore, senza il menu del browser;
- **barra in basso**: il pulsante "Capriola" (si clicca anche lui e mostra la ricarica) e gli spazi spenti per abilità, arma secondaria e compagno;
- **icone in alto a destra**: scheda e sviluppatore funzionano; zaino, pergamena e dischetto sono spenti. Passandoci sopra compare un suggerimento con la fase in cui arriveranno.

La tastiera funziona ancora come scorciatoia (WASD, J, Spazio, C, F8). Se cammini con la tastiera, l'obiettivo del mouse si annulla.

In modalità sviluppatore, con "Aree di colpo e corpi" attivo, compare in giallo la **strada scelta dall'eroe**.

Numeri: **175 test** Vitest (34 nuovi) e due prove nel browser: 28 controlli per la 3a, 25 per la 3b.

---

## I concetti nuovi

### 1. Ricerca del percorso: A*

Il problema è quello di un navigatore stradale: sei qui, vuoi andare là, in mezzo ci sono ostacoli.

La mappa è già una griglia, quindi ogni cella è un "incrocio" collegato alle 8 vicine: 4 dritte con costo 1, 4 in diagonale con costo √2 ≈ 1,41. A* esplora le celle partendo da quelle che **sembrano** più promettenti (`src/systems/percorso.ts:64`). Per ognuna conosce:

- **g**: quanto è costato arrivarci (strada già fatta, certa);
- **h**: una stima di quanto manca (`stima`, riga 54: la distanza in linea d'aria con le diagonali, ignorando i muri);
- **f = g + h**: il costo totale stimato passando di lì.

A ogni giro si espande la cella aperta con la **f più bassa** (righe 76–80). Se la stima non esagera mai, il primo percorso che raggiunge l'arrivo è il più breve. Senza la stima (h = 0) avremmo l'algoritmo di Dijkstra: corretto ma molto più lento, perché esplora in tutte le direzioni allo stesso modo. Con la stima, A* "punta" verso la meta.

Due dettagli importanti:

- **Niente angoli tagliati** (riga 43): in diagonale si passa solo se sono libere anche le due celle di lato. Altrimenti il percorso passerebbe "nella fessura" tra due alberi che si toccano per lo spigolo, dove il corpo dell'eroe non entra.
- **Le celle aperte** sono cercate con un ciclo (riga 80). Con le nostre mappe (al massimo 40 × 40) è velocissimo: il test fa 100 percorsi casuali nel bosco ben sotto il secondo. Con mappe molto grandi si userebbe una *coda con priorità* (heap), la struttura dati fatta apposta per "dammi sempre il minimo".

### 2. Dove si clicca davvero? Coordinate dello schermo e del mondo

Il mouse dice "pixel (630, 210) della finestra". Ma la telecamera è spostata (segue l'eroe) e ingrandita ×3: quel pixel corrisponde a un punto diverso della mappa a seconda di dove si trova l'eroe. La conversione la fa la telecamera: `getWorldPoint` (`src/scenes/ScenaMondo.ts:253`).

È lo stesso problema di una pagina che scorre: `clientX` è relativo alla finestra, la posizione nel documento è `clientX + scrollX`. Qui in più c'è lo zoom, quindi si divide anche per 3.

Due conseguenze:

- **Il cursore va ricalcolato a ogni fotogramma.** Anche se il mouse è fermo, la telecamera si muove con l'eroe e il punto del mondo sotto il cursore cambia. Per questo, tenendo premuto, l'eroe segue davvero il cursore.
- **La telecamera ha un riquadro** (`setViewport`, riga 357) che si ferma sopra la barra in basso, così la barra non copre la mappa.

### 3. Mira, portata e "cosa c'è sotto il clic"

Tre piccole funzioni pure in `src/systems/mira.ts`:

- `direzioneVerso` (riga 11): verso il nemico, arrotondato alle 4 direzioni (vince l'asse con la distanza maggiore);
- `aPortata` (riga 24): se attaccassi adesso in quella direzione, l'area di colpo lo toccherebbe? È lo stesso test AABB della fase 2, fatto "in anticipo";
- `bersaglioSotto` (riga 33): quale nemico c'è sotto il clic, con un margine di 4 px. I nemici sono piccoli e si muovono, e pretendere un clic al pixel sarebbe frustrante. Se due si sovrappongono vince quello col centro più vicino.

### 4. Input come intenzioni: GuidaEroe

L'eroe non sa nulla di mouse e tastiera. Riceve a ogni fotogramma dei `ComandiEroe` (`src/systems/tipi.ts:73`): una direzione di marcia, "attacca", "guarda di là", "capriola di là". Chi li produce è la **guida** (`src/scenes/mondo/GuidaEroe.ts`), e ha un lavoro interessante: col mouse il giocatore non dice "vai a destra", dice "vai **lì**" o "attacca **quello**". Serve quindi un'intenzione che dura nel tempo, l'**obiettivo**, e a ogni fotogramma il passo giusto per avvicinarsi:

- `premiSinistro` (riga 55) decide se il clic è su un nemico o sul terreno e imposta l'obiettivo;
- `comandi` (riga 95) a ogni fotogramma trasforma l'obiettivo in comandi. La tastiera ha la precedenza (riga 106);
- `versoNemico` (riga 137):
  - se il nemico è a portata: fermo, girato verso di lui, attacca;
  - altrimenti lo insegue, ricalcolando la strada ogni 250 ms (riga 23), perché il nemico si muove e ricalcolare a ogni fotogramma sarebbe uno spreco;
  - con un clic singolo, appena parte il fendente l'obiettivo è raggiunto (riga 147); tenendo premuto si continua.

È la stessa separazione che si fa nel web tra "gestore dell'evento" e "azione" (pensa alle *action* di Redux): domani un gamepad o un touchscreen produrranno gli stessi `ComandiEroe` e l'eroe non cambierà di una riga.

### 5. Lisciare il percorso

A* lavora a celle: seguito alla lettera, l'eroe andrebbe da centro a centro, a zig-zag. `lisciaPercorso` (`percorso.ts:168`) lo "tende come un filo": da ogni punto si salta dritti al punto **più lontano** raggiungibile in linea retta.

"Raggiungibile in linea retta" lo decide `liberoTra` (riga 148), e qui c'è un'insidia: non basta che la linea dei centri non tocchi muri, perché l'eroe è largo 12 px. La funzione controlla i **quattro angoli** del corpo ogni 2 px lungo il tragitto. Il test "rasente a un muro" mostra un caso in cui la linea passa fuori dal muro ma il corpo lo toccherebbe.

Nella schermata del percorso (modalità sviluppatore) si vede il risultato: da circa 15 celle a 5 tratti dritti, con i punti esattamente dove serve girare (prima e dopo il varco, attorno agli alberi).

### 6. Cursori e menu del browser

Il cursore di un gioco nel browser è il normale cursore CSS del `<canvas>`. Phaser lo imposta con `setDefaultCursor` (`ScenaMondo.ts:272`). La spada è una piccola immagine **SVG scritta nel codice** come *data URL* (`src/scenes/interfaccia/cursori.ts:19`): nessun file da scaricare. Il valore finale `crosshair` è la riserva se il browser non accettasse l'immagine, come in qualsiasi foglio di stile.

Il tasto destro aprirebbe il menu del browser: `disableContextMenu` (riga 227) lo impedisce, come un `preventDefault()` sull'evento `contextmenu`.

### 7. Un clic, una scena

Interfaccia e mondo sono scene sovrapposte e ricevono **entrambe** il clic. Senza precauzioni, cliccando il pulsante "Capriola" l'eroe farebbe la capriola **e** camminerebbe verso il pulsante. `sopraInterfaccia` (riga 258) chiede alle scene sopra se il punto colpisce un loro oggetto interattivo (`hitTestPointer`, riga 260): se sì, il clic non è per il mondo. Per lo stesso motivo lo sfondo della barra in basso è interattivo anche se non fa nulla: "assorbe" i clic.

### 8. Due lezioni dalle prove automatiche

Scrivendo la prova nel browser della 3b sono emersi due problemi che un test Vitest non avrebbe mai trovato.

- **Il nome scritto due volte.** Ogni tanto il campo del nome diventava "Alle" invece di "Ale": la tastiera di Phaser, sotto carico, poteva consegnare due volte lo stesso tasto. Per scrivere testo ora ascoltiamo direttamente l'evento `keydown` del browser (`src/scenes/ScenaCreazione.ts:64`), rimosso alla chiusura della scena. È il modo che conosci dal web, e per il testo è il più affidabile. Il controllo è stato poi ripetuto cinque volte di fila senza errori.
- **Respinti oltre l'uscita.** Un nemico che ti colpisce mentre sei sul punto d'arrivo può respingerti sulla tessera dell'uscita, e torni nella mappa precedente. Non è un bug di codice: anche in Zelda una spinta può farti cambiare stanza. Lo lasciamo così, e lo ricorderemo quando disegneremo le mappe dei dungeon (ingressi con un po' di spazio libero davanti).

Le prove nel browser sono "rumorose" per natura: il tempo reale e il caso (dadi, critici, nemici che si muovono) le rendono imprevedibili. Per questo le prove preparano la situazione che vogliono verificare (per esempio uno slime fermo) e sono state eseguite più volte prima della consegna.

---

## Esercizio facoltativo (3b)

**Guarda A\* al lavoro.**

1. Apri il gioco, clicca l'ingranaggio e attiva "Aree di colpo e corpi".
2. Clicca in punti diversi della Radura e guarda la linea gialla: dove decide di girare? Prova a cliccare dall'altra parte del muro di pietra, poi dentro il laghetto.
3. Ora apri `src/systems/percorso.ts` e trova la riga 43, quella che vieta di tagliare gli angoli. Cosa succederebbe togliendola? Prova a immaginarlo su due alberi che si toccano per lo spigolo, poi, se vuoi, chiedimi di provarlo davvero: il test "non taglia gli angoli tra due muri" fallirà e ti dirà perché.

**Domanda per riflettere:** la stima `h` di A* (riga 54) ignora i muri. Perché questo non rende il percorso sbagliato, ma solo la ricerca un po' più lunga?

---

# 3c – Cosa sai fare

## Cosa abbiamo costruito

Ogni classe ora gioca in modo diverso.

- **Mago**: clicca un nemico e l'eroe si ferma **a distanza di tiro** e lancia **dardi magici** (1d4 + INT, 1 mana l'uno). Il mana è la barra blu sotto la vita e si ricarica da solo. Con il pulsante **Palla di fuoco** (o E) si attiva il **mirino** (cursore a croce, bordo giallo sul pulsante); il clic successivo lancia una palla che **esplode** e ferisce tutti i nemici vicini (2d6 + INT, 6 mana).
- **Guerriero**: **Parata** alza lo scudo verso il cursore. Un nemico che attacca **davanti** viene respinto ("parato!"), uno che arriva **da dietro** colpisce lo stesso.
- **Ladro**: **Scatto nell'ombra** lo rende semitrasparente per 3 secondi: i nemici lo perdono e tornano a casa. Colpire alle spalle fa sempre **danno doppio** ("12 alle spalle!"), e attaccare fa finire l'invisibilità.
- **Chierico**: **Cura** recupera 1d8 + 2 × SAG di vita (5 mana). Contro i **non morti** fa sempre +1d6. Gli scheletri arriveranno nella Cripta; per ora si generano dalla modalità sviluppatore.

Ogni pulsante di abilità mostra la sua **ricarica** (il velo scuro che si ritira) e diventa più scuro quando manca il mana. Provando a usarlo troppo presto, sopra l'eroe compare "non ancora!" o "mana!". Passandoci sopra col mouse compare la descrizione.

Numeri: **208 test** Vitest (33 nuovi), prove nel browser per tutte e quattro le classi (31 controlli nuovi).

---

## I concetti nuovi

### 1. Proiettili: entità con un ciclo di vita

Un fendente esiste per qualche fotogramma e non si muove. Un dardo invece **nasce, vola, colpisce qualcosa e muore**: è la prima entità del gioco che appare e scompare di continuo.

La matematica sta in `src/systems/proiettili.ts`. `avanza` (riga 26) applica la formula delle elementari, *spazio = velocità × tempo*, con il tempo in millisecondi del fotogramma: per questo il dardo va alla stessa velocità a 30 e a 144 fotogrammi al secondo.

La vita del proiettile la gestisce `GestoreProiettili` (`src/scenes/mondo/GestoreProiettili.ts:41`). A ogni fotogramma:

1. muove ogni proiettile;
2. controlla se ha toccato un nemico o un muro (riga 54: alberi, rocce e acqua fermano anche i dardi);
3. in caso di impatto chiama la funzione scelta da chi l'ha lanciato.

I proiettili finiti vengono tolti dall'elenco (riga 62): altrimenti, dopo mezz'ora di gioco, avremmo migliaia di dardi "morti" da scorrere a ogni fotogramma. È l'equivalente di rimuovere gli elementi dal DOM e i loro ascoltatori.

La funzione d'impatto è un **callback**: il dardo magico, all'impatto, ferisce il nemico colpito; la palla di fuoco, all'impatto **o a fine corsa**, esplode (`src/scenes/mondo/abilita/pallaDiFuoco.ts:31`). Stesso gestore, comportamenti diversi: è la stessa idea di passare una funzione a `fetch(...).then(...)`.

### 2. Un cerchio contro un rettangolo

Per l'esplosione serve sapere quali nemici (rettangoli) toccano un cerchio. Il trucco di `nelRaggio` (`proiettili.ts:44`) è trovare **il punto del rettangolo più vicino al centro**, "schiacciando" il centro dentro il rettangolo con `Math.max` e `Math.min` (riga 48). Se quel punto è nel raggio, il rettangolo è colpito. Misurare dal centro del nemico sarebbe sbagliato: un nemico grande verrebbe ignorato anche con mezzo corpo dentro l'esplosione.

### 3. Il prodotto scalare: davanti, dietro, di lato

Parata e colpo alle spalle pongono la stessa domanda: *da che parte arriva?* La risposta è il **prodotto scalare** tra la direzione in cui si guarda e la direzione verso l'altro (`src/systems/geometria.ts:90–93`). Vale +1 se l'altro è esattamente davanti, 0 se è di lato, −1 se è esattamente dietro. Il confine ±0,5 corrisponde a circa 60°: la parata copre il davanti "largo", il colpo alle spalle richiede di essere davvero dietro.

Perché funzioni, i nemici devono **guardare** da qualche parte: guardano nella direzione in cui hanno camminato l'ultima volta (`Nemico.guarda`). Un nemico che insegue ti guarda; uno che torna a casa ti dà le spalle. Ecco perché lo Scatto nell'ombra e il colpo alle spalle vanno così d'accordo.

### 4. Le abilità: regole separate dagli effetti

Ogni abilità ha due parti, in due posti diversi.

- **Il "posso?"** (`src/systems/abilita.ts:24`): è pronta, o è in ricarica? C'è abbastanza mana? Sono regole pure e testate: `puòUsare` restituisce `'pronta'`, `'in ricarica'` o `'mana insufficiente'`, ed è da qui che nascono i messaggi sopra l'eroe.
- **Il "cosa fa"** (`src/scenes/mondo/abilita/`): un file per abilità, ognuno con una sola funzione che riceve un *contesto* (eroe, nemici, proiettili…) e il punto mirato. Il registro `ABILITA` (`abilita/index.ts:14`) collega i nomi scritti in `classi.json` alle funzioni.

Il tipo `Record<(typeof ABILITA_CONOSCIUTE)[number], …>` è un piccolo trucco di TypeScript: obbliga il registro ad avere **tutte** le abilità elencate in `systems/abilita.ts:8`. Se domani aggiungi un nome all'elenco e dimentichi la funzione, la compilazione si ferma.

`usaAbilita` (`src/scenes/ScenaMondo.ts:248`) fa il resto:

1. controlla;
2. esegue;
3. solo se l'effetto è riuscito, consuma il mana e fa partire la ricarica. Una parata tentata mentre stai già attaccando non ti costa nulla.

La ricarica sta nel **registro** (riga 273), non nella scena: cambiando mappa la scena riparte, ma la palla di fuoco non torna pronta per magia.

### 5. Il mirino: un piccolo stato in più

Con la palla di fuoco il primo clic (sul pulsante) non lancia nulla: cambia il **significato del clic successivo**. È una mini macchina a stati con due stati, *normale* e *mirino* (`ScenaMondo.ts:332`):

- nel mirino il clic sinistro sceglie il bersaglio e il destro annulla;
- il cursore diventa una croce e il pulsante si evidenzia, così lo stato è sempre visibile.

Come in tutti i programmi di disegno: scegli lo strumento, poi clicchi sulla tela.

### 6. Un solo posto per i danni

Fendente, dardo e palla di fuoco finiscono tutti in `Combattimento.infliggi` (`src/scenes/mondo/Combattimento.ts:36`). Lì vengono applicate le **capacità passive**:

- il colpo alle spalle del Ladro (riga 42);
- il +1d6 del Chierico contro i non morti (riga 44).

Avere un solo punto d'ingresso evita la classica dimenticanza: "il bonus del Chierico funziona con la mazza ma non con…". La formula pura in `systems/combattimento.ts` ora accetta dadi aggiuntivi e un moltiplicatore; critico e colpo alle spalle si sommano (×4).

### 7. Il mana: una risorsa che scorre

Vita e mana sono la stessa cosa per il codice (`systems/risorsa.ts`), ma il mana **cresce un poco a ogni fotogramma** (`src/entities/Eroe.ts:117`: rigenerazione × tempo trascorso).

Se salvassimo la Partita nel registro a ogni fotogramma, l'interfaccia si ridisegnerebbe 60 volte al secondo per niente. `salvaRisorse` (`ScenaMondo.ts:439`) scrive solo quando cambia il **numero intero** mostrato (riga 444). È una forma di *throttling*: lo stesso motivo per cui nel web non si aggiorna lo stato a ogni evento `scroll`.

### 8. Mischia o distanza: la guida decide dove fermarsi

Col mouse il Mago non deve correre addosso al nemico: la guida (`src/scenes/mondo/GuidaEroe.ts:158`) controlla se l'arma ha un proiettile.

- **Mischia:** l'eroe si avvicina finché l'area di colpo tocca il nemico.
- **Distanza:** si ferma appena il nemico è **a tiro**: entro l'85% della gittata e senza muri in mezzo (`aTiro`, che riusa `liberoTra` del percorso con un "corridoio" largo 4 px).

Stesso clic, comportamento giusto per ogni arma, e nessun `if (classe === 'mago')`: decide il dato `proiettile` dell'arma.

### 9. Prove nel browser e tempo reale

Anche questa volta le prove automatiche hanno insegnato qualcosa. Alcuni controlli fallivano a caso: tra un comando del browser automatico e il successivo possono passare centinaia di millisecondi. Intanto il gioco va avanti: il lupo arrivava prima che la parata fosse alzata, il mana si ricaricava prima di essere letto.

La soluzione è la stessa dei test sul web con elementi animati: preparare la situazione in modo che **non dipenda dai tempi**. Il lupo resta fermo accanto all'eroe e viene "sbloccato" nello stesso istante in cui lo scudo è alzato; il mana si legge nell'istante del tiro. Per i danni, la prova sostituisce il generatore casuale del combattimento con uno fisso, come fanno i test Vitest. Dopo queste correzioni la prova è passata tre volte di fila.

---

## Esercizio facoltativo (3c)

**Inventa una variante della palla di fuoco solo con i dati.**

1. In `src/data/classi.json`, nell'abilità del Mago, porta `raggio` da 24 a 40 e `costoMana` da 6 a 9.
2. Prova: genera tre o quattro slime con la modalità sviluppatore e lanciala. L'esplosione più grande vale i 3 mana in più?
3. Ora prova il contrario: raggio 16, costo 4, ricarica (`ricaricaMs`) 800. Diventa un'abilità da usare di continuo.

**Domanda per riflettere:** il Ladro fa danno doppio "alle spalle", cioè quando il prodotto scalare è sotto −0,5. Cosa cambierebbe nel gioco con −0,9? E con 0 (cioè anche di lato)? Quale ti sembra più divertente, e perché?

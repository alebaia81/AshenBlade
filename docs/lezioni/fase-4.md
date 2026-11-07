# Lezione della fase 4: oggetti e inventario

La fase 4 è divisa in due consegne. Ora c'è la parte **4a – Lo zaino**; la 4b (armi) si aggiungerà qui sotto.

---

# 4a – Lo zaino

## Cosa abbiamo costruito

- L'icona dello **zaino** (o I) apre l'inventario, con il mondo in pausa:
  - una griglia di 12 spazi;
  - a destra i dettagli dell'oggetto sotto il mouse, col nome nel colore della sua **rarità**;
  - i pulsanti **Usa** e **Getta**; il clic destro usa al volo.
- Si parte con **2 pozioni di vita** (più 2 di mana per Mago e Chierico).
- Le **pozioni si impilano**: vita (+12), mana (+10), forza (+2 ai danni in mischia per 60 s), resistenza (+2 armatura per 60 s). Gli effetti a tempo compaiono in giallo sotto le barre, con i secondi che restano.
- Nella barra in basso ci sono due **spazi rapidi**, pozione di vita e pozione di mana (tasti 1 e 2), con il numero rimasto.
- Nella Radura e nel bosco c'è un **forziere**. Passandoci sopra il cursore diventa una mano; cliccandolo l'eroe ci va, lo apre e il contenuto salta fuori. **Resta aperto per sempre**, anche cambiando mappa.
- Gli oggetti a terra si **raccolgono passandoci sopra**. Con lo zaino pieno restano lì, con l'avviso "zaino pieno".
- I nemici lasciano a volte un **bottino** (slime 15% pozione di vita, lupo 20% vita e 5% forza…).
- La **borsa di cuoio** (nel forziere della Radura) porta lo zaino a **16 spazi**.
- Nella modalità sviluppatore ci sono "Dai oggetto…" (un secondo elenco) e "Riempi lo zaino". Il pannello si usa solo col mouse, e ora è cliccabile tutta la riga.

Numeri: **243 test** Vitest (35 nuovi), prova nel browser della 4a con 21 controlli. Le prove di 3a, 3b e 3c sono state aggiornate alla nuova barra e ripassano tutte.

---

## I concetti nuovi

### 1. Gli oggetti sono dati, non classi

In molti tutorial si vede `class Pozione extends Oggetto`, `class PozioneDiVita extends Pozione`… Qui no: una pozione è **un pezzo di JSON** (`src/data/oggetti.json`), con nome, rarità, quanti se ne impilano e un `effetto` (`{"tipo": "cura", "quantita": 12}`). Le regole che li usano sono **funzioni pure**.

Il vantaggio è lo stesso che si ha nel web tra dati e componenti: per inventare la "Pozione di vita superiore" basta una riga di JSON. Il codice cambia solo per un *tipo* di effetto nuovo, ed è proprio la regola del design §4.

L'effetto è un **tipo unione discriminato** (`EffettoOggetto` in `src/systems/oggetti.ts`): TypeScript sa che se `tipo` è `"cura"` c'è `quantita`, se è `"temporaneo"` ci sono `effetto`, `valore` e `durataMs`. Lo `switch` in `usaOggetto` (`src/systems/partita.ts:127`) è verificato dal compilatore: se un domani aggiungiamo un tipo di effetto e dimentichiamo di gestirlo, la compilazione si ferma.

### 2. Il modello di un inventario

L'inventario (`src/systems/inventario.ts`) è un array di spazi lungo esattamente quanto la capacità: ogni spazio è `null` oppure una **pila** `{ id, quantita }`. `aggiungi` (riga 30) lavora in due passate:

1. prima completa le pile già presenti dello stesso oggetto (riga 33);
2. poi usa gli spazi vuoti (riga 42).

Quello che non entra **torna indietro** (`rimasti`): chi chiama decide cosa farne. Lo zaino non sa nulla del "mondo": è la scena che lascia a terra ciò che non è entrato.

Un dettaglio: se non è entrato **niente**, `aggiungi` restituisce lo **stesso oggetto** ricevuto (riga 52). Così chi chiama può capire con un semplice `===` che non è cambiato nulla e non riscrivere la Partita (né ridisegnare l'interfaccia) per niente. È la stessa idea della *referential equality* di React.

### 3. Effetti a tempo (buff e debuff)

La pozione di forza dura 60 secondi. Non usiamo `setTimeout`: come per gli stati dell'eroe, l'effetto ricorda **fino a quando** dura (`src/systems/effettiTemporanei.ts:22`) e chi lo usa chiede "che bonus c'è *adesso*?". Ci sono tre vantaggi:

- **la pausa funziona da sola**: col mondo in pausa il tempo di gioco non avanza;
- **lo stato è solo dati**: si potrà salvare nella fase 9;
- **si testa** passando l'ora che si vuole.

Due regole di progettazione stanno nei test.

- **Lo stesso effetto non si somma a se stesso**: due pozioni di forza danno +2 per 60 s rinnovati, non +4. Altrimenti si "accumulerebbero" dieci pozioni prima di un boss.
- **Gli effetti a intervalli contano i colpi persi** (`danniDaTick`, riga 59, con il ciclo `while` alla riga 68): se un fotogramma lento salta due secondi, il fuoco fa comunque due danni. È lo stesso problema dell'animazione nel web, quando non si può contare sul fatto che `requestAnimationFrame` arrivi puntuale.

Il fuoco non è ancora usato: servirà agli effetti delle armi nella 4b.

### 4. Bottino e probabilità

`tiraBottino` (`src/systems/bottino.ts:14`) tira **ogni voce separatamente**: un lupo può lasciare niente, una pozione di vita, una di forza o tutte e due. È diverso da una "ruota" dove esce una sola cosa. Con il caso iniettabile i test controllano esattamente i casi limite (il valore *uguale* alla probabilità non fa cadere l'oggetto).

### 5. Interagire col mondo: cliccare per avvicinarsi

Cliccare un forziere non basta ad aprirlo: bisogna **arrivarci**. La guida dell'eroe ha un nuovo tipo di obiettivo, `interagisci` (`src/scenes/mondo/GuidaEroe.ts:39`):

1. calcola il percorso verso il forziere. È un ostacolo, quindi A\* porta alla cella libera più vicina;
2. a ogni fotogramma controlla la distanza;
3. abbastanza vicini, chiama la funzione d'interazione (riga 139).

La guida non sa *cosa* sia un forziere: riceve un `Interagibile` (posizione, distanza, cosa fare) da `interagibileSotto` della scena (`src/scenes/ScenaMondo.ts:405`). Nella fase 5 lo stesso meccanismo servirà per parlare con le persone e attraversare le porte, senza toccare la guida.

### 6. Stato persistente del mondo

Un forziere aperto deve restare aperto, ma la scena riparte da zero a ogni cambio di mappa. La soluzione è la stessa della vita e del livello: lo stato va nella **Partita**, che vive fuori dalle scene. `forzieriAperti` contiene chiavi come `"radura:36:3"` (mappa, colonna, riga); `creaForzieri` le legge e disegna il forziere aperto o chiuso.

È anche la differenza tra ciò che **si ricorda** (forzieri, livello, zaino) e ciò che **si rigenera** (nemici, oggetti a terra non raccolti): una scelta di game design, scritta nel codice in modo esplicito.

### 7. Oggetti a terra e il problema del "lo riprendo subito"

Gettando una pozione, questa cade sotto i piedi dell'eroe… che ci sta sopra e la raccoglierebbe al fotogramma successivo. Ogni oggetto ha un flag `bloccato` (`src/scenes/mondo/GestoreOggettiATerra.ts:43`): non si raccoglie finché l'eroe non si allontana. Lo stesso flag evita che "zaino pieno" compaia 60 volte al secondo mentre si sta sopra a un oggetto che non entra (riga 56).

L'oggetto galleggia su e giù con una tween **infinita** (`repeat: -1`, `yoyo: true`, `src/entities/OggettoATerra.ts:35`): un piccolo movimento attira l'occhio molto più di un colore.

### 8. Interfaccia che si ridisegna

La schermata dello zaino non aggiorna i singoli spazi: quando la Partita cambia, **svuota e ricostruisce** la griglia (`src/scenes/ScenaInventario.ts:91`), ascoltando `changedata-partita` (riga 75). Con al massimo 24 spazi è istantaneo, ed è molto più semplice e sicuro che tenere sincronizzati 24 pezzi di interfaccia a mano. È lo stesso ragionamento del *virtual DOM*: descrivi come deve apparire e lascia che si ricostruisca.

Le voci della modalità sviluppatore ora hanno un'**area cliccabile** larga quanto il pannello (`hitArea`, `src/scenes/ScenaSviluppatore.ts:97`): senza, era cliccabile solo il testo e "Dai oggetto…", corto, si mancava facilmente. Lo ha scoperto la prova nel browser.

---

## Esercizio facoltativo (4a)

**Una pozione nuova, solo con i dati.**

1. In `src/data/oggetti.json` aggiungi una "Pozione di vita superiore": `id` `"pozione_vita_superiore"`, rarità `"rara"`, pila 5, colore `"#ff2a6a"`, effetto `{"tipo": "cura", "quantita": 30}`.
2. Mettila nel forziere del bosco: in `src/data/mappe/bosco.json`, nella legenda di `"X"`, aggiungila al `contenuto`.
3. Chiedimi test e compilazione. Se sbagli a scrivere l'id nel forziere, un test te lo dirà.

**Domanda per riflettere:** la pozione di forza dà +2 al modificatore dei danni, che vale per ogni colpo. È più utile a chi fa tanti colpi deboli (pugnali) o a chi ne fa pochi forti (spada)? Fai il conto con 1d4 + 3 contro 1d8 + 2.

---

# Consegna 4b — Armi e armature

Schermate in `docs/schermate/fase-4b/`. Prova nel browser: `tests/browser/fase-4b.cjs` (35 controlli, tutti riusciti).

### 1. Un catalogo unico: "tutto ciò che sta nello zaino"

Armi (`armi.json`) e armature (`armature.json`) hanno formati diversi, ma lo zaino, i forzieri e il bottino conoscono solo gli **oggetti**. Invece di insegnare a ognuno di loro le spade e gli elmi, `caricaDati` costruisce per ogni arma e armatura una voce "oggetto" (`src/data/caricaDati.ts:72`, funzioni `voceArma` e `voceArmatura` a riga 96): non si impila (`pila: 1`) e ha il colore della sua rarità. Da quel momento una spada entra in un forziere esattamente come una pozione, e il codice di zaino e raccolta non è cambiato di una riga.

Nel web è il pattern **adapter**, o un *view model*: trasformi dati di forme diverse in una forma comune che il resto dell'app sa già usare. Lo stesso id in due file creerebbe ambiguità, per questo c'è il controllo `idRipetuti`.

Per le regole dell'equipaggiamento serve un secondo riassunto, `Indossabile` (`src/systems/equipaggiamento.ts:24`): categoria, spazio, rarità, armatura, bonus ed effetti. È un'**interfaccia comune**, come un tipo TypeScript che due API diverse rispettano.

### 2. Equipaggiare è uno scambio

`equipaggia` (`src/systems/equipaggiamento.ts:60`) prende il pezzo dallo zaino e, se nello spazio c'era già qualcosa, lo rimette **nello stesso spazio dello zaino** (riga 87). Grazie allo scambio si può cambiare arma anche con lo zaino pieno. Togliere un pezzo, invece, richiede uno spazio libero.

La funzione non lancia errori: restituisce `{ ok: true, stato }` oppure `{ ok: false, errore }`. È una **unione discriminata**: TypeScript ti obbliga a guardare `ok` prima di usare `stato`, come con le risposte di una fetch che può fallire.

### 3. Il limite delle esotiche

È la regola più delicata, quindi è nei systems con i suoi test (riga 75). Quando indossi un'esotica si controllano gli **altri** spazi della stessa categoria: se c'è già un'esotica, la richiesta viene rifiutata. Lo spazio che stai riempiendo è escluso dal controllo, quindi puoi **sostituire** la tua arma esotica con un'altra, ma non averne due. Armi e armature hanno ciascuna il proprio limite: un'arma esotica e un pezzo d'armatura esotico possono stare insieme.

### 4. Bonus delle leggendarie: un valore derivato

I pezzi leggendari danno +1 a una caratteristica. Il bonus **non viene scritto** nelle caratteristiche del personaggio, che restano quelle "vere". Si calcola al volo con `conBonus` (`equipaggiamento.ts:143`), e `caratteristicheTotali` (in `partita.ts`) è quello che la scena usa per danni, critico, capriola e mana. Togliendo il pezzo, il bonus sparisce da solo.

C'è però una conseguenza. La vita massima dipende dalla COS, quindi indossare o togliere un elmo con +1 COS deve ricalcolarla. Per questo `aggiungiEsperienza` e `assegnaPuntoPartita` ricevono il bonus come parametro facoltativo (`partita.ts:88` e `:106`). È lo stesso principio dei selettori calcolati (le "computed"): un solo dato vero e tutto il resto derivato.

### 5. Registro degli effetti

Gli effetti nei dati sono **etichette** (`"risucchio_vita"`, `"spine"`…). I numeri stanno in `src/systems/effettiArmi.ts`, testati. Cosa fa ogni etichetta nel mondo è deciso in un solo posto: `effettiDopoIlColpo` (`src/scenes/mondo/Combattimento.ts:96`). Gli effetti sono:

- **Risucchio:** l'eroe recupera il 20% del danno inflitto.
- **Critico triplo:** cambia il moltiplicatore passato a `calcolaDanno` (riga 61).
- **Fuoco e rallentamento:** si attaccano al nemico. Il nemico usa lo stesso sistema di effetti a tempo delle pozioni dell'eroe (`effettiTemporanei.ts`), cioè lo stesso codice per due usi diversi.
- **Invisibilità dopo un'uccisione** e **Guanti del predatore:** usano metodi dell'eroe che esistevano già.

Le bruciature e le spine non tirano dadi e non stordiscono: passano da `danneggiaDiretto` (riga 77), che però può comunque sconfiggere un nemico e dare esperienza.

Un'arma nuova che **combina** effetti esistenti si crea solo con i dati. Un effetto **nuovo** richiede di aggiungere un caso qui, come prevede il design (§4).

### 6. La freccia che rimbalza

`tiraProiettile` (`src/scenes/ScenaMondo.ts:613`) è una funzione **ricorsiva**: quando la freccia colpisce, cerca il nemico più vicino non ancora colpito (`prossimoRimbalzo`) e lancia una nuova freccia dal punto d'impatto, con un rimbalzo in meno.

La prima prova nel browser ha trovato un bug: la nuova freccia nasceva *dentro* il nemico appena colpito e lo ricolpiva subito, tre volte di fila. La correzione è l'insieme `ignora` (riga 630): il gestore dei proiettili attraversa i nemici già colpiti. È un caso tipico in cui un test sulla sola funzione pura non basta: l'errore stava nel **collegamento** tra le parti.

### 7. Il muro segreto e la griglia che cambia

A* chiede alla griglia "qui si passa?". Prima la risposta dipendeva solo dalla mappa scritta nel file. Ora `grigliaDellaMappa` riceve una **funzione** che dice se una cella è stata aperta (`ScenaMondo.ts:160`). Poiché è una funzione e non una copia dei dati, quando il muro si apre il percorso lo sa subito, senza ricostruire nulla. È la differenza tra passare un valore e passare un *getter*. La stessa funzione la usano i proiettili, così una freccia attraversa il varco aperto.

Il muro si apre in due modi: cliccandolo da vicino, oppure colpendolo con un fendente (`aggiornaMuri`, riga 568). Lo stato "aperto" va nella Partita (`muriAperti`), come i forzieri.

### 8. "Non durante un combattimento"

La scheda decide **all'apertura** se è bloccata (`ScenaScheda.ts:63`): il mondo è in pausa e i nemici non si muovono, quindi la situazione non può cambiare finché la scheda è aperta. "In combattimento" significa che almeno un nemico vivo ti vede, cioè sei dentro il suo raggio di vista (`GruppoNemici.inCombattimento`). Il blocco vale solo per le armature: le armi restano libere.

### 9. Due pagine nella stessa scheda

Le due schede (*Caratteristiche* ed *Equipaggiamento*) sono due **Container** (`ScenaScheda.ts:80`). Nascondere un Container nasconde tutto ciò che contiene e, cosa importante, Phaser non manda clic agli oggetti invisibili. Il comportamento è quello di `display: none` sul `<div>` di una tab.

### 10. Due capriole di fila

La macchina a stati ha un campo in più, `capriolaExtra` (`src/systems/statoEroe.ts:25`). La prima capriola dopo la ricarica, con gli Stivali del vento, lascia "in tasca" una seconda capriola (riga 74). La ricarica parte comunque dalla prima. È un esempio di come uno **stato esplicito** renda facile aggiungere una regola senza toccare le altre.

---

## Esercizio facoltativo (4b)

**Un'arma nuova combinando effetti esistenti.**

1. In `src/data/armi.json` aggiungi la "Falce del gelo infuocato": copia `spada_brace`, cambia `id` e `nome`, rarità `"leggendaria"` ed effetti `["fuoco", "rallentamento"]`.
2. Avvia i test: passano senza toccare il codice, perché gli effetti esistono già.
3. Ora prova a scrivere un effetto inventato, per esempio `"veleno"`, e riavvia i test: la validazione ti dirà `effetto "veleno" sconosciuto`.

**Domanda per riflettere:** la Corazza di spine rimanda il 30% del danno *subito*, che dopo l'armatura è spesso 1. Conviene di più contro tanti nemici deboli o contro pochi forti? E cosa cambierebbe se rimandasse il 30% del danno *prima* dell'armatura?

---

# Consegna 4c — Barra dei preferiti

Schermate in `docs/schermate/fase-4c/`. Prova nel browser: `tests/browser/fase-4c.cjs` (20 controlli, tutti riusciti).

### 1. Collegamenti, non oggetti

Uno spazio della barra contiene solo l'**id** dell'oggetto (`src/systems/preferiti.ts`), come un segnalibro del browser che punta a una pagina senza spostarla. Le pozioni restano nello zaino. Quando finiscono, lo spazio resta al suo posto, grigio e con "0", e si riaccende appena ne raccogli un'altra.

Se metti lo stesso oggetto in un altro spazio, il collegamento **si sposta** e non si duplica (`preferiti.ts:29`). Così la barra non si riempie di copie dello stesso oggetto.

### 2. Una sola funzione per "cosa fa questo spazio?"

`cosaFa` (`preferiti.ts:46`) risponde con un'**unione discriminata** (`AzionePreferito`, riga 40). Gli esiti possibili sono tre: vuoto, pozione (con quante ce ne sono), oppure arma (già in mano, oppure in quale spazio dello zaino si trova). La usano tre parti del gioco:

- la barra in basso, per **disegnare** lo spazio (grigio, bordo verde "in mano", quantità);
- lo zaino, per la sua riga dei preferiti;
- il mondo, per **eseguire** il clic o il tasto 1–6 (`ScenaMondo.ts:279`).

Disegno e comportamento non possono andare in disaccordo, perché leggono la stessa risposta. Nel web è come un selettore usato sia dal componente sia dall'handler.

### 3. Cambio rapido d'arma con attesa

Impugnare un'arma dalla barra passa da `indossaDaZaino` con un'attesa di 500 ms (`ATTESA_CAMBIO_ARMA`, `ScenaMondo.ts:100`). La macchina a stati la applica con `attendiAttacco` (`statoEroe.ts:82`), che **sposta in avanti** il momento in cui si può riattaccare senza accorciare una ricarica già più lunga. Senza questa regola si potrebbero alternare due armi per saltare le ricariche.

Una piccola trappola trovata scrivendo il codice: l'evento `RESUME` di Phaser passa i suoi argomenti alla funzione collegata. `dallaPartita(attesa)` avrebbe ricevuto un oggetto al posto di un numero. Per questo c'è `alRiprendere` (riga 837), che chiama `dallaPartita()` senza argomenti. È lo stesso problema di `addEventListener('click', funzione)`, quando la funzione si aspettava altri parametri.

### 4. Trascinare: drag & drop a eventi

Il trascinamento di Phaser (`ScenaInventario.ts:139`) funziona come il drag & drop HTML: `dragstart`, `drag`, `dragend`. Tre accorgimenti:

- **Soglia di 6 pixel** (riga 141): sotto quella distanza è un clic, sopra è un trascinamento. Senza la soglia, ogni clic per selezionare diventerebbe un mini-trascinamento.
- **Selezione al rilascio:** l'oggetto si seleziona al `pointerup`, non al `pointerdown`. Selezionare ridisegna la griglia, e farlo all'inizio del trascinamento distruggerebbe l'oggetto che stai trascinando. Per lo stesso motivo `ridisegna` non fa nulla mentre trascini (riga 177).
- **Dati attaccati all'oggetto:** ogni spazio trascinabile porta con sé cosa rappresenta, con `setData('trascina', …)` (righe 193 e 241), come un attributo `data-*` in HTML. Così un solo gestore di `dragend` capisce se arriva dallo zaino o dalla barra.

L'"oggetto che segue il mouse" è un **fantasma**: un disegno temporaneo creato al `dragstart` e distrutto al `dragend`. Lo spazio vero non si muove mai.

### 5. Una barra che si ridisegna poco

`SpazioBarra` (`src/scenes/interfaccia/SpazioBarra.ts`) ridisegna l'icona solo quando cambia la sua **chiave** (riga 67): l'arma secondaria viene controllata 60 volte al secondo, ma ridisegnata solo quando cambia davvero. I preferiti si aggiornano solo quando cambia la Partita (`aggiornaPreferiti`, `ScenaInterfaccia.ts:235`), non a ogni fotogramma. È la stessa idea della *memoization*: rifai il lavoro solo se l'input è cambiato.

La posizione degli spazi è calcolata da una funzione (`xSpazioBarra`, riga 47) e non scritta a mano. Le prove nel browser usano la stessa formula (`BARRA` in `tests/browser/aiuti.cjs`), quindi se la barra cambia di nuovo basta aggiornare un posto solo.

---

## Esercizio facoltativo (4c)

**Più spazi nella barra.**

1. In `src/systems/preferiti.ts` porta `NUMERO_PREFERITI` da 6 a 7.
2. Avvia i test: quali falliscono, e perché? Sono test che controllavano proprio il "6" del design. È un buon esempio di test che proteggono una decisione.
3. Rimetti 6. Se volessi davvero 7 spazi, cos'altro dovresti cambiare? Pensa al tasto 7 in `ScenaMondo` e alla larghezza della barra in `xSpazioBarra`.

**Domanda per riflettere:** l'attesa dopo il cambio d'arma vale 500 ms per tutte le armi. Avrebbe senso farla dipendere dall'arma (una balestra più lenta da preparare di un pugnale)? Dove metteresti quel numero: nel codice o in `armi.json`?

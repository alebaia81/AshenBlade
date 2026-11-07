# Lezione della fase 5: il villaggio

# Consegna 5a — Borgo Quercia

Schermate in `docs/schermate/fase-5a/`. Prova nel browser: `tests/browser/fase-5a.cjs` (22 controlli, tutti riusciti).

### 1. Un dialogo è un grafo

Un dialogo (`src/data/dialoghi.json`) è fatto di **nodi**: ogni nodo ha un testo e delle risposte. Ogni risposta può:

- portare a un altro nodo (`"va"`);
- aprire qualcosa (`"apri": "negozio"`);
- chiudere il dialogo, se non ha né `"va"` né `"apri"`.

È esattamente un sito con pagine e link. Le scelte non sono codice, sono **dati**: per scrivere una nuova chiacchierata con Gemma basta il JSON.

La regola è in una funzione pura, `scegli` (`src/systems/dialoghi.ts:36`). Restituisce un'unione discriminata: `nodo`, `apri` oppure `chiudi`. La scena del dialogo si limita a mostrare il risultato.

### 2. Validare un grafo: link rotti e pagine orfane

Con tanti testi è facile sbagliare un id. `validaDialogo` (riga 49) trova tre tipi di errore:

- **link rotti:** una risposta che porta a un nodo inesistente;
- **vicoli ciechi:** nodi senza risposte, da cui il giocatore non potrebbe uscire;
- **nodi irraggiungibili:** testo scritto ma impossibile da vedere.

Per gli ultimi c'è una **visita del grafo** (riga 62): si parte dall'inizio, si segue ogni link e si segna ciò che si tocca; quello che resta non segnato è irraggiungibile. È lo stesso algoritmo di un controllo dei link rotti su un sito, e la stessa idea della ricerca del percorso (A\*), ma più semplice. Gli errori compaiono all'avvio del gioco e nei test, mai a metà partita.

### 3. Le persone del villaggio

Un abitante è una cella della mappa con `"tipo": "abitante"` e un id (`borgo.json`). Il resto (nome, colore, dialogo) sta in `abitanti.json`. È lo stesso schema dei nemici, che ormai conosci: la **mappa dice dove**, il **file di dati dice chi**.

Nel mondo (`src/entities/Abitante.ts`) l'abitante ha un corpo fisico **statico** (riga 21), come i forzieri: non si attraversa e non si sposta. Anche per A\* è una cella piena (`mappa.ts:94`).

Il nome sopra la testa è un testo con `resolution: 4` (riga 38). La telecamera ingrandisce il mondo ×3, quindi un testo disegnato alla risoluzione normale verrebbe sgranato. È come preparare un'immagine @2x o @3x per gli schermi retina.

### 4. Cliccare per parlare: riusare "Interagibile"

Parlare con qualcuno funziona **esattamente** come aprire un forziere: la persona è un `Interagibile`, e `GuidaEroe` porta l'eroe vicino e poi chiama `interagisci`. L'unica novità è il campo `cursore: 'parla'` (`ScenaMondo.ts:620`), che mostra il **fumetto** invece della mano.

Il fumetto è un SVG scritto direttamente nel codice e usato come cursore CSS, come la spada della fase 3. Grazie al "contratto" `Interagibile` non abbiamo dovuto toccare la ricerca del percorso: aggiungere un tipo nuovo di cosa cliccabile è costato tre righe.

### 5. La scena del dialogo

`ScenaDialogo` è una scena sovrapposta, come la scheda e lo zaino: il mondo va in **pausa** (`parla`, `ScenaMondo.ts:634`). Le risposte sono righe di testo con un'**area cliccabile** larga quanto il riquadro (`ScenaDialogo.ts:83`), e si possono scegliere anche con i tasti 1–4 (riga 63).

I tasti 1–4 sono gli stessi della barra dei preferiti, ma non c'è conflitto: una scena in pausa non riceve la tastiera. È come un modale che cattura il focus.

### 6. Le monete: un oggetto che non va nello zaino

Le monete devono cadere a terra e luccicare come il resto del bottino, ma **non** occupano spazio nello zaino. La soluzione è un adattatore, come per armi e armature nella 4b:

- `caricaDati` aggiunge al catalogo una voce `"monete"` di tipo `'monete'` (`caricaDati.ts:109`), così bottino, forzieri e oggetti a terra la trattano come le altre;
- un solo punto, `raccogli` (`ScenaMondo.ts:700`), la riconosce e la somma alla Partita invece di metterla nello zaino. Per questo si raccoglie anche con lo zaino pieno.

Le regole sono in `src/systems/monete.ts`:

- `moneteDelNemico` (riga 10) tira un numero nell'intervallo scritto nel nemico, estremi compresi, con il solito "casuale" iniettabile;
- `aggiungiMonete` e `spendiMonete` (righe 20 e 26) sono **generiche** (`<T extends { monete: number }>`) e funzionano con qualunque oggetto che abbia un campo `monete`. Le useremo anche per il negozio.

### 7. Cambiare il punto di partenza senza rompere i vecchi test

Da questa consegna la partita inizia nel borgo (`mondo.json`). Le prove nel browser delle fasi 3 e 4 erano scritte per la Radura. Invece di riscriverle, abbiamo aggiunto un comando, `vaiA(idMappa)` (`ScenaMondo.ts:397`), e l'aiuto delle prove ci porta automaticamente nella Radura dopo la creazione del personaggio.

È una lezione generale: quando cambi un'impostazione predefinita, **dai ai vecchi test un modo esplicito per chiedere quella vecchia**, invece di cambiarli tutti.

---

## Esercizio facoltativo (5a)

**Una frase nuova per Bruno.**

1. In `src/data/dialoghi.json`, nel dialogo `"bruno"`, aggiungi al nodo `"saluto"` una risposta `{"testo": "Hai un figlio?", "va": "figlio"}`.
2. Avvia i test: falliscono, perché il nodo `"figlio"` non esiste. Leggi il messaggio.
3. Aggiungi il nodo `"figlio"` con un testo (Bruno ha perso il figlio nella miniera, §3) e una risposta che chiude. Ora i test passano.

**Domanda per riflettere:** cosa succederebbe se un nodo avesse come unica risposta `{"va": "saluto"}` e il nodo `"saluto"` portasse solo a lui? La validazione lo troverebbe? È un problema per il giocatore? (Suggerimento: pensa a cosa fa il tasto Esc.)

---

# Consegna 5b — La bottega di Gemma

Schermate in `docs/schermate/fase-5b/`. Prova nel browser: `tests/browser/fase-5b.cjs` (17 controlli, tutti riusciti).

### 1. Prezzi: un numero nei dati, una formula nel codice

Ogni oggetto ha un `"prezzo"` pieno (`oggetti.json`, `armi.json`, `armature.json`). Il prezzo vero lo calcolano due funzioni pure (`src/systems/negozio.ts:19` e `:24`):

- **comprare:** prezzo pieno meno il 5% per ogni punto di modificatore CAR;
- **vendere:** metà prezzo più il 5% per punto.

Il Carisma conta **al massimo il 25%** (`MASSIMO_CAR`, riga 12). Senza limite, con un Carisma altissimo rivendere costerebbe più che comprare, e si potrebbero "stampare" monete comprando e rivendendo all'infinito. Nei giochi questo errore si chiama *exploit*, e un test lo controlla ("la vendita non supera mai l'acquisto").

Il Carisma usato è quello **totale**, bonus delle leggendarie compresi (`ScenaNegozio.ts:88`): è la stessa funzione `caratteristicheTotali` della 4b.

### 2. Una transazione: tutto o niente

`compra` (riga 43) fa due cose: toglie le monete e aggiunge l'oggetto allo zaino. Se una delle due non riesce (monete insufficienti o zaino pieno), **non deve succedere nemmeno l'altra**: niente monete spese per un oggetto che non entra.

Visto che le funzioni restituiscono oggetti nuovi senza toccare quelli vecchi, la cosa è semplice: si prepara il risultato e, se qualcosa va storto, si restituisce l'errore e la Partita originale resta com'era. È lo stesso principio di una **transazione** in un database (*commit* o *rollback*), ottenuto gratis con i dati immutabili.

`compra` riusa `spendiMonete` della 5a (riga 46), che era **generica** proprio per questo. Anche `compra` e `vendi` sono generiche (`<T extends Portafoglio>`): ricevono una Partita intera e restituiscono una Partita intera, ma guardano solo monete e zaino.

### 3. Validare anche il negozio

`validaNegozio` (riga 60, chiamata da `caricaDati.ts:97`) controlla che ogni merce:

- esista;
- abbia un prezzo;
- **non** sia leggendaria o esotica, che il design riserva ai dungeon (§8).

Se un giorno qualcuno scrivesse `"lama_vuoto"` nella merce di Gemma, il gioco si rifiuterebbe di partire con un messaggio chiaro. Le regole di game design diventano così controlli automatici.

### 4. Selezione e mouse: cosa guardi e cosa compri

La scena distingue due cose: ciò che è **sotto il mouse** (aggiorna i dettagli, per curiosare) e ciò che è **selezionato** (il pulsante Compra / Vendi agisce su quello, riga 200). Se il pulsante seguisse il mouse, spostandoti verso il pulsante passeresti sopra un'altra riga e compreresti la cosa sbagliata.

Ogni riga e ogni spazio diventano cliccabili con la stessa funzione, `rendiCliccabile` (riga 151): clic sinistro seleziona, clic destro compra o vende subito, come "usa al volo" nello zaino. Stesse abitudini in tutte le schermate.

---

## Esercizio facoltativo (5b)

**Gemma vende una cosa nuova.**

1. In `src/data/negozio.json` aggiungi `"guanti_acciaio"` alla merce di Gemma. Apri la bottega: compare, con il prezzo calcolato.
2. Ora prova con `"guanti_titano"` (leggendari): avvia i test e leggi l'errore.
3. Rimetti com'era.

**Domanda per riflettere:** il prezzo di rivendita si basa sul prezzo pieno. Un'arma esotica trovata nel dungeon (prezzo 800) si rivende a 400: è giusto o rende i dungeon "una miniera d'oro"? Come cambieresti la regola, e in quale file?

---

# Consegna 5c — La taverna e i compagni

Schermate in `docs/schermate/fase-5c/`. Prova nel browser: `tests/browser/fase-5c.cjs` (24 controlli, tutti riusciti).

### 1. Riusare un'IA invertendo il bersaglio

Il design (§10) chiede di riusare l'intelligenza dei nemici "con bersagli invertiti". Un nemico guarda l'eroe e lo insegue; il compagno guarda i nemici e insegue quello **più vicino all'eroe** (`bersaglioCompagno`, `src/systems/ia/compagno.ts:31`), non il più vicino a sé. Così difende te invece di correre dietro a chi passa lontano.

`decidiCompagno` (riga 44) restituisce una delle quattro decisioni: attacca, avvicinati, segui l'eroe, fermo. Come per i nemici, la "mente" è una funzione pura e testata; il corpo (`src/entities/Compagno.ts`) si limita a eseguire.

### 2. Muoversi: linea retta, poi A*, poi il trucco del teletrasporto

Il compagno si muove in tre modi:

1. se la strada è libera in linea retta (`liberoTra`), va dritto;
2. altrimenti calcola un percorso con **A\***, lo stesso dell'eroe, e lo ricalcola ogni 400 ms perché la destinazione si muove;
3. se resta indietro di più di 220 pixel, **ricompare accanto all'eroe** (riga 60).

Il punto 3 lo usano quasi tutti i giochi con compagni: è meglio un piccolo "salto" che un compagno incastrato dietro un albero per tutta la partita.

La prova nel browser ha trovato un caso vero: uno slime era nato **dentro** un albero, A\* non trovava strada verso una cella piena e il compagno restava fermo. La correzione è la stessa dell'eroe quando clicchi un albero: puntare alla **cella libera più vicina** (`cellaRaggiungibilePiuVicina`, riga 107).

### 3. Più bersagli per i nemici

Prima i nemici avevano un solo bersaglio possibile, l'eroe. Ora `GruppoNemici.aggiorna` (riga 36) riceve un **elenco** di bersagli, e ogni nemico sceglie il più vicino a sé. La scena lo prepara a ogni fotogramma (`ScenaMondo.ts:264`): l'eroe se è visibile, il compagno se è in piedi.

Passare da "un valore" a "un elenco" è un cambiamento piccolo, che però apre molte possibilità: domani potrebbero esserci due compagni, o un'esca.

### 4. Al tappeto e rialzo: uno stato con il tempo

`aggiornaRialzo` (`src/systems/compagno.ts:31`) conta da quanto **nessun nemico è in vista**. Se un nemico ricompare, il conto riparte da zero. Dopo 3 secondi di calma il compagno si rialza con metà vita. È lo stesso schema della macchina a stati dell'eroe: niente `setTimeout`, solo "da quando" e confronti con l'ora attuale. Così il gioco in pausa (scheda, zaino, dialogo) non fa scorrere il tempo per sbaglio.

### 5. Le protezioni: un "middleware" sul danno

La parata di Corrado e lo scudo di Elisa intercettano il danno **prima** che arrivi all'eroe. `gestisciContatti` riceve una funzione `protezione` che prende il danno e restituisce quello che resta. In mezzo c'è `assorbiDanno` (`compagno.ts:50`), pura e testata. È come un middleware in un server web: la richiesta (il colpo) passa da un filtro che può fermarla, ridurla o lasciarla passare.

Un dettaglio importante: se l'eroe in quel momento non può essere colpito (capriola, invulnerabilità), la protezione **non si consuma** (`gestisciContatti.ts:46`). Altrimenti la parata di Corrado verrebbe sprecata su un colpo che non avrebbe fatto danno.

### 6. I colpi del compagno non sono i tuoi

Il compagno usa lo stesso `Combattimento` dell'eroe, ma il colpo porta il segno `dalCompagno` (`Combattimento.ts:46`). Così:

- le passive della tua classe (colpo alle spalle del Ladro, bonus contro i non morti del Chierico) non valgono per lui;
- i Guanti del predatore non ti curano per i suoi critici.

L'esperienza delle sue uccisioni invece va a te: passa dalla stessa funzione `quandoSconfitto`.

### 7. Pulire bene quando qualcosa sparisce

Ogni volta che cambi compagno dalla taverna, il vecchio sparisce e ne arriva uno nuovo. Prima di distruggerlo togliamo le sue **collisioni** con muri e nemici (`ScenaMondo.ts:681`): un collider che punta a un oggetto distrutto farebbe errore al fotogramma dopo. È lo stesso principio di `removeEventListener` quando un componente web viene smontato.

### 8. Bonus fissi come funzione

`bonusCompagno(tipo)` (riga 673) restituisce il valore del bonus del compagno attivo, oppure 0. Armatura, critico e rigenerazione del mana lo sommano nei punti in cui già si calcolavano: una riga ciascuno, senza `if` sparsi per sapere chi è con te.

---

## Esercizio facoltativo (5c)

**Un compagno più forte (o più economico).**

1. In `src/data/compagni.json` cambia il `"prezzo"` di Corrado a 40 e la ricarica di "Para un colpo" a 8000.
2. Prova in taverna: il prezzo e la ricarica scritti sulla scheda cambiano da soli.
3. Poi prova a dargli `"danno": "2d8"` e avvia i test: uno fallisce. Quale, e perché il design lo vuole?

**Domanda per riflettere:** i nemici inseguono il bersaglio più vicino. Corrado ha più vita di te e +1 armatura per te: come cambierebbe il gioco se i nemici preferissero **sempre** il compagno quando è vicino? Dove scriveresti questa regola?

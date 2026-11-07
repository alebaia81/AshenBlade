# Lezione della fase 7: quest

# Consegna 7a — Il sistema delle quest

Schermate in `docs/schermate/fase-7a/`. Prova nel browser: `tests/browser/fase-7a.cjs` (29 controlli, tutti riusciti). Tutte le prove precedenti ripassano (3a–6b).

### 1. Una quest è un reducer

`registraEvento` (`src/systems/quest.ts:121`) è il cuore della fase. Il gioco non dice mai "aggiungi 1 al contatore dei lupi di Dario": dice soltanto **cosa è successo** (`{ tipo: 'sconfitto', nemico: 'lupo' }`) e la funzione decide, per ogni quest attiva, se un passo avanza. Restituisce lo stato nuovo e gli avvisi da mostrare.

È lo schema di Redux: `(stato, azione) => stato nuovo`. Il mondo manda quattro tipi di evento, da quattro punti di `ScenaMondo.ts`:

- `sconfitto` quando un nemico muore (riga 1275);
- `parlato` quando apri un dialogo (riga 982);
- `aperto` quando apri un forziere (riga 1041);
- `raggiunto` quando entri in una mappa (riga 205).

Il vantaggio: le regole si provano con i test senza aprire il gioco (`tests/quest.test.ts`), e aggiungere un tipo di obiettivo nuovo vuol dire toccare **un solo file**.

### 2. Cosa si salva e cosa si calcola

Nella Partita, per ogni quest iniziata ci sono solo tre cose: `stato` (attiva o conclusa), `passo` e `conteggio` (i lupi sconfitti finora). "Disponibile" e "pronta" **non si salvano**: le calcola `statoDi` (riga 90) ogni volta che servono, dai dati e dallo zaino.

Perché? Pensa alle erbe di frate Anselmo. Se salvassi "ne hai raccolte 5", vendendone una da Gemma il numero resterebbe 5 e la quest sarebbe falsamente pronta. Invece il progresso di una quest *raccogli* si legge **dallo zaino** (`progresso`, riga 109): vendi un'erba e il registro scende a 4 / 5. È la stessa idea di un *computed* in Vue o di un selettore in Redux: un valore derivato non si memorizza, si ricalcola.

### 3. Dialoghi con condizioni: un `v-if` sulle risposte

Le risposte del dialogo ora possono avere:

- `se`: la risposta compare solo se una quest è in un certo stato;
- `azione`: accetta o conclude una quest prima di proseguire.

```json
{ "testo": "I lupi non torneranno.", "va": "grazie",
  "se": { "quest": "lupi_dario", "stato": "pronta" },
  "azione": { "concludi": "lupi_dario" } }
```

`risposteVisibili` (`src/systems/dialoghi.ts:65`) filtra la lista, come un `v-if` (o un `{cond && <li>}` in React) su ogni riga. La scena chiede soltanto "questa condizione è vera?" a `condizioneVera` (`ScenaMondo.ts:336`). Così i testi delle quest restano tutti in `dialoghi.json`, scritti come dati.

Una regola nuova nella validazione (riga 81): ogni nodo deve avere **almeno una risposta senza condizione**. Altrimenti, in certi momenti, un nodo potrebbe mostrare zero risposte e il giocatore resterebbe bloccato nel dialogo.

### 4. Validare i collegamenti tra file diversi

Una quest cita nemici, oggetti, persone e mappe. `validaQuest` (`quest.ts:229`) controlla che esistano tutti. `questSenzaDialogo` (`caricaDati.ts:185`) controlla una cosa più sottile: che nel dialogo di chi affida la quest esista davvero una risposta per **accettarla**, e in quello di chi la chiude una per **concluderla**. Senza, la persona avrebbe un `!` sopra la testa per sempre.

Per far funzionare le quest *elimina* serviva anche che un nemico sapesse "chi è". Prima il nome stava solo nella chiave del JSON, quindi `caricaDati` ora lo copia dentro la definizione (riga 99).

### 5. Ricompense: riusare la regola del Carisma

Le monete crescono del 5% per punto di modificatore CAR, al massimo del 25%. È la stessa regola dei prezzi di Gemma, quindi `concludi` (riga 183) chiama la stessa funzione `effettoCarisma` del negozio invece di riscriverla.

`concludi` restituisce esperienza e oggetti **al chiamante**, invece di gestirli lei. L'esperienza può far salire di livello (e quella logica sta già in `ScenaMondo`), e gli oggetti con lo zaino pieno cadono **a terra**, bloccati come il bottino rifiutato finché l'eroe non si allontana. Una funzione pura non può far cadere nulla nel mondo: lo fa la scena.

### 6. I segni sopra le persone seguono la Partita

`segnoSopra` (`quest.ts:206`) decide il segno: `!` giallo, `?` giallo o `?` grigio. `ScenaMondo` ricalcola i segni a ogni cambio della Partita (`changedata`, riga 202): accetti, raccogli, vendi, e il segno si aggiorna da solo. È un **osservatore**, come un `watch` in Vue o un `useEffect` che dipende dallo stato.

### 7. Riusare un'entità con un aspetto diverso

I cespugli di erbe **sono vene**. Stesso clic, stesso "scava", stesso esaurimento fino al rientro nella zona. Cambia solo il disegno, scelto da un campo della mappa (`"aspetto": "cespuglio"`; `Vena.ts:26` e `disegnaCespuglio`, riga 76). Prima di creare una classe nuova conviene sempre chiedersi: *si comporta in modo diverso, o si vede soltanto in modo diverso?*

### 8. Un bug trovato dalla prova nel browser

La prima versione dell'avviso di fine quest finiva **sotto** il riquadro del dialogo: il giocatore non vedeva la ricompensa. Ora `azioneQuest` restituisce anche una riga di testo, che il dialogo mostra in verde sopra le risposte (`ScenaDialogo.ts:111`).

---

## Esercizio facoltativo (7a)

**Una quest nuova, solo con i dati.**

1. In `src/data/quest.json` aggiungi una quest di Gemma: *raccogli* 3 gelatine di slime (`gelatina_slime`), ricompensa 25 monete.
2. Avvia i test: la validazione ti dirà cosa manca nel dialogo di Gemma. Aggiungi le risposte con `se` e `azione`, copiando quelle di Bruno.
3. Prova a mettere *raccogli* come **primo** passo di una quest a due passi: quale controllo ti ferma, e perché esiste?

**Domanda per riflettere:** oggi i nemici sconfitti **prima** di accettare non contano. Se volessi una quest "hai già ucciso 10 lupi? Ti premio", cosa dovresti salvare in più nella Partita, e dove?

---

# Consegna 7b — Il mondo si allarga

Schermate in `docs/schermate/fase-7b/`. Prova nel browser: `tests/browser/fase-7b.cjs` (28 controlli, tutti riusciti). Tutte le prove precedenti ripassano (3a–7a).

### 1. Due mappe nuove senza una riga di codice per le mappe

Il **Cimitero sulla collina** e le **Colline Grigie** sono solo due file JSON in `src/data/mappe/`. `caricaDati` li trova da solo (li cerca per cartella) e li valida: uscite che portano a mappe vere, punti d'arrivo esistenti, nemici e oggetti noti. Per collegarle sono bastate due celle d'uscita nel bosco e nella Radura.

Un test ha trovato subito un problema: il nuovo ingresso del bosco era a 5 tessere da un lupo, e la regola "nessun nemico nasce troppo vicino a un ingresso" l'ha fermato. Ho spostato il lupo. È il vantaggio di aver scritto le regole del level design come test.

### 2. Un "componente" generico: il cartello

Il cancello della cripta, la frana sulla strada della miniera e il cartello stradale fanno la stessa cosa: non si attraversano, e cliccandoli **dicono qualcosa**. Invece di tre classi ce n'è una sola (`src/entities/Cartello.ts`), con l'aspetto e il testo presi dalla mappa:

```json
"G": { "tipo": "cartello", "aspetto": "cancello",
       "testo": "…È chiuso a chiave…",
       "oggetto": "chiave_cripta", "testoConOggetto": "La chiave di Berta gira…" }
```

Con la chiave nello zaino il testo cambia (`Cartello.ts:45`). È come un componente con le *props*: la stessa classe, dati diversi. Nella fase 8 il cancello diventerà una porta vera.

### 3. Tre varianti di quest, con tre campi in più

Il sistema della 7a ha retto quasi tutto. Sono serviti solo alcuni campi facoltativi in `DefinizioneQuest`:

- `oggettiAllInizio`: accettando, Bruno ti dà la lettera da consegnare;
- `siAccettaCon` + `automatica`: la mappa del tesoro non passa da nessuno. La quest si avvia **usando** la mappa e si chiude **da sola** quando apri il forziere (`automatichePronte`, `quest.ts:212`, chiamata in `ScenaMondo.ts:335`). Niente `!` sopra Gemma (`quest.ts:229`);
- `prossimo`: la quest principale mostra nel registro il capitolo che verrà, "sbarrato".

È il principio "aperto all'estensione": i dati nuovi non hanno cambiato il comportamento delle quest vecchie. Lo dimostrano i test della 7a, che ripassano senza modifiche.

### 4. Un caso limite: il forziere già aperto

Cosa succede se il giocatore trova il tesoro **prima** di comprare la mappa? La quest *trova* aspetta un evento "forziere aperto" che non arriverà mai più. `usaMappa` (`ScenaMondo.ts:342`) se ne accorge: se il forziere è già nella lista di quelli aperti, manda subito l'evento e la quest si chiude. Pensare ai casi limite *prima* che li trovi un giocatore è metà del lavoro.

### 5. Oggetti che non si possono perdere

La lettera e la chiave sono di tipo `missione`: non si vendono e non si gettano (`èDiMissione`, `oggetti.ts:73`). Altrimenti un clic sbagliato bloccherebbe una quest per sempre. La regola sta in un posto solo; il negozio e lo zaino la chiedono (il pulsante diventa "Non si vende", e "Getta" si spegne).

### 6. Disegnare dai dati: la mappa del tesoro

La pergamena con la X non è un'immagine fatta a mano: `ScenaMappaTesoro` ridisegna **la griglia vera** delle Colline in color seppia, e mette la X dove sta il forziere della quest (riga 32). Il muro segreto è disegnato come un muro: la mappa aiuta, ma non svela tutto (riga 50). Se domani spostassimo il tesoro nei dati, la X si sposterebbe da sola.

---

## Esercizio facoltativo (7b)

**Un cartello nuovo.**

1. In `src/data/mappe/radura.json` aggiungi alla legenda un simbolo `K` di tipo `cartello`, aspetto `cartello`, con il testo "Borgo Quercia ← · Colline Grigie ↓".
2. Mettilo nella griglia accanto all'uscita verso le Colline (al posto di un `.`, non sopra il sentiero).
3. Togli il campo `"testo"`: quale errore ottieni, e in quale file è scritta la regola?

**Domanda per riflettere:** il cancello della cripta oggi "parla" e basta. Nella fase 8 con la chiave dovrà **aprirsi** e diventare un passaggio. Ti sembra meglio aggiungere un campo al cartello (`"siApreCon": "chiave_cripta"`) o creare un tipo di cella nuovo, "porta"? Pensa a cosa hanno in comune un muro segreto e una porta chiusa a chiave.

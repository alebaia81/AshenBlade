# Lezione della fase 9: rifinitura

# Consegna 9a — Salvare e ricominciare

Schermate in `docs/schermate/fase-9a/`. Prova nel browser: `tests/browser/fase-9a.cjs` (35 controlli, tutti riusciti). Tutte le prove precedenti ripassano (3a–8c), aggiornate per partire dal menu.

### 1. Salvare = trasformare la Partita in testo

Il `localStorage` del browser conserva solo **stringhe**, come un cookie molto grande. La Partita è già fatta di soli dati (numeri, testi, elenchi), senza oggetti di Phaser dentro: è il motivo per cui dalla fase 3 la teniamo **fuori dalle scene**, nel registro. Salvare è quindi un `JSON.stringify` (`src/systems/salvataggio.ts:73`), e caricare un `JSON.parse`.

Cosa si salva: la Partita, la **mappa** e il **punto d'ingresso**. Non si salvano la posizione esatta e i nemici: si riprende all'ingresso della zona, come dopo una sconfitta (§12). È la scelta di molti giochi. Ricordare ogni slime ferito sarebbe tanto lavoro per poco.

### 2. Il tempo non si salva come orario

Una pozione di forza dice "attiva **fino a** 65 000 ms" (millisecondi dall'apertura della pagina). Ricaricando la pagina l'orologio riparte da zero, e "fino a 65 000" vorrebbe dire un minuto in più di forza. Per questo il salvataggio trasforma l'orario in **quanto manca** (`effettiRelativi`, riga 88), e il caricamento lo riconverte (`dopoIlCaricamento`, riga 95).

Paragone web: è la differenza tra salvare `expiresAt` con l'ora di un server e salvare `expiresIn`.

Nella stessa funzione c'è un caso limite: se si salva nell'istante della sconfitta, con la vita a 0, al caricamento si riparte con la vita piena, come dopo ogni sconfitta.

### 3. Non fidarsi di ciò che si rilegge

Chiunque può aprire gli strumenti del browser (F12) e modificare il `localStorage`, oppure importare un file sbagliato. `leggiSalvataggio` (riga 111) tratta il testo come il corpo di una richiesta HTTP:

- **JSON non valido** → errore leggibile, non un'eccezione;
- **versione mancante o più recente** del gioco → errore;
- **forma sbagliata** (manca il personaggio, la vita non è un numero…) → "Salvataggio rovinato" (`controllaForma`, riga 174).

La funzione non lancia mai eccezioni: restituisce `{ ok: true, salvataggio }` oppure `{ ok: false, errore }`. Il menu mostra l'errore e lo slot resta sovrascrivibile. Un salvataggio rovinato non fa mai partire il gioco a metà.

C'è anche una tolleranza voluta: se mancano solo degli **elenchi** (forzieri aperti, ricette…), partono vuoti. Così un salvataggio poco più vecchio della Partita attuale si carica lo stesso.

### 4. Versioni e migrazioni, come in un database

Ogni salvataggio ha `versione: 1`. Prima o poi la Partita cambierà forma, per esempio con un campo nuovo o un nome cambiato. A quel punto si alza la versione e si aggiunge una **migrazione** in `MIGRAZIONI` (riga 144): una funzione che trasforma un salvataggio della versione N in uno della N+1. `aggiorna` (riga 147) le applica in fila, come `npm run migrate` su un database.

Oggi la tabella è vuota (c'è una sola versione), ma il meccanismo è testato con una tabella finta (`tests/salvataggio.test.ts`, "aggiorna"). Il giorno in cui servirà, funziona già.

### 5. Iniettare il localStorage: l'interfaccia `Archivio`

`salvataggio.ts` non usa direttamente `window.localStorage`. Riceve un `Archivio` (riga 25) con tre funzioni: `getItem`, `setItem`, `removeItem`.

- **Nel gioco** è il `localStorage` vero (`archivioDelBrowser`, `src/scenes/browser.ts:16`). Se il browser lo vieta, come certe modalità private, diventa una `Map` in memoria e il menu avvisa.
- **Nei test** è una `Map` scritta in 5 righe. Così i test possono simulare anche un browser che rifiuta di scrivere (spazio finito) e controllare che l'errore sia gestito.

È la **dependency injection** che si usa nel web per i test (un client HTTP finto, un database in memoria). La regola dei `systems` resta la stessa: niente browser e niente Phaser dentro, quindi si possono testare da soli.

### 6. Le pagine del menu: svuota e ridisegna

Il menu ha quattro "pagine" (principale, nuova partita, carica, crediti) in **una sola scena**. Cambiare pagina vuol dire svuotare un contenitore e ridisegnarlo (`vai`, `src/scenes/ScenaMenu.ts:71`). Il `true` di `removeAll(true)` distrugge davvero gli oggetti, invece di staccarli e basta.

È lo stesso modello di un componente React: lo **stato** è la pagina attuale, e ogni cambiamento produce un nuovo disegno. Le pagine sono piccole, quindi ridisegnare tutto è più semplice e sicuro che aggiornare pezzo per pezzo.

### 7. Chi ascolta Esc? L'ordine delle scene

Esc fa cose diverse a seconda di cosa è aperto: chiude lo zaino, chiude le opzioni, apre la pausa. Nessun `if (zainoAperto)` è sparso nel codice: risponde **la scena attiva**.

- Con lo zaino aperto, il mondo è **in pausa** e le scene in pausa non ricevono tasti. Esc lo riceve lo zaino.
- Senza pannelli, il mondo è attivo e Esc apre la pausa (`ScenaMondo.ts:345`).

L'ordine delle scene in `src/main.ts` conta in due modi:

- **il disegno:** le scene più in basso nell'elenco stanno sopra, ed è per questo che pausa e opzioni sono in fondo (riga 69);
- **i tasti:** nello stesso fotogramma le scene vengono aggiornate in ordine. Quando lo zaino si chiude con Esc e "risveglia" il mondo, il mondo ha già fatto il suo turno. Lo stesso Esc non riapre subito la pausa (la prova "Esc chiude lo zaino senza aprire anche la pausa" lo controlla).

F2 invece lo ascolta l'**interfaccia** (`ScenaInterfaccia.ts:117`), che non va mai in pausa: si salva anche con lo zaino o la fucina aperti, come chiede il §12.

### 8. Opzioni "con ritorno"

Le opzioni si aprono dal menu e dalla pausa. Chi le apre passa un dato, `{ torna: 'Pausa' }`, che arriva in `init` (`ScenaOpzioni.ts:26`). Chiudendo, le opzioni risvegliano quella scena. È come passare un `returnUrl` a una pagina di login: la pagina non deve sapere da dove arrivi.

### 9. Esporta e importa: il browser come in un'app web

Phaser disegna tutto su un canvas, ma il browser intorno c'è ancora:

- **Esporta** (`scaricaFile`, `browser.ts:35`) crea un `Blob`, un URL temporaneo e un `<a download>` cliccato dal codice;
- **Importa** (`scegliFile`, riga 50) crea un `<input type="file">` invisibile, lo aggiunge alla pagina e lo "clicca". Il file letto passa poi dagli stessi controlli di sicurezza del punto 3.

Il browser apre la finestra dei file solo se il clic arriva **subito dopo un'azione del giocatore**: per sicurezza, una pagina non può aprirla quando vuole. Il nostro clic su "Importa" vale come azione del giocatore.

### Cosa provare

1. Apri il gioco: ti accoglie il menu. Fai **Nuova partita** → slot 1 → leggi (o salta) l'introduzione → crea il personaggio.
2. Raccogli qualcosa, poi clicca il **dischetto** (o premi F2): gira e compare "Partita salvata nello slot 1".
3. Esci dal borgo e rientraci: "Salvataggio automatico".
4. Chiudi la scheda del browser, riapri `gioco.html`: **Continua** ti riporta all'ingresso dell'ultima zona salvata, con zaino e monete com'erano.
5. **Esc** nel gioco: la pausa. Prova **Opzioni** (togli il testo introduttivo) e **Torna al menu**.
6. In **Carica**: esporta lo slot 1 (scarica un `.json`), importalo nello slot 2, poi elimina lo slot 2.
7. Per curiosità: F12 → Application → Local Storage. Le chiavi `quercia-slot-1…3` contengono la Partita in chiaro. Prova a rovinarne una e guarda cosa dice il menu.

### Esercizio (facoltativo)

Aggiungi alla Partita un contatore `nemiciSconfitti` e mostralo nella scheda. Poi fai in modo che i salvataggi fatti **prima** si carichino ancora.

Per la parte dei salvataggi:

- alza `VERSIONE_SALVATAGGIO` a 2;
- scrivi la migrazione `1: (d) => ({ ...d, versione: 2, partita: { ...d.partita, nemiciSconfitti: 0 } })`;
- aggiungi un test in stile "aggiorna" che parte da un salvataggio della versione 1.

È esattamente il lavoro che si fa in un'app vera quando cambia lo schema dei dati.

# Consegna 9b — Pixel art

Schermate in `docs/schermate/fase-9b/`: `00-prima-e-dopo.png` mette a confronto le fasi precedenti (a sinistra) con la pixel art (a destra), poi c'è una schermata per ogni zona. Prova nel browser: `tests/browser/fase-9b.cjs` (19 controlli, tutti riusciti). Tutte le prove precedenti ripassano (3a–9a) senza modifiche.

### 1. Uno spritesheet è uno sprite CSS

Ogni pacchetto Kenney è **un'immagine sola** (`assets/tiny-town/tilemap_packed.png`), 12 × 11 quadrati da 16 pixel. Phaser la carica come *spritesheet* (`src/scenes/ScenaCaricamento.ts:24`): la divide in fotogrammi uguali, numerati da 0 riga per riga. "Il cavaliere" è il fotogramma 96 del foglio `dungeon`.

È la stessa tecnica degli **sprite CSS** di una volta: un'immagine con tante icone e `background-position` per mostrarne una. Si scarica un file invece di 132.

### 2. Le immagini dentro il file: `?inline`

`gioco.html` deve restare un file solo, senza internet. L'import con `?inline` (`ScenaCaricamento.ts:9`) chiede a Vite di trasformare il PNG in un **data URL**, cioè testo come `data:image/png;base64,iVBOR…`, scritto dentro il codice. La prova controlla che la sorgente delle immagini cominci davvero con `data:image/png`.

Le due immagini pesano circa 5 KB l'una, quindi il file cresce pochissimo.

### 3. Quale immagine per quale cosa: un file di dati

Il codice non sa che lo slime è "la melma verde". Lo dice `src/data/sprite.json`, diviso in due parti:

- **`immagini`**: un nome per ogni tessera usata (`"melma": { "foglio": "dungeon", "indice": 108 }`);
- **a chi va**: classi, compagni, persone, nemici, oggetti, vene. Per esempio `"slime_nero": { "immagine": "melma", "tinta": "#6060a0" }`.

`risolvi` (`src/systems/sprite.ts:62`) trasforma il nome nelle coordinate da disegnare. `validaSprite` (riga 117) controlla all'avvio, come per mappe e quest, che:

- ogni nemico, persona e classe abbia la sua figura;
- ogni tessera citata esista;
- ogni indice stia dentro il foglio.

Cambiare l'aspetto di un nemico è quindi una riga di dati, come cambiarne la vita.

### 4. La tinta: una figura, tante varianti

I pacchetti hanno poche figure, e alcune creature non ci sono: niente scheletri, zombie o goblin veri. La soluzione è la **tinta**: il colore della figura viene **moltiplicato** per un altro colore, come il metodo di fusione "moltiplica" di un programma di grafica.

- Lo slime nero è la melma verde moltiplicata per un blu scuro.
- Il goblin è il demone rosso tinto di verde.
- Il Re Scheletro è il cavaliere tinto d'oro e ingrandito.

Sugli sprite la tinta la applica Phaser (`setTint`). Sulle tessere della mappa la applichiamo noi su un canvas (`tinto`, `src/scenes/grafica.ts:51`), in due passi:

1. `multiply` per colorare;
2. `destination-in` per ritagliare sulla forma originale, così le parti trasparenti restano trasparenti.

### 5. Le tessere della mappa si "cuociono" una volta

La Tilemap di Phaser vuole **un'immagine** con una tessera per simbolo. Nelle legende delle mappe ora c'è `"tessera"`: un'immagine, una tinta o più strati dal basso, come `["erba", "pino"]` per un albero sopra l'erba.

`creaTilemap` (`src/scenes/mondo/creaTilemap.ts:36`) dipinge tutti i simboli su un **canvas** (`createCanvas`). Strati e tinte si calcolano una volta sola, quando si entra la prima volta nella mappa; poi è un'immagine come le altre.

In fondo alla striscia c'è un fotogramma con un nome (`"muro:M"`, riga 45): è il muro dei muri segreti, che così si mimetizza con gli altri muri della mappa.

Paragone web: è il **pre-rendering**, cioè calcolare una volta ciò che non cambia invece di ricalcolarlo a ogni fotogramma.

### 6. Corpo fisico e figura: due cose separate

L'eroe è ancora il quadrato di 12 pixel delle fasi precedenti: è lui che urta i muri e viene colpito. Ora è **invisibile** (`src/entities/Eroe.ts:99`), e sopra c'è una `Figura` (`src/entities/Figura.ts`). Dopo la fisica, a ogni fotogramma (riga 45), la figura raggiunge il corpo, ne copia trasparenza e scala, e sparisce quando il corpo viene distrutto (riga 47).

Perché separarli? Le collisioni devono restare semplici e stabili. Se la figura saltella, il corpo non deve saltellare con lei, altrimenti l'eroe "rimbalzerebbe" contro i muri. È come una **hitbox** fissa in una pagina web con un'animazione CSS solo sul disegno.

C'è un vantaggio pratico: tutte le regole delle fasi 2–8 (collisioni, colpi, cariche, teletrasporti) non sono cambiate di una riga, e infatti le prove vecchie passano tutte.

### 7. La camminata simulata

Le figure Kenney hanno una sola posa, quindi la camminata è "finta", con due funzioni pure in `systems/sprite.ts`:

- `saltello` (riga 87): mentre ci si muove, la figura si alza di un pixel e mezzo seguendo mezzo seno, che si ripete come i passi;
- `guardaASinistra` (riga 98): andando a sinistra la figura si ribalta (`setFlipX`). Sotto una piccola soglia di velocità si tiene il verso di prima, così non "sfarfalla" salendo o scendendo in verticale.

Sono funzioni del tempo e della velocità, senza Phaser, quindi hanno i loro test (`tests/sprite.test.ts`).

### 8. Il lampo e i colori di stato

Prima un nemico colpito diventava un quadrato bianco, e uno che bruciava aveva il bordo arancione. Con le figure:

- il **lampo** usa la tinta in modo *FILL*, che riempie la figura di bianco (`Figura.ts:81`), per 70 ms;
- **fuoco e rallentamento** tingono la figura di arancione o d'azzurro;
- il **ragno che prende la mira** lampeggia di rosso.

È lo stesso segnale delle fasi precedenti, ridisegnato.

### 9. Quando il pacchetto non basta: pixel art scritta a mano

Il dischetto, la pecora di Dario e le rocce con il minerale non esistono nei pacchetti. Li ho scritti come **testo** in `sprite.json`: 16 righe da 16 caratteri, con una tavolozza come `"b": "#2a3a7a"` e il punto per il trasparente. È lo stesso formato delle mappe.

`ScenaCaricamento.creaDisegni` (riga 38) li dipinge pixel per pixel su un canvas e li registra come texture. Per il resto del gioco sono immagini come le altre. È il "piano B" del piano della fase, usato solo dove serve.

### Cosa provare

1. Apri il gioco: già nella creazione ogni classe ha la sua figura.
2. Cammina a destra e a sinistra: la figura si gira e saltella.
3. Colpisci uno slime: il lampo bianco. Con un'arma che dà fuoco, il nemico che brucia diventa arancione.
4. Parla con Gemma: il ritratto è la sua figura in grande.
5. Guarda il dischetto in alto a destra: è pixel art.
6. Visita le zone: ognuna ha i suoi colori (cripta grigia, miniera bruna, torre viola, brughiera di notte).

### Esercizio (facoltativo)

Cambia l'aspetto di un nemico **solo con i dati**. In `src/data/sprite.json`, sezione `"nemici"`, prova `"lupo": { "immagine": "bestia", "tinta": "#c0c0c0" }`. Ricompila e guarda la Radura.

Poi prova a sbagliare apposta il nome dell'immagine (`"bestiaa"`): il gioco non parte e ti dice esattamente quale riga è sbagliata.

# Consegna 9c — Suoni e musica

Prova nel browser: `tests/browser/fase-9c.cjs` (26 controlli, tutti riusciti). Tutte le prove precedenti ripassano (3a–9b). Schermate in `docs/schermate/fase-9c/`. Per questa consegna contano soprattutto le orecchie: alza il volume.

### 1. Nessun file audio: il suono si "calcola"

Un suono è un'onda: l'aria che vibra centinaia di volte al secondo. Il browser ha un sintetizzatore incorporato, la **Web Audio API**, che genera onde semplici:

- **square** (quadra): il suono "8 bit" del Game Boy;
- **triangle**: più morbida, ottima per i bassi;
- **sawtooth** (a dente di sega): più aspra;
- **sine**: pulita, come un fischio.

Tutti i suoni del gioco nascono da queste onde e da un po' di **rumore** (numeri a caso, che all'orecchio sono un fruscio). Così non serve nessun file: il gioco resta un file solo, senza internet e senza licenze da controllare.

### 2. Un circuito di nodi, come pedali per chitarra

Con la Web Audio API si costruisce un circuito (`src/audio/Suoni.ts:71`):

```
oscillatore → volume della nota → volume della musica ┐
oscillatore → volume della nota → volume degli effetti ┴→ volume generale → altoparlanti
```

Ogni freccia è un `connect()`. I due volumi intermedi sono quelli delle **opzioni**: abbassare la musica è una sola riga (riga 104), e vale per tutte le note.

Il volume segue una curva al quadrato (`volume ** 2`), perché l'orecchio non sente in modo lineare: il passo da 1 a 2 deve sembrare grande quanto quello da 8 a 9.

### 3. Il browser vuole un clic

Nessun browser lascia suonare una pagina appena aperta: è la regola contro i siti che partono a tutto volume. Per questo il contesto audio si crea al **primo clic o tasto** (`sblocca`, riga 66). Il primo controllo della prova verifica proprio questo: prima del clic l'audio non esiste, dopo è acceso e suona la musica del menu.

### 4. La musica scritta come testo

I brani sono in `src/data/musica.json`, scritti come le mappe e i disegni:

```
"note": "E4:1 G4:1 C5:1 G4:1  A4:1 G4:1 E4:2 …"
```

`E4:1` è il Mi della quarta ottava per un battito, `-:1` una pausa, `[E2:0.5 E3:0.5]*8` un gruppo ripetuto otto volte. Ogni brano ha un tempo (`bpm`, battiti al minuto) e due voci: la melodia e il basso.

- `frequenza` (`src/systems/sequenze.ts:58`) trasforma il nome in Hz. Il La (A4) vale 440, e ogni semitono moltiplica per la radice dodicesima di 2, così dodici semitoni (un'ottava) raddoppiano la frequenza.
- `espandi` (riga 76) svolge le ripetizioni, anche una dentro l'altra.
- `preparaBrano` (riga 133) trasforma battiti in secondi.

Tutto senza suono, quindi tutto testato (`tests/sequenze.test.ts`).

### 5. Il problema del tempo: due orologi

Potremmo suonare ogni nota con un `setTimeout`, ma i timer di JavaScript sono **imprecisi**: arrivano anche 10–50 ms in ritardo, soprattutto se il gioco è impegnato, e il ritmo zoppicherebbe.

L'audio invece ha un orologio suo, preciso al campione (44 100 al secondo). La soluzione classica usa due orologi:

- un timer impreciso ogni 40 ms chiede "quali note cominciano nei prossimi 200 ms?" (`pianifica`, riga 188);
- quelle note vengono **prenotate** sull'orologio preciso dell'audio: "suona a 12,350 s".

La domanda la fa `noteNellIntervallo` (`sequenze.ts:158`). Gli intervalli consecutivi non perdono e non ripetono note (c'è un test apposta), e alla fine del brano si ricomincia da capo.

Paragone web: il timer è il "polling", l'audio è chi esegue davvero all'ora giusta.

### 6. Inviluppo: perché le note non fanno "clic"

Se un'onda si accende o si spegne di colpo, l'altoparlante salta e si sente un "clic". Ogni nota allora (`suonaNota`, riga 199):

- sale in 10 ms (attacco);
- resta ferma;
- scende fino a quasi zero (rilascio).

La nota suona solo per l'85% della sua durata (riga 203): quel piccolo stacco è ciò che fa sentire il ritmo.

### 7. Gli effetti: suoni che scivolano

Un effetto è uno o più "pezzi" che scivolano da una frequenza all'altra (`suonaPezzo`, riga 119):

- il **colpo** scende da 360 a 120 Hz in 70 ms, con un soffio di rumore;
- la **capriola** è rumore filtrato che sale. Il filtro "passa banda" (riga 134) lascia passare solo una fascia di frequenze, e spostandola il fruscio diventa uno "swish";
- il **bip** del dischetto e le **monete** sono due note acute in fila, grazie al campo `ritardo`;
- il **livello** è un arpeggio Do–Mi–Sol–Do.

Anche gli effetti sono nei dati: si cambiano senza toccare il codice.

### 8. Quale musica, quando

`musica.json` ha una sezione `zone`: per ogni mappa il suo brano (villaggio, esplorazione, dungeon), più `menu` e `boss`. La scena del mondo la chiede entrando (`ScenaMondo.ts:397`).

Per il boss non serve un collegamento diretto con il codice del boss. Il mondo **ascolta il registro**: quando compare la barra della vita del boss parte un boato e la musica dello scontro; quando la barra sparisce torna quella della zona. È lo stesso registro condiviso che usa l'interfaccia dalla fase 3.

Cambiando brano, il vecchio **sfuma** (riga 170) invece di interrompersi.

### 9. Un servizio condiviso

`suoni` è un oggetto solo per tutto il gioco (in fondo a `Suoni.ts`), importato da chi deve suonare: il pulsante per il "clic", il combattimento per il "colpo", l'interfaccia per il "bip". È come un servizio condiviso (un logger, un client HTTP) in un'app web. È raggiungibile anche dalla console, F12: `suoni.stato` mostra brano, effetti recenti e volumi.

### Cosa provare

1. Apri il gioco e clicca un pulsante qualsiasi: parte la musica del menu.
2. **Opzioni**: abbassa e alza musica ed effetti. Quando cambi gli effetti senti subito un suono di prova.
3. Gioca: colpi, monete, forziere, capriola, F2 (il bip!), un livello guadagnato.
4. Passa dal borgo alla radura e poi alla cripta: tre musiche diverse.
5. Entra nella tomba del re: quando si chiudono le barriere parte la musica del boss.

### Esercizio (facoltativo)

Componi la **tua** musica del villaggio. In `src/data/musica.json`, sotto `"villaggio"`, cambia la riga della melodia.

Prova per esempio *Fra Martino*: `C4:1 D4:1 E4:1 C4:1  C4:1 D4:1 E4:1 C4:1  E4:1 F4:1 G4:2  E4:1 F4:1 G4:2`.

Ricompila e apri il gioco. Se sbagli una nota (`H4`), il gioco non parte e ti dice quale.

# Fine della fase 9 (e del piano)

Il gioco del design è completo: dalla fase 1 (un quadrato che cammina) a un gioco di ruolo con tre dungeon, quest, crafting, compagni, salvataggi, pixel art e musica. Tutto in un file solo, `dist/gioco.html`, che si apre con un doppio clic.

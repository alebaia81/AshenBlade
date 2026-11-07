# Lezione della fase 1: il mondo si muove

## Cosa abbiamo costruito

Apri `dist/gioco.html` con un doppio clic. L'eroe (il quadrato chiaro con l'"occhio") parte nella **Radura di Borgo Quercia**. Si muove con WASD o con le frecce, si ferma contro alberi, rocce e acqua e scivola lungo le pareti. La telecamera lo segue. Dalla tessera dorata a destra si passa al **Sentiero nel bosco** e da lì si torna indietro.

Sotto il cofano:

- **41 test automatici** sulle regole del gioco (`tests/`). Non toccano Phaser.
- Le mappe sono **griglie di caratteri** in `src/data/mappe/*.json`. Vengono controllate all'avvio, e un errore nei dati compare in un riquadro rosso invece che come schermo nero.
- Tutto il gioco, Phaser compreso, sta in un solo file HTML di circa 1,4 MB, che non scarica nulla da internet.

### Una deviazione dal piano (approvata)

All'inizio i muri erano **un corpo fisico per tessera**. Le prove hanno mostrato un difetto classico: camminando in diagonale contro una parete verticale l'eroe si incastrava sulle "giunture" invisibili tra una tessera e l'altra. Siamo passati a una **Tilemap**, che risolve il problema (vedi più sotto). Le mappe restano griglie di caratteri: cambia solo come le diamo a Phaser.

---

## I concetti nuovi

### 1. Il ciclo di gioco (game loop)

Una pagina web è **guidata dagli eventi**: non succede nulla finché l'utente non clicca. Un gioco invece **ridisegna tutto circa 60 volte al secondo**, anche quando sei fermo. Ogni giro si chiama *fotogramma* (frame) e ripete sempre gli stessi passi:

1. legge l'input (quali tasti sono premuti **adesso**);
2. aggiorna lo stato (posizioni, velocità, collisioni);
3. disegna.

In Phaser il passo 2 è il metodo `update()` della scena: `src/scenes/ScenaMondo.ts:69`. Guarda quanto è corto: legge i tasti, li passa all'eroe e controlla se sei su un'uscita. Phaser lo chiama per te, come farebbe un `requestAnimationFrame` (che infatti usa sotto).

Nota che non reagiamo all'evento "tasto premuto". Chiediamo invece **a ogni fotogramma** quali tasti sono giù (`src/entities/Comandi.ts:22`). È la differenza tra un `addEventListener('keydown')` e il controllare lo stato a ogni frame. Nei giochi conviene la seconda: tenere premuto D significa "continua ad andare a destra", non "fai una cosa una volta".

### 2. Le scene

Una **scena** è uno "schermo" del gioco con un suo ciclo di vita, simile a un componente React o a una route di una single-page app:

| Metodo | Quando | Paragone web |
|---|---|---|
| `init(dati)` | prima di tutto, riceve parametri | le props |
| `create()` | una volta, costruisce gli oggetti | il mount |
| `update()` | a ogni fotogramma | — (non esiste nel web classico) |

- `ScenaMondo.ts:42`: `init` sceglie la mappa e il punto d'ingresso dai dati ricevuti.
- `ScenaMondo.ts:52`: `create` costruisce mappa, eroe, collisioni e telecamera.
- **Cambiare mappa = riavviare la scena con dati diversi** (`ScenaMondo.ts:104`, `this.scene.restart(dati)`). È come rimontare un componente con nuove props invece di modificarlo pezzo per pezzo: più semplice e senza "avanzi" della mappa precedente.

Le scene possono anche **girare insieme, una sopra l'altra**. `ScenaInterfaccia` (il nome della mappa in alto) gira sopra `ScenaMondo`: non scorre con la telecamera e non viene ingrandita. È l'equivalente di un elemento `position: fixed`. Il mondo la avvia con `scene.launch` (`ScenaMondo.ts:90`).

Le due scene comunicano tramite il **registro** (`registry`), un piccolo archivio condiviso. Il mondo scrive il nome (`ScenaMondo.ts:89`) e l'interfaccia si iscrive all'evento `changedata-nomeMappa` (`ScenaInterfaccia.ts:25`), come con uno state store. Quando la scena si chiude l'iscrizione viene rimossa (`ScenaInterfaccia.ts:29`), per lo stesso motivo per cui si fa `removeEventListener` nel cleanup di un componente.

### 3. Coordinate: celle e pixel

Ci sono due unità di misura:

- **celle**: colonna e riga nella griglia della mappa (numeri interi), usate dalle regole;
- **pixel di mondo**: dove Phaser disegna gli oggetti e calcola la fisica.

Le conversioni stanno tutte in `src/systems/coordinate.ts`. Nota `Math.floor` alle righe 19–20: con le coordinate negative (fuori mappa) arrotonda nel verso giusto, mentre un troncamento con `| 0` sbaglierebbe. Gli oggetti di Phaser si posizionano **dal centro**, per questo esiste `centroCella`.

### 4. Movimento: velocità, non posizione

L'eroe non viene spostato con `x += 2`. Gli diamo una **velocità** in pixel al secondo (`src/entities/Eroe.ts:52`) e il motore fisico calcola lo spostamento in base al tempo trascorso dal fotogramma precedente (il *delta time*). Così su un PC lento, a 30 fotogrammi al secondo, l'eroe va alla stessa velocità che su uno a 144.

**La diagonale.** Se premi destra e giù insieme e sommi le due velocità, ottieni (80, 80). Per Pitagora sono circa 113 px/s: in diagonale andresti più veloce. Per questo il vettore viene **normalizzato**, cioè riportato a lunghezza 1 e poi moltiplicato per la velocità: `src/systems/movimento.ts:16–19`. Il test che lo garantisce è in `tests/movimento.test.ts`, "in diagonale la velocità totale resta la stessa".

### 5. Corpi fisici e collisioni (AABB)

Phaser ha diversi motori fisici. Noi usiamo **Arcade**, il più semplice: ogni corpo è un **rettangolo allineato agli assi** (*AABB, Axis-Aligned Bounding Box*). Controllare se due AABB si sovrappongono costa pochissimo: basta confrontare i bordi, come nella vecchia logica per capire se due `<div>` si toccano con `getBoundingClientRect()`.

- `Eroe.ts:34`: `physics.add.existing` dà al quadrato un corpo **dinamico**, che si muove.
- `ScenaMondo.ts:62`: `physics.add.collider` dice "questi due non possono sovrapporsi". Se succede, Arcade **separa** l'eroe spostandolo fuori dal muro, un asse alla volta. Ecco perché, spingendo in diagonale contro una parete, l'asse bloccato si ferma e l'altro continua: l'eroe **scivola**.

**Ordine dentro un fotogramma.** La fisica sposta l'eroe *dopo* il nostro `update()`. Se riposizionassimo l'occhio in `update`, resterebbe indietro di un fotogramma. Per questo lo spostiamo all'evento `POST_UPDATE`, che arriva dopo il passo della fisica (`Eroe.ts:40`).

### 6. Tilemap: perché i muri non sono più rettangoli separati

Una **Tilemap** è il modo standard di fare mappe a tessere nei giochi 2D: una griglia di **numeri**, dove ogni numero indica quale quadratino ritagliare da un'immagine detta **tileset**. Un po' come gli sprite CSS: una sola immagine e tanti `background-position`.

- `src/systems/tessere.ts` traduce i caratteri in numeri ed è testato in `tests/tessere.test.ts`. È TypeScript puro.
- `src/scenes/mondo/creaTilemap.ts:26` **genera il tileset dal codice**: una striscia di quadrati colorati, uno per simbolo della legenda. Nella fase 9 lo sostituiremo con la pixel art e la riga 31 (`make.tilemap`) non cambierà.
- `creaTilemap.ts:40`: `setCollision` marca come solide le tessere muro.

**Perché ha risolto l'incastro?** Con un corpo per tessera, una parete verticale è una pila di rettangoli. Quando l'eroe scivola lungo la pila, Arcade a volte scambia il bordo superiore della tessera successiva per un ostacolo e lo blocca: sono le "giunture". La Tilemap invece sa quali lati di una tessera toccano un'altra tessera solida (i lati "interni") e li ignora. Per la fisica la parete diventa una superficie liscia.

**Una trappola di JavaScript** scoperta grazie ai test (`tessere.ts:29`): `Object.keys` mette **prima** le chiavi che sembrano numeri. La legenda `{"#":…, ".":…, "1":…}` dà quindi `["1", "#", "."]`. Il primo test dava per scontato l'ordine scritto nel file ed è fallito. Ora il codice non dipende dall'ordine.

### 7. La telecamera

La mappa è più grande dello schermo: la **telecamera** decide quale porzione mostrare. È come una pagina che scorre, con lo scroll gestito dal gioco.

- `ScenaMondo.ts:78`: `setBounds` impedisce di mostrare il nero oltre il bordo.
- `ScenaMondo.ts:79`: `setZoom(3)` fa sì che ogni pixel del mondo diventi 3×3 pixel sullo schermo. Con `pixelArt: true` (`src/main.ts:21`) l'ingrandimento resta nitido, senza sfocature.
- `ScenaMondo.ts:82`: `startFollow` tiene l'eroe al centro, finché i limiti lo permettono.
- Il cambio mappa usa `fadeOut` e attende l'evento di fine dissolvenza prima di riavviare la scena (`ScenaMondo.ts:101–104`). Il flag `inTransizione` evita di avviare due cambi insieme mentre l'eroe è ancora sull'uscita.

### 8. Regole separate dalla presentazione

`src/systems/` non importa Phaser: riceve dati e restituisce risultati. Per questo si testa con Vitest in pochi millisecondi, senza browser. Le scene e le entità fanno da "colla": leggono l'input, chiamano i systems e applicano i risultati a Phaser. È la stessa idea che separa la logica di business dai componenti di interfaccia in un'app web.

Un esempio concreto: `src/data/caricaMappe.ts:12` usa `import.meta.glob` di Vite per raccogliere **tutti** i JSON delle mappe al momento della compilazione. Poi `validaMondo` (riga 34) controlla che ogni uscita porti a una mappa e a un arrivo esistenti. Il test `tests/datiMappe.test.ts` esegue lo stesso controllo sui dati veri: un errore di battitura in una mappa blocca la consegna prima di arrivare nel browser.

### 9. Errori visibili

Phaser esegue il ciclo di gioco fuori dal nostro `try/catch`. Per non avere schermi neri muti, `src/erroreVisibile.ts:21–22` ascolta gli errori non gestiti dell'intera finestra e li mostra nel riquadro rosso, oltre che nella console.

Nella console del browser (F12) puoi anche curiosare nel gioco in esecuzione: prova `gioco.scene.getScene('Mondo').eroe.x`.

---

## Esercizio facoltativo

**Aggiungi una terza mappa senza toccare il codice.**

1. Copia `src/data/mappe/bosco.json` in `src/data/mappe/stagno.json`. Cambia `"id"` in `"stagno"` e scegli un `"nome"`, poi disegna una griglia piccola (per esempio 25×15) con un po' di acqua `~`. Ricorda di aggiungere `~` alla legenda come muro blu.
2. Nella Radura aggiungi un'uscita `3` sul bordo sinistro o in basso, con un arrivo `c` accanto. In legenda: `"3": {"tipo":"uscita","colore":"#c9a227","verso":"stagno","arrivo":"d"}` e `"c": {"tipo":"arrivo"}`.
3. Nello Stagno metti un'uscita di ritorno con `"verso":"radura","arrivo":"c"` e un arrivo `d` accanto.
4. Chiedimi di eseguire test e compilazione. Se hai sbagliato qualcosa (una riga più corta, un arrivo che non esiste), il test `datiMappe` ti dirà esattamente dove.

**Variante più rapida:** cambia `"velocita"` in `src/data/eroe.json` (per esempio 140) e osserva come cambia la sensazione di gioco. Il game design passa molto da numeri come questo.

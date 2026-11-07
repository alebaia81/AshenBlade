# Lezione della fase 6: crafting

# Consegna 6a — Materiali e ricette

Schermate in `docs/schermate/fase-6a/`. Prova nel browser: `tests/browser/fase-6a.cjs` (19 controlli, tutti riusciti).

### 1. Ancora lo stesso catalogo

Materiali e pergamene sono **oggetti** come pozioni e spade (`oggetti.json`, tipi `materiale` e `pergamena`). Grazie a questo, senza scrivere codice nuovo:

- si impilano nello zaino (pila 20);
- cadono dai nemici con il bottino;
- si comprano e si vendono da Gemma;
- compaiono nella modalità sviluppatore.

È il vantaggio dell'adattatore della 4b: ogni nuova "cosa" del gioco entra in un sistema che già funziona.

La **pergamena** è un oggetto con un effetto nuovo, `ricetta`, gestito in `usaOggetto` (`src/systems/partita.ts:200`) accanto a cura e mana. Se conosci già la ricetta, la pergamena non si consuma, come le pozioni con la vita già piena.

### 2. Il crafting è una transazione (come il negozio)

`crea` (`src/systems/crafting.ts:52`) fa tre passi:

1. toglie i materiali (riga 59);
2. paga Bruno;
3. mette l'arma nello zaino (riga 69).

Se un passo fallisce si restituisce l'errore e la Partita originale non cambia: nessun materiale sprecato. L'ordine conta: i materiali tolti al passo 1 possono **liberare spazi**, così si può creare un'arma anche con lo zaino pieno. Un test lo controlla.

`cosaManca` (riga 39) è una funzione separata, pensata per la schermata: per ogni ingrediente dice quanti ne servono e quanti ne hai. La fucina la usa per colorare di verde o di rosso, e per accendere o spegnere il pulsante Crea. Regole e presentazione restano divise.

### 3. Ricette conosciute: un valore derivato

La Partita salva solo le ricette **imparate** dalle pergamene. Quelle di base le sa già Bruno, e stanno nei dati (`conosciutaDallInizio`). L'elenco completo lo calcola `ricetteConosciute` (riga 21) ogni volta che serve. Se domani Bruno imparasse una ricetta di base in più, basterebbe cambiare il JSON: le partite già iniziate la vedrebbero subito.

### 4. Validare le relazioni tra i dati

`controllaRicette` (`src/data/caricaDati.ts:316`) non guarda una ricetta da sola, ma i **collegamenti** tra file diversi:

- il risultato deve essere un'arma, e mai esotica (§8);
- gli ingredienti devono essere materiali;
- ogni ricetta che non è di base deve avere una pergamena che la insegna, altrimenti nessuno potrebbe mai impararla;
- ogni pergamena deve insegnare una ricetta che esiste.

Un test sui dati controlla anche che ogni materiale di oggi **si trovi da qualche parte**: da un nemico, da una vena o in un forziere. È un'altra regola di game design ("niente oggetti impossibili da trovare") trasformata in un controllo automatico.

### 5. Le vene: stato che NON si salva

Una vena esaurita torna piena quando rientri nella zona, come i nemici (§11). Per questo il suo stato vive solo nell'entità (`src/entities/Vena.ts:4`) e non nella Partita: quando la scena riparte, la vena rinasce piena. Il muro segreto invece, una volta aperto, resta aperto, quindi lui sta nella Partita. Decidere **cosa si ricorda e cosa no** è una scelta di design, e il codice la rende esplicita.

Scavare riusa la logica di forzieri e persone: la vena è un `Interagibile` (`ScenaMondo.ts:860`), l'eroe ci va da solo e poi `scava`. La vena trema con una *tween* e alla fine chiama una funzione (`scava(fatto)`, `Vena.ts:37`): è una **callback**, come una `Promise` che si risolve quando l'animazione finisce.

### 6. Un bug "a volte sì, a volte no"

La prima versione faceva cadere i pezzi a metà strada tra l'eroe e la roccia. Si raccoglie un oggetto se si è entro 10 pixel, e a seconda di dove l'eroe si fermava (a volte un pixel più in là) i pezzi venivano raccolti **oppure no**. La prova nel browser falliva una volta su tre.

Questi bug "intermittenti" sono i più subdoli. La soluzione è eliminare l'incertezza invece di aumentare le attese: ora i pezzi cadono **ai piedi** dell'eroe e vengono sempre raccolti (con lo zaino pieno restano a terra).

---

## Esercizio facoltativo (6a)

**Una ricetta nuova.**

1. In `src/data/ricette.json` aggiungi una ricetta di base per il **Pugnale dell'ombra** (`"risultato": "pugnale_ombra"`, con i materiali che vuoi).
2. Avvia i test: la validazione ti fermerà. Perché? (Rileggi il §8 del design.)
3. Ora prova con l'**Arco lungo** (raro): la ricetta funziona e compare nella fucina.

**Domanda per riflettere:** i materiali delle vene si rigenerano a ogni rientro nella zona. Un giocatore paziente potrebbe entrare e uscire dalla Radura all'infinito per accumulare ferro. È un problema? Come lo limiteresti, e in quale file?

---

# Consegna 6b — Potenziamenti

Schermate in `docs/schermate/fase-6b/`. Prova nel browser: `tests/browser/fase-6b.cjs` (20 controlli, tutti riusciti). Tutte le prove precedenti ripassano (3a–6a).

### 1. Un'arma potenziata è un oggetto a sé

Il modo più ovvio di potenziare sarebbe aggiungere un campo "livello" a ogni spada nello zaino. Ma allora zaino, equipaggiamento, barra dei preferiti e negozio dovrebbero tutti imparare a leggerlo e salvarlo.

Invece "Spada lunga +2" è un **altro oggetto**, con il suo id: `spada_lunga+2`. Le varianti da +1 a +5 non le scrive nessuno a mano: le genera `varianti` (`src/data/caricaDati.ts:174`) all'avvio, copiando l'arma e cambiando solo nome, prezzo e `potenziamento`. Da quel momento tutto il resto del gioco le tratta come armi qualsiasi, **senza una riga di codice in più**.

Paragone web: è come generare le pagine statiche di un sito (`/prodotto/42`, `/prodotto/42?variante=rossa` diventa `/prodotto/42-rossa`) invece di gestire mille parametri a runtime. Più dati, meno casi speciali.

L'id si legge e si scrive con due funzioni piccolissime: `idPotenziato` e `livelloDi` (`src/systems/potenziamento.ts:19` e `:23`). Sono l'unico posto dove compare il `+`: se un giorno volessimo `spada_lunga#2`, cambierebbe una costante.

### 2. Il bonus nella formula, finalmente

Dalla fase 3 la formula del danno (§7) aveva un `bonus` sempre a 0. Ora `colpoArma` lo prende dall'arma (`src/scenes/mondo/Combattimento.ts:96`) e `infliggi` lo passa a `calcolaDanno` (riga 60). Gli incantesimi e i colpi del compagno non lo hanno: il campo è facoltativo e vale 0.

La prova nel browser lo verifica senza fortuna di mezzo: rende il dado "truccato" (sempre il valore più basso, nessun critico) e confronta il colpo prima e dopo. Con la Spada e scudo +3 il danno minimo passa da 1 a 4. Iniettare il caso (`casuale`) era stata una scelta della fase 3: qui ripaga.

### 3. Potenziare: tutto o niente, ovunque sia l'arma

`potenzia` (`src/systems/potenziamento.ts:66`) segue lo schema del crafting: prima toglie i materiali, poi le monete, e se una cosa sola manca restituisce un errore senza aver cambiato nulla (lavora su copie). L'arma può stare in due posti diversi, e il tipo `DoveArma` lo dice in modo esplicito: `{ zaino: 3 }` oppure `{ spazio: 'primaria' }`. È una **unione discriminata**, come un'azione Redux con `type`.

Un dettaglio facile da sbagliare: la barra dei preferiti contiene **id**, non riferimenti. Se potenzi la spada che hai sul tasto 3, il tasto punterebbe ancora a `spada_e_scudo`, un'arma che non hai più. Per questo `potenzia` aggiorna anche i collegamenti (riga 92). È lo stesso problema di una chiave esterna in un database: se cambi la chiave primaria, devi aggiornare chi la cita.

Quando chiudi la fucina il mondo riprende e `dallaPartita` vede che l'arma in mano ha un id diverso (`ScenaMondo.ts:1164`): l'eroe la impugna subito.

### 4. I costi stanno nei dati

`data/potenziamenti.json` dice cosa serve per ogni livello; le monete si moltiplicano per la rarità (`costoPotenziamento`, riga 48). La validazione (`controllaPotenziamenti`, `caricaDati.ts:186`) controlla che ci siano tutti e cinque i livelli, che i materiali siano veri materiali e che ogni rarità abbia il suo moltiplicatore. Dal +4 serve il **cristallo della miniera**, che arriverà nella fase 8: oggi lo si prova con la modalità sviluppatore.

### 5. Un bug del compagno, scoperto per caso

Ripassando tutte le prove, quella della 5c falliva sempre: Corrado si avvicinava allo slime e poi restava fermo senza colpirlo. Il motivo: la sua portata è 14 pixel misurati **da centro a centro**, ma due quadrati che si toccano **in diagonale** hanno i centri a quasi 15 pixel. I corpi fisici gli impedivano di avvicinarsi di più, e lui non era mai "a portata".

La correzione (`src/systems/ia/compagno.ts:49`): la portata si misura dal **bordo** del nemico, sottraendo metà del suo lato (l'"ingombro"). Prima il test che riproduce il bug (`tests/ia/compagno.test.ts`), poi la riga che lo corregge. Prima, la prova passava solo quando l'approccio era dritto: un altro bug "a volte sì".

Due prove nel browser avevano invece attese troppo strette (3b e 5c): non erano bug del gioco ma del test. Le ho corrette partendo da uno stato pulito (eroe fermo, Corrado che non disturba la parata) invece di allungare le attese a caso.

---

## Esercizio facoltativo (6b)

**Potenziamenti più cari per le leggendarie.**

1. In `src/data/potenziamenti.json` porta il moltiplicatore delle `leggendaria` da 3 a 5.
2. Ricostruisci, apri la fucina con una Spada dell'eroe (modalità sviluppatore → Dai arma…) e guarda come cambiano le monete richieste.
3. Ora togli il livello 5 dal JSON e avvia i test: quale controllo ti ferma, e in che file?

**Domanda per riflettere:** oggi una Spada lunga +2 si vende al 140% del prezzo. Con i costi attuali, potenziare e rivendere conviene o ci si perde? Fai il conto con i numeri del JSON, e pensa a cosa cambieresti se volessi impedire che il fabbro diventi una "macchina per fare soldi".

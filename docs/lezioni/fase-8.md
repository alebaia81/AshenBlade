# Lezione della fase 8: dungeon e boss

# Consegna 8a — La Cripta dei Non Morti

Schermate in `docs/schermate/fase-8a/`. Prova nel browser: `tests/browser/fase-8a.cjs` (29 controlli, tutti riusciti). Tutte le prove precedenti ripassano (3a–7b).

### 1. Una porta è un muro segreto con un requisito

Nella lezione 7b c'era una domanda: il cancello della cripta dovrà aprirsi. Meglio un campo in più sul cartello, o un tipo di cella nuovo?

Ho scelto la cella **`porta`**, perché il suo comportamento è quello di un **muro segreto**, non di un cartello: è piena finché è chiusa, poi diventa passaggio per sempre (la Partita la ricorda in `porteAperte`). Cambia solo cosa la apre: la chiave giusta nello zaino. La regola sta in `apriConChiave` (`src/systems/porte.ts:21`) ed è la stessa per porte e forzieri chiusi. L'unica differenza è un campo, `consuma`: la chiave di una porta resta, una chiave piccola si usa e sparisce.

Volpe entra nella stessa funzione come un'opzione (`scassinatore`, riga 23): un forziere chiuso lo apre senza consumare chiavi. Non c'è un "se è Volpe" sparso nel codice della scena.

### 2. La griglia vede porte e barriere: due funzioni, non due copie della mappa

A* deve sapere dove si può camminare **adesso**. Una porta aperta è un passaggio; la barriera del boss, chiusa, è un muro. Invece di ricostruire la griglia a ogni cambiamento, `grigliaDellaMappa` riceve due funzioni (`src/systems/mappa.ts:154`): `aperta(c, r)` e `chiusa(c, r)`. Le chiama ogni volta, quindi vedono sempre lo stato attuale.

Paragone web: è come passare a un componente un **callback** invece di un valore copiato una volta sola, che diventerebbe vecchio.

### 3. Il boss: un nemico più un "direttore d'orchestra"

Il Re Scheletro è un `Nemico` come gli altri: si muove e morde con il comportamento `inseguitore`. Quello che lo rende un boss sta in `GestoreBoss` (`src/scenes/mondo/GestoreBoss.ts`):

- **l'ingaggio:** quando ti vede, e non sei sopra una barriera, le barriere si chiudono (riga 51). La condizione "non sei sopra una barriera" evita di restare incastrati dentro una sbarra;
- **le fasi:** `faseDi` (`src/systems/boss.ts:21`) guarda la frazione di vita. Sotto metà parte la fase 2, con il suo avviso;
- **gli attacchi speciali:** `attacchiPronti` (riga 31) dice quali hanno finito la ricarica; `quantiEvocare` (riga 36) non supera il massimo di servitori vivi;
- **la barra della vita:** il gestore scrive `{ nome, vita, massima }` nel registro condiviso e l'interfaccia la disegna, come per la vita dell'eroe.

Le fasi stanno in `data/boss.json`. Il codice sa eseguire degli **attacchi con un'etichetta** (`evoca`), come gli effetti delle armi: la Miniera e la Torre aggiungeranno `carica`, `crollo_massi`, `teletrasporto` e `incantesimo`.

### 4. "Non ricompare più": quando ricordare e quando no

I nemici normali rinascono a ogni ingresso nella zona; il boss no. Basta una lista nella Partita, `bossSconfitti`, e un `continue` quando si creano i nemici (`ScenaMondo.ts:212`). Se invece l'eroe **muore** durante lo scontro, la scena riparte da capo: il boss torna a vita piena, le barriere si riaprono. Non c'è niente da "resettare" a mano, perché quello stato non è mai stato salvato.

### 5. Un test sul level design: il re non deve vederti da fuori

Durante il lavoro ho trovato un bug **prima** di provarlo: con il raggio di vista iniziale (130 pixel), il re vedeva l'eroe ancora nel corridoio. Le barriere si sarebbero chiuse **davanti** a lui, lasciandolo fuori dalla stanza. Ho abbassato il raggio a 100 e scritto un test (`tests/datiMappe.test.ts:413`): per ogni cella raggiungibile dall'ingresso con le barriere chiuse, la distanza dal re deve essere maggiore del suo raggio di vista. Se un giorno qualcuno sposta il re o allarga il corridoio, il test lo ferma.

### 6. Le prove nel browser dipendono dai menu

Aggiungendo zombie, pipistrelli e il re, il pannello sviluppatore aveva troppe righe "Genera nemico" e le prove che cliccavano "la decima voce" cliccavano la voce sbagliata. Ora i nemici hanno un elenco a parte ("Genera nemico…"), e ho aggiornato gli indici nelle prove 3c, 4a e 5a.

Ho anche capito perché la prova 3a falliva ogni tanto: uno slime a volte morde l'eroe mentre la prova lavora, e la vita non era più 21/21. Ora controlla la vita **massima**, che è ciò che la prova vuole verificare.

---

## Esercizio facoltativo (8a)

**Un re più cattivo.**

1. In `src/data/boss.json` aggiungi al Re Scheletro una terza fase: `"sottoVita": 0.25`, con un avviso e un attacco `evoca` di 2 **zombie** ogni 6 secondi.
2. Ricostruisci e prova: sotto un quarto di vita arrivano gli zombie.
3. Ora scambia l'ordine delle fasi nel JSON (prima 0.25, poi 0.5). Quale controllo ti ferma, e perché l'ordine conta per `faseDi`?

**Domanda per riflettere:** oggi la barriera si chiude quando il boss ti **vede**. Un'alternativa è chiuderla quando l'eroe **entra in certe celle** della stanza (una "zona d'ingaggio" scritta nella mappa). Quale delle due è più facile da sbagliare per chi disegna le mappe? Quale si testa meglio?

---

# Consegna 8b — La Miniera dei Goblin

Schermate in `docs/schermate/fase-8b/`. Prova nel browser: `tests/browser/fase-8b.cjs` (21 controlli, tutti riusciti). Tutte le prove precedenti ripassano.

### 1. Due comportamenti nuovi, due righe nel registro

Nella fase 2 il registro dei comportamenti aveva una riga sola, `inseguitore`, e un commento: "per aggiungere il tiratore o il caricatore basterà aggiungere una riga qui". Ora quelle righe ci sono (`src/systems/ia/comportamenti.ts:21`).

Le regole stanno in due funzioni pure, testate senza aprire il gioco:

- `decidiTiratore` (`src/systems/ia/tiratore.ts:36`): riposo, inseguimento e ritorno a casa li prende **dall'inseguitore**, invece di riscriverli. Ci aggiunge solo la parte nuova: troppo vicino si allontana, troppo lontano o senza linea di tiro si avvicina (riga 47), alla distanza giusta si ferma e tira;
- `decidiCaricatore` (`src/systems/ia/caricatore.ts:30`): una piccola macchina a stati, insegue → mira → scatto → stanco. La direzione dello scatto si decide **alla fine della mira** e poi non cambia più (riga 34). È per questo che la capriola funziona: il ragno va dritto dove eri.

Una mente adesso restituisce un'**azione** (`{ velocita, tira?, stato? }`) invece della sola velocità. È come passare da una funzione che restituisce un numero a una che restituisce un oggetto: si può aggiungere un campo senza rompere chi usa gli altri.

### 2. Lo stesso colpo, per contatto o da lontano

Fino alla 8a l'eroe veniva ferito solo per **contatto** (`gestisciContatti`). Le frecce dei goblin e i massi del troll arrivano da lontano, ma devono seguire le stesse regole: parata del Guerriero, invulnerabilità dopo un colpo, armatura, scudo di Elisa. Invece di copiare quel codice, l'ho estratto in una funzione sola, `colpisci` (`src/scenes/mondo/gestisciContatti.ts:39`), con un parametro `contatto`. `gestisciContatti` la restituisce (riga 82) per chi colpisce da lontano.

Un dettaglio di game design deciso dal parametro: la Corazza di spine rimanda il danno **solo a chi ti tocca**, non a un arciere a dieci metri.

### 3. Il troll: attacchi che durano nel tempo

L'evocazione del Re Scheletro succedeva in un istante. La **carica** del troll invece dura: mira (si vede una linea rossa che lampeggia), scatto, eventuale schianto contro la roccia. Il `GestoreBoss` ricorda la carica in corso e, finché dura, non fa partire altri attacchi. Il movimento dello scatto è **imposto** al nemico da fuori (`Nemico.imponi`, `src/entities/Nemico.ts:146`) e vince sulla sua mente.

Un bug trovato dalla prova nel browser: il troll, arrivato **addosso** all'eroe, cominciava a caricare… da fermo, con direzione zero. Ora sotto i 48 pixel non carica (`GestoreBoss.ts:112`) e l'attacco riprova al fotogramma dopo, senza consumare la ricarica.

I **massi** cadono in punti scelti da `puntiCrollo` (`src/systems/boss.ts:50`): il primo esattamente sull'eroe (così deve muoversi), gli altri intorno, solo dove si cammina. La funzione riceve il caso dall'esterno, come il combattimento della fase 3: nei test si usa una sequenza fissa.

### 4. Il mondo cambia con la storia, ma resta una mappa normale

La frana sparisce dopo l'Atto I; la Quercia Antica appare ferita dopo il troll. Nella legenda una voce può dire "quando succede questo, al mio posto metti quest'altro simbolo":

```json
"F": { "tipo": "cartello", "aspetto": "frana", "testo": "…",
       "cambiaCon": { "quest": "atto1_cripta", "stato": "conclusa" }, "diventa": ":" }
```

`applicaCondizioni` (`src/systems/condizioniMappa.ts:18`) produce una **mappa nuova** con i simboli sostituiti, e la scena la usa al posto dell'originale (`ScenaMondo.ts:194`). Il resto del gioco (tilemap, A*, nemici, porte) non sa nulla delle condizioni: vede una mappa normale. È l'idea di un **selettore** in Redux: dallo stato si calcola la vista, e nessuno modifica i dati di partenza.

### 5. Un test sui dati che vale per tutti i boss

Nella 8a il test "il boss non ti vede da fuori le barriere" era scritto per il Re Scheletro. Ora gira su **ogni mappa con barriere**: il troll è stato controllato senza scrivere una riga di test in più. Quando aggiungeremo il Negromante, lo controllerà da solo.

---

## Esercizio facoltativo (8b)

**Un goblin che corre.**

1. In `src/data/nemici.json` copia `ragno` e crea `goblin_carica`: nome "Goblin furioso", colore rosso, `carica` con `miraMs: 300` e `velocita: 260`.
2. Mettilo in una stanza della miniera (`miniera_gallerie.json`, un simbolo nuovo nella legenda).
3. Togli il campo `carica`: quale errore ti dà la validazione, e in quale file è scritta la regola che lo trova?

**Domanda per riflettere:** il tiratore si allontana se sei troppo vicino. In un corridoio stretto, però, può finire con le spalle al muro e restare lì. Cosa gli faresti fare in quel caso? Che informazione in più gli servirebbe nella percezione?

---

# Consegna 8c — La Torre del Negromante e il finale

Schermate in `docs/schermate/fase-8c/`. Prova nel browser: `tests/browser/fase-8c.cjs` (25 controlli, tutti riusciti). Tutte le prove precedenti ripassano (3a–8b).

Con questa consegna la storia si gioca **dall'inizio alla fine**.

### 1. Il terzo boss è quasi tutto dati

Il Negromante usa cose che esistevano già: il comportamento `tiratore` della 8b (si tiene a distanza e tira), l'evocazione della 8a (le ombre), le barriere, la barra della vita, "non ricompare più". Di nuovo ci sono solo **due attacchi**, e ognuno ha una funzione pura con i suoi test:

- `teletrasporto`: `puntoTeletrasporto` (`src/systems/boss.ts:75`) sceglie un punto libero **nella sua stanza** (entro un raggio da dove è nato, `GestoreBoss.ts:61`) e **lontano dall'eroe**;
- `incantesimo`: `ventaglio` (riga 89) calcola le direzioni di 3 o 5 sfere, simmetriche intorno all'eroe. Le sfere viaggiano con lo stesso sistema delle frecce dei goblin, tramite `tiraCon` (`GestoreTiriNemici.ts:34`).

Il pattern si ripete dalla fase 4: **un'etichetta nei dati, un comportamento nel codice**. Tre boss diversi, un solo `GestoreBoss`.

### 2. La geometria al servizio del gioco: il ventaglio

Per sparare 5 sfere a ventaglio verso l'eroe serve un po' di trigonometria:

1. si trova l'**angolo** della direzione verso l'eroe con `Math.atan2(y, x)`;
2. si distribuiscono i colpi da `angolo − ampiezza/2` a `angolo + ampiezza/2`;
3. si torna a una direzione con `(cos, sin)`.

È la stessa matematica di una rotazione CSS (`transform: rotate()`), solo scritta a mano. Il test controlla le proprietà che contano: il colpo centrale punta all'eroe, i laterali sono simmetrici.

### 3. La notte: un velo, ma messo al posto giusto

La Brughiera e la Torre hanno `"notte": true` nel JSON. La scena aggiunge un rettangolo blu scuro semitrasparente grande quanto la mappa (`ScenaMondo.ts:1504`).

La prima versione lo metteva **sopra tutto**: si capiva che era notte, ma il Negromante, viola scuro su fondo scuro, quasi spariva. L'ho visto nella schermata della prova. Il velo ora sta **sotto** eroe e nemici (profondità 1): il terreno è scuro, chi combatte resta leggibile. Ho anche schiarito i colori di Negromante, ombre e cultisti. In un videogioco la leggibilità viene prima dell'atmosfera: è come il contrasto del testo in una pagina web.

### 4. Il finale: una scena che mette in pausa il mondo

Sconfitto il Negromante, dopo un secondo e mezzo si apre `ScenaFinale` (`ScenaMondo.ts:382`) con il mondo in pausa, come la scheda e lo zaino. Le pagine stanno in `data/finale.json`: chi scrive la storia non tocca il codice. All'ultima pagina la scena si chiude e il mondo riprende (`ScenaFinale.ts:46`): il gioco **non finisce**, perché il design vuole il mondo aperto per le quest rimaste.

Il dopo-storia è fatto solo di cose già esistenti:

- la **confessione di Berta** è un dialogo con una condizione sulla quest;
- il **germoglio sulla tomba di Lia** è una cella che cambia quando il boss è sconfitto (la 8b);
- Gemma e Rosalba hanno battute nuove con le stesse condizioni.

### 5. Conti con le condizioni: quando una sola quest non basta

Gemma deve dire cose diverse prima e dopo il troll, e poi dopo il finale. Una condizione guarda **una** quest sola, quindi "dopo il troll **ma** prima del finale" non si può scrivere direttamente. Si usa la catena delle quest: l'Atto III diventa disponibile solo quando l'Atto II è concluso, quindi "Atto III disponibile, attivo o pronto" vuol dire esattamente "dopo il troll, prima del finale". È un ragionamento da database: invece di aggiungere un operatore `AND`, si sfrutta un vincolo che esiste già.

---

## Esercizio facoltativo (8c)

**Il tuo epilogo.**

1. In `src/data/finale.json` aggiungi una pagina prima dell'ultima: cosa fa Bruno quando sente la notizia?
2. Al cimitero, il germoglio dice "Ha già due foglie". Aggiungi un dialogo a frate Anselmo, visibile solo dopo l'Atto III (`"se": { "quest": "atto3_torre", "stato": "conclusa" }`), in cui racconta di averlo piantato.
3. Avvia i test: se dimentichi una risposta senza condizione in un nodo nuovo, quale controllo ti ferma?

**Domanda per riflettere:** il teletrasporto sceglie un punto a caso tra quelli buoni. Un giocatore esperto potrebbe preferire un Negromante **prevedibile** (per esempio, sempre nell'angolo più lontano dall'eroe). Quale dei due è più divertente da affrontare? E quale da testare?

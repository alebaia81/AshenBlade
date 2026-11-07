# Piano della fase 4: oggetti e inventario

Stato: **fase 4 completata** (4a, 4b e 4c consegnate)

## Obiettivo

Dal documento di design (§15): *inventario ampliabile, arma primaria e secondaria, pozioni, forzieri, tesori nascosti, rarità ed effetti delle armi* (dettagli nel §8).

Alla fine della fase:

- cliccando lo **zaino** (o I) si apre l'**inventario**, con il gioco in pausa. Contiene:
  - una **griglia** di spazi;
  - i due spazi dell'**equipaggiamento** (arma primaria e secondaria);
  - un riquadro con i dettagli dell'oggetto sotto il mouse, col nome nel colore della sua **rarità**;
- le **pozioni** (vita, mana, forza temporanea, resistenza) si **impilano** e si usano dall'inventario o da due spazi rapidi nella barra in basso;
- nelle mappe ci sono **forzieri** da aprire cliccandoli e **muri segreti** che si aprono colpendoli. Dietro c'è un forziere "fuori percorso";
- i nemici possono lasciare **bottino** a terra: passandoci sopra lo si raccoglie;
- l'**arma secondaria** (arco, balestra, pugnali da lancio, bacchetta) si usa dal suo pulsante nella barra, poi si clicca il bersaglio;
- le armi hanno una **rarità** (comune, non comune, rara, leggendaria, esotica) e possono avere **effetti** (risucchio di vita, rallentamento, fuoco, rimbalzo…);
- una **borsa** trovata in un forziere **amplia l'inventario**.

## Proposta: due consegne

Come la fase 3, propongo due parti giocabili, con una pausa per provare tra l'una e l'altra.

| Consegna | Contenuto |
|---|---|
| **4a – Lo zaino** | inventario e sua schermata, oggetti impilabili, pozioni con effetti a tempo, spazi rapidi, forzieri, bottino dei nemici, raccolta da terra, borsa che amplia l'inventario |
| **4b – Le armi** | equipaggiamento primaria/secondaria, armi secondarie (arco, balestra, pugnali da lancio, bacchetta), rarità, registro degli effetti delle armi, muri segreti e tesori nascosti |

## Scelte da confermare

| Scelta | Proposta | Perché |
|---|---|---|
| Rarità "comune" | Aggiungere al §8 la rarità **comune** (grigio chiaro) per le armi iniziali e gli oggetti semplici (pozioni) | La tabella del design parte da "non comune", ma le armi iniziali delle classi non possono essere già verdi. **Modifica al design.** |
| Ampliare l'inventario | Spazi iniziali **12** (4 × 3). Una **borsa** trovata in un forziere li porta a **16**; borse e zaini più grandi (fino a **24**) si compreranno dal mercante nella fase 5 | Il §8 dice "comprando dal mercante", ma il mercante arriva nella fase 5: con una borsa trovata possiamo già provare l'ampliamento. |
| Raccogliere gli oggetti | **Passandoci sopra**, se c'è spazio. Cliccando un oggetto a terra l'eroe ci va. Se lo zaino è pieno, l'oggetto resta a terra con l'avviso "zaino pieno" | È il modo più comodo col mouse; nessun clic in più per ogni pozione. |
| Usare l'inventario col mouse | **Clic** su un oggetto: lo seleziona e mostra i pulsanti **Usa / Equipaggia / Getta**. Il clic destro equipaggia o usa al volo. Niente trascinamento (*drag and drop*) per ora | Il trascinamento si può aggiungere nella fase 9 (rifinitura); i clic bastano e sono più semplici da provare e testare. |
| Spazi rapidi delle pozioni | Due pulsanti nella barra in basso: **pozione di vita** e **pozione di mana**, con il numero rimasto. Scorciatoie **1** e **2** | Nel combattimento aprire lo zaino sarebbe lento. Di conseguenza il pannello sviluppatore smette di usare i tasti numerici (resta tutto cliccabile, F8 per aprirlo). **Aggiungo le scorciatoie al §13.** |
| Pozioni | **Vita** +12; **mana** +10; **forza** +2 ai danni in mischia per 60 s; **resistenza** +2 armatura per 60 s | Numeri nei dati. Forza e resistenza introducono gli **effetti a tempo**, che servono anche agli effetti delle armi (fuoco, rallentamento). |
| Forzieri | Tessera nuova nella legenda: `"X": {"tipo":"forziere","contenuto":["pozione_vita","borsa"]}`. Si apre cliccandolo da vicino; resta aperto per sempre (anche cambiando mappa) | Coerente con il §4: forzieri e contenuti stanno nei dati. "Aperto per sempre" va nella Partita, così il salvataggio della fase 9 lo ricorderà. |
| Forzieri chiusi a chiave | **Non in questa fase**: li aprirà il Ladro compagno (fase 5, §10) | Nel §10 è un'abilità del compagno. |
| Muri segreti | Tessera `muro segreto`: sembra un muro, con una leggera crepa. **Colpendolo** si apre e resta aperto | È lo stile Zelda; il Ladro compagno (fase 5) li segnalerà. |
| Mappe del tesoro | **Fase 7** (sono quest secondarie, §8 e §11) | |
| Bottino dei nemici | Tabella nei dati di ogni nemico (es. slime: 15% pozione di vita). **Niente monete**: arrivano nella fase 5 con il mercante | Le monete senza nulla da comprare non servirebbero. |
| Restrizioni di classe | **Nessuna**: ogni classe può usare ogni arma; contano le caratteristiche (un Mago con FOR 8 fa poco danno con la spada) | Il design non prevede restrizioni; è lo stile più libero. |
| Armi secondarie | **Arco** (DES, a distanza), **balestra** (DES, lenta ma forte), **pugnali da lancio** (DES, rapidi, corti), **bacchetta** (INT, costa mana). **Frecce e pugnali infiniti**, con ricarica | Le munizioni aggiungerebbero gestione senza molto divertimento; si possono aggiungere più avanti. |
| Effetti delle armi (§4) | Registro con 6 effetti: **risucchio_vita** (cura il 20% del danno), **colpo_critico_doppio** (critico ×3 invece di ×2), **rallentamento** (nemico a metà velocità per 2 s), **fuoco** (1 danno al secondo per 3 s), **rimbalzo** (il proiettile salta a un altro nemico vicino, fino a 2 volte), **invisibile_dopo_uccisione** (2 s) | Coprono gli esempi del §8. Nuove armi combinano questi effetti solo con i dati. |
| Armi da trovare in questa fase | Fino a **rara**: una non comune nel forziere della Radura, una rara dietro il muro segreto del bosco | Le **leggendarie** stanno nei boss e nei tesori dei dungeon (fase 8), le **esotiche** "al massimo una per dungeon" (§8). In questa fase le provo con la modalità sviluppatore ("Dai oggetto"). |
| Armatura indossabile | **Non in questa fase.** Il §7 parla di armatura, ma il §8 non prevede oggetti di armatura. Resta la pozione di resistenza | Se vuoi armature indossabili (elmo, corazza) le aggiungiamo al design: andrebbero bene con il fabbro della fase 6. |

## File da creare o modificare

```
src/
  systems/
    oggetti.ts               tipi di oggetto (arma, pozione, borsa), rarità e loro ordine e colore      [4a]
    inventario.ts            aggiungere (con pile e capacità), togliere, contare, ampliare               [4a]
    effettiTemporanei.ts     effetti a tempo: aggiungere, scadere, sommare (forza, armatura, lentezza, fuoco) [4a]
    bottino.ts               tirare la tabella del bottino di un nemico                                   [4a]
    equipaggiamento.ts       equipaggiare/togliere armi, cosa torna nello zaino                           [4b]
    effettiArmi.ts           parti pure degli effetti: quanto risucchiare, chi colpire col rimbalzo…      [4b]
    mappa.ts / mondo.ts      (modifica) tessere forziere e muro segreto, validazione dei contenuti
    partita.ts               (modifica) inventario, equipaggiamento, forzieri aperti, muri aperti, effetti
  data/
    oggetti.json             pozioni, borsa                                                                [4a]
    armi.json                (modifica) rarità, effetti, armi secondarie e nuove primarie                  [4b]
    nemici.json              (modifica) tabelle del bottino                                                [4a]
    mappe/*.json             (modifica) forzieri [4a], muro segreto e forziere nascosto [4b]
  entities/
    OggettoATerra.ts         oggetto caduto: forma colorata, raccolta passandoci sopra                    [4a]
    Forziere.ts              forziere chiuso/aperto                                                        [4a]
  scenes/
    ScenaInventario.ts       griglia, equipaggiamento, dettagli, pulsanti Usa/Equipaggia/Getta            [4a/4b]
    interfaccia/iconeOggetti.ts  icone disegnate dal codice: pozioni, borsa, spada, arco…                  [4a/4b]
    mondo/effettiArmi/       registro degli effetti nel mondo (risucchio, fuoco, rimbalzo…)               [4b]
    ScenaMondo.ts, ScenaInterfaccia.ts, ScenaSviluppatore.ts   (modifica)
tests/  uno per ogni system nuovo o modificato, più i dati; tests/browser/fase-4a.cjs e fase-4b.cjs
docs/design.md               (modifica) rarità "comune", scorciatoie 1 e 2 nel §13
docs/lezioni/fase-4.md
```

## Passi in ordine

Per ogni `system`: prima i test, poi il codice.

**4a – Lo zaino**

1. Aggiornare il `design.md`.
2. `oggetti.ts` e `data/oggetti.json`; `inventario.ts`; `effettiTemporanei.ts`; `bottino.ts`; Partita con inventario, forzieri aperti ed effetti.
3. Tessera forziere nella mappa e validazione: ogni oggetto citato in un forziere o in un bottino deve esistere.
4. Oggetti a terra, raccolta, bottino dei nemici, forzieri da cliccare.
5. Pozioni: uso, effetti a tempo (forza nei danni, resistenza nell'armatura dell'eroe), spazi rapidi.
6. `ScenaInventario`: griglia, dettagli, Usa/Getta, pausa del mondo; icona dello zaino accesa.
7. Borsa che amplia l'inventario.
8. Modalità sviluppatore: "Dai oggetto" (elenco cliccabile); niente più tasti numerici.
9. Verifica, prova nel browser, schermate, lezione 4a. **Mi fermo.**

**4b – Le armi**

10. `equipaggiamento.ts`; armi nell'inventario; Equipaggia/Togli; la classe parte con la sua arma già equipaggiata.
11. Armi secondarie: pulsante nella barra (scorciatoia K), mirino come per la palla di fuoco.
12. Rarità nelle armi esistenti e nuove armi (per ogni tipo almeno una non comune o rara, e almeno una leggendaria e una esotica solo per le prove).
13. `effettiArmi.ts` e il registro degli effetti nel mondo: risucchio, critico doppio, rallentamento, fuoco, rimbalzo, invisibilità dopo un'uccisione.
14. Muri segreti e il forziere nascosto nel bosco.
15. Verifica, prova nel browser, schermate, lezione completa.

## Test previsti

**4a**
- **inventario**:
  - aggiungere in uno spazio libero;
  - le pozioni si impilano fino al massimo della pila, poi occupano un nuovo spazio;
  - zaino pieno: l'oggetto viene rifiutato (e resta a terra);
  - togliere da una pila;
  - contare quante pozioni di vita ci sono;
  - ampliare la capacità mantenendo gli oggetti;
  - non si può ridurre sotto gli spazi occupati.
- **effettiTemporanei**: un effetto dura il tempo previsto; due pozioni di forza non si sommano ma rinnovano la durata; il bonus totale di forza e armatura; il fuoco fa danno una volta al secondo.
- **bottino**: con casuali scelti a mano, cade o non cade; più oggetti possibili; tabella vuota → niente.
- **partita**: un forziere aperto resta aperto; l'inventario sopravvive alla sconfitta (§12: nessuna penalità).
- **dati**: ogni oggetto nei forzieri e nei bottini esiste; rarità valide; le pile hanno un massimo positivo.

**4b**
- **equipaggiamento**: equipaggiare un'arma la toglie dallo zaino e rimette la vecchia al suo posto; un'arma secondaria non va nello spazio primario; zaino pieno → non si può togliere l'arma.
- **effettiArmi**: risucchio = 20% del danno arrotondato (almeno 1); il rimbalzo sceglie il nemico più vicino non ancora colpito entro il raggio; critico ×3.
- **combattimento**: critico ×3 con "colpo_critico_doppio".
- **dati**: ogni effetto citato nelle armi è conosciuto; le esotiche non hanno ricette (pronto per la fase 6).

## Cose da provare giocando

**4a**
1. Clicca lo zaino (o I): inventario vuoto, 12 spazi, gioco in pausa.
2. Clicca il forziere nella Radura: l'eroe ci va, il forziere si apre e gli oggetti cadono a terra. Passandoci sopra li raccogli.
3. Uccidi qualche slime: ogni tanto lascia una pozione.
4. Nell'inventario passa il mouse su una pozione: nome, rarità, descrizione. Clicca → Usa.
5. Fatti ferire e usa il pulsante della pozione di vita nella barra (o 1). Il numero di pozioni scende.
6. Bevi la pozione di forza: i danni salgono e un'icona nell'interfaccia mostra il tempo che resta.
7. Usa la borsa trovata nel forziere: gli spazi diventano 16.
8. Riempi lo zaino con la modalità sviluppatore: un oggetto a terra non si raccoglie e compare "zaino pieno".
9. Esci dalla Radura e rientra: il forziere è ancora aperto.

**4b**
10. Trova l'arco nella Radura ed equipaggialo come arma secondaria. Pulsante nella barra (o K), poi clic su un lupo lontano.
11. Equipaggia un'arma primaria trovata: la vecchia torna nello zaino.
12. Nel bosco cerca il muro con la crepa e colpiscilo: si apre un passaggio verso un forziere nascosto con un'arma rara.
13. Con la modalità sviluppatore prendi un'arma leggendaria e un'esotica e prova i loro effetti: risucchio di vita, rimbalzo dell'arco tra i nemici, invisibilità dopo un'uccisione.

## Concetti nuovi della lezione

Modello dei dati di un inventario (pile, capacità), oggetti come dati e non come classi, effetti a tempo (*buff* e *debuff*), tabelle del bottino e probabilità, interazione con oggetti del mondo (cliccare per avvicinarsi e interagire), stato persistente del mondo (forzieri aperti), registro di effetti componibili (come i *middleware*), griglie e interfacce di inventario.

## Note di sviluppo

**4a**
- Barra in basso: i pulsanti sono diventati 6 (capriola, abilità, pozione di vita, pozione di mana, arma secondaria, compagno), più stretti.
- La modalità sviluppatore non usa più i tasti numerici (ora sono le pozioni) e ogni voce è cliccabile su tutta la riga.
- Gli oggetti a terra non raccolti spariscono cambiando mappa; i forzieri aperti invece restano aperti (sono nella Partita).
- Le prove nel browser delle fasi precedenti sono state aggiornate alla nuova disposizione della barra e delle icone.

---

# Revisione: 4b – Armi e armature, 4c – Barra dei preferiti

Dopo la 4a hai chiesto le **armature** (con rarità ed esotiche) e una **barra dei preferiti**. Il `design.md` è già aggiornato (§7, §8, §13, §15). Questa revisione **sostituisce** la parte 4b scritta sopra.

## Scelte da confermare

| Scelta | Proposta | Perché |
|---|---|---|
| Pezzi di armatura | **Elmo, corazza, guanti, stivali** | Quattro spazi bastano a dare varietà senza riempire la scheda. |
| Armatura per rarità (per pezzo) | Comune 0–1, non comune 1, rara 2, leggendaria 2 + **1 punto a una caratteristica**, esotica 1 + **effetto speciale**. Corazza +1 rispetto agli altri pezzi | Il danno minimo è 1: con un'armatura totale troppo alta gli slime non farebbero quasi nulla. Il massimo realistico (tutto rare + resistenza) resta attorno a 10. Numeri nei dati, da bilanciare giocando. |
| Dove si trovano | Comuni, non comuni e rare in forzieri e bottini delle zone aperte; **leggendarie ed esotiche nei dungeon e dai boss** (fase 8). In questa fase le esotiche e le leggendarie si provano con la modalità sviluppatore | Come per le armi (design §8). |
| Armatura iniziale | **Nessuna**: si trova giocando | Le prime ricompense dei forzieri diventano più interessanti. |
| Dove si cambiano | **Solo dalla scheda del personaggio**, che avrà due schede: *Caratteristiche* ed *Equipaggiamento* (2 armi + 4 armature). Cliccando uno spazio si sceglie tra i pezzi adatti nello zaino, oppure "Togli" | Come hai chiesto. Le armi si possono cambiare anche dallo zaino e dalla barra dei preferiti. |
| "Non durante un combattimento" | Proposta: con un nemico che ti sta **inseguendo**, gli spazi delle armature nella scheda sono bloccati con la scritta "Non durante un combattimento" | È come ho interpretato la tua frase. Se intendevi solo "non dalla barra", tolgo il blocco. |
| Limite delle esotiche | Al massimo **1 arma esotica** (primaria o secondaria) e **1 armatura esotica**. Se provi a equipaggiarne una seconda: messaggio "Puoi equipaggiare una sola arma esotica" e resta nello zaino | Regola del design §8. È una regola pura, testabile in `equipaggiamento.ts`. |
| Effetti delle armature esotiche | Stesso registro degli effetti delle armi. Quattro esotiche iniziali: **Stivali del vento** (due capriole di fila), **Corazza di spine** (rimanda il 30% del danno subito), **Elmo del veggente** (segnala muri segreti e forzieri nascosti vicini), **Guanti del predatore** (i critici curano 2 punti vita) | Uno per pezzo, e cambiano il modo di giocare come chiede il §8. |
| Armi esotiche (per le prove) | **Arco del rimbalzo** (rimbalzo), **Spada di brace** (fuoco), **Pugnale dell'ombra** (invisibile dopo un'uccisione), **Lama del vuoto** (risucchio + critico doppio: è l'esempio del §4) | Gli esempi del design. |
| Barra dei preferiti | **6 spazi**, solo **pozioni e armi**, tasti **1–6**. Si parte con pozione di vita (1) e di mana (2) | Come hai chiesto: niente armature nella barra. |
| Come si riempie | **Trascinando** dallo zaino allo spazio (e trascinando fuori dalla barra per svuotarlo). Alternativa per chi non trascina: clic destro su un oggetto dello zaino → "Aggiungi ai preferiti" | Il trascinamento è la cosa più naturale; l'alternativa col clic aiuta anche le prove automatiche. |
| Collegamento, non spostamento | Lo spazio "punta" all'oggetto: le pozioni mostrano quante ne restano (grigio a zero); un'arma impugnata mostra un bordo "in mano" | Così finire le pozioni non svuota la barra. |
| Cambio d'arma dalla barra | L'arma va nel suo spazio (primaria o secondaria); quella di prima torna nello zaino; **0,5 s di attesa** prima di poter attaccare | Evita il trucco di alternare due armi per colpire due volte. |
| Barra in basso | **Icone quadrate** invece di pulsanti con il testo: a sinistra capriola, abilità, arma secondaria, compagno; a destra i 6 preferiti, con il numero del tasto nell'angolo e il nome nel suggerimento | Nove-dieci pulsanti con il testo non ci stanno in 960 pixel. |

## File da creare o modificare (oltre a quelli della 4a)

```
src/
  systems/
    equipaggiamento.ts       2 armi + 4 armature: equipaggiare, togliere, limite delle esotiche, armatura totale, bonus    [4b]
    effettiArmi.ts           parti pure degli effetti (risucchio, rimbalzo, critico ×3) e delle armature esotiche          [4b]
    preferiti.ts             i 6 spazi: assegnare, svuotare, cosa fa un clic su uno spazio                                 [4c]
    combattimento.ts         (modifica) critico ×3
    statoEroe.ts             (modifica) cariche della capriola (Stivali del vento), attesa dopo il cambio d'arma
    partita.ts               (modifica) equipaggiamento e preferiti
  data/
    armi.json                (modifica) rarità, effetti, armi secondarie, nuove armi                                       [4b]
    armature.json            i pezzi di armatura per rarità, più le 4 esotiche                                              [4b]
    mappe/*.json             (modifica) muro segreto e forziere nascosto nel bosco                                          [4b]
  entities/
    MuroSegreto.ts           sembra un muro con una crepa; si apre colpendolo                                               [4b]
  scenes/
    mondo/effettiArmi/       registro degli effetti nel mondo (risucchio, fuoco, rallentamento, rimbalzo, invisibilità, spine…) [4b]
    ScenaScheda.ts           (modifica) schede Caratteristiche / Equipaggiamento                                            [4b]
    ScenaInventario.ts       (modifica) Equipaggia per le armi [4b]; trascinamento verso la barra [4c]
    ScenaInterfaccia.ts      (modifica) barra a icone, 6 preferiti, trascinamento [4c]
    interfaccia/iconeOggetti.ts  (modifica) icone di armi e armature                                                        [4b]
tests/  equipaggiamento, effettiArmi, preferiti, più i test modificati e quelli sui dati;
        tests/browser/fase-4b.cjs e fase-4c.cjs
```

## Passi in ordine

**4b – Armi e armature**

1. `equipaggiamento.ts` (test prima): spazi, limite delle esotiche, armatura totale, bonus delle leggendarie.
2. Dati: `armature.json`, nuove armi con rarità ed effetti; validazione (effetti conosciuti, esotiche senza ricette).
3. Partita con l'equipaggiamento; la classe parte con la sua arma impugnata; l'armatura totale entra nel calcolo dei danni subiti.
4. Scheda con le due schede e il blocco "non durante un combattimento"; Equipaggia nello zaino per le armi.
5. Armi secondarie: pulsante nella barra (K) e mirino.
6. `effettiArmi.ts` (test prima) e il registro nel mondo: risucchio, critico doppio, rallentamento, fuoco, rimbalzo, invisibilità dopo un'uccisione; poi le 4 armature esotiche.
7. Muro segreto e forziere nascosto nel bosco (con un'arma rara e un pezzo di armatura raro).
8. Verifica, prova nel browser, schermate, lezione 4b. **Mi fermo.**

**4c – Barra dei preferiti**

9. `preferiti.ts` (test prima): assegnare pozioni e armi (non armature), svuotare, effetto del clic.
10. Barra in basso a icone con i 6 preferiti e i tasti 1–6.
11. Trascinamento dallo zaino alla barra e fuori dalla barra; "Aggiungi ai preferiti" col clic destro.
12. Cambio d'arma dalla barra con l'attesa di 0,5 s.
13. Verifica, prova nel browser, schermate, lezione completa.

## Test previsti

- **equipaggiamento**:
  - equipaggiare un'arma la toglie dallo zaino e rimette la vecchia;
  - un'arma secondaria non va nello spazio primario;
  - un elmo non va nello spazio dei guanti;
  - una seconda arma esotica (o una seconda armatura esotica) viene rifiutata, ma si può **sostituire** l'esotica già equipaggiata;
  - un'arma esotica e un'armatura esotica insieme sono permesse;
  - zaino pieno: non si può togliere un pezzo;
  - armatura totale = somma dei pezzi;
  - una leggendaria aggiunge il suo punto di caratteristica.
- **effettiArmi**: risucchio = 20% del danno (almeno 1); rimbalzo verso il nemico più vicino non ancora colpito entro il raggio; spine = 30% del danno subito (almeno 1); critico ×3.
- **statoEroe**: con due cariche si fanno due capriole di fila, poi serve la ricarica; dopo un cambio d'arma non si attacca per 0,5 s.
- **preferiti**: assegnare una pozione o un'arma sì, un'armatura no; lo stesso oggetto in due spazi si sposta nel nuovo; a pozioni finite lo spazio resta assegnato; trascinare fuori svuota.
- **dati**: rarità ed effetti validi; ogni pezzo ha uno spazio valido; esiste un'esotica per ogni pezzo d'armatura; armi e armature nei forzieri esistono.

## Cose da provare giocando

**4b**
1. Apri la scheda: due schede, *Caratteristiche* ed *Equipaggiamento*. Gli spazi delle armature sono vuoti.
2. Apri il forziere nascosto del bosco (colpisci il muro con la crepa): dentro un pezzo d'armatura raro e un'arma rara. Indossa l'armatura dalla scheda: l'armatura totale sale e i lupi fanno meno male.
3. Fatti inseguire da un lupo e apri la scheda: gli spazi delle armature sono bloccati.
4. Con la modalità sviluppatore prendi due armi esotiche: la seconda non si può impugnare finché c'è la prima. Prendi un'arma esotica e degli stivali esotici: insieme sì.
5. Prova gli effetti: risucchio di vita, fuoco, rimbalzo dell'arco, invisibilità dopo un'uccisione, due capriole di fila, spine, elmo che segnala il muro segreto.
6. Equipaggia l'arco come arma secondaria e usalo dal suo pulsante (K) con il mirino.

**4c**
7. Trascina una pozione di forza dallo zaino allo spazio 3 della barra, una mazza nello spazio 4 e l'arco nello spazio 5.
8. In combattimento premi 4: impugni la mazza al posto della tua arma (che torna nello zaino) e per mezzo secondo non puoi attaccare. Premi 5: l'arco va nello spazio dell'arma secondaria e lo usi con K.
9. Finisci le pozioni di vita: lo spazio 1 diventa grigio ma resta lì; raccogline una e si riaccende.
10. Trascina uno spazio fuori dalla barra: si svuota.
11. Prova a trascinare un elmo nella barra: viene rifiutato ("Le armature si cambiano dalla scheda").

## Note di sviluppo (4b)

- **Valori di armatura:** comune 1, non comune 1 (corazza 2), rara 2 (corazza 3), leggendaria 2 + bonus, esotica 1 (corazza 2). Rispetto alla proposta, i pezzi comuni danno 1 e non 0: un oggetto con armatura 0 sarebbe sembrato inutile.
- **Armi secondarie:** tirano solo quando l'eroe è "libero" (non durante un attacco, una capriola o una parata) e hanno la loro ricarica, separata da quella dell'arma primaria.
- **Il forziere nascosto** sta nell'angolo in alto a destra del bosco, dietro il muro con la crepa nella colonna 27, riga 5 (contando da 1). Dentro ci sono l'Arco lungo e la Cotta di maglia.
- **Forziere della Radura:** ora contiene anche un Arco e una Corazza di cuoio, così l'arma secondaria si prova presto.
- **Bottino:** i lupi possono lasciare stivali o corazze di cuoio; gli scheletri elmi o guanti di ferro, oppure un arco.
- **Bug trovati dalle prove nel browser e corretti:**
  - la freccia che rimbalza ricolpiva il primo nemico;
  - il suggerimento di un'icona restava visibile sopra il pannello appena aperto.
- **Prove nel browser:**
  - `fase-4b.cjs`: 35 su 35;
  - le prove precedenti (3a, 3b, 3c, 4a) sono state aggiornate alle nuove funzioni e ripassano tutte.

## Note di sviluppo (4c)

- **"Aggiungi ai preferiti" è un pulsante**, *Preferiti*, accanto a *Usa* e *Getta*, e non una voce del clic destro: nello zaino il clic destro usa già l'oggetto al volo (dalla 4a). Il pulsante mette l'oggetto selezionato nel primo spazio libero della barra.
- **Il trascinamento avviene nello zaino**, che mostra una riga identica alla barra in basso. Mentre lo zaino è aperto, il velo scuro copre la barra vera. Si trascina dallo zaino alla riga, da uno spazio della riga a un altro (il collegamento si sposta), oppure fuori dalla riga per svuotare lo spazio. Anche il clic destro su uno spazio della riga lo svuota.
- **Spazio 2 iniziale:** è vuoto per le classi senza mana (Guerriero e Ladro), perché una pozione di mana non servirebbe loro.
- **Barra in basso:** è fatta di quadrati con icona. Il nome compare nel suggerimento. Bordo giallo = mirino attivo; bordo verde = arma in mano.
- **Prove nel browser:**
  - `fase-4c.cjs`: 20 su 20;
  - tutte le prove precedenti usano le nuove posizioni della barra (`BARRA` in `aiuti.cjs`) e ripassano: 3a, 3b, 3c, 4a e 4b.

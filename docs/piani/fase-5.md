# Piano della fase 5: il villaggio

Stato: **fase 5 completata** (5a, 5b e 5c consegnate)

## Obiettivo

Dal documento di design (§15): *Borgo Quercia, dialoghi, monete, mercante, taverna, compagno che combatte con abilità speciale* (dettagli nei §3, §9, §10, §11).

Alla fine della fase:

- c'è una nuova mappa, **Borgo Quercia**, con la piazza della **Quercia Antica**, le barricate e i sei personaggi del §3. Si gioca col mouse: cliccando un personaggio l'eroe ci va e ci **parla**;
- i **dialoghi** sono scritti nei dati, con risposte a scelta;
- esistono le **monete**: le lasciano i nemici, stanno nei forzieri e si vedono nell'interfaccia;
- **Gemma** vende pozioni, armi, armature, borse e zaini, e **ricompra** a metà prezzo. Il Carisma (CAR) migliora i prezzi in entrambe le direzioni;
- da **Tobia**, nella taverna, si ingaggia un **compagno** per ciascuna classe: Corrado, Elisa, Nives "Volpe" e Sorella Agata;
- il compagno **segue l'eroe** e **combatte da solo**. Ha un'**abilità speciale**, che si usa con il pulsante del compagno nella barra in basso o con Q.

## Proposta: tre consegne

Come le fasi 3 e 4, propongo tre parti giocabili, con una pausa per provare tra l'una e l'altra.

| Consegna | Contenuto |
|---|---|
| **5a – Borgo Quercia** | mappa del villaggio collegata alla Radura, personaggi cliccabili, finestra di dialogo con scelte, monete (bottino, forzieri, interfaccia), cursore "parla" |
| **5b – La bottega di Gemma** | negozio: compra e vendi, prezzi nei dati, sconto del Carisma, ricompra a metà prezzo, zaini grandi fino a 24 spazi |
| **5c – La taverna e i compagni** | ingaggio da Tobia, compagno che segue e combatte, nemici che possono attaccare anche lui, "al tappeto" e rialzo, bonus fisso e abilità speciale (pulsante e Q) |

## Scelte da confermare

| Scelta | Proposta | Perché |
|---|---|---|
| Dove inizia la partita | Nella **piazza di Borgo Quercia**. La Radura è fuori dal cancello del villaggio | È l'inizio della storia (§3): l'eroe arriva al villaggio barricato in cerca di riparo. |
| Edifici | **Niente interni** per ora: ogni personaggio sta davanti alla sua bottega (banco di Gemma, fucina di Bruno, porta della taverna, cappella). Gli edifici sono "muri" disegnati come case | Ogni interno sarebbe una mappa in più da collegare. Gli interni si possono aggiungere più avanti con nuove mappe, senza toccare il codice. |
| Dialoghi | Un file `dialoghi.json` con dei **nodi** (testo + risposte). Ogni risposta porta a un altro nodo, chiude il dialogo o apre qualcosa (`"apri": "negozio"` o `"taverna"`). Le **condizioni** (es. "dopo il primo boss") arriveranno con le quest (fase 7) | È un "grafo" di schermate, come le pagine di un sito collegate da link. Aggiungere frasi non richiede codice. |
| Cosa dicono adesso | **Berta:** il villaggio e le barricate. **Anselmo:** la cappella, e una mezza frase su un "vecchio amico". **Gemma:** apre il negozio (5b). **Tobia:** apre la taverna (5c). **Bruno:** "torna quando avrò la forgia accesa" (fase 6). **Nonna Rosalba:** una leggenda con un **indizio sul muro segreto del bosco** | Il §3 dice che Rosalba nasconde indizi sui muri segreti: il primo esiste già. |
| Monete | Un numero nella Partita, mostrato sotto le barre con un'icona. **Slime** 1–3, **lupo** 2–5, **scheletro** 3–6 (nei dati del nemico). Nei forzieri un campo `"monete"`. Le monete a terra si raccolgono passandoci sopra, anche con lo zaino pieno | Le monete non occupano spazio nello zaino: sarebbe frustrante. |
| Prezzi | Ogni oggetto ha un `"prezzo"` nei dati: pozione di vita 15, borsa 60, **zaino da 20 spazi** 150, **zaino da 24 spazi** 300. Ogni punto di modificatore CAR toglie il 5% quando compri e aggiunge il 5% quando vendi (al massimo ±25%). Si **ricompra a metà** del prezzo pieno | Il §9 dice "CAR migliora i prezzi in entrambe le direzioni". |
| Cosa vende Gemma | Pozioni, armi e armature **comuni e non comuni**, alcune **rare**, borse e zaini. **Mai** leggendarie ed esotiche | Il §8: leggendarie ed esotiche si trovano nei dungeon e dai boss. |
| Ingaggio | Ogni compagno ha un **prezzo una tantum** (Corrado 80, Agata 80, Volpe 100, Elisa 100). Pagato una volta, puoi tornare da Tobia e **cambiarlo gratis** con uno già ingaggiato. Uno solo alla volta | Il §10 dice "ingaggiabile a pagamento, sostituibile": così cambiare compagno non diventa una tassa. |
| Come combatte | Riusa il comportamento **inseguitore** dei nemici con il bersaglio invertito: insegue il **nemico più vicino all'eroe** entro un raggio, altrimenti segue l'eroe a due tessere di distanza. Fa **metà danno** dell'eroe. Elisa tira dardi magici, gli altri colpiscono in mischia | Come dice il §10. Riusare l'IA è anche un buon esempio di codice riutilizzabile. |
| Nemici contro il compagno | I nemici inseguono il bersaglio **più vicino** tra eroe e compagno | Senza questa regola il compagno non verrebbe mai "messo al tappeto" (§10). |
| Al tappeto | Con la vita a zero il compagno resta a terra, trasparente. **Si rialza** con metà vita quando nessun nemico ti vede da 3 secondi, oppure cambiando mappa | "Si rialza a fine combattimento, non si perde mai" (§10): la fine del combattimento la definiamo come per il blocco delle armature (4b). |
| Bonus fisso | **Corrado:** +1 armatura all'eroe. **Elisa:** +25% rigenerazione del mana (a chi non ha mana non serve, quindi +1 INT ai suoi dardi). **Volpe:** +5% probabilità di critico. **Agata:** 1 punto vita ogni 5 secondi | Piccoli, perché il compagno aiuta ma non risolve i combattimenti al posto tuo. |
| Abilità speciali | **Agata:** cura 8 punti vita all'eroe (ricarica 20 s). **Corrado:** il prossimo colpo che subiresti lo para lui (ricarica 15 s). **Elisa:** scudo magico che assorbe 10 danni per 8 s (ricarica 25 s). **Volpe:** segnala i tesori e i muri segreti entro 10 tessere per 6 s (ricarica 30 s). La parte "apre i forzieri chiusi a chiave" arriverà con i forzieri chiusi dei dungeon (fase 8) | Come il §10. Il segnale di Volpe riusa il luccichio dell'Elmo del veggente. |
| Cambio mappa | Il compagno ti segue: ricompare accanto a te nella nuova mappa | Altrimenti andrebbe "riportato" ogni volta. |

## File da creare o modificare

```
src/
  systems/
    dialoghi.ts           nodi e risposte: dove si va con una scelta, validazione del grafo           [5a]
    monete.ts             monete nella partita, tiro delle monete dei nemici                           [5a]
    negozio.ts            prezzi con il CAR, comprare, vendere, cosa vende il mercante                  [5b]
    taverna.ts            ingaggio, prezzo una tantum, cambio gratuito                                  [5c]
    ia/compagno.ts        "mente" del compagno: quale nemico inseguire, quando seguire l'eroe            [5c]
    compagno.ts           vita, al tappeto e rialzo, ricarica dell'abilità                                [5c]
    tipi.ts, mappa.ts     (modifica) celle "abitante", monete nei forzieri
    partita.ts            (modifica) monete, compagni ingaggiati, compagno attivo
  data/
    mappe/borgo.json      il villaggio; la Radura ha un'uscita verso il borgo                          [5a]
    abitanti.json         i sei personaggi: nome, colore, dialogo iniziale                              [5a]
    dialoghi.json         i testi                                                                       [5a]
    negozio.json          cosa vende Gemma                                                              [5b]
    compagni.json         i quattro compagni: classe, vita, prezzo, bonus, abilità                      [5c]
    oggetti.json, armi.json, armature.json   (modifica) "prezzo"; due zaini nuovi                       [5b]
  entities/
    Abitante.ts           un personaggio fermo, con un'ombra e un nome sopra                            [5a]
    Compagno.ts           il compagno nel mondo                                                         [5c]
  scenes/
    ScenaDialogo.ts       finestra in basso con testo e risposte cliccabili (il mondo in pausa)          [5a]
    ScenaNegozio.ts       due colonne: "Gemma vende" e "Il tuo zaino"                                   [5b]
    ScenaTaverna.ts       i quattro compagni, prezzo, "Ingaggia" / "Scegli"                             [5c]
    mondo/abilitaCompagno/  registro delle quattro abilità speciali                                     [5c]
    ScenaInterfaccia.ts   (modifica) monete; pulsante del compagno attivo con ricarica [5a, 5c]
    ScenaSviluppatore.ts  (modifica) "+100 monete", "Ingaggia compagno…"
tests/  dialoghi, monete, negozio, taverna, compagno, ia/compagno, dati del borgo e dei testi;
        tests/browser/fase-5a.cjs, 5b, 5c
```

## Passi in ordine

**5a – Borgo Quercia**

1. `dialoghi.ts` e `monete.ts` (test prima): navigazione dei nodi, validazione (nessuna risposta verso un nodo inesistente), monete dei nemici.
2. Mappa `borgo.json`: piazza, Quercia Antica, case, barricate, cancello verso la Radura. La partita inizia qui.
3. `Abitante` nel mondo: clic → l'eroe ci va → si apre il dialogo. Cursore "parla" (un fumetto).
4. `ScenaDialogo`: nome, testo e risposte cliccabili; il mondo in pausa.
5. Monete: bottino dei nemici, forzieri, interfaccia, modalità sviluppatore.
6. Verifica, prova nel browser, schermate, lezione 5a. **Mi fermo.**

**5b – La bottega di Gemma**

7. `negozio.ts` (test prima): prezzi con il CAR, compra (monete e spazio nello zaino), vendi (non l'equipaggiamento indossato), metà prezzo.
8. `ScenaNegozio` aperta dal dialogo di Gemma; zaini grandi.
9. Verifica, prova nel browser, schermate, lezione 5b. **Mi fermo.**

**5c – La taverna e i compagni**

10. `taverna.ts`, `compagno.ts`, `ia/compagno.ts` (test prima).
11. `Compagno` nel mondo: segue l'eroe, combatte, viene colpito, va al tappeto, si rialza; segue l'eroe nei cambi di mappa.
12. Nemici che scelgono il bersaglio più vicino tra eroe e compagno.
13. `ScenaTaverna`, bonus fissi, le quattro abilità speciali, pulsante del compagno nella barra e tasto Q.
14. Verifica, prova nel browser, schermate, lezione completa.

## Test previsti

- **dialoghi:**
  - si parte dal nodo iniziale;
  - una risposta porta al nodo giusto, oppure chiude, oppure apre il negozio;
  - la validazione trova risposte verso nodi inesistenti e nodi irraggiungibili.
- **monete:**
  - le monete di un nemico stanno nel suo intervallo (con casuale fisso);
  - aggiungere e spendere; non si va mai sotto zero.
- **negozio:**
  - prezzo con CAR 10, 14 e 6;
  - mai sotto la metà né sopra il doppio;
  - comprare senza monete o con lo zaino pieno: rifiutato e nulla cambia;
  - vendere a metà prezzo;
  - l'arma in mano non si vende;
  - le pozioni si vendono una alla volta da una pila.
- **taverna:** il primo ingaggio costa, il cambio verso un compagno già pagato è gratis, uno solo attivo, monete insufficienti.
- **compagno:**
  - il bersaglio è il nemico più vicino all'eroe entro il raggio, altrimenti l'eroe;
  - si ferma a due tessere dall'eroe;
  - al tappeto non attacca;
  - si rialza dopo 3 s senza nemici in vista;
  - le ricariche delle abilità.
- **dati:**
  - il borgo è raggiungibile dalla Radura e viceversa;
  - ogni abitante ha un dialogo esistente;
  - ogni oggetto in vendita esiste e ha un prezzo;
  - nessun oggetto leggendario o esotico nel negozio.

## Cose da provare giocando (5a)

1. Nuova partita: si comincia nella piazza di Borgo Quercia, accanto alla Quercia Antica.
2. Passa col mouse sopra un personaggio: il cursore diventa un fumetto. Clicca: l'eroe ci va e si apre il dialogo, con il gioco in pausa.
3. Scegli le risposte con il mouse; "Arrivederci" chiude il dialogo.
4. Parla con Nonna Rosalba: la sua leggenda indica dove cercare nel bosco.
5. Esci dal cancello: sei nella Radura. Sconfiggi qualche slime: lasciano monete, che si raccolgono passandoci sopra e compaiono nell'interfaccia.
6. Torna al villaggio dal cancello della Radura.

## Note di sviluppo (5a)

- **Borgo Quercia:** 40 × 28 tessere.
  - Al centro c'è la piazza con la Quercia Antica e una fontana.
  - In alto il municipio (Berta), la cappella (Anselmo) e la bottega (Gemma); a sinistra la casa di Rosalba; in basso la fucina (Bruno) e la taverna (Tobia).
  - A destra ci sono le barricate e il cancello verso la Radura.
- **La Radura** ha una nuova uscita a sinistra, riga 13 (contando da 1), che porta al cancello del borgo.
- **Monete:**
  - slime 1–3, lupo 2–5, scheletro 3–6;
  - forzieri: Radura 15, bosco 20, forziere nascosto 40.
- **Modalità sviluppatore:** nuova voce "+100 monete".
- **"Fammi vedere la merce"** (Gemma) e **"Cerco qualcuno che combatta con me"** (Tobia) per ora mostrano un avviso: diventano negozio e taverna nella 5b e nella 5c.
- **Prove nel browser:** `fase-5a.cjs` 22 su 22. Le prove precedenti iniziano nella Radura con `vaiA('radura')` e ripassano tutte (3a, 3b, 3c, 4a, 4b, 4c).

## Note di sviluppo (5b)

- **Prezzi pieni:**
  - armi: comune 30, non comune 70, rara 160, leggendaria 400, esotica 800;
  - armature: comune 25, non comune 60, rara 140, leggendaria 350, esotica 700 (le corazze costano il 50% in più);
  - pozioni 15–30, borsa 60.
- **Zaini nuovi:** "Zaino da viaggio" (20 spazi, 150) e "Zaino dell'esploratore" (24 spazi, 300).
- **Gemma vende 16 oggetti** (`negozio.json`): pozioni, borsa, zaini, spada lunga, arco, balestra, bacchetta, e pezzi di cuoio e di ferro.
- **Il Guerriero può comprare la bacchetta,** ma non impugnarla (usa il mana): la scheda glielo dice. Si può sempre rivendere.
- **Prove nel browser:** `fase-5b.cjs` 17 su 17; tutte le precedenti ripassano.

## Note di sviluppo (5c)

- **I bonus fissi valgono finché il compagno è con te**, anche se è al tappeto. Il pulsante dell'abilità invece è spento finché non si rialza.
- **Movimento:** linea retta quando la strada è libera, A\* (ricalcolato ogni 400 ms) quando non lo è, e ricomparsa accanto all'eroe se resta indietro di più di 220 pixel.
- **Cambio mappa:** il compagno ricompare accanto all'eroe con la vita piena. Parata e scudo attivi si perdono.
- **"Lascialo qui":** in taverna si può congedare il compagno e riprenderlo gratis più tardi.
- **Bug trovato dalla prova nel browser e corretto:** con un nemico nato dentro un albero, il compagno non trovava strada e restava fermo. Ora punta alla cella libera più vicina.
- **Modalità sviluppatore:** la voce "Ingaggia compagno…" prevista nel piano non è stata aggiunta: basta "+100 monete" e la taverna.
- **Prove nel browser:** `fase-5c.cjs` 24 su 24; tutte le precedenti ripassano (3a–5b).

# Piano della fase 2: combattimento

Stato: **approvato** (3 novembre 2026)

## Obiettivo

Dal documento di design (§15): *attacco primario, schivata, nemici con comportamento inseguitore, vita, invulnerabilità dopo il colpo, morte e ricomparsa, modalità sviluppatore.*

Alla fine della fase:

- con **J** l'eroe colpisce davanti a sé: per un istante compare l'area di colpo (un rettangolo chiaro) e i nemici toccati perdono vita. Il danno compare sopra di loro come numero che sale e svanisce, in giallo e più grande se è un critico. Un nemico colpito viene respinto e stordito per un attimo;
- con **Spazio** l'eroe fa una capriola: scatto rapido nella direzione di marcia, invulnerabile durante lo scatto, poi una breve ricarica prima di poterla rifare;
- nella Radura ci sono **slime** (lenti, deboli) e nel Sentiero nel bosco anche **lupi** (veloci). Stanno fermi finché l'eroe non si avvicina, poi lo inseguono; se si allontana abbastanza smettono e tornano al loro posto;
- toccare un nemico fa perdere vita: l'eroe viene respinto, la telecamera trema, l'eroe lampeggia ed è invulnerabile per un attimo;
- in alto a sinistra una **barra della vita** con i numeri (es. 14/20) sotto il nome della mappa;
- a vita zero: dissolvenza, scritta "Sei stato sconfitto", e l'eroe **ricompare all'ingresso della zona** con la vita piena (§12); i nemici della zona ricompaiono (§11);
- con **F8** si apre un pannello della **modalità sviluppatore**.

## Scelte da confermare

| Scelta | Proposta | Perché |
|---|---|---|
| Valori provvisori | Fino alla fase 3 l'eroe non ha caratteristiche: modificatori a 0, quindi critico al 5% base. Vita fissa 20 in `data/eroe.json`. Arma iniziale provvisoria **spada di legno** (1d6) in `data/armi.json`, nel formato del §4 | Le formule del §7 si scrivono già complete; nella fase 3 basterà passare i veri modificatori. |
| Attacco dei nemici | **Danno da contatto**: un nemico che tocca l'eroe lo ferisce, poi si ferma un attimo | È lo schema classico di Zelda per i nemici semplici. Attacchi con preavviso (carica, tiro) arrivano con i comportamenti "caricatore" e "tiratore" quando serviranno nei dungeon. |
| Come gli inseguitori trovano la strada | **In linea retta** verso l'eroe, fermati dai muri | Semplice e sufficiente nelle zone aperte. Limite noto: dietro un albero un nemico può restare bloccato. Se nei dungeon diventerà un problema, aggiungeremo la ricerca del percorso (algoritmo A*) come lezione a sé. |
| Aree di colpo | Calcolate nei `systems` con rettangoli puri (AABB), non con la fisica di Phaser | Sono regole del gioco: così si testano senza browser (quanto è lunga la spada, se un colpo tocca un nemico, se lo stesso nemico viene colpito una sola volta per fendente). |
| Contatto eroe–nemico | Fisica Arcade (`overlap`): si toccano ma non si spingono | La fisica lo fa già bene; i nemici invece **si scontrano** con muri e tra loro, così non si ammucchiano uno sopra l'altro. |
| Stati dell'eroe | **Macchina a stati** in `systems`: `libero`, `attacco`, `schivata`, `colpito`, `sconfitto` | Evita i casi impossibili (attaccare durante la capriola, muoversi mentre si è respinti). È il concetto principale di questa lezione. |
| Modalità sviluppatore (F8) | In questa fase: mostra le aree di colpo e i corpi fisici, invulnerabilità, vita piena, teletrasporto tra le mappe, genera un nemico accanto all'eroe | Il §14 cita anche oggetti, monete ed esperienza: non esistono ancora, li aggiungeremo al pannello nelle fasi 3–5. |
| Nemici nelle mappe | Nuovo tipo di cella `nemico` nella legenda, con l'id del nemico: `"S": {"tipo":"nemico","nemico":"slime","colore":"#6b9a4b"}`. Si disegna e si calpesta come pavimento | Coerente col §4: i nemici si aggiungono ai dati, non al codice. La validazione segnala un nemico inesistente in `nemici.json`. |

## Formato dei nemici (`data/nemici.json`)

```json
{
  "slime": {
    "nome": "Slime",
    "comportamento": "inseguitore",
    "vita": 8,
    "armatura": 0,
    "danno": "1d4",
    "velocita": 35,
    "raggioVista": 80,
    "raggioAbbandono": 140,
    "dimensione": 10,
    "colore": "#7ad3c0"
  },
  "lupo": { "...": "più veloce, più vita, danno 1d6" }
}
```

Il campo `comportamento` sceglie la "mente" del nemico da un **registro dei comportamenti** nel codice. Oggi c'è solo `inseguitore`; `tiratore` e `caricatore` si aggiungeranno allo stesso registro.

## File da creare o modificare

```
src/
  systems/
    tipi.ts                     (modifica) tipo di cella "nemico", tipi di armi, nemici, rettangoli
    casuale.ts                  generatore di numeri casuali "iniettabile" (nei test si usa uno prevedibile)
    dadi.ts                     legge e tira dadi in notazione D&D ("1d6", "2d4+1")
    combattimento.ts            danno (dado + modificatore + bonus − armatura, minimo 1), critico
    vita.ts                     punti vita: subire danno, curare, essere sconfitti
    geometria.ts                rettangoli: sovrapposizione (AABB), area di colpo davanti all'eroe
    statoEroe.ts                macchina a stati dell'eroe con i suoi tempi
    ia/inseguitore.ts           decide cosa fa un inseguitore (fermo, insegue, torna a casa)
    ia/comportamenti.ts         registro dei comportamenti per nome
    mappa.ts, mondo.ts          (modifica) celle nemico e loro validazione
  data/
    armi.json                   spada di legno
    nemici.json                 slime e lupo
    eroe.json                   (modifica) vita, schivata (velocità, durata, ricarica), invulnerabilità
    mappe/radura.json           (modifica) qualche slime
    mappe/bosco.json            (modifica) slime e lupi
    caricaDati.ts               (rinomina di caricaMappe.ts) mappe + nemici + armi, tutto validato
  entities/
    Comandi.ts                  (modifica) J, Spazio, F8, tasti numerici del pannello
    Eroe.ts                     (modifica) usa la macchina a stati, attacco, schivata, lampeggio
    Nemico.ts                   corpo, vita, mente presa dal registro, respinta
    colori.ts                   conversione dei colori "#rrggbb" per Phaser
  scenes/
    ScenaMondo.ts               (modifica) collega combattimento, morte e ricomparsa
    mondo/GestoreAttacchi.ts    area di colpo dell'eroe contro i nemici
    mondo/gestisciContatti.ts   nemici che toccano l'eroe
    mondo/GruppoNemici.ts       nemici dalle celle della mappa, gruppo fisico e collisioni
    mondo/numeriDanno.ts        numeri che salgono e svaniscono
    ScenaInterfaccia.ts         (modifica) barra della vita, scritta "Sei stato sconfitto"
    ScenaSviluppatore.ts        pannello F8
tests/
  dadi.test.ts, combattimento.test.ts, vita.test.ts, geometria.test.ts,
  statoEroe.test.ts, inseguitore.test.ts, comportamenti.test.ts
  mappa.test.ts, mondo.test.ts, datiMappe.test.ts  (modifica) nemici
docs/lezioni/fase-2.md
dist/gioco.html
```

## Passi in ordine

Per ogni `system`: prima i test, poi il codice.

1. **Tipi e casualità**: `casuale.ts` con un'interfaccia `() => numero tra 0 e 1`, così i test possono "truccare i dadi".
2. **Dadi**: lettura della notazione, errori leggibili ("1d" non valido), tiro.
3. **Vita**: danno, cura, limiti (mai sotto 0 né sopra il massimo), sconfitta.
4. **Combattimento**: formula del danno e del critico del §7.
5. **Geometria**: sovrapposizione di rettangoli, area di colpo nelle quattro direzioni.
6. **Macchina a stati dell'eroe**: transizioni e tempi (attacco, schivata con ricarica, colpito con respinta, invulnerabilità, sconfitto).
7. **Mente dell'inseguitore** e registro dei comportamenti.
8. **Dati**: armi, nemici, celle nemico nelle mappe, validazione; `caricaDati.ts`.
9. **Eroe**: collegamento alla macchina a stati, attacco con area visibile, capriola, lampeggio.
10. **Nemici**: creazione dalla mappa, collisioni con muri e tra loro, inseguimento, respinta.
11. **Combattimento nella scena**: colpi dell'eroe, contatto dei nemici, numeri del danno, tremolio della telecamera.
12. **Morte e ricomparsa**: dissolvenza, messaggio, riavvio della scena all'ingresso con vita piena.
13. **Interfaccia**: barra della vita.
14. **Modalità sviluppatore** (F8).
15. **Verifica**: test, `tsc`, compilazione, prova automatica nel browser (colpire, essere colpiti, schivare, morire e ricomparire, F8).
16. **Consegna**: `dist/gioco.html` e `docs/lezioni/fase-2.md`.

## Test previsti

- **dadi**: "1d6" con il minimo dei casuali dà 1 e con il massimo dà 6; "2d4+1" tra 3 e 9; formati sbagliati danno un errore che cita il testo.
- **vita**: il danno toglie vita; non scende sotto 0; a 0 si è sconfitti; la cura non supera il massimo.
- **combattimento**: danno = dado + modificatore + bonus − armatura; minimo 1 anche contro armature alte; il critico raddoppia; probabilità di critico 5% + 1% per punto di modificatore DES + bonus arma (verificata con casuali scelti a mano).
- **geometria**: rettangoli che si toccano, che non si toccano, che si sfiorano sul bordo; area di colpo davanti all'eroe nelle quattro direzioni, alla distanza giusta.
- **statoEroe**: da `libero` J porta in `attacco` per la durata dell'arma e poi torna `libero`; durante l'attacco non si può schivare; la schivata rende invulnerabili e poi entra in ricarica (Spazio ignorato finché non finisce); un colpo porta in `colpito` con invulnerabilità che dura oltre la respinta; mentre si è invulnerabili un secondo colpo non ha effetto; vita a 0 porta in `sconfitto` da qualsiasi stato.
- **inseguitore**: fuori dal raggio di vista resta fermo; dentro insegue nella direzione giusta; oltre il raggio di abbandono torna verso casa; arrivato a casa si ferma; durante lo stordimento non si muove.
- **comportamenti**: il registro restituisce l'inseguitore; un nome sconosciuto dà errore.
- **mondo/dati**: un nemico in mappa che non esiste in `nemici.json` dà errore; tutti i nemici e le armi reali hanno dadi validi.

## Cose da provare giocando

1. J colpisce davanti: prova nelle quattro direzioni e mentre cammini.
2. Uno slime colpito perde vita (numero bianco), viene respinto, e dopo qualche colpo scompare.
3. Ogni tanto esce un critico (numero giallo, più grande, danno doppio).
4. Lo slime ti insegue solo quando ti avvicini; se scappi lontano torna al suo posto.
5. Toccato da uno slime: perdi vita, vieni respinto, lo schermo trema, lampeggi e per un attimo i nemici non ti fanno nulla.
6. Spazio: capriola veloce; durante la capriola puoi attraversare un nemico senza danni; subito dopo non puoi rifarla.
7. Nel bosco i lupi sono più veloci e fanno più male: la capriola diventa utile.
8. Lasciati sconfiggere: "Sei stato sconfitto", ricompari all'ingresso della zona con la vita piena e i nemici sono di nuovo al loro posto.
9. F8: si apre il pannello. Prova a mostrare le aree di colpo, a diventare invulnerabile, a ripristinare la vita, a teletrasportarti nell'altra mappa e a generare un nemico. F8 lo richiude.
10. Il cambio mappa della fase 1 funziona ancora, anche con i nemici che ti inseguono.

## Concetti nuovi della lezione

Macchina a stati (con paragone con gli stati di una richiesta web: in attesa, caricamento, errore), aree di colpo e corpi (hitbox e hurtbox), invulnerabilità a tempo (i-frames), respinta, intelligenza artificiale dei nemici come funzione "stato del mondo → decisione", registro dei comportamenti (come una mappa di handler per tipo di messaggio), numeri casuali iniettabili per rendere testabile il caso, effetti visivi temporanei con le *tween*.

## Note di sviluppo

- Due nomi di file sono cambiati rispetto all'elenco iniziale: sono diventati classi con un proprio stato. `creaNemici.ts` ora è `GruppoNemici.ts`, `gestisciAttacchi.ts` ora è `GestoreAttacchi.ts`.
- Lo stordimento del nemico colpito è gestito da `entities/Nemico.ts` e non dalla mente dell'inseguitore. Durante lo stordimento il nemico non chiede nulla alla mente e lascia la velocità della respinta. Così ogni comportamento futuro (tiratore, caricatore) ottiene lo stordimento gratis.
- Aggiunta `direzioneDa` in `systems/geometria.ts` (con test): calcola la direzione della respinta.

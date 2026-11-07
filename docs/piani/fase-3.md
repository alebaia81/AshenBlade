# Piano della fase 3: il personaggio

Stato: **approvato** (4 novembre 2026)

## Obiettivo

Dal documento di design (§15, aggiornato): *creazione con le 4 classi e le 6 caratteristiche, esperienza, livelli, punti da assegnare, abilità di classe*, e il passaggio ai **controlli punta e clicca** (§2, §13).

La fase si consegna in **tre parti giocabili**. Dopo ognuna mi fermo e ti lascio provare.

| Consegna | Contenuto |
|---|---|
| **3a – Chi sei** | caratteristiche, classi, creazione del personaggio, armi delle classi in mischia, esperienza, livelli, scheda del personaggio |
| **3b – Punta e clicca** | camminare cliccando con ricerca del percorso (A\*), attaccare cliccando i nemici, capriola col tasto destro, cursore che cambia, barra in basso e icone dei menu |
| **3c – Cosa sai fare** | mana, proiettili (dardi magici, palla di fuoco), le quattro abilità di classe mirate col mouse, nemici non morti |

## Scelte approvate (ora nel design.md)

- **Curva dell'esperienza:** 25 × L × (L − 1) in totale per il livello L (§5). Esperienza dai nemici nei dati: slime 5, lupo 12.
- **Vita:** base della classe + crescita × (livello − 1) + modificatore COS × livello. Guerriero 14 (+6), Chierico 11 (+5), Ladro 10 (+4), Mago 8 (+3) (§6).
- **Punti liberi:** 2, su caratteristiche diverse, nessuna oltre 16 (§5).
- **Nome:** facoltativo, predefinito "Viandante".
- **Scheda del personaggio:** icona del ritratto (scorciatoia C), con il gioco in pausa (§13).
- **Armi:**
  - Guerriero: spada e scudo, 1d8 FOR;
  - Mago: bastone con dardi magici, 1d4 + INT, 1 mana;
  - Ladro: pugnali, 1d4 DES, veloci, +5% critico;
  - Chierico: mazza, 1d6 FOR.
- **Mana:** solo Mago e Chierico. Massimo = base + 2 × modificatore INT; rigenerazione 1/s + 0,25 × modificatore SAG.
- **Abilità:**
  - Parata: 0,6 s, ricarica 3 s;
  - Palla di fuoco: 2d6 + INT entro 24 px, 6 mana, ricarica 2 s;
  - Scatto nell'ombra: 3 s, finisce se attacchi;
  - Cura: 1d8 + 2 × SAG, 5 mana, ricarica 4 s.
- **Ladro:** danno doppio alle spalle, sempre attivo.
- **Chierico:** +1d6 contro i non morti; lo scheletro si aggiunge ai dati e si genera con la modalità sviluppatore.
- **Partita:** oggetto TypeScript puro, fuori dalle scene, con personaggio, livello, esperienza, vita e mana.
- **Modalità sviluppatore:** nuove voci +100 esperienza, sali di livello, genera scheletro.

## Scelte nuove da confermare (controlli col mouse)

| Scelta | Proposta | Perché |
|---|---|---|
| Direzioni di attacco | L'attacco va verso il bersaglio, **arrotondato alle 4 direzioni** (su, giù, sinistra, destra) | Le aree di colpo restano rettangoli dritti (semplici e già testati). Gli sprite stile Zelda della fase 9 hanno di solito 4 direzioni. Si può passare a 8 più avanti. |
| Ricerca del percorso | **A\*** sulla griglia delle tessere, con 8 direzioni ma senza "tagliare gli angoli" dei muri. Il percorso viene poi **lisciato** (si salta dritto ai punti visibili) per evitare il camminare a zig-zag | È l'algoritmo standard dei giochi a tessere. Lisciare il percorso rende il movimento naturale. |
| Clic su un punto non raggiungibile (dentro un albero, nell'acqua) | L'eroe va alla **cella raggiungibile più vicina** | Più comodo che non fare nulla. |
| Tenere premuto | Sul terreno l'eroe segue il cursore (percorso ricalcolato ogni 150 ms); su un nemico lo insegue e attacca a ripetizione | È lo schema di Diablo: evita di dover cliccare a raffica. |
| Inseguire un nemico che si muove | Percorso ricalcolato ogni 250 ms verso la sua posizione; attacca quando l'area di colpo lo raggiunge | Ricalcolare a ogni fotogramma sarebbe uno spreco; 4 volte al secondo basta. |
| Tasto destro | Capriola verso il cursore; il menu del browser col tasto destro viene disattivato sul gioco | Il §13 aggiornato. |
| Cursore | Il cursore del browser cambia con il CSS: freccia, spada sopra un nemico, mano sopra ciò con cui si interagisce (dalla fase 5) | Sono cursori del sistema, nessuna immagine da scaricare. Nella fase 9 si potranno disegnare cursori personalizzati. |
| Segnale del clic | Un piccolo cerchio che si allarga e svanisce dove hai cliccato | Conferma che il clic è stato ricevuto, come in tutti i giochi punta e clicca. |
| Scorciatoie da tastiera | Restano attive quelle esistenti (WASD, J, Spazio, F8) più C | Facoltative, come dice il §13. Se usi la tastiera per camminare, il percorso del mouse si annulla. |
| Barra in basso | In 3b compare con il pulsante della capriola e gli spazi (vuoti) per abilità, arma secondaria e compagno. Si riempiono nelle fasi 3c, 4 e 5 | Così la disposizione dello schermo è definitiva da subito. |
| Icone in alto a destra | Ritratto (scheda), ingranaggio (sviluppatore) già funzionanti; zaino, pergamena e dischetto visibili ma disattivati finché le loro fasi non arrivano | Stessa ragione: l'interfaccia si completa man mano senza spostare nulla. Le icone sono disegnate dal codice (forme semplici), come il resto della grafica fino alla fase 9. |

## File da creare o modificare

```
src/
  systems/
    caratteristiche.ts       modificatore, valori iniziali + punti liberi (con regole), assegnazione punti      [3a]
    livelli.ts               livello dall'esperienza, livelli guadagnati, punti da assegnare                   [3a]
    personaggio.ts           valori derivati: vita e mana massimi, rigenerazione, critico, ricarica schivata   [3a]
    partita.ts               stato della partita e sue operazioni                                              [3a]
    risorsa.ts               (da vita.ts) punti che si consumano e si recuperano: vita e mana                  [3a]
    percorso.ts              A* sulla griglia, cella raggiungibile più vicina, lisciatura del percorso         [3b]
    seguiPercorso.ts         prossimo punto da raggiungere, arrivo, velocità verso il punto                    [3b]
    mira.ts                  direzione verso un bersaglio (4 direzioni), "è a portata?", cosa c'è sotto il clic [3b]
    abilita.ts               ricarica e costo in mana                                                           [3c]
    proiettili.ts            movimento, gittata, esplosione ad area                                             [3c]
    geometria.ts             (modifica) "è alle spalle?", "arriva davanti?"                                     [3c]
    combattimento.ts         (modifica) modificatori veri [3a]; non morti, alle spalle [3c]
    statoEroe.ts             (modifica) stato "parata"                                                          [3c]
  data/
    classi.json, livelli.json                                                                                    [3a]
    armi.json, nemici.json, eroe.json   (modifica)                                                               [3a/3c]
  entities/
    Eroe.ts                  (modifica) classe e caratteristiche [3a]; segue un percorso, attacca un bersaglio [3b]; abilità [3c]
    Comandi.ts               (modifica) mouse + scorciatoie, tutto tradotto in "intenzioni"                     [3b]
    Proiettile.ts, abilita/  (Parata, PallaDiFuoco, ScattoOmbra, Cura)                                          [3c]
  scenes/
    ScenaCreazione.ts        creazione del personaggio, tutta cliccabile                                        [3a]
    ScenaScheda.ts           scheda del personaggio con pulsanti "+", mondo in pausa                            [3a]
    ScenaInterfaccia.ts      (modifica) esperienza e livello [3a]; barra in basso e icone [3b]; mana e ricariche [3c]
    ScenaMondo.ts            (modifica) partita, esperienza [3a]; clic sul mondo, cursore, segnale del clic [3b]
    interfaccia/Pulsante.ts  pulsante riutilizzabile (forma, testo o icona, stato attivo/disattivo)            [3a]
    interfaccia/icone.ts     icone disegnate dal codice (ritratto, zaino, pergamena, dischetto, ingranaggio)   [3b]
    ScenaSviluppatore.ts     (modifica) nuove voci, cliccabili                                                  [3a/3c]
  main.ts                    (modifica) si parte dalla creazione del personaggio                                [3a]
tests/  uno per ogni system nuovo o modificato, più i test sui dati
docs/lezioni/fase-3.md       sezioni 3a, 3b, 3c
```

## Passi in ordine

Per ogni `system`: prima i test, poi il codice.

**3a – Chi sei**

1. `caratteristiche.ts`, `livelli.ts` + `data/livelli.json`, `risorsa.ts`, `personaggio.ts`, `partita.ts`.
2. `combattimento.ts`: modificatore della caratteristica dell'arma e critico con la DES vera.
3. Dati: `classi.json`, armi delle classi, esperienza dei nemici; test sui dati.
4. `Pulsante.ts`, poi `ScenaCreazione`: schede delle 4 classi da cliccare, pulsanti "+"/"−" per i punti liberi, campo nome, "Inizia".
5. Eroe e mondo che leggono la Partita; esperienza alla sconfitta di un nemico; avviso "Livello 2!".
6. `ScenaScheda` (C, o icona del ritratto aggiunta in 3a) con pausa del mondo e pulsanti "+" per i punti.
7. Interfaccia: barra dell'esperienza e livello. Modalità sviluppatore: +100 esperienza, sali di livello, voci cliccabili.
8. Verifica e **consegna 3a**. **Mi fermo.**

**3b – Punta e clicca**

9. `percorso.ts` (A\*), `seguiPercorso.ts`, `mira.ts`.
10. `Comandi.ts`: mouse e tastiera diventano "intenzioni" (vai lì, attacca quel nemico, capriola verso…).
11. Eroe: segue un percorso, insegue e attacca un bersaglio, capriola verso il cursore.
12. Mondo: clic sul terreno o su un nemico, tenere premuto, cursore che cambia, segnale del clic, tasto destro.
13. Interfaccia: barra in basso e icone in alto a destra.
14. Verifica e **consegna 3b**. **Mi fermo.**

**3c – Cosa sai fare**

15. Mana nella Partita, rigenerazione, barra del mana.
16. `proiettili.ts` ed entità `Proiettile`: il Mago clicca un nemico, si ferma a distanza di tiro e lancia dardi.
17. `abilita.ts`; pulsante dell'abilità nella barra (scorciatoia E) con la ricarica visibile.
18. Le quattro abilità, una alla volta: Cura e Scatto nell'ombra (immediate); Parata e Palla di fuoco (mirate col mouse).
19. Scheletro, bonus contro i non morti, voce "genera scheletro".
20. Verifica e **consegna 3c**, lezione completa.

## Test previsti

**3a**
- **caratteristiche**: modificatore di 8 = −1, 10 e 11 = 0, 15 = +2, 20 = +5; creazione con esattamente 2 punti liberi su caratteristiche diverse; errore con 3 punti, con 2 punti sulla stessa caratteristica o con un valore oltre 16; assegnare un punto senza punti disponibili dà errore.
- **livelli**: 0 esperienza = livello 1; 49 = 1; 50 = 2; 9.500 = 20; oltre resta 20; da 40 a 160 si guadagnano 2 livelli e 2 punti; il file ha 20 soglie crescenti.
- **risorsa**: consumo, recupero fino al massimo, "basta per…?".
- **personaggio**: vita del Guerriero al livello 1 con COS 14 = 14 + 2; al livello 3 = 14 + 2 × 6 + 3 × 2; il Guerriero non ha mana; ricarica della capriola più breve con DES alta (con un minimo); critico 5% + DES; modificatore dell'arma secondo la sua caratteristica.
- **partita**: creazione con vita piena; salendo di livello vita massima e attuale crescono insieme; un punto in COS aumenta subito la vita massima.
- **combattimento**: danno con il modificatore FOR o DES dell'arma.
- **dati**: ogni classe ha 6 caratteristiche, un'arma esistente e un'abilità nota; ogni nemico dà esperienza.

**3b**
- **percorso**:
  - in campo aperto il percorso è dritto;
  - aggira un muro;
  - non taglia gli angoli tra due muri in diagonale;
  - restituisce "nessun percorso" se la destinazione è chiusa;
  - un clic dentro un muro porta alla cella raggiungibile più vicina;
  - la lisciatura toglie i punti intermedi inutili ma non attraversa i muri;
  - i percorsi sulle mappe vere si calcolano in pochi millisecondi.
- **seguiPercorso**: si passa al punto successivo quando si arriva vicino; a fine percorso ci si ferma; la velocità punta verso il punto attuale.
- **mira**: direzione verso il bersaglio arrotondata alle 4 direzioni (anche nei casi a 45°); "a portata" con l'area di colpo dell'arma.

**3c**
- **abilita**: pronta all'inizio; dopo l'uso non pronta fino alla fine della ricarica; senza mana non si usa e non consuma nulla.
- **proiettili**: avanza nella direzione giusta; sparisce oltre la gittata o contro un muro; esplosione: nel raggio sì, sul bordo e fuori no.
- **geometria**: alle spalle, di lato e di fronte rispetto a dove guarda il nemico.
- **combattimento**: +1d6 contro i non morti solo per il Chierico; danno doppio alle spalle solo per il Ladro.
- **statoEroe**: la parata dura il tempo previsto; durante la parata non si attacca e non si schiva.

## Cose da provare giocando

**3a**
1. All'avvio compare la creazione: clicca le 4 classi e guarda come cambiano caratteristiche, vita e arma.
2. Prova a mettere 2 punti sulla stessa caratteristica: il pulsante si disattiva. Mettine 1 in FOR e 1 in COS, scrivi un nome, clicca "Inizia".
3. Colore dell'eroe e arma (portata, velocità, danni) cambiano con la classe: prova almeno Guerriero e Ladro.
4. Sconfiggi slime e lupi: la barra dell'esperienza cresce; al livello 2 compare l'avviso e la vita massima aumenta.
5. Apri la scheda (ritratto o C): il gioco si ferma, assegna il punto con "+", chiudi.
6. Con la modalità sviluppatore dai +100 esperienza più volte: più livelli, un punto per livello.

**3b**
7. Clicca sul terreno: l'eroe ci va aggirando alberi e acqua, senza zig-zag. Il cerchio indica dove hai cliccato.
8. Clicca dall'altra parte del muro di pietra: l'eroe passa dal varco da solo.
9. Clicca dentro il laghetto: l'eroe si ferma sulla riva più vicina.
10. Tieni premuto e muovi il mouse: l'eroe segue il cursore.
11. Passa sopra uno slime: il cursore diventa una spada. Cliccalo: l'eroe lo raggiunge e colpisce; tenendo premuto continua.
12. Tasto destro: capriola verso il cursore, e nessun menu del browser.
13. Le icone del ritratto e dell'ingranaggio funzionano; zaino, pergamena e dischetto sono visibili ma spenti.
14. WASD e J funzionano ancora come scorciatoie.

**3c**
15. Mago: clicca un lupo lontano, l'eroe si ferma a distanza e lancia dardi che consumano mana; a mana zero non partono e il mana si ricarica.
16. Mago: pulsante della palla di fuoco, poi clic su un gruppo di slime: esplode e li colpisce tutti.
17. Guerriero: parata verso il cursore: un lupo che attacca davanti non fa danno ed è respinto; da dietro sì.
18. Ladro: scatto nell'ombra, i nemici ti perdono; colpendo un lupo alle spalle vedi il danno doppio.
19. Chierico: cura (vita su, mana giù); genera uno scheletro e confronta i danni con uno slime.
20. Ogni pulsante di abilità mostra la ricarica e non si può riusare prima.

## Concetti nuovi della lezione

Dati derivati (come le proprietà calcolate o i selettori), stato della partita fuori dalle scene (come uno store globale), interfacce di gioco cliccabili, pausa di una scena, curve di progressione, **ricerca del percorso A\*** (con un paragone con la ricerca del percorso più breve di un navigatore), coordinate dello schermo e del mondo (dal pixel cliccato alla tessera), input come "intenzioni" (separare il dispositivo dall'azione), proiettili, abilità con ricarica e costo, composizione di comportamenti.

## Note di sviluppo

**3a**
- Il campo del nome legge la tastiera con l'evento `keydown` del browser invece che con quello di Phaser: quest'ultimo, sotto carico, a volte consegnava due volte lo stesso tasto (scoperto dalla prova nel browser, corretto nella 3b).
- Le prove nel browser fanno parte del progetto: `tests/browser/` (vedi `LEGGIMI.md`). Le schermate stanno in `docs/schermate/`.

**3b**
- Le intenzioni del mouse le gestisce `scenes/mondo/GuidaEroe.ts`, non `entities/Comandi.ts`. `Comandi.ts` resta la sola tastiera; la guida mette insieme le due cose e produce i `ComandiEroe` (al posto di `ComandiFotogramma`).
- Nuovo `scenes/interfaccia/cursori.ts` (cursore a spada in SVG, senza file esterni).
- In modalità sviluppatore, con "Aree di colpo e corpi" attivo, si vede anche il percorso scelto da A*.
- La telecamera del mondo si ferma sopra la barra in basso (`setViewport`), così la barra non copre la mappa.

**3c**
- Scatto nell'ombra: il piano non indicava la ricarica; scelta 6 secondi (nei dati, `classi.json`).
- I danni dell'eroe (fendente, dardo, palla di fuoco) passano tutti da `scenes/mondo/Combattimento.ts`, che applica anche le passive. `GestoreAttacchi` ora si occupa solo di "chi tocca l'area di colpo".
- Le abilità stanno in `scenes/mondo/abilita/` (una funzione per abilità e un registro), non in `entities/abilita/` come scritto nel piano: non sono oggetti del mondo ma effetti.
- La ricarica dell'abilità è conservata nel registro, così non si azzera cambiando mappa.

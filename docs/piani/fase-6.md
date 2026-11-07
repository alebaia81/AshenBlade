# Piano della fase 6: crafting

Stato: **approvato** · 6a e 6b consegnate · fase completata

## Obiettivo

Dal documento di design (§15): *materiali, ricette, fabbro, potenziamenti*. Dettagli nel §9: *il fabbro crea armi da ricette con materiali raccolti da nemici, forzieri e minerali; le ricette si trovano come pergamene o si comprano; potenziamento delle armi da +1 a +5*. Dal §8: le **leggendarie** si possono creare con i materiali dei boss, le **esotiche** mai.

Alla fine della fase:

- esistono i **materiali**: si impilano nello zaino e si vendono da Gemma. Ne lasciano i nemici (pelle di lupo, gelatina di slime, ossa antiche) e si estraggono dalle **vene** di minerale nelle zone aperte (minerale di ferro, carbone);
- Bruno riapre la **fucina**: cliccandolo e scegliendo "Lavoriamo" si apre la schermata del fabbro;
- nella fucina, sotto **Crea**, ci sono le **ricette conosciute**, con i materiali che hai e quelli che mancano;
- nuove ricette si imparano usando una **pergamena** (trovata in un forziere o comprata da Gemma);
- sotto **Potenzia** un'arma sale da +1 a +5: più danno, e il nome diventa "Spada lunga +2".

## Proposta: due consegne

| Consegna | Contenuto |
|---|---|
| **6a – Materiali e ricette** | materiali, bottino dei nemici, vene da estrarre, pergamene, la fucina di Bruno con la scheda "Crea" |
| **6b – Potenziamenti** | da +1 a +5, scheda "Potenzia", danno in più, potenziare anche l'arma che hai in mano |

## Scelte da confermare

| Scelta | Proposta | Perché |
|---|---|---|
| La forgia di Bruno | Bruno la **riaccende subito**: il suo dialogo cambia ("Ho trovato un po' di carbone…") e offre "Lavoriamo". Portargli il carbone della miniera diventerà una **quest** nella fase 7 | Una quest vera richiede il sistema delle quest (fase 7): fingerla adesso vorrebbe dire scriverla due volte. |
| Materiali | **Minerale di ferro**, **carbone**, **pelle di lupo**, **gelatina di slime**, **osso antico**. Nei dati anche il **cristallo della miniera** e il **frammento della corona** (dal Re Scheletro), che si troveranno nella fase 8 | I primi cinque si trovano già nelle mappe di oggi; gli altri due servono alle ricette più forti e ai potenziamenti alti. |
| Vene di minerale | Nuove celle nella mappa (`"tipo": "vena"`), nel bosco e nella Radura. **Clic sulla vena**: l'eroe ci va, scava per mezzo secondo e cadono 1–2 pezzi. Poi la vena è **esaurita** finché non torni nella zona, come i nemici che ricompaiono (§11) | Si gioca col mouse come tutto il resto, e non serve un piccone da equipaggiare. |
| Bottino dei nemici | Slime → gelatina (30%), lupo → pelle (40%), scheletro → osso antico (40%) | Probabilità nei dati, facili da ribilanciare. |
| Ricette all'inizio | Bruno ne conosce **tre**: Spada lunga, Balestra e Pugnali da lancio (armi già esistenti, così il crafting si prova subito) | Il §9 dice che le ricette "si trovano o si comprano": qualcuna di base serve per cominciare. |
| Pergamene | Un oggetto **"Pergamena: …"**. *Usarla* dallo zaino insegna la ricetta e la consuma. Una nel **forziere nascosto del bosco** (Arco del cacciatore, nuova arma rara), una in vendita da Gemma (Mazza del gelo). Nei dati anche una ricetta **leggendaria** (Spada dell'eroe, con il frammento della corona) per la fase 8 | Come chiede il §9. La leggendaria mostra già ora come i materiali dei boss si useranno. |
| Costo di una ricetta | Materiali **più qualche moneta** (il lavoro di Bruno). Esempio: Spada lunga = 3 ferro + 1 carbone + 20 monete | Senza un costo in monete i materiali diventerebbero l'unica valuta. |
| Cosa si crea | Solo **armi**, come nel §9. Il formato delle ricette permette di aggiungere più avanti anche armature, senza codice nuovo | Restiamo fedeli al design; se vuoi le armature, basta dirlo e le aggiungo ai dati. |
| Potenziamenti: come funzionano | Ogni livello dà **+1 al danno** (è il "bonus di potenziamento" della formula del §7, finora sempre 0). L'arma potenziata è un **oggetto a sé**: "Spada lunga +2" ha il suo id (`spada_lunga+2`), creato in automatico per ogni arma | Così zaino, equipaggiamento, barra dei preferiti e negozio funzionano senza modifiche. Dettaglio da sviluppatore: vedi la lezione. |
| Costo dei potenziamenti | **+1** ferro e monete, **+2** e **+3** anche carbone, **+4** e **+5** anche il **cristallo della miniera** (fase 8). Le monete crescono con il livello e con la rarità dell'arma | I due livelli più alti restano un obiettivo per dopo i dungeon. In questa fase si provano con la modalità sviluppatore. |
| Esotiche | **Si possono potenziare**, ma **non creare** | Il §8 vieta di crearle col crafting, non di migliorarle. |
| Prezzo di vendita | Un'arma potenziata vale il **20% in più** per livello | Altrimenti potenziare e rivendere farebbe perdere tutto. |

## File da creare o modificare

```
src/
  systems/
    crafting.ts        ricette conosciute, cosa manca, creare (materiali + monete → arma), imparare da una pergamena   [6a]
    potenziamento.ts   costo di ogni livello, id dell'arma potenziata, potenziare (anche quella in mano)             [6b]
    tipi.ts, mappa.ts, oggetti.ts  (modifica) celle "vena", oggetti "materiale" e "pergamena"
    partita.ts         (modifica) ricette conosciute
  data/
    oggetti.json       (modifica) materiali e pergamene                                                         [6a]
    ricette.json       le ricette: risultato, materiali, monete, se è conosciuta dall'inizio                     [6a]
    potenziamenti.json costo di ogni livello                                                                    [6b]
    armi.json          (modifica) "Arco del cacciatore"; le varianti +1…+5 le crea caricaDati                    [6a, 6b]
    nemici.json, mappe/*.json, negozio.json, dialoghi.json  (modifica) bottino, vene, pergamena da Gemma, Bruno
  entities/
    Vena.ts            la vena nel mondo: piena, esaurita                                                        [6a]
  scenes/
    ScenaFucina.ts     due schede: Crea (6a) e Potenzia (6b)
    ScenaMondo.ts      (modifica) vene, scavare, apri("fucina")
tests/  crafting, potenziamento, dati (ogni ricetta usa oggetti esistenti, nessuna esotica creabile…);
        tests/browser/fase-6a.cjs e fase-6b.cjs
```

## Passi in ordine

**6a – Materiali e ricette**

1. `crafting.ts` (test prima): cosa manca per una ricetta, creare (tutto o niente, come il negozio), imparare da una pergamena.
2. Dati: materiali, pergamene, ricette, bottino; validazione.
3. Vene nelle mappe e nel mondo: clic, scavo, materiali a terra, vena esaurita.
4. Bruno: dialogo nuovo e `ScenaFucina` con la scheda "Crea".
5. Pergamene: "Usa" nello zaino insegna la ricetta.
6. Verifica, prova nel browser, schermate, lezione 6a. **Mi fermo.**

**6b – Potenziamenti**

7. `potenziamento.ts` (test prima): costi, id delle varianti, potenziare un'arma nello zaino o in mano (e aggiornare la barra dei preferiti).
8. Varianti +1…+5 create da `caricaDati`, bonus di potenziamento nel danno.
9. Scheda "Potenzia" nella fucina.
10. Verifica, prova nel browser, schermate, lezione completa.

## Test previsti

- **crafting:**
  - con tutti i materiali: i materiali scendono, le monete scendono, l'arma entra nello zaino;
  - materiali o monete insufficienti, oppure zaino pieno: rifiutato e nulla cambia;
  - l'elenco "cosa manca" è giusto;
  - una ricetta non conosciuta non si può creare;
  - usare una pergamena insegna la ricetta (e una seconda volta dice "già conosciuta" senza consumarla).
- **potenziamento:**
  - l'id da `spada` a `spada+1`, fino al massimo +5;
  - i costi crescono con il livello e con la rarità;
  - potenziare l'arma in mano cambia l'equipaggiamento e i collegamenti nei preferiti;
  - oltre +5: rifiutato.
- **dati:**
  - ogni ricetta usa oggetti esistenti;
  - nessuna esotica si può creare;
  - ogni materiale si trova da qualche parte (nemico, vena o forziere);
  - le ricette iniziali sono tre;
  - le varianti +1…+5 esistono per ogni arma e hanno il bonus giusto.

## Cose da provare giocando (6a)

1. Nel bosco o nella Radura passa sopra una **vena** di minerale: il cursore è una mano. Clicca: l'eroe scava e cadono minerale di ferro o carbone. La vena diventa scura (esaurita) finché non torni nella zona.
2. Sconfiggi lupi e slime: a volte lasciano pelle o gelatina.
3. Parla con Bruno: la forgia è accesa, scegli "Lavoriamo".
4. Scheda **Crea**: le tre ricette di base, con i materiali che hai e quelli che mancano (in rosso). Crea una Spada lunga.
5. Apri il forziere nascosto del bosco: c'è la pergamena dell'Arco del cacciatore. Usala dallo zaino: la ricetta compare nella fucina.
6. Gemma vende la pergamena della Mazza del gelo.

## Note di sviluppo (6a)

- **Vene:**
  - Radura: ferro (colonna 27, riga 7, contando da 1) e carbone (colonna 27, riga 20), dentro la fila di rocce;
  - bosco: ferro (colonna 14, riga 4) e carbone (colonna 17, riga 22), accanto al sentiero;
  - ognuna dà 1–2 pezzi, che cadono ai piedi dell'eroe e si raccolgono subito.
- **Ricette:**
  - di base: Spada lunga (3 ferro, 1 carbone, 20 monete), Balestra (2 ferro, 2 pelle di lupo, 25), Pugnali da lancio (2 ferro, 10);
  - da pergamena: Arco del cacciatore (nuova arma rara: 3 pelle, 1 ferro, 2 gelatina, 40), Mazza del gelo (3 ferro, 3 gelatina, 1 carbone, 40), Spada dell'eroe (leggendaria: 5 ferro, 3 carbone, 1 frammento della corona, 120).
- **Gemma** vende la pergamena della Mazza del gelo al posto della Balestra, che ora si crea dal fabbro (così la lista resta di 16 oggetti).
- **Il forziere nascosto del bosco** contiene anche la pergamena dell'Arco del cacciatore.
- **Modalità sviluppatore:** nuova voce "Dai materiale o pergamena…".
- **Bug trovato dalla prova nel browser e corretto:** i pezzi delle vene a volte non venivano raccolti (cadevano troppo lontano dall'eroe).
- **Prove nel browser:** `fase-6a.cjs` 19 su 19; tutte le precedenti ripassano (3a–5c).

## Cose da provare giocando (6b)

1. Parla con Bruno, "Lavoriamo", scheda **Potenzia**: in cima l'arma che hai in mano, poi quelle dello zaino.
2. Scegli un'arma: a destra il danno di adesso e quello dopo, i materiali (verde/rosso) e le monete. Clicca **Potenzia**.
3. Chiudi la fucina e combatti: il danno minimo è salito di uno per livello. Se l'arma era nella barra dei preferiti, il tasto la segue.
4. Nello zaino la descrizione dice "Potenziamento +N"; da Gemma vale di più.
5. Dal +4 serve il cristallo della miniera (fase 8): con la modalità sviluppatore (F8 → Dai materiale…) puoi provarlo già ora.

## Note di sviluppo (6b)

- **Costi** (`data/potenziamenti.json`): +1 1 ferro e 15 monete; +2 2 ferro, 1 carbone, 30; +3 3 ferro, 2 carbone, 60; +4 4 ferro, 2 carbone, 1 cristallo, 100; +5 5 ferro, 3 carbone, 2 cristalli, 160. Monete × rarità: comune 1, non comune 1,5, rara 2, leggendaria 3, esotica 4.
- **Prezzo** delle varianti: +20% per livello.
- La modalità sviluppatore elenca solo le armi base (le varianti sarebbero 6 righe per arma).
- L'elenco della fucina mostra al massimo 7 armi; con di più c'è una nota in fondo.
- **Bug trovato e corretto:** il compagno in mischia non colpiva un nemico in diagonale (portata misurata da centro a centro). Ora si misura dal bordo del nemico.
- **Prove nel browser rese stabili:** 3b (l'eroe a volte camminava già prima del clic) e 5c (Corrado respingeva il lupo prima del morso da parare).
- **Prove nel browser:** `fase-6b.cjs` 20 su 20; tutte le precedenti ripassano (3a–6a).

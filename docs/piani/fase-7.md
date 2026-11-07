# Piano della fase 7: quest

Stato: **approvato** · 7a e 7b consegnate · fase completata

## Obiettivo

Dal documento di design (§15): *quest principale e secondarie, registro*. Dettagli nel §11: *quest secondarie di tipi riutilizzabili definiti nei dati (elimina nemici, raccogli oggetti, consegna, trova un tesoro); chi ha una quest mostra un punto esclamativo; un registro tiene traccia dei progressi*. Gli agganci per le secondarie sono nel §3. Dal §5: il **Carisma** aumenta le ricompense.

Alla fine della fase:

- sopra chi ha una quest per te compare un **punto esclamativo**; quando hai finito, un **punto interrogativo** ti dice a chi tornare;
- le quest si accettano e si consegnano **parlando**, con risposte che compaiono solo quando servono;
- l'icona della **pergamena** (o il tasto L) apre il **registro**: quest attive e concluse, obiettivi e progressi ("Lupi: 2 / 4");
- quando un obiettivo avanza compare un avviso ("Lupi sconfitti: 3 / 4");
- ci sono le **cinque quest secondarie** e il **primo tratto della quest principale** (Atto I, fino al cancello della cripta, che si apre nella fase 8).

## Proposta: due consegne

| Consegna | Contenuto |
|---|---|
| **7a – Il sistema delle quest** | regole delle quest, dialoghi con condizioni, `!` e `?` sopra le persone, registro, avvisi, ricompense. Quest: *elimina* (i lupi di Dario), *raccogli* (le erbe di frate Anselmo), il carbone di Bruno |
| **7b – Il mondo si allarga** | due mappe nuove (**Cimitero sulla collina** e **Colline Grigie**), quest principale Atto I, *consegna* (la lettera di Bruno), *trova un tesoro* (la mappa del cavaliere) |

## Scelte da confermare

| Scelta | Proposta | Perché |
|---|---|---|
| Come sono fatte | Una quest è una **lista di passi**, ognuno con un obiettivo di un tipo fisso: `elimina`, `raccogli`, `consegna`, `trova`, più `raggiungi` (arriva in un posto) e `parla` (parla con qualcuno), che servono alla principale. Tutto in `data/quest.json` | Come chiede il §11: una quest nuova si scrive nei dati. Un *tipo* di obiettivo nuovo invece richiede codice, come gli effetti delle armi. |
| Ciclo di vita | **non disponibile → disponibile (`!`) → attiva → pronta (`?`) → conclusa**. Una quest può richiederne un'altra già conclusa | Cinque stati chiari, facili da testare e da mostrare nel registro. |
| Accettare e consegnare | **Nel dialogo**: le risposte possono avere una **condizione** ("solo se la quest è disponibile") e un'**azione** ("accetta", "consegna"). Nessuna finestra in più | Si gioca parlando, come il negozio e la taverna. Scrivere dialoghi resta lavoro sui dati. |
| Rifiutare | Si può dire "Non ora": la quest resta disponibile | Nessuna scelta irreversibile per sbaglio. |
| "Raccogli" | Il progresso è **quanti ne hai nello zaino** in quel momento. Alla consegna vengono tolti | Se vendi le erbe, il conteggio scende: niente trucchi, e niente oggetti "di quest" speciali. |
| "Elimina" | Contano i nemici sconfitti **dopo** aver accettato, anche quelli abbattuti dal compagno | Contare quelli di prima toglierebbe senso alla quest. |
| Ricompense | Monete, esperienza ed eventualmente un oggetto. Le monete crescono del **5% per punto di modificatore CAR** (al massimo +25%), come i prezzi da Gemma | Dal §5. Stessa regola del negozio: una sola idea da imparare. |
| Zaino pieno alla consegna | L'oggetto di ricompensa **cade a terra** ai piedi dell'eroe | Come il bottino: non si perde nulla e la consegna non si blocca. |
| Le secondarie | 1. **I lupi di Dario** (*elimina* 4 lupi): Dario, pastore nuovo, nella Radura con il suo recinto.<br>2. **Le erbe di frate Anselmo** (*raccogli* 5 erbe): nuovi **cespugli di erbe** nel bosco, si raccolgono con un clic come le vene.<br>3. **Il carbone di Bruno** (*raccogli* 5 carbone): promessa nel piano della fase 6. Ricompensa: la pergamena dell'Arco lungo.<br>4. **La lettera di Bruno** (*consegna*): al fratello **Ugo**, rifugiato in un accampamento nelle Colline Grigie.<br>5. **La mappa del cavaliere** (*trova un tesoro*): Gemma vende una mappa; usandola si apre un disegno con una **X** e inizia la quest. Il tesoro è dietro un muro segreto nelle Colline Grigie: la **Spada del cavaliere** (nuova arma rara) | I quattro agganci del §3, più quella del carbone già promessa. |
| Quest principale (Atto I) | Passi di questa fase: **parla con la sindaca Berta** → **raggiungi il cimitero sulla collina** (in fondo al bosco) → **torna da Berta**, che ti dà la **chiave della cripta**. Il passo successivo, "Scendi nella Cripta dei Non Morti", compare nel registro ma il cancello resta sbarrato fino alla fase 8 | La storia comincia adesso, e la fase 8 deve solo aggiungere i passi che mancano nei dati. |
| Mappe nuove | **Cimitero sulla collina**: piccolo, in fondo al sentiero del bosco, con scheletri e il cancello della cripta. **Colline Grigie**: dalla Radura verso sud, lupi, l'accampamento di Ugo e il muro segreto del cavaliere. La strada per la miniera è segnata ma chiusa da una frana fino alla fase 8. I **banditi** arrivano con la fase 8 | Il §3 mette il cimitero oltre il bosco e il fratello "oltre le colline". Il §11 chiede un mondo che cresce aggiungendo mappe. |
| Registro | Pannello come lo zaino: a sinistra l'elenco (prima la principale, poi le attive, in fondo le concluse in grigio), a destra descrizione, passi (fatti ✔ / da fare) e ricompensa. Icona della pergamena nella barra in alto, scorciatoia **L** | Dal §13. L'icona c'è già, oggi è spenta. |
| Indicatori | `!` giallo = quest disponibile, `?` giallo = quest pronta da consegnare, `?` grigio = quest attiva ma non finita. Sopra le persone, e anche sulla minimappa se c'è spazio | Convenzione dei giochi di ruolo, si legge al volo. |
| Salvataggio | Lo stato delle quest sta nella Partita, quindi verrà salvato con tutto il resto nella fase 9 | Nessun lavoro doppio. |

## File da creare o modificare

```
src/
  systems/
    quest.ts           stati, accettare, avanzare con gli eventi (nemico sconfitto, posto raggiunto,
                       persona incontrata, forziere aperto), progresso, consegnare, ricompensa con CAR,
                       indicatore sopra una persona, validazione                                          [7a]
    dialoghi.ts        (modifica) condizioni e azioni sulle risposte, validazione                          [7a]
    partita.ts         (modifica) stato delle quest                                                        [7a]
    mappa.ts, tipi.ts  (modifica) celle "raccoglibile" (vene ed erbe), zone da raggiungere                 [7a, 7b]
  data/
    quest.json         le quest                                                                            [7a, 7b]
    dialoghi.json, abitanti.json  (modifica) Dario, Ugo, risposte delle quest                              [7a, 7b]
    oggetti.json       (modifica) erbe, lettera, mappa del tesoro, chiave della cripta                     [7a, 7b]
    armi.json          (modifica) Spada del cavaliere                                                      [7b]
    mappe/cimitero.json, mappe/colline.json   nuove; radura.json e bosco.json (modifica) uscite, Dario, erbe [7a, 7b]
  entities/
    Vena.ts            (modifica) diventa "raccoglibile": roccia o cespuglio, stesso comportamento          [7a]
    Abitante.ts        (modifica) il simbolo ! o ? sopra la testa                                          [7a]
  scenes/
    ScenaRegistro.ts   il registro delle quest                                                             [7a]
    ScenaMappaTesoro.ts il disegno della mappa del cavaliere                                               [7b]
    ScenaDialogo.ts    (modifica) mostra solo le risposte valide, esegue le azioni                         [7a]
    ScenaMondo.ts      (modifica) manda gli eventi alle quest, avvisi, ricompense                          [7a]
    ScenaInterfaccia.ts (modifica) icona della pergamena attiva                                            [7a]
tests/  quest, dialoghi (condizioni), dati (ogni quest usa nemici, oggetti, persone e mappe esistenti);
        tests/browser/fase-7a.cjs e fase-7b.cjs
```

## Passi in ordine

**7a – Il sistema delle quest**

1. `quest.ts` (test prima): ciclo di vita, eventi, progressi, consegna, ricompense con CAR.
2. Dialoghi con condizioni e azioni (test prima), e la loro validazione.
3. Dati: le tre quest, Dario e il recinto nella Radura, i cespugli di erbe nel bosco; validazione.
4. Nel mondo: eventi alle quest, `!` e `?`, avvisi, ricompense (anche a terra con lo zaino pieno).
5. Registro (icona e tasto L). Modalità sviluppatore: "Completa la quest attiva".
6. Verifica, prova nel browser, schermate, lezione 7a. **Mi fermo.**

**7b – Il mondo si allarga**

7. Mappe del Cimitero e delle Colline Grigie, collegate a bosco e Radura.
8. Quest principale Atto I (`parla`, `raggiungi`), chiave della cripta, cancello sbarrato.
9. Lettera di Bruno (`consegna`) e mappa del cavaliere (`trova`) con la sua schermata.
10. Verifica, prova nel browser, schermate, lezione completa.

## Test previsti

- **quest:**
  - una quest con un requisito non concluso non è disponibile; dopo sì;
  - accettare porta allo stato attivo; accettarla due volte non cambia nulla;
  - *elimina*: contano solo i nemici del tipo giusto, solo dopo averla accettata; arrivati al numero la quest è pronta;
  - *raccogli*: il progresso segue lo zaino (sale e scende); alla consegna gli oggetti vengono tolti; senza abbastanza oggetti la consegna è rifiutata e nulla cambia;
  - *consegna*: si conclude parlando con la persona giusta e togliendo l'oggetto;
  - *raggiungi*, *parla*, *trova*: l'evento giusto fa avanzare il passo, quello sbagliato no;
  - una quest a più passi avanza un passo alla volta;
  - ricompensa: monete con il bonus del Carisma (anche negativo, con i limiti), esperienza, oggetto;
  - indicatore sopra una persona: `!`, `?` giallo, `?` grigio o niente.
- **dialoghi:** le risposte con condizione compaiono solo quando la condizione è vera; un'azione su una quest che non esiste è un errore di validazione.
- **dati:** ogni quest cita nemici, oggetti, persone, mappe e forzieri esistenti; ogni quest si può accettare da qualche dialogo; ogni requisito è una quest che esiste.

## Cose da provare giocando (7a)

1. Nel borgo e nella Radura: chi ha una quest per te ha un `!` sopra la testa.
2. Parla con Dario nella Radura, accetta "I lupi di Dario". Apri il registro (pergamena o L).
3. Nel bosco sconfiggi 4 lupi: a ogni lupo un avviso, poi il `?` giallo sopra Dario. Torna da lui per la ricompensa.
4. Frate Anselmo: raccogli 5 erbe dai cespugli del bosco. Prova a venderne una da Gemma: il registro torna indietro.
5. Bruno: portagli 5 carbone e ricevi la pergamena dell'Arco lungo.

## Note di sviluppo (7a)

- **Dario** sta nella Radura (colonna 30, riga 22, contando da 1), accanto al recinto con le pecore, a est della fila di rocce.
- **Cespugli di erbe** nel bosco: 6, ognuno dà 1–2 erbe e ricresce rientrando nella zona.
- **Ricompense:** Dario 40 monete, 60 esperienza, pozione di forza; Anselmo 30 monete, 40 esperienza, 2 pozioni di vita; Bruno 10 monete, 30 esperienza, pergamena dell'Arco lungo (nuova ricetta: 2 ferro, 2 pelle di lupo, 1 carbone, 35 monete).
- Accettando o concludendo una quest, nel riquadro del dialogo compare una riga verde con il risultato (l'avviso in basso restava coperto).
- **Modalità sviluppatore:** "Quest attive: completa i passi" (per *raccogli* regala gli oggetti mancanti).
- **Registro:** icona della pergamena o L; mostra i passi già fatti e quello di adesso, non quelli futuri.
- La prova 3b usava la pergamena come "icona spenta": ora usa il dischetto.
- **Prove nel browser:** `fase-7a.cjs` 29 su 29; tutte le precedenti ripassano (3a–6b).

## Cose da provare giocando (7b)

1. Parla con la sindaca Berta ("Sono pronto: che lavoro hai per me?"): parte «Atto I: il cimitero sulla collina».
2. Vai in fondo al sentiero del bosco, verso sud: c'è il **Cimitero sulla collina**, con tre scheletri. Clicca il cancello della cripta.
3. Torna da Berta: ti dà la **chiave della cripta**. Nel registro vedi già il capitolo dopo, sbarrato. Riprova il cancello con la chiave.
4. Concluso il carbone, Bruno ti affida una **lettera** per il fratello Ugo. Le **Colline Grigie** sono a sud della Radura (uscita in basso). Ugo ha il suo accampamento lì.
5. Nelle Colline: clicca la frana a est e il cartello della miniera.
6. Compra da Gemma la **Mappa del cavaliere**, usala dallo zaino e cerca la X: il muro che non è un muro è nell'angolo a nord-ovest.

## Note di sviluppo (7b)

- **Cimitero sulla collina** (26×18): uscita in fondo al bosco (colonna 23). 3 scheletri, tombe, la cripta con il cancello (un "cartello" con aspetto "cancello").
- **Colline Grigie** (32×24): uscita sul bordo sud della Radura (colonna 17). 4 lupi, l'accampamento di Ugo, la frana e il cartello verso la miniera, il muro segreto con il forziere del cavaliere (Spada del cavaliere, rara, 1d10 e +5% di critico, più 50 monete).
- Nel bosco un lupo è stato spostato: era troppo vicino al nuovo ingresso (il test sui dati l'ha segnalato).
- **Gemma** vende la Mappa del cavaliere al posto degli stivali di cuoio (la lista resta di 16).
- **Oggetti di missione** (lettera, chiave): non si vendono e non si gettano.
- **Ricompense:** Berta 50 monete, 100 esperienza, chiave; Ugo 30 monete, 50 esperienza, pozione di resistenza; tesoro 80 esperienza (più il contenuto del forziere).
- Se il forziere del cavaliere era già stato aperto prima di usare la mappa, la quest si chiude subito.
- **Prove nel browser:** `fase-7b.cjs` 28 su 28; le precedenti ripassano. La 3a una volta su tre falliva il controllo "Livello 3!": nella 8a si è capito che uno slime a volte morde l'eroe durante la prova (vita non più 21/21). Corretta la prova nella 8a.

# Piano della fase 8: dungeon e boss

Stato: **approvato** · 8a, 8b e 8c consegnate · fase completata

## Obiettivo

Dal documento di design (§15): *i 3 dungeon completi con i loro boss*. Dettagli:

- §3: la trama in tre atti, i dungeon con i loro nemici, i boss e le loro meccaniche, le quattro zone aperte;
- §7: comportamenti dei nemici riutilizzabili (inseguitore, **tiratore a distanza**, **caricatore**); boss **a fasi**, che sotto metà vita cambiano schema;
- §8: leggendarie dai boss e con i loro materiali; **al massimo un'esotica nascosta per dungeon**, più una piccola probabilità dai boss;
- §10: il Ladro (Volpe) apre i **forzieri chiusi a chiave**;
- §11: più stanze, **chiavi e porte chiuse**, muri segreti, un tesoro nascosto, la stanza del boss; difficoltà crescente; i nemici normali ricompaiono, **i boss no**; ogni boss sconfitto sblocca il dungeon successivo;
- §12: morendo si ricompare all'ingresso della zona, senza penalità.

Alla fine della fase si può giocare la storia **dall'inizio alla fine**: tre dungeon, tre boss, il finale, e il mondo che resta aperto per le quest rimaste.

## Proposta: tre consegne, una per atto

| Consegna | Contenuto |
|---|---|
| **8a – La Cripta dei Non Morti** | porte e chiavi, forzieri chiusi a chiave, boss a fasi con la barra della vita, nuovi nemici (zombie, pipistrelli), il **Re Scheletro**; Atto I fino alla verità di frate Anselmo |
| **8b – La Miniera dei Goblin** | nemici **tiratori** e **caricatori**, i banditi nelle Colline Grigie, la frana che si libera, le vene di cristallo, il **Troll delle Caverne**; Atto II fino alla Quercia ferita |
| **8c – La Torre del Negromante** | la **Brughiera della Torre**, cultisti, spettri e golem, **il Negromante**; la notte della luna nera, il finale, il mondo che resta aperto |

Ogni consegna si ferma per la prova, come sempre.

## Scelte da confermare

| Scelta | Proposta | Perché |
|---|---|---|
| Com'è fatto un dungeon | **Due o tre mappe collegate** (per esempio "Cripta – le sale" e "Cripta – la tomba del re"), ognuna con più stanze separate da corridoi e porte. Tutto nei dati, come le mappe di oggi | Mappe piccole si leggono meglio e si provano meglio. Il §11 chiede che dungeon nuovi si aggiungano con mappe e dati. |
| Porte e chiavi | Una cella **porta** che si apre con una chiave (oggetto "di missione") e resta aperta per sempre (si salva nella Partita, come i muri segreti). Il **cancello della cripta** diventa la prima porta: si apre con la chiave di Berta | Risponde alla domanda della lezione 7b: una porta è un muro segreto con un requisito. Le chiavi si trovano in forzieri o le lasciano nemici speciali. |
| Forzieri chiusi a chiave | Alcuni forzieri dei dungeon sono **chiusi**: servono una chiave piccola **oppure Volpe**, che con la sua abilità li apre (oltre a segnalare i tesori, come oggi) | Dal §10: dà finalmente un motivo concreto per portare la Ladra. |
| Il boss | Un'entità nuova con **fasi scritte nei dati**: per ogni fase, sotto quale frazione di vita parte e quali attacchi usa. Gli attacchi sono etichette con un comportamento nel codice (`evoca`, `carica`, `crollo_massi`, `teletrasporto`, `incantesimo`), come gli effetti delle armi. In alto compare una **barra della vita** con il nome | Il §7 chiede boss a fasi; così un boss nuovo si scrive soprattutto nei dati. |
| La stanza del boss | Entrando, la porta **si chiude alle spalle** finché il boss non è sconfitto. Morendo si ricompare all'**ingresso del dungeon** e il boss torna a vita piena; una volta sconfitto **non ricompare più** | Il §11 dice che i boss non ricompaiono. La porta chiusa evita di uscire e rientrare per curarsi gratis. |
| Re Scheletro | Fase 1: colpi lenti e pesanti. Sotto metà vita: **evoca 3 scheletri** ogni tanto. Lascia il **frammento della corona** (per la Spada dell'eroe, già nelle ricette) | Dal §3. |
| Troll delle Caverne | Fase 1: **carica in linea retta** (si schiva con la capriola). Sotto metà vita: **fa crollare massi** in punti segnati a terra un attimo prima. Sconfitto **non muore**: il sigillo si spezza e lui si ritira | Dal §3: è uno schiavo di Orvald, non un cattivo. |
| Il Negromante | Fase 1: **incantesimi** (proiettili) e **teletrasporto**. Sotto metà vita: **evoca le ombre dei paesani** morti nella febbre. Sconfitto: una breve scena di testo, lo spirito di Lia lo porta via | Dal §3, compreso il momento finale. |
| Nemici nuovi | **Comportamenti nuovi:** `tiratore` (goblin arcieri, cultisti: si tengono a distanza e tirano) e `caricatore` (ragni: si fermano, mirano e scattano). Gli altri sono **varianti nei dati** dei comportamenti esistenti: zombie (lenti e resistenti), pipistrelli (veloci e fragili), goblin, banditi, spettri, golem (lenti, molta armatura), ombre | Il §7 chiede comportamenti riutilizzabili definiti nei dati. Due comportamenti nuovi bastano a coprire tutto. |
| Banditi e Brughiera | I **banditi** arrivano nelle Colline Grigie con la 8b. La **Brughiera della Torre** (8c) ha lupi, banditi e slime **più forti**, cioè gli stessi nemici con più vita e danno, scritti come varianti nei dati | Dal §3. Le varianti costano solo dati. |
| Difficoltà | Ogni dungeon è pensato per un livello: Cripta 3–5, Miniera 6–8, Torre 9–11. Il livello consigliato è scritto nel registro della quest principale. Il gioco non lo impone | Difficoltà crescente (§11) senza bloccare chi vuole rischiare. |
| Tesori | In ogni dungeon un **muro segreto** con il tesoro nascosto, e **un'esotica nascosta** (§8). Ogni boss lascia monete, il suo materiale, una **leggendaria** sicura e una piccola probabilità (10%) di un'esotica | Dal §8. |
| Materiali | Il **cristallo della miniera** nelle vene della Miniera: sblocca i potenziamenti +4 e +5 e una nuova ricetta. Il frammento della corona dal Re Scheletro (Spada dell'eroe). Una ricetta leggendaria per ogni boss | Mantiene le promesse delle fasi 6a e 6b. |
| La frana | Dopo l'Atto I, Berta manda gli uomini del villaggio a liberare la strada: la frana sparisce. Per farlo serve un meccanismo generico: **celle che esistono solo finché una quest non è conclusa** (o solo dopo) | Lo stesso meccanismo serve per la Quercia ferita (8b) e per il germoglio sulla tomba di Lia (8c). |
| La storia nei dialoghi | **Anselmo** racconta la verità dopo l'Atto I. **Gemma** commenta ogni boss sconfitto. Dopo l'Atto II la **Quercia Antica** del borgo ha un ramo tagliato. Nel finale **Berta** confessa davanti a tutti. Tutto con le condizioni sulle quest della fase 7 | Il §3 lo chiede, e i dialoghi con condizioni esistono già. |
| La luna nera | Nella Brughiera e nella Torre lo schermo è più scuro e bluastro (una tinta sopra la scena) | Si capisce che è "la notte" senza grafica nuova (siamo ancora prima della fase 9). |
| Il finale | Sconfitto il Negromante: alcune schermate di testo (Lia, il ritorno al borgo, la confessione di Berta, il germoglio sulla tomba), poi si torna a giocare nel mondo aperto | Dal §3: il mondo resta esplorabile per le quest rimaste. |

## File da creare o modificare (in breve)

```
src/
  systems/
    porte.ts              porte e forzieri chiusi: cosa li apre, aperto per sempre        [8a]
    boss.ts               fasi del boss: quale fase è attiva, quale attacco scegliere      [8a]
    ia/tiratore.ts        tenersi a distanza e tirare                                      [8b]
    ia/caricatore.ts      fermarsi, mirare, scattare in linea retta                        [8b]
    condizioniMappa.ts    celle che compaiono o spariscono secondo le quest                [8b]
    partita.ts, mappa.ts, quest.ts, tipi.ts  (modifica)
  data/
    boss.json             i tre boss con le loro fasi                                      [8a–8c]
    nemici.json, quest.json, dialoghi.json, oggetti.json, armi.json, ricette.json  (modifica)
    mappe/                cripta-*, miniera-*, torre-*, brughiera.json                    [8a–8c]
  entities/
    Boss.ts, Porta.ts                                                                      [8a]
  scenes/
    ScenaMondo.ts (modifica), ScenaFinale.ts (testi del finale)                            [8c]
    interfaccia: barra della vita del boss                                                 [8a]
tests/  porte, boss (fasi e attacchi), tiratore, caricatore, condizioni delle mappe,
        dati (ogni dungeon raggiungibile, chiavi prima delle porte, boss presenti…);
        tests/browser/fase-8a.cjs, fase-8b.cjs, fase-8c.cjs
```

## Passi in ordine

**8a – La Cripta dei Non Morti**

1. `porte.ts` (test prima): porte con chiave, forzieri chiusi, Volpe che apre.
2. `boss.ts` (test prima): fasi, scelta dell'attacco, "sconfitto per sempre".
3. Mappe della Cripta (sale + tomba del re), zombie e pipistrelli, cancello che si apre con la chiave di Berta.
4. Re Scheletro: entità, barra della vita, evocazione, stanza che si chiude.
5. Quest principale: Atto I fino alla pagina del diario e alla verità di Anselmo; commenti di Gemma.
6. Verifica, prova nel browser, schermate, lezione 8a. **Mi fermo.**

**8b – La Miniera dei Goblin**

7. Comportamenti `tiratore` e `caricatore` (test prima).
8. Celle condizionate dalle quest: la frana sparisce, la Quercia ferita.
9. Banditi nelle Colline, mappe della Miniera, vene di cristallo, goblin, arcieri, ragni.
10. Troll delle Caverne: carica, crollo dei massi, il sigillo spezzato. Atto II.
11. Verifica, prova nel browser, schermate, lezione 8b. **Mi fermo.**

**8c – La Torre del Negromante**

12. Brughiera della Torre (varianti più forti), la tinta della luna nera.
13. Mappe della Torre, cultisti, spettri, golem.
14. Il Negromante: incantesimi, teletrasporto, ombre. Atto III.
15. Il finale: testi, confessione di Berta, germoglio sulla tomba di Lia; il mondo resta aperto.
16. Verifica, prova nel browser, schermate, lezione completa.

## Test previsti (principali)

- **porte:** una porta senza chiave resta chiusa; con la chiave si apre e resta aperta anche cambiando mappa; un forziere chiuso si apre con la chiave piccola o con l'abilità di Volpe.
- **boss:** sopra metà vita è in fase 1, sotto in fase 2; sceglie solo gli attacchi della sua fase; sconfitto, risulta tale nella Partita e non ricompare.
- **tiratore:** troppo vicino si allontana, a distanza giusta tira, senza linea di tiro si sposta.
- **caricatore:** prima si ferma e mira, poi scatta in linea retta, poi resta stordito un attimo.
- **celle condizionate:** la frana c'è finché l'Atto I non è concluso, poi no.
- **dati:** ogni dungeon si raggiunge; ogni porta ha la sua chiave raggiungibile **prima** della porta; un'esotica nascosta al massimo per dungeon; ogni boss esiste e lascia il suo materiale.

## Cose da provare giocando (8a)

1. Con l'Atto I al cimitero concluso, parla con Berta ("E adesso? La cripta…").
2. Al cimitero clicca il cancello: con la chiave di Berta si apre. Dietro c'è l'ingresso della **Cripta dei Non Morti**.
3. Nelle sale: zombie lenti e resistenti, pipistrelli veloci. La **porta d'ossa** in fondo alla sala è chiusa: la chiave è nella stanza a ovest, tra gli scheletri.
4. Nella stanza a est c'è un **forziere chiuso a chiave**: la chiave piccola è nel forziere della sala. Oppure porta Volpe e usa la sua abilità vicino al forziere.
5. Il muro che non è un muro, nella stanza a est, nasconde un'esotica.
6. Dalle scale si scende alla **tomba del re**. Entrando nella stanza le barriere si chiudono e compare la barra del **Re Scheletro**. Sotto metà vita evoca scheletri.
7. Sconfitto il re: frammento della corona, Elmo della corona, monete e una **pagina di diario**. Portala a frate Anselmo.

## Note di sviluppo (8a)

- **Mappe:** `cripta_sale` (30×22) e `cripta_tomba` (24×20). Il cancello del cimitero è una porta vera; dietro, l'uscita verso la cripta.
- **Nemici:** zombie (22 vita, lento), pipistrello (5 vita, veloce). **Re Scheletro:** 110 vita, 1d10, armatura 2; sotto metà vita evoca fino a 4 scheletri (3 alla volta, ogni 9 s). Bottino: frammento della corona, Elmo della corona (leggendario), pagina di diario, 60–90 monete, Lama del vuoto al 10%.
- **Esotica nascosta:** l'Elmo del veggente, dietro il muro segreto della stanza est.
- **Volpe:** la sua abilità apre il forziere chiuso più vicino (entro 10 tessere); se non ce n'è, fa brillare i tesori come prima.
- **Modalità sviluppatore:** i nemici hanno un elenco a parte ("Genera nemico…"); nel sottomenu dei materiali ci sono anche gli oggetti di missione (chiavi, lettera, pagina).
- **Avvisi delle porte:** "Chiuso a chiave: la porta d'ossa. Serve: …" e "Apri la porta d'ossa con: …", così il testo va bene sia al maschile sia al femminile.
- **Prove nel browser:** `fase-8a.cjs` 29 su 29; ripassano tutte le precedenti. Aggiornate: 3c, 4a e 5a (indici del pannello sviluppatore), 7b (il cancello ora si apre), 3a (controlla la vita massima: era la causa dei fallimenti saltuari).

## Cose da provare giocando (8b)

1. Concluso l'Atto I, parla con Berta: "Anselmo mi ha raccontato di Orvald". Parte «Atto II: la Miniera dei Goblin».
2. Nelle Colline Grigie la frana non c'è più: a est c'è l'ingresso della **miniera**. Attento ai **banditi**.
3. Nelle gallerie: i **goblin arcieri** si tengono a distanza e tirano frecce; i **ragni** si fermano, lampeggiano e scattano (capriola!).
4. Le **vene di cristallo** (servono per i potenziamenti +4 e +5). Il forziere chiuso ha la pergamena dell'**Ascia del troll**; la chiave piccola è nell'altro forziere. Un muro segreto nasconde un'esotica.
5. Nella tana: il **Troll delle Caverne**. Una linea rossa avvisa della carica; se sbatte contro una roccia resta stordito. Sotto metà vita fa crollare i massi: guarda le ombre a terra.
6. Tornando al borgo: la **Quercia Antica** è ferita. Parla con nonna Rosalba.

## Note di sviluppo (8b)

- **Mappe:** `miniera_gallerie` (36×26) e `miniera_tana` (26×20). Le Colline hanno l'uscita a est (oltre la frana) e tre banditi.
- **Nemici:** bandito (22 vita, 1d8), goblin (16, 1d6), goblin arciere (tiratore: 50–110 px, una freccia ogni 1,8 s), ragno (caricatore: mira 0,55 s, scatto a 210). **Troll delle Caverne:** 220 vita, 2d6, armatura 3; carica ogni 5 s; sotto metà vita carica ogni 6 s e crollo di 5 massi ogni 7 s (1d8 l'uno, preavviso 1,1 s). Non carica se l'eroe è a meno di 48 px.
- **Bottino del troll:** zanna del troll, Guanti del titano (leggendari), un cristallo, 100–150 monete, Corazza di spine al 10%.
- **Nuova ricetta** (da pergamena): Ascia del troll, leggendaria (2d8): 1 zanna, 3 cristalli, 4 ferro, 150 monete.
- **Esotica nascosta:** gli Stivali del vento, dietro il muro segreto delle gallerie.
- **Celle che cambiano con la storia:** frana e cartello delle Colline (dopo l'Atto I), Quercia e ramo tagliato nel borgo (dopo il troll).
- **Prove nel browser:** `fase-8b.cjs` 21 su 21; ripassano tutte le precedenti. Aggiornata la 5c: controllava che la ricarica fosse oltre l'80%, ma la parata può arrivare qualche secondo dopo; ora basta oltre il 50%.

## Cose da provare giocando (8c)

1. Concluso l'Atto II, parla con nonna Rosalba ("La torre di Orvald…"): parte «Atto III: la Torre del Negromante».
2. Nelle Colline Grigie, a ovest, la nebbia si è diradata: si entra nella **Brughiera della Torre**. È notte (la luna nera) e i nemici sono più forti.
3. Nella **torre**: cultisti che tirano sfere, spettri trasparenti, golem lenti e corazzati. Il cancello della scala si apre con la chiave della torre (nella stanza del golem, a ovest). Il forziere chiuso ha la pergamena del **Bastone di Orvald**; un muro segreto nasconde un'esotica.
4. In cima: **il Negromante**. Si teletrasporta e lancia ventagli di sfere; sotto metà vita evoca le ombre dei paesani.
5. Sconfitto: le pagine del **finale**. Poi torna da Berta, e vai al cimitero a vedere la tomba di Lia.

## Note di sviluppo (8c)

- **Mappe:** `brughiera` (34×24), `torre_piani` (28×26), `torre_cima` (26×20), tutte "di notte". Le Colline hanno l'uscita a ovest, chiusa dalla nebbia fino all'Atto II.
- **Nemici:** lupo della brughiera, predone della brughiera, slime nero (varianti più forti), cultista (tiratore), spettro (trasparente, non morto), golem di pietra (55 vita, armatura 4), ombra di un paesano (evocata).
- **Il Negromante:** 300 vita, tiratore; fase 1: teletrasporto ogni 6 s e ventaglio di 3 sfere ogni 4 s; sotto metà vita: teletrasporto ogni 5 s, 5 sfere ogni 3,5 s, fino a 5 ombre. Bottino: ossidiana nera, Corazza della Quercia (leggendaria, +1 COS e +1 SAG), 200–300 monete, Arco del rimbalzo al 10%.
- **Nuova ricetta** (da pergamena): Bastone di Orvald, leggendario (2d6, dardi da 2 mana): 1 ossidiana, 2 cristalli, 3 ossa antiche, 180 monete.
- **Esotica nascosta:** il Pugnale dell'ombra, dietro il muro segreto della sala alta.
- **Il velo della notte** sta sotto eroe e nemici: nella prima versione copriva tutto e il Negromante quasi non si vedeva.
- **Prove nel browser:** `fase-8c.cjs` 25 su 25; ripassano tutte le precedenti (3a–8b).

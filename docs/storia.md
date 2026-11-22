# La storia di Borgo Quercia — edizione estesa (5–6 ore)

> **A chi è rivolto questo file.** È la "bibbia" della storia: chi sono i personaggi, cosa succede, in che ordine, dove. Serve a chiunque continui lo sviluppo, persona o AI, insieme a `docs/espansione.md` (il *come*: fasi, sistemi, dati) e a `docs/design.md` (le regole del gioco, fonte di verità).
>
> **Stato del documento:** approvato con Ale il 22/11/2026. Tutto ciò che è segnato 🆕 è nuovo; ✅ esiste già nel gioco (fasi 1–9). Nomi, struttura (3 regioni, 1 compagno per regione, boss con bottino garantito ed Eco) e scelte aperte (§12) sono **decisi**.

## 1. In una frase

Un viaggiatore arriva in una valle dove i morti non riposano più, e scopre che dietro c'è il dolore di un padre, maestro Orvald, che vuole riportare in vita la figlia Lia. Per fermarlo attraversa tre regioni, trova tre compagni di viaggio, forgia armi leggendarie e scopre i segreti che il villaggio ha nascosto per vent'anni.

## 2. Decisioni prese con Ale

| Decisione | Cosa vuol dire |
|---|---|
| **La storia di Orvald resta la spina dorsale** | Antefatto, personaggi, tre atti e finale del design §3 non cambiano. Si **allargano**. |
| **Durata: 5–6 ore** | Oggi l'avventura dura 1–1,5 ore. Si arriva a 5–6 ore con più regioni, quest, tesori e crafting, non allungando i combattimenti. |
| **Una regione per atto** (scelta "A") | Ogni atto è una regione con un villaggio o avamposto, 3–4 zone aperte, un dungeon "di mezzo" con un mini-boss e il dungeon del boss. Prima c'è un prologo, dopo il finale un "dopo-storia". |
| **Storia e crafting** sono ciò che tiene incollati | Il crafting attraversa tutto il gioco: armi leggendarie della trama, materiali rari per regione, commissioni dei paesani. |
| **Bottino dei boss** | Prima sconfitta: **1 leggendario garantito** (arma o armatura, a caso dalla lista del boss), **probabilità di un esotico** (25%), pozioni e monete. |
| **L'Eco dei boss** | Il boss si può riaffrontare in versione più forte forgiando un **Sigillo dell'Eco** presso l'artigiano della sua regione (Bruno per la Valle, Ugo per le Colline, Selva per la Brughiera). L'Eco **garantisce l'esotico "firma"** di quel boss. |
| **Caccia ai tesori** | Un'attività a sé: tesori sepolti, mappe del tesoro, muri segreti, una collezione da completare. |
| **Un compagno di viaggio per regione** | Tre compagni nuovi che si uniscono **con la storia**, non a pagamento, ognuno con una sua quest personale e un'abilità che apre un tipo di segreto. |

## 3. Tono e temi (dal design §3, invariati)

- **Temi:** il lutto, l'accettazione, le colpe del passato che una comunità deve riconoscere.
- **Tono:** avventuroso, con momenti malinconici, mai crudo. Ironia nei personaggi minori (Gemma, Volpe, il goblin Grisk).
- **Regola d'oro per chi scrive dialoghi:** Orvald non è un "cattivo". Ogni regione deve aggiungere un pezzo che lo rende più umano, senza giustificare ciò che fa.
- **Lingua:** italiano. Battute brevi (2–3 frasi per nodo di dialogo), niente muri di testo.

## 4. Il mondo: mappa delle regioni

```
                          [Regione III: la Brughiera]
   Palude delle Lanterne 🆕 — Guado delle Lanterne 🆕 — Brughiera ✅ — Torre ✅
          |                                   |
   Osservatorio di Orvald 🆕            Casa sul Colle 🆕
                                              |
                                  [Regione II: le Colline]
            Passo del Corvo 🆕 — Colline Grigie ✅ — Miniera ✅
                    |                 |
          Cave di Zolfo 🆕     Pietrafonda 🆕 (villaggio dei minatori)
                                      |
                              [Regione I: la Valle]
   Strada Maestra 🆕 — Radura ✅ — BORGO QUERCIA ✅ — Mulino del Ponte 🆕
                          |                                |
                       Bosco ✅ — Cimitero ✅ — Cripta ✅   Cantine del Mulino 🆕
                                                           |
                                                 Le Radici 🆕 (dopo-storia)
```

Le zone sono collegate da uscite come oggi. Per non far camminare troppo, ogni villaggio ha una **pietra di passaggio** (viaggio rapido tra villaggi già visitati, vedi `espansione.md` §5.6).

## 5. Personaggi

### 5.1 Quelli che ci sono già ✅ (cosa aggiungiamo 🆕)

| Personaggio | Dove | Ruolo oggi | In più nell'edizione estesa 🆕 |
|---|---|---|---|
| **Sindaca Berta** | Borgo | Affida l'Atto I e II. Nasconde la cacciata di Orvald. | Il suo segreto cresce: fu lei a dare fuoco al laboratorio di Orvald. Lo confessa nell'Atto III difendendo la sua scelta: lo fece per proteggere il borgo. |
| **Frate Anselmo** | Borgo | Racconta la verità dopo il Re Scheletro. | Conosce Selva (la terza compagna): fu lui a nasconderla dopo la cacciata. |
| **Bruno** il fabbro | Borgo | Crafting e potenziamenti. Ha perso il figlio Matteo nella miniera. | Nell'Atto II scopre che Matteo è vivo, prigioniero dei banditi alle Cave di Zolfo. Nel dopo-storia forgia i Sigilli dell'Eco della Valle. |
| **Gemma** | Borgo | Negozio, pettegolezzi, mappe del tesoro "autentiche". | Vende una mappa per regione. I suoi commenti cambiano dopo ogni boss. |
| **Tobia** | Taverna | Ingaggia i 4 compagni a pagamento. | Bacheca delle **commissioni**: lavori di crafting per i paesani. |
| **Nonna Rosalba** | Borgo | Leggende della Quercia, indizi sui muri segreti. Affida l'Atto III. | Custodisce la leggenda delle **Ghiande d'oro** (la collezione, §8). |
| **Dario** il pastore | Radura | Quest dei lupi. | Amico di Tessa (prima compagna). |
| **Ugo** | Colline | Fratello di Bruno, rifugiato. | Diventa il **fabbro delle armature** a Pietrafonda e forgia i Sigilli dell'Eco delle Colline. |
| **Corrado, Elisa, Volpe, Agata** | Taverna | Compagni a pagamento delle 4 classi. | Invariati. Restano l'alternativa ai compagni di viaggio. |

### 5.2 I compagni di viaggio 🆕 (uno per regione)

Si uniscono **con la storia**, gratis, e restano disponibili per sempre. Come i compagni della taverna, se ne porta **uno alla volta**: si cambiano dalla taverna o dalla pietra di passaggio. Ognuno ha un'**abilità che apre un tipo di segreto**: tornare con lui nelle regioni già visitate dà accesso a tesori che prima non si potevano prendere. Questo è il motore della caccia ai tesori e una parte importante delle 5–6 ore.

#### Tessa e Brina — Regione I (la Valle)

- **Chi è:** cacciatrice dei boschi, figlia del boscaiolo Aldo, scomparso nel Bosco. Va in giro con **Brina**, un cane da pastore grigio. Diretta, poco paziente, generosa.
- **Combatte:** con l'arco, da lontano (comportamento tiratore). Brina non combatte: è il "segugio" del gruppo.
- **Abilità speciale — Fiuta!:** Brina annusa **tutti i segreti e i tesori** entro 12 tessere per 10 secondi: rivela i **tesori sepolti** (compare un ciuffo d'erba smossa sui punti di scavo) e segnala anche **muri segreti, rocce crepate e forzieri nascosti** nelle vicinanze.
- **Si unisce:** nell'Atto I, dopo la quest *Le tracce di Aldo* (§6.1).
- **Quest personale — L'ascia di mio padre:** Aldo è morto nel Bosco, ucciso dai lupi spinti dai non morti. La sua ascia è sepolta vicino al Mulino. Brina la trova, Tessa la porta a Bruno, Bruno la riforgia. Ricompensa: la ricetta dell'**Arco di Aldo** (leggendario).
- **Commento sulla storia:** è la più dura con Orvald ("Mio padre è morto per i suoi capricci"). Nel finale è lei a dire che anche lei avrebbe voluto riavere suo padre.

#### Grisk — Regione II (le Colline)

- **Chi è:** un goblin piccolo, chiacchierone, ex "esperto di esplosivi" del clan Pietrarossa. Prigioniero del Troll, incatenato a scavare ossidiana. Parla di sé in terza persona ("Grisk non scava più. Grisk fa BUM").
- **Combatte:** in mischia, veloce e debole (comportamento inseguitore).
- **Abilità speciale — Polvere nera:** lancia una bomba nel punto indicato. Danno ad area **e rompe le rocce crepate**: passaggi e tesori bloccati dietro macerie fragili, in tutte le regioni.
- **Si unisce:** nell'Atto II, quando lo si libera nella Miniera, prima del Troll.
- **Quest personale — Pace con il clan:** il clan Pietrarossa attacca Pietrafonda perché ha perso le sue colline ai non morti. Grisk fa da interprete: si portano al capo clan 10 zanne di lupo grigio (i lupi infestano le loro tane) e i goblin smettono di attaccare. Ricompensa: la ricetta dei **Pugnali di Pietrarossa** (leggendari) e un negozio goblin a Pietrafonda.
- **Commento sulla storia:** non capisce perché gli umani piangano tanto i morti ("I goblin li ricordano cantando, poi mangiano"). È la voce leggera dell'Atto II, ma è lui a dire la frase che fa riflettere l'eroe: "Il vecchio della torre non vuole i morti. Vuole non essere più solo."

#### Selva — Regione III (la Brughiera)

- **Chi è:** ex allieva di Orvald, oggi sulla quarantina. Vent'anni fa lo aiutava nel laboratorio; quando i paesani lo cacciarono fuggì, e frate Anselmo la nascose. Tornata dal maestro per fermarlo, è stata messa a guardia del suo vecchio osservatorio con un incantesimo. Colta, malinconica, ironica su se stessa.
- **Combatte:** con incantesimi (dardi d'ombra, comportamento tiratore).
- **Abilità speciale — Velo d'ombra:** per 6 secondi i nemici vicini perdono l'eroe (come lo Scatto nell'ombra del Ladro, ma su tutti). Fuori dal combattimento **legge le rune di Orvald**: apre le **porte runiche**, presenti soprattutto nella Regione III e nel dopo-storia.
- **Si unisce:** nell'Atto III, dopo averla sconfitta come mini-boss all'Osservatorio. Battuta, l'incantesimo si spezza.
- **Quest personale — Il quaderno di Lia:** nell'Osservatorio c'è il quaderno di scuola di Lia, con i disegni di una bambina. Selva vuole portarlo nella torre, per mostrarlo a Orvald prima dello scontro finale. Se il quaderno è nello zaino durante il finale, c'è una **battuta in più di Orvald** e una ricompensa: l'esotico **Ciondolo di Lia** (vedi `espansione.md` §4).
- **Commento sulla storia:** è l'unica che ha voluto bene a Orvald da adulta. Spiega cosa è successo dentro di lui. Il suo arco finisce sulla tomba di Lia, nel finale.

## 6. La trama, regione per regione

Accanto a ogni parte trovi il **tempo stimato** e il **livello** dell'eroe all'uscita. Il livello massimo resta 20 (design §5).

### 6.0 Prologo — La strada dei morti 🆕 (~20 min, livello 1 → 2)

1. **Strada Maestra 🆕.** Si parte qui, non più nel borgo. È sera, la strada principale è bloccata da un carro rovesciato e da scheletri. È il **tutorial**: camminare, attaccare, capriola, raccogliere.
2. Si salva **Teodoro**, mercante ambulante (🆕) aggredito dagli scheletri. Da quel momento lo si ritrova in ogni villaggio nuovo: vende pozioni e materiali di base, e compra.
3. **Il cancello del borgo:** Borgo Quercia è barricato. La guardia (🆕 Fausto, un ragazzo con un forcone) non apre agli sconosciuti, finché tre scheletri non attaccano il cancello e l'eroe li ferma.
4. **Berta** accoglie l'eroe a malincuore: "Cerchi riparo? Qui servono spade, non ospiti." Primo dialogo, prima quest principale.

*Perché:* oggi la storia comincia a freddo nel borgo. Il prologo dà un motivo per essere lì e insegna i comandi.

### 6.1 Atto I — La Valle: le ossa dei re (~1 h 30, livello 2 → 7)

**Villaggio:** Borgo Quercia ✅.

**Cosa succede:**

1. ✅ **Il cimitero sulla collina:** Berta manda l'eroe a guardare. *(quest esistente `atto1_cimitero`)*
2. 🆕 **Il becchino sparito:** il cancello della cripta ha una seconda serratura, e la chiave ce l'ha Ottone il becchino, fuggito al **Mulino del Ponte**. L'eroe ci va: il mulino è invaso dalle melme e Ottone è chiuso in soffitta. Per aprire bisogna ripulire le **Cantine del Mulino** (dungeon di mezzo).
3. 🆕 **Mini-boss: il Re Melma.** Una melma gigante nelle cantine, che si divide in melme più piccole sotto metà vita. Sconfitto, Ottone consegna la chiave e racconta di aver visto "un vecchio col mantello viola" al cimitero, di notte.
4. 🆕 **Tessa e Brina:** al Mulino si incontra Tessa, che cerca il padre. Quest *Le tracce di Aldo*: seguire le tracce nel Bosco fino a una radura nascosta. Aldo è morto, e Tessa si unisce all'eroe.
5. ✅ **La Cripta dei Non Morti e il Re Scheletro.** *(quest esistente `atto1_cripta`)*. Dentro, la pagina del diario di Orvald.
6. ✅ **La verità di Anselmo** dopo la pagina del diario. 🆕 In più, Anselmo nomina "la ragazza che lo aiutava. Non so che fine abbia fatto." È il primo accenno a Selva.

**Secondarie della regione:** *I lupi di Dario* ✅, *Le erbe di Anselmo* ✅, *Il carbone di Bruno* ✅, *L'ascia di mio padre* 🆕 (Tessa), *Il pozzo dei desideri* 🆕 (§7), *La mappa del mugnaio* 🆕 (mappa del tesoro della regione).

**Il crafting dell'Atto I:** Bruno insegna la **Spada dell'eroe** (leggendaria ✅, con il frammento della corona del Re Scheletro). Si scoprono le prime ricette di armatura 🆕: corazza di cuoio rinforzata, elmo di ferro.

### 6.2 Atto II — Le Colline: l'ossidiana nera (~1 h 30, livello 7 → 12)

**Villaggio:** **Pietrafonda 🆕**, il villaggio dei minatori. All'inizio è un **accampamento** alle Colline, perché il villaggio vero è occupato dai goblin. A metà atto lo si libera e diventa un villaggio con fabbro (Ugo), negozio goblin e pietra di passaggio.

**Cosa succede:**

1. ✅ Berta affida l'**Atto II**: Orvald cerca l'ossidiana della miniera.
2. 🆕 **La frana e i minatori:** la strada per la miniera è franata ✅. Ugo e i minatori sono accampati lì vicino. Ugo spiega che l'ossidiana non sparisce solo per mano dei goblin: c'è qualcuno che la **compra**.
3. 🆕 **Il Passo del Corvo:** banditi sulla strada di montagna. Si scopre un carico di ossidiana diretto alla Brughiera e un nome: **Ferrante**.
4. 🆕 **Le Cave di Zolfo** (dungeon di mezzo): il covo dei banditi. **Mini-boss: Ferrante il Contrabbandiere**, un umano che vende ossidiana a Orvald. Sotto metà vita getta bombe di zolfo che lasciano una nube. Dentro, prigioniero, c'è **Matteo, il figlio di Bruno**, creduto morto nella miniera. Momento forte della regione: Bruno lo riabbraccia al borgo.
5. 🆕 **Liberare Pietrafonda** dai goblin. Si fa con le armi, oppure con la quest di Grisk dopo la miniera: la regione cambia aspetto in base a quando la si completa.
6. ✅ **La Miniera dei Goblin** e il **Troll delle Caverne.** 🆕 Prima del Troll si libera **Grisk**, incatenato in una galleria laterale.
7. ✅ Spezzato il sigillo, il Troll si ritira. Tornando al borgo, la **Quercia è ferita** ✅: Orvald ha preso il legno.

**Secondarie della regione:** *La lettera di Bruno* ✅, *La mappa del cavaliere* ✅, *Pace con il clan* 🆕 (Grisk), *Il ritorno di Matteo* 🆕 (portare Matteo a casa sano e salvo, scortandolo), *Le lanterne dei minatori* 🆕 (riaccendere 5 lanterne nelle gallerie, quest "raggiungi"), *La mappa di Ferrante* 🆕 (mappa del tesoro della regione).

**Il crafting dell'Atto II:** Ugo forgia le **armature** a Pietrafonda (nuovo banco 🆕). Ricette leggendarie: **Ascia del troll** ✅, **Guanti del titano** come ricetta alternativa 🆕, **Pugnali di Pietrarossa** 🆕 (Grisk). Nuovi materiali: argento, zolfo, pietra lunare (§9).

### 6.3 Atto III — La Brughiera: la luna nera (~1 h 30, livello 12 → 17)

**Villaggio:** **Il Guado delle Lanterne 🆕**, una locanda-traghetto sul fiume della palude, gestita da **Mamma Orsola**: burbera, ospitale, ha visto Orvald passare ogni notte per vent'anni.

**Cosa succede:**

1. ✅ Rosalba affida l'**Atto III**: la luna nera è vicina.
2. 🆕 **La Brughiera** ✅ non porta più direttamente alla torre: il ponte è stato distrutto e serve il **traghetto del Guado**. Orsola però ha paura delle **lanterne fatue** nella palude.
3. 🆕 **La Palude delle Lanterne:** si spengono tre fuochi fatui (mini-incontri con spettri). In cambio Orsola traghetta l'eroe verso la **Casa sul Colle**.
4. 🆕 **La Casa sul Colle**, la vecchia casa di Orvald e Lia: un luogo senza nemici, solo **ricordi**. Cartelli e oggetti che, cliccati, mostrano frammenti del passato (Lia che impara a leggere, la febbre, la notte dell'incendio). È il momento più malinconico del gioco. Qui si scopre che fu **Berta a dare fuoco al laboratorio**.
5. 🆕 **L'Osservatorio di Orvald** (dungeon di mezzo, sotto la casa): porte runiche, specchi. **Mini-boss: Selva**, sotto l'incantesimo di Orvald. Sconfitta, torna in sé e si unisce all'eroe.
6. 🆕 **Il confronto con Berta:** tornando al borgo (o alla pietra di passaggio) si affronta Berta, che confessa ma **difende la sua scelta**: lo fece per proteggere il borgo dal primo rituale di Orvald ("Se non avessi bruciato quel laboratorio, i morti si sarebbero alzati vent'anni fa!"). Non c'è una scelta di gioco che blocca la trama, ma il dialogo ha due toni di risposta (duro o comprensivo) e cambia una battuta del finale.
7. ✅ **La Torre del Negromante** ✅. 🆕 Selva apre la porta runica dell'ultimo piano.
8. ✅ **Il Negromante** e il **finale** ✅. 🆕 Se si ha il quaderno di Lia, Orvald lo sfoglia prima di dissolversi (battuta in più).

**Secondarie della regione:** *Il quaderno di Lia* 🆕 (Selva), *Il traghetto di Orsola* 🆕, *Le ultime lettere* 🆕 (consegnare a Borgo tre lettere mai spedite, trovate nella Casa), *La mappa della luna* 🆕 (mappa del tesoro della regione, si legge solo di notte, cioè nella Brughiera).

**Il crafting dell'Atto III:** **Bastone di Orvald** ✅. 🆕 **Selva** distilla pozioni rare al Guado: l'**alchimia**, una variante del crafting che usa erbe e materiali della palude. Nuove pozioni: rigenerazione, velocità, antiveleno.

### 6.4 Finale ✅ e dopo-storia 🆕 (~45 min, livello 17 → 20)

**Il finale ✅ resta com'è:** la luna nera passa, Berta confessa davanti al villaggio, si pianta il germoglio sulla tomba di Lia. 🆕 Nell'ultima pagina compaiono i tre compagni di viaggio, ognuno con una frase sua.

**Dopo il finale il mondo resta aperto ✅, e in più 🆕:**

1. **Le Eco dei boss:** ciascun artigiano impara a forgiare i **Sigilli dell'Eco** dei boss della propria regione (Bruno per la Valle, Ugo per le Colline, Selva per la Brughiera). Ogni boss e mini-boss si può riaffrontare in versione potenziata per il suo esotico "firma" (lista in `espansione.md` §4).
2. **Le Radici** (dungeon segreto): sotto la Quercia Antica è rimasto qualcosa del rito spezzato. Le radici marciscono e i nemici sono "eco" dei nemici delle tre regioni. **Boss finale facoltativo: la Radice Marcia.** Sconfitta, la Quercia guarisce e rimette le foglie.
3. **Le Ghiande d'oro:** completare la collezione (§8).
4. **Le ultime commissioni** della bacheca di Tobia.

*Perché un dopo-storia:* chi vuole le esotiche e tutti i tesori ha un motivo per restare, ma la storia di Orvald resta chiusa.

## 7. Elenco delle quest

Formato: **id** — nome (chi la dà, tipo di passi). Gli id sono proposte per `data/quest.json`. ✅ esiste già.

**Principali** (una catena, ognuna richiede la precedente):

| id | Nome | Chi la dà | Passi |
|---|---|---|---|
| `prologo_strada` 🆕 | Prologo: la strada dei morti | (automatica) | raggiungi il borgo, elimina 3 scheletri al cancello, parla con Berta |
| `atto1_cimitero` ✅ | Atto I: il cimitero sulla collina | Berta | raggiungi |
| `atto1_becchino` 🆕 | Atto I: il becchino sparito | Berta | raggiungi il Mulino, elimina il Re Melma, parla con Ottone |
| `atto1_cripta` ✅ | Atto I: la Cripta dei Non Morti | Berta | raggiungi, elimina il Re Scheletro, consegna la pagina |
| `atto2_miniera` ✅ (allungata) | Atto II: l'ossidiana nera | Berta | parla con Ugo, raggiungi il Passo del Corvo, elimina Ferrante, raggiungi la Miniera, elimina il Troll |
| `atto2_pietrafonda` 🆕 | Atto II: Pietrafonda | Ugo | libera il villaggio (elimina 8 goblin) oppure completa *Pace con il clan* |
| `atto3_torre` ✅ (allungata) | Atto III: la luna nera | Rosalba | raggiungi il Guado, completa il traghetto, raggiungi la Casa sul Colle, sconfiggi Selva, parla con Berta, elimina il Negromante |

**Compagni di viaggio** 🆕: `tessa_tracce` (si unisce Tessa), `tessa_ascia`, `grisk_liberato`, `grisk_clan`, `selva_quaderno`.

**Secondarie** (ne esistono già 5 ✅; le nuove sono circa 15 🆕):

- **Regione I:** `lupi_dario` ✅, `erbe_anselmo` ✅, `carbone_bruno` ✅, `pozzo_desideri` 🆕 (getta 5 monete nel pozzo del borgo, ripeti 3 volte: alla terza esce una ghianda d'oro), `mappa_mugnaio` 🆕, `fausto_forcone` 🆕 (la guardia vuole un'arma vera: commissione di crafting).
- **Regione II:** `lettera_bruno` ✅, `tesoro_cavaliere` ✅, `ritorno_matteo` 🆕, `lanterne_minatori` 🆕, `mappa_ferrante` 🆕, `argento_ugo` 🆕 (commissione: Ugo vuole 5 argento per insegnare la corazza d'argento).
- **Regione III:** `traghetto_orsola` 🆕, `ultime_lettere` 🆕, `mappa_luna` 🆕, `erbe_palude` 🆕 (Selva: 6 giunchi della palude per l'alchimia).
- **Dopo-storia:** `radici` 🆕 (il dungeon segreto), `ghiande_oro` 🆕 (collezione), `eco_*` 🆕 (una per boss, automatiche quando si forgia il sigillo).

Le **commissioni** della bacheca di Tobia (🆕, 6–8, ripetibili una volta) sono piccole quest "consegna un oggetto forgiato": per esempio "Fausto vuole una lancia", "Il mugnaio vuole un'ascia nuova", "Orsola vuole una lanterna d'argento". Ricompense: monete, ricette rare, a volte una ghianda d'oro.

## 8. Tesori e segreti

La caccia ai tesori è un'attività a sé. Per regione, come obiettivo:

| Tipo | Come si trova | Per regione |
|---|---|---|
| **Muri segreti** ✅ | crepa visibile, Elmo del veggente, fiuto di Volpe o **Brina** | 2–3 |
| **Forzieri chiusi a chiave** ✅ | chiave piccola o Volpe (segnalati anche da **Brina**) | 2 |
| **Tesori sepolti** 🆕 | punto di scavo invisibile, lo trova **Brina** (Tessa) o l'**Elmo del veggente**; si scava con una **pala** (oggetto, si compra da Teodoro) | 4–5 |
| **Rocce crepate** 🆕 | segnalate da **Brina**, si rompono con la **Polvere nera** di Grisk | 2–3 |
| **Porte runiche** 🆕 | le apre **Selva** | 1 (Regione I e II), 3 (Regione III), 4 (Radici) |
| **Mappa del tesoro** ✅ | una per regione; si compra da Gemma o si trova; un indovinello o un disegno porta al posto | 1 |
| **Ghiande d'oro** 🆕 | 12 in tutto il mondo, nascoste dietro i segreti qui sopra | 3–4 |

**Le Ghiande d'oro** 🆕 sono la collezione principale. Secondo una leggenda di Rosalba, la Quercia Antica lasciò cadere dodici ghiande d'oro "per chi un giorno l'avrebbe salvata". Si portano a Rosalba, che a ogni gruppo di tre dà un premio:

- 3 ghiande: zaino grande (24 spazi);
- 6 ghiande: ricetta leggendaria **Corazza della Quercia** (oggi è il bottino del Negromante ✅; il Negromante passa a un'altra leggendaria, vedi `espansione.md` §4);
- 9 ghiande: un punto caratteristica in più;
- 12 ghiande: l'esotico **Cuore della Quercia** (amuleto, vedi `espansione.md` §4).

**Regola per chi disegna le mappe:** nessun tesoro deve essere *impossibile da notare*. Ogni segreto ha un indizio visibile: una crepa, un'erba smossa, una frase di Rosalba, un cartello.

## 9. Materiali per regione

| Regione | Materiali comuni | Materiali rari | Dai boss |
|---|---|---|---|
| I — Valle | minerale di ferro ✅, carbone ✅, pelle di lupo ✅, gelatina di slime ✅, erba medicinale ✅ | osso antico ✅, **ambra** 🆕 (Cantine del Mulino, alberi vecchi) | frammento di corona ✅, **nucleo di melma** 🆕 |
| II — Colline | minerale di ferro, **argento** 🆕, **zolfo** 🆕 | cristallo di miniera ✅, **pietra lunare** 🆕 (vene nascoste) | zanna di troll ✅, **sigillo spezzato** 🆕 (Ferrante) |
| III — Brughiera | **giunco di palude** 🆕, **erica** 🆕 | **essenza d'ombra** 🆕 (spettri), **inchiostro di luna** 🆕 | ossidiana nera ✅, **lacrima di Selva** 🆕 |
| Dopo-storia | — | **frammento d'eco** 🆕 (lo lasciano i boss, serve per i sigilli) | **legno vivo** 🆕 (Radice Marcia) |

## 10. Mappe nuove: le idee

Formato: **id** — nome, dimensione indicativa in tessere, cosa c'è. Le tessere citate sono nomi di `data/sprite.json`. Nuove tessere vanno aggiunte lì (i fogli Kenney hanno 132 tessere ciascuno; molte non sono ancora usate).

### Prologo
- **`strada_maestra`** — La Strada Maestra, 40×16. Una strada di sentiero tra campi (erba, staccionate, alberi d'autunno), un carro rovesciato (ostacolo), 6 scheletri sparsi in gruppi da 2, il mercante Teodoro. A est il cancello del borgo. Tutorial: forziere facile con 2 pozioni.

### Regione I — la Valle
- **`mulino_ponte`** — Il Mulino del Ponte, 32×24. Un fiume (acqua) attraversato da un ponte di legno, un mulino (case di legno, tetto rosso), campi di grano (erba con fiori), melme. Ottone in soffitta (abitante, dietro una porta). Qui c'è un **tesoro sepolto** sotto il ponte e una **ghianda d'oro** dietro un muro segreto.
- **`cantine_mulino`** — Le Cantine del Mulino, 28×22, dungeon di mezzo. Pavimento di terra, botti (immagine "botte" da aggiungere: dungeon indice 82), muri di mattoni. Melme, ratti (nuovo nemico), pipistrelli. Stanza del **Re Melma** con barriere. Ambra nelle vene.
- **`radura_nascosta`** — La radura di Aldo, 20×16. Raggiungibile dal Bosco attraverso un passaggio nascosto (muro segreto di cespugli). Nessun nemico tranne 3 lupi. La tomba improvvisata di Aldo. Primo **tesoro sepolto** del gioco (tutorial di Brina).

### Regione II — le Colline
- **`accampamento`** — L'accampamento dei minatori, 26×18. Tende (muri di legno), un fuoco (braciere), Ugo e 3 minatori. Più avanti diventa la porta di Pietrafonda. Pietra di passaggio provvisoria.
- **`pietrafonda`** — Pietrafonda, 40×28. Villaggio di pietra (muri di pietra chiara, tetti grigi), un pozzo, la fucina di Ugo, il negozio goblin (dopo *Pace con il clan*). Prima della liberazione: goblin nelle strade, case sbarrate. **Due versioni della mappa** con il sistema delle condizioni ✅ (`cambiaCon`): occupata e liberata.
- **`passo_corvo`** — Il Passo del Corvo, 36×20. Sentiero di montagna stretto tra rocce (cespugli grigi, macerie), un ponte sospeso (strisce di legno), banditi e corvi (nuovo nemico, veloce e fragile). Un carro con le casse di ossidiana (cartello). **Roccia crepata** con un tesoro (si torna con Grisk).
- **`cave_zolfo`** — Le Cave di Zolfo, 34×26, dungeon di mezzo. Sabbia gialla (sabbia con tinta), pozze di zolfo (colore pieno giallo, muri), banditi, banditi con la balestra (tiratori). Cella di **Matteo**. Stanza di **Ferrante**.
- **`miniera_profonda`** 🆕 *(facoltativa, dopo-storia)* — Il Pozzo Profondo, 30×30. Il livello più basso della miniera, raggiungibile solo con la Polvere nera di Grisk. Vene di pietra lunare, golem, la seconda metà della mappa di Ferrante.

### Regione III — la Brughiera
- **`guado`** — Il Guado delle Lanterne, 30×22. Una locanda di legno su palafitte (muri di legno sull'acqua), un pontile, il traghetto (cartello che "parla"), Mamma Orsola, Teodoro, la pietra di passaggio. Notte (`"notte": true`) con lanterne.
- **`palude_lanterne`** — La Palude delle Lanterne, 40×30. Acqua bassa (colore pieno con onde), isolotti d'erba tinta di viola, giunchi (cespugli tinti), nebbia (cartelli "nebbia" ✅ che si diradano). Spettri, fuochi fatui (nuovo nemico: piccolo, veloce, tiratore). Notte.
- **`casa_colle`** — La Casa sul Colle, 24×20. Esterno: un giardino abbandonato. Interno: stanze bruciate (pavimento di legno tinto di scuro). **Nessun nemico.** 8–10 "ricordi" (cartelli con testo, aspetto nuovo: un bagliore). La scala verso l'Osservatorio è una porta runica... aperta dall'interno al primo passaggio.
- **`osservatorio`** — L'Osservatorio di Orvald, 30×26, dungeon di mezzo. Pietra viola, specchi (nuova tessera o colore pieno), porte runiche (si aprono dall'interno, con leve). Cultisti, golem piccoli. Stanza di **Selva** con barriere.

### Dopo-storia
- **`radici`** — Le Radici, 36×36, dungeon segreto su due piani (`radici_alte`, `radici_cuore`). Si entra da una porta runica sotto la Quercia del borgo. Tessere: terra tinta di verde-nero, radici (tronco tinto, muri). Nemici: "eco" dei nemici delle tre regioni (stessi nemici, tinta grigio-verde, più forti). Boss: **la Radice Marcia**.

**Totale:** 12 mappe esistenti ✅ + 15 nuove 🆕 (14 più quella facoltativa) = circa 27 mappe.

## 11. Il bilancio delle ore

| Parte | Tempo | Mappe | Boss / mini-boss |
|---|---|---|---|
| Prologo | 0:20 | 1 🆕 | — |
| Atto I | 1:30 | 6 ✅ + 3 🆕 | Re Melma 🆕, Re Scheletro ✅ |
| Atto II | 1:30 | 3 ✅ + 5 🆕 | Ferrante 🆕, Troll ✅ |
| Atto III | 1:30 | 3 ✅ + 4 🆕 | Selva 🆕, Negromante ✅ |
| Dopo-storia | 0:45 (fino a 1:30 per chi completa tutto) | 2–3 🆕 | Eco ×6, Radice Marcia 🆕 |
| **Totale** | **5:35 – 6:20** | **~27** | **7 + 6 Eco** |

Le stime valgono per un giocatore che segue la storia e fa la maggior parte delle secondarie. Chi corre finisce in circa 3 ore, chi completa tutto in circa 7.

## 12. Decisioni confermate con Ale (22/11/2026) **[deciso]**

- **Nomi:** confermati tutti i nomi proposti per personaggi e luoghi nuovi (*Tessa e Brina, Grisk, Selva, Teodoro, Fausto, Ottone, Ferrante, Mamma Orsola, Pietrafonda, Guado delle Lanterne*).
- **Tono di Berta nell'Atto III:** Berta **difende la sua scelta** ("L'ho fatto per proteggere il borgo!").
- **Il cane Brina:** non combatte, ma con **Fiuta!** cerca **tutto** entro 12 tessere (tesori sepolti, muri segreti, rocce crepate, forzieri nascosti).
- **Sigilli dell'Eco:** ciascun artigiano forgia i sigilli dei boss della sua regione (**Bruno** per la Valle, **Ugo** per le Colline, **Selva** per la Brughiera).
- **Finale:** un solo finale, arricchito dalle battute aggiuntive (quaderno di Lia, tono scelto con Berta e frasi dei tre compagni di viaggio).

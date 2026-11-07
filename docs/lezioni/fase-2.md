# Lezione della fase 2: combattimento

## Cosa abbiamo costruito

Ora la valle è pericolosa. Nella Radura ci sono gli **slime**, nel Sentiero nel bosco anche i **lupi**. Stanno fermi finché non ti avvicini, poi ti inseguono, e se scappi lontano tornano al loro posto.

- **J**: colpisci con la spada di legno. Per un istante compare l'area di colpo (il rettangolo chiaro). Il nemico colpito lampeggia di bianco, viene respinto e sopra di lui sale il numero del danno: bianco, oppure giallo e più grande se è un critico.
- **Spazio**: capriola. Durante lo scatto sei invulnerabile, poi devi aspettare la ricarica.
- Se un nemico ti tocca perdi vita: vieni respinto, lo schermo trema e lampeggi. Mentre lampeggi i nemici non possono ferirti.
- In alto c'è la **barra della vita**, e la vita si conserva cambiando mappa.
- A vita zero compare "Sei stato sconfitto". Poi ricompari all'ingresso della zona con la vita piena, e i nemici sono di nuovo al loro posto.
- **F8** apre la modalità sviluppatore. Da lì puoi mostrare corpi e aree, diventare invulnerabile, ripristinare la vita, teletrasportarti nell'altra mappa e generare nemici.

Numeri: **99 test**, 58 in più della fase 1. Tutte le regole nuove (dadi, danno, critico, vita, aree di colpo, stati dell'eroe, mente dei nemici) sono in `src/systems/` e si testano senza browser.

---

## I concetti nuovi

### 1. La macchina a stati (il concetto principale)

Senza una struttura, il codice dell'eroe diventa presto una rete di booleani: `staAttaccando`, `staSchivando`, `èColpito`, `puòMuoversi`… e prima o poi due sono veri insieme quando non dovrebbero (attaccare durante la capriola, camminare mentre si viene respinti).

Una **macchina a stati** risolve il problema alla radice: l'eroe è sempre in **uno solo** di questi stati.

```
            J (se pronto)              tempo
  libero ───────────────▶ attacco ───────────▶ libero
     │  Spazio (se pronto)        tempo
     ├──────────────────▶ schivata ──────────▶ libero
     │  colpito (se non invulnerabile)   tempo
     ├──────────────────▶ colpito ───────────▶ libero
     │  vita a 0 (da qualsiasi stato)
     └──────────────────▶ sconfitto   (fine: si ricomincia con la scena)
```

**Paragone web:** è come lo stato di una richiesta: `idle → loading → success | error`. Non può essere "loading" ed "error" insieme. Chi ha usato XState o un `useReducer` con un campo `status` ha già visto questa idea.

Nel codice:

- `src/systems/statoEroe.ts`: lo stato è un piccolo oggetto con il nome (`nome`) e alcuni orari: quando è iniziato e fino a quando si è invulnerabili. Le transizioni sono funzioni pure:
  - per il tempo che passa: `aggiornaStato` (riga 40);
  - per un comando: `provaAttacco` (riga 49) e `provaSchivata`;
  - per un evento: `riceviColpo` (riga 65).
- Ogni funzione **rifiuta** le transizioni non permesse e restituisce lo stesso oggetto. Per esempio `provaAttacco` controlla `s.nome !== 'libero'`. Così "attaccare durante la capriola" non è un bug da evitare: non si può proprio scrivere.
- `src/entities/Eroe.ts:112`: lo `switch (this.stato.nome)` decide come ci si muove in ogni stato. Da libero si cammina, durante la capriola si scatta, da colpito si vola all'indietro, durante l'attacco si sta fermi.

I tempi non usano `setTimeout`. Lo stato ricorda **quando** è iniziato, e a ogni fotogramma si confronta con l'ora attuale (`adesso`). È il modo naturale nei giochi: tutto avanza insieme al ciclo di gioco, e nei test basta passare l'ora che vogliamo (`tests/statoEroe.test.ts`).

### 2. Aree di colpo e corpi (hitbox e hurtbox)

I giochi distinguono due rettangoli:

- il **corpo** (*hurtbox*): dove puoi essere colpito, cioè il quadrato del nemico;
- l'**area di colpo** (*hitbox*): dove colpisci tu. Esiste solo mentre l'attacco è attivo.

Il colpo va a segno se i due rettangoli si sovrappongono (design §7: non si tira per colpire). Il test è `intersecano` (`src/systems/geometria.ts:19`): quattro confronti, lo stesso controllo che faresti con due `getBoundingClientRect()`.

`areaDiColpo` (riga 40) appoggia l'area al lato dell'eroe verso cui guarda. Le misure vengono dall'arma in `src/data/armi.json` (`portata`, `larghezzaColpo`). Una lancia avrà una portata maggiore senza toccare il codice.

**Un fendente, un colpo.** L'attacco dura circa 10 fotogrammi: senza precauzioni colpirebbe lo stesso nemico 10 volte. `nuoviColpiti` (riga 64) esclude chi è già stato colpito dal fendente in corso. `GestoreAttacchi` (`src/scenes/mondo/GestoreAttacchi.ts:30`) azzera l'elenco quando inizia un nuovo fendente, e l'eroe numera ogni fendente (`Eroe.ts:98`).

### 3. Invulnerabilità a tempo (i-frames)

Dopo un colpo l'eroe è invulnerabile per 900 ms e **lampeggia** (`Eroe.ts:191`). Senza questa regola un nemico appoggiato all'eroe lo colpirebbe 60 volte al secondo. Il lampeggio comunica la regola al giocatore senza bisogno di spiegarla. Anche la capriola rende invulnerabili: un rischio (devi avvicinarti) in cambio di una ricompensa (attraversi il nemico).

Nella verifica automatica, con due lupi addosso, i colpi subiti arrivavano a 917 e 900 ms di distanza: mai prima della fine dell'invulnerabilità.

### 4. Respinta e "sensazione" del colpo

Un colpo che non si *sente* sembra un bug. Per questo ogni colpo produce più segnali insieme:

- il colpito **vola all'indietro**: gli diamo una velocità nella direzione opposta a chi l'ha colpito (`direzioneDa` in `geometria.ts`);
- il nemico **lampeggia di bianco** per 70 ms;
- sale il **numero del danno**;
- quando è l'eroe a essere colpito, **lo schermo trema** (`gestisciContatti.ts:35`).

Nel gergo dei giochi questo si chiama *game feel* o *juice*: piccoli dettagli che non cambiano le regole ma rendono il gioco piacevole.

### 5. L'intelligenza artificiale dei nemici

L'IA di un nemico semplice è sorprendentemente piccola: una funzione che riceve **ciò che il nemico percepisce** (dove si trova, dov'è casa, dov'è l'eroe) e restituisce **una decisione** (la velocità). Vedi `decidiInseguitore` in `src/systems/ia/inseguitore.ts:37`.

Anche qui c'è una mini macchina a stati: `riposo → insegue → ritorno → riposo`.

Nota i **due raggi**: si accorge di te a 80 px (`raggioVista`) ma rinuncia solo oltre 140 (`raggioAbbandono`). Con un raggio solo, stando proprio al confine il nemico alternerebbe "inseguo/non inseguo" a ogni fotogramma, tremolando. È la stessa tecnica (isteresi) dei termostati.

`creaMenteInseguitore` (riga 62) avvolge la funzione in una **closure** che ricorda la modalità tra un fotogramma e l'altro (`let modalita`, riga 63). È un pattern JavaScript che conosci già, usato per dare memoria a una funzione.

### 6. Il registro dei comportamenti

In `src/data/nemici.json` ogni nemico dice `"comportamento": "inseguitore"`. Il registro (`src/systems/ia/comportamenti.ts:15`) è una semplice tabella "nome → funzione che crea la mente", come una mappa di handler per tipo di messaggio, o le rotte di un server Express.

Per aggiungere il tiratore della fase 8 basterà scrivere la sua mente e aggiungere una riga al registro. Tutti i nemici con `"comportamento": "tiratore"` la useranno.

Il pannello F8 usa la stessa idea al contrario: crea una voce "Genera nemico" per **ogni** nemico nel JSON (`ScenaSviluppatore.ts:54`).

### 7. Il caso, reso testabile

Dadi e critici dipendono dal caso: come si testa una cosa casuale? Le funzioni non chiamano `Math.random()` direttamente, ma ricevono il generatore come parametro (`src/systems/casuale.ts:7`). Nel gioco gli passiamo il caso vero. Nei test usiamo `casualeFisso([0, 0.5])` (riga 12), che restituisce i numeri che decidiamo noi. Così possiamo verificare esattamente cosa succede con un critico o con il tiro minimo (`tests/combattimento.test.ts`).

È la *dependency injection* del mondo web, applicata al caso.

La formula del danno (`src/systems/combattimento.ts`) segue il §7:

- prima si decide il critico (riga 35);
- poi si tira il dado e si aggiungono modificatore e bonus;
- il critico raddoppia il totale;
- si toglie l'armatura;
- il risultato è minimo 1 (riga 39).

Fino alla fase 3 i modificatori valgono 0, quindi il critico è al 5%.

### 8. Fisica: collider contro overlap, e i gruppi

- **collider**: i due oggetti non possono sovrapporsi e la fisica li separa. Lo usiamo per nemici contro muri e per nemici contro nemici, così non si ammucchiano (`GruppoNemici.ts:20–21`).
- **overlap**: i due oggetti possono sovrapporsi e la fisica chiama una nostra funzione quando succede. Lo usiamo per eroe contro nemici (`gestisciContatti.ts:20`): il contatto ferisce ma non spinge.

Un **gruppo fisico** (`physics.add.group()`) raccoglie molti oggetti. Le regole impostate sul gruppo valgono anche per i nemici aggiunti dopo, come quelli generati con F8.

### 9. Tween: animazioni dichiarative

`scena.tweens.add({ targets, y, alpha, duration })` anima una proprietà nel tempo, come una transizione CSS o la Web Animations API. La usiamo per:

- i numeri del danno (`src/scenes/mondo/numeriDanno.ts:33–34`): due tween in parallelo, una sale e l'altra fa svanire;
- la scomparsa dei nemici sconfitti (`Nemico.ts:92`).

### 10. JustDown: premere contro tenere premuto

Per camminare chiediamo "il tasto è giù?" (`isDown`). Per attaccare invece usiamo `JustDown` (`src/entities/Comandi.ts:33`), vero **solo nel fotogramma** in cui il tasto viene premuto. È la differenza tra lo stato di un tasto e l'evento `keydown`. Tenendo premuto J si fa un solo fendente: per il successivo serve premere di nuovo.

---

## Esercizio facoltativo

**Crea un nuovo nemico solo con i dati.**

1. In `src/data/nemici.json` aggiungi un **"cinghiale"**: vita 20, armatura 2, danno "1d8", velocità 90, raggioVista 60, raggioAbbandono 120, dimensione 14, un colore marrone. Lo immaginiamo veloce, che ti nota tardi e rinuncia presto.
2. Mettine uno nel bosco: in `src/data/mappe/bosco.json` aggiungi alla legenda `"C": {"tipo":"nemico","nemico":"cinghiale","colore":"#5f8a43"}` e sostituisci un `.` della griglia con `C`. Mettilo lontano dagli ingressi, altrimenti un test ti fermerà.
3. Chiedimi test e compilazione, poi provalo. Con F8 comparirà da solo anche la voce "Genera nemico: Cinghiale".

**Domanda per riflettere:** il cinghiale ha armatura 2 e la spada fa 1d6. Quante volte colpisce mediamente il tuo fendente prima di abbatterlo? E se l'armatura fosse 6, cosa succederebbe con la regola del "minimo 1"?

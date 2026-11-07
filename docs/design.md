# Design del gioco: RPG fantasy 2D nel browser

Documento di design approvato in fase di brainstorming. È la fonte di verità del progetto: ogni fase di sviluppo deve rispettarlo. Le modifiche si fanno aggiornando questo file.

## 1. Obiettivo e contesto

- **Scopo:** imparare a programmare videogiochi costruendo un gioco di ruolo completo, una fase alla volta.
- **Chi lo sviluppa:** programmatore web (JavaScript, app, script) senza esperienza di videogiochi. Il codice deve essere chiaro, commentato in italiano e accompagnato da spiegazioni dei concetti nuovi.
- **Vincolo ambiente:** sul PC non si può installare nulla. Tutto lo sviluppo (Node, npm, compilazione, test) avviene dentro Claude Cowork. Il risultato è un unico file `gioco.html` che si apre con doppio clic in un browser.
- **Criterio di successo:** al termine di ogni fase esiste una versione giocabile che dimostra la funzionalità della fase, e lo sviluppatore capisce come funziona il codice che la realizza.

## 2. Scelte di base

| Aspetto | Scelta |
|---|---|
| Genere | Gioco di ruolo d'azione in stile D&D |
| Visuale | 2D visto dall'alto, stile Zelda / Pokémon |
| Combattimento | In tempo reale (attacchi, schivata) |
| Controlli | **Mouse, punta e clicca** (stile Diablo): il gioco si completa interamente col mouse; la tastiera offre solo scorciatoie facoltative (§13) |
| Piattaforma | Browser, giocatore singolo, nessuna parte online |
| Tecnologia | Phaser (ultima versione stabile) + TypeScript + Vite |
| Consegna | Un solo file `dist/gioco.html` autosufficiente (Vite + plugin single-file) |
| Mappe | Griglie di caratteri in file di dati (niente editor esterni) |
| Grafica | Fasi 1–8 forme geometriche colorate; fase 9 pixel art gratuita con licenza libera (es. Kenney, itch.io), tessere 16×16 |
| Ambientazione | Fantasy medievale classico |

## 3. Ambientazione e storia (proposta modificabile)

### Antefatto

**Borgo Quercia** è un villaggio di boscaioli e minatori in una valle tra boschi e colline. Prende il nome dalla **Quercia Antica** della piazza: secondo la leggenda, finché resta in piedi, la valle è protetta.

Vent'anni fa una febbre colpì il villaggio. Il guaritore, **maestro Orvald**, curò tutti tranne sua figlia **Lia**, che morì. Accecato dal dolore, Orvald tentò di riportarla in vita con la negromanzia. I paesani lo scoprirono e lo cacciarono. Da allora nessuno ha più pronunciato il suo nome.

Oggi Orvald è tornato. Dalla torre in rovina oltre le colline prepara il **Grande Risveglio**: alla prossima *luna nera* vuole riportare in vita tutti i morti della valle, convinto che la morte sia un'ingiustizia da correggere. Lia compresa. Per il rito gli servono tre cose: le ossa dei re sepolti nella cripta, l'ossidiana nera della miniera e il legno della Quercia Antica.

### L'eroe

Un viaggiatore senza legami con la valle: la classe la sceglie il giocatore (fase 3). La storia inizia quando la strada principale è bloccata dai non morti e l'eroe arriva a Borgo Quercia in cerca di riparo. Trova un villaggio barricato, e qualcuno che ha bisogno di una spada (o di un incantesimo).

### Personaggi del villaggio

| Personaggio | Ruolo | Cosa porta alla storia |
|---|---|---|
| **Sindaca Berta** | guida del villaggio | Affida le missioni principali. Era tra chi cacciò Orvald e lo nasconde. |
| **Frate Anselmo** | custode della cappella | Era amico di Orvald. Conosce la verità e la racconta dopo il primo dungeon. |
| **Bruno** | fabbro | Crafting e potenziamenti (fase 6). Ha perso il figlio nella miniera invasa. |
| **Gemma** | mercante | Negozio (fase 5). Pettegola: i suoi commenti cambiano dopo ogni boss. |
| **Tobia** | oste della taverna *Il Cinghiale Zoppo* | Ingaggia i compagni e dà indizi sui tesori nascosti. |
| **Nonna Rosalba** | la più anziana | Racconta le leggende della Quercia. Le sue storie nascondono indizi sui muri segreti. |

### Compagni della taverna

| Compagno | Classe | Carattere |
|---|---|---|
| **Corrado** | Guerriero | Ex soldato burbero, protettivo. |
| **Elisa** | Maga | Studentessa fuggita dall'accademia, curiosa e un po' sbadata. |
| **Nives detta "Volpe"** | Ladra | Ironica. Conosce ogni serratura della valle. |
| **Sorella Agata** | Chierica | Allieva di frate Anselmo, calma e testarda. |

### La trama in tre atti

**Atto I: la Cripta dei Non Morti.** I morti escono dalla cripta del cimitero sulla collina. In fondo c'è il **Re Scheletro**, l'antico re Gualtiero, risvegliato da Orvald come primo guardiano. Sconfitto il re, l'eroe trova una pagina del diario di Orvald che parla di "riportarla indietro". Frate Anselmo, messo davanti alla pagina, racconta la storia di Orvald e Lia.

**Atto II: la Miniera dei Goblin.** I goblin sono scesi in miniera perché i non morti hanno invaso le loro colline. Sono pericolosi ma anche loro in fuga. Il **Troll delle Caverne** porta al collo un sigillo che lo rende schiavo di Orvald: lo costringe a scavare l'ossidiana nera. Spezzato il sigillo, il troll sconfitto si ritira e i goblin smettono di attaccare il villaggio. Al ritorno l'eroe trova la Quercia Antica ferita: un ramo è stato tagliato. Orvald ha tutto ciò che gli serve.

**Atto III: la Torre del Negromante.** È la notte della luna nera. In cima alla torre, durante lo scontro, **il Negromante** usa i ricordi del villaggio contro l'eroe: evoca le ombre dei paesani morti nella febbre. Sconfitto Orvald, il rito si spezza. Lo spirito di Lia appare per un istante, prende la mano del padre e lo porta via con sé, in pace.

**Finale.** La luna nera passa e i morti tornano a riposare. A Borgo Quercia la sindaca Berta ammette davanti a tutti cosa accadde vent'anni fa. Si pianta un germoglio della Quercia Antica sulla tomba di Lia. I negozi e la taverna restano aperti, e il mondo resta esplorabile per le quest rimaste.

**Temi:** il lutto, l'accettazione, le colpe del passato che una comunità deve riconoscere. Tono avventuroso, con momenti malinconici ma senza crudezza.

### I dungeon

| Dungeon | Nemici | Boss | Meccanica del boss |
|---|---|---|---|
| 1. Cripta dei Non Morti | scheletri, zombie, pipistrelli | Re Scheletro | sotto metà vita evoca scheletri |
| 2. Miniera dei Goblin | goblin, goblin arcieri, ragni | Troll delle Caverne | cariche in linea retta, sotto metà vita fa crollare massi |
| 3. Torre del Negromante | cultisti, spettri, golem | Il Negromante | si teletrasporta, evoca, lancia incantesimi |

### Le zone aperte

Lupi, banditi e slime.

- **Radura di Borgo Quercia**: subito fuori dal villaggio, nemici deboli (slime).
- **Sentiero nel bosco**: verso il cimitero e la cripta (slime, lupi).
- **Colline Grigie**: verso la miniera (lupi, banditi).
- **Brughiera della Torre**: l'ultima zona, dove i nemici delle zone aperte sono più forti.

### Agganci per le quest secondarie (fase 7)

- *Elimina:* i lupi che attaccano il gregge del pastore Dario.
- *Raccogli:* erbe del bosco per gli unguenti di frate Anselmo.
- *Consegna:* una lettera di Bruno al fratello, rifugiato oltre le colline.
- *Trova un tesoro:* la mappa del tesoro di un vecchio cavaliere, venduta da Gemma. Porta alla spada del cavaliere, nascosta dietro un muro segreto.

### Come entra la storia nel gioco

Dialoghi e personaggi arrivano nella fase 5, quest e registro nella fase 7, dungeon e boss nella fase 8, il testo introduttivo nella fase 9 (menu). I testi stanno in `data/` come tutti gli altri contenuti.

## 4. Architettura del codice

```
src/
  scenes/     schermate Phaser: Caricamento, Menu, CreazionePersonaggio, Mondo, Interfaccia (HUD)
  entities/   oggetti vivi nel mondo: Eroe, Nemico, Boss, Abitante, Compagno
  systems/    regole del gioco in TypeScript puro, SENZA Phaser:
              caratteristiche, combattimento, ricerca del percorso (A*), inventario, crafting, quest, negozio, salvataggio
  data/       contenuti in JSON / testo: classi, armi, oggetti, nemici, ricette, quest, compagni, mappe
  audio/      il sintetizzatore (Web Audio): effetti e musica generati dal codice, note scritte in data/ (fase 9c)
tests/        test automatici dei systems (Vitest)
docs/         questo documento e le note di lezione
dist/         gioco.html compilato
```

Principi:
- Ogni file ha un compito solo; se un file cresce troppo, va diviso.
- I `systems` non conoscono Phaser: ricevono dati, restituiscono risultati, sono testabili da soli.
- I contenuti stanno in `data/`: aggiungere armi, nemici, quest o mappe non deve richiedere modifiche al codice, salvo nuovi tipi di effetto o comportamento.

### Formato delle mappe

Griglia di caratteri con una legenda per mappa. Esempio:

```
##########
#..M...T.#
#........#
#...@....D
##########
```

`#` muro, `.` pavimento, `@` partenza, `M` mercante, `T` taverna, `D` porta del dungeon. Ogni mappa dichiara la sua legenda e le uscite verso altre mappe.

### Formato delle armi

```json
{
  "id": "lama_del_vuoto",
  "nome": "Lama del Vuoto",
  "tipo": "spada",
  "slot": "primaria",
  "rarita": "esotica",
  "dado": "1d10",
  "caratteristica": "FOR",
  "effetti": ["risucchio_vita", "colpo_critico_doppio"]
}
```

Gli effetti sono etichette interpretate da un registro di effetti nel codice. Nuove armi combinano effetti esistenti; un effetto nuovo richiede codice.

## 5. Personaggio e caratteristiche

Sei caratteristiche D&D. Modificatore = arrotondato per difetto di (valore − 10) / 2.

| Caratteristica | Effetto |
|---|---|
| FOR | danni con armi pesanti in mischia |
| DES | danni con armi leggere e a distanza, probabilità di critico, ricarica della schivata più breve |
| COS | punti vita |
| INT | danni e mana degli incantesimi |
| SAG | potenza delle cure, rigenerazione del mana |
| CAR | prezzi migliori dal mercante, costo minore dei compagni, ricompense maggiori delle quest |

- Valori iniziali per classe (sotto) più 2 punti liberi alla creazione.
- Alla creazione i 2 punti liberi vanno su due caratteristiche diverse (al massimo 1 per caratteristica) e nessun valore può superare 16.
- 1 punto da assegnare a ogni livello. Livello massimo 20.
- **Curva dell'esperienza:** per raggiungere il livello L servono in totale 25 × L × (L − 1) punti esperienza (livello 2 = 50, 5 = 500, 10 = 2.250, 20 = 9.500). Le soglie stanno in `data/livelli.json`; ogni nemico indica nei dati quanta esperienza dà.

## 6. Classi

| Classe | FOR | DES | COS | INT | SAG | CAR | Arma iniziale | Abilità |
|---|---|---|---|---|---|---|---|---|
| Guerriero | 15 | 12 | 14 | 8 | 10 | 10 | spada e scudo | Parata: blocca i colpi frontali per un breve tempo |
| Mago | 8 | 12 | 12 | 15 | 12 | 10 | bastone (dardi magici, usa mana) | Palla di fuoco: danno ad area |
| Ladro | 10 | 15 | 12 | 10 | 10 | 12 | pugnali | Scatto nell'ombra: breve invisibilità, danno doppio alle spalle |
| Chierico | 12 | 10 | 12 | 10 | 15 | 10 | mazza | Cura; danno extra contro i non morti |

- **Punti vita:** vita base della classe + crescita per livello × (livello − 1) + modificatore di COS × livello. Valori iniziali: Guerriero 14 (+6 per livello), Chierico 11 (+5), Ladro 10 (+4), Mago 8 (+3). L'ordine Guerriero > Chierico > Ladro > Mago resta; i numeri stanno nei dati e si bilanciano giocando.
- **Mana:** solo Mago e Chierico. Massimo = base della classe + 2 × modificatore di INT; si rigenera nel tempo, più in fretta con SAG alta.
- **Abilità di classe:** si attivano con il pulsante dell'abilità nella barra in basso (scorciatoia E). Hanno una ricarica, e quelle di Mago e Chierico costano mana.
- **Ladro:** il danno doppio alle spalle è una capacità passiva sempre attiva; lo Scatto nell'ombra (i nemici perdono l'eroe) è il modo naturale per arrivare alle spalle.
- **Chierico:** +1d6 di danno contro i nemici con l'etichetta "non morto".

## 7. Combattimento

- **Tempo reale:** se l'area di colpo dell'arma tocca il nemico, il colpo va a segno. Non si tira per colpire.
- **Col mouse:** cliccando un nemico l'eroe lo raggiunge (o, con un'arma a distanza, si ferma a portata di tiro) e attacca nella sua direzione; tenendo premuto continua ad attaccare.
- **Danno:** dado dell'arma + modificatore della caratteristica dell'arma + bonus di potenziamento. Il numero compare sopra il bersaglio.
- **Critico:** 5% base + 1% per punto di modificatore DES + bonus dell'arma; danno doppio.
- **Armatura:** riduce il danno subito. È la somma dei pezzi indossati (§8) più eventuali pozioni di resistenza.
- **Schivata:** capriola verso il cursore (tasto destro), con breve invulnerabilità e ricarica.
- **Invulnerabilità dopo un colpo subito:** breve, con lampeggio.
- **Arma primaria** (mischia o bastone) col clic sinistro e **secondaria** (arco, balestra, pugnali da lancio, bacchetta) dal suo pulsante nella barra in basso.
- **Nemici:** comportamenti riutilizzabili: inseguitore, tiratore a distanza, caricatore. Definiti nei dati.
- **Boss:** a fasi; sotto metà vita cambiano schema di attacco.

## 8. Oggetti, inventario e rarità

| Rarità | Colore | Dove si trova |
|---|---|---|
| Comune | grigio chiaro | armi iniziali delle classi, pozioni e oggetti semplici |
| Non comune | verde | ovunque |
| Rara | blu | forzieri, nemici forti, negozio |
| Leggendaria | viola | boss, tesori nascosti, crafting con materiali dei boss |
| Esotica | oro | al massimo una nascosta per dungeon + piccola probabilità dai boss; non si crea col crafting |

- **Leggendarie:** molto più forti delle altre armi.
- **Esotiche:** cambiano il modo di giocare (es. arco che rimbalza tra i nemici, spada con scia di fuoco, pugnale che rende invisibili dopo un'uccisione).
- **Inventario:** griglia con spazi limitati (12 all'inizio); pozioni e materiali si impilano. Si amplia con borse e zaini più grandi (fino a 24 spazi): una borsa si trova in un forziere, gli altri si comprano dal mercante.
- **Raccolta:** gli oggetti a terra (bottino dei nemici, contenuto dei forzieri) si raccolgono passandoci sopra, se lo zaino ha spazio.
- **Pozioni:** vita, mana, forza temporanea, resistenza.
- **Armature:** quattro pezzi indossabili, cioè **elmo, corazza, guanti e stivali**, con le stesse rarità delle armi. Ogni pezzo dà armatura; i leggendari danno anche un bonus alle caratteristiche; gli esotici hanno un **effetto speciale** (es. stivali con due capriole di fila, corazza che rimanda parte del danno, elmo che mostra i tesori nascosti vicini). Le armature si cambiano **solo dalla scheda del personaggio**, non dalla barra dei preferiti.
- **Limite delle esotiche:** si può equipaggiare **al massimo un'arma esotica** (tra primaria e secondaria) e **al massimo un pezzo di armatura esotico**. Senza questo limite, un eroe tutto esotico sarebbe troppo squilibrato.
- **Barra dei preferiti:** 6 spazi in fondo allo schermo (tasti 1–6) per **pozioni e armi**: un clic beve la pozione o impugna l'arma (quella di prima torna nello zaino). Si riempie trascinando gli oggetti dallo zaino; lo spazio è un collegamento all'oggetto, non lo sposta. Cambiare arma dalla barra ha una breve attesa (mezzo secondo).
- **Tesori nascosti:** muri segreti, forzieri fuori percorso, mappe del tesoro (quest secondarie).

## 9. Crafting ed economia

- **Fabbro:** crea armi da ricette con materiali raccolti da nemici, forzieri e minerali. Le ricette si trovano come pergamene o si comprano. Potenziamento delle armi da +1 a +5.
- **Monete:** da nemici, forzieri, quest e vendite.
- **Mercante:** vende pozioni, armi, borse e zaini; ricompra a metà prezzo. CAR migliora i prezzi in entrambe le direzioni.

## 10. Taverna e compagni

- Un compagno per ciascuna delle 4 classi, ingaggiabile a pagamento in taverna. Uno alla volta, sostituibile.
- Il compagno segue l'eroe e **combatte da solo**: attacca il nemico più vicino, riusando l'intelligenza artificiale dei nemici con bersagli invertiti. Infligge meno danni dell'eroe (circa la metà) per non risolvere i combattimenti al suo posto.
- Ha un bonus fisso e un'**abilità speciale** con ricarica, attivata dal giocatore con il pulsante del compagno nella barra in basso:
  - Chierico: cura l'eroe
  - Ladro: apre forzieri chiusi a chiave e segnala i tesori vicini
  - Guerriero: para un colpo al posto dell'eroe
  - Mago: scudo magico
- Se viene messo al tappeto si rialza a fine combattimento. Non si perde mai.

## 11. Mondo e quest

- **Borgo Quercia** (villaggio base): mercante, fabbro, taverna, abitanti con quest.
- **Zone aperte** collegano il villaggio ai dungeon.
- **Dungeon:** più stanze, chiavi e porte chiuse, muri segreti, un tesoro nascosto, stanza del boss. Difficoltà crescente.
- I nemici normali ricompaiono rientrando in una zona; i boss no.
- **Quest principale:** ogni boss sconfitto sblocca il dungeon successivo; il Negromante è il boss finale.
- **Quest secondarie:** tipi riutilizzabili definiti nei dati: elimina nemici, raccogli oggetti, consegna, trova un tesoro.
- Chi ha una quest mostra un punto esclamativo; un registro delle quest tiene traccia dei progressi.
- Il mondo deve poter crescere: nuovi villaggi e dungeon si aggiungono con nuove mappe e dati.

## 12. Salvataggio e morte

- **Tasto salva sempre disponibile:** icona a forma di floppy disk anni '80 in pixel art nell'interfaccia, cliccabile in qualsiasi momento (anche in combattimento), con animazione e un breve "bip". Scorciatoia da tastiera facoltativa: F2.
- Salvataggio automatico all'ingresso nel villaggio.
- 3 slot di salvataggio, conservati nel browser (localStorage).
- **Morte senza penalità:** si ricompare all'ingresso della zona corrente con monete e oggetti intatti.

## 13. Comandi

Il gioco si gioca **col mouse**. Il cursore cambia aspetto per dire cosa farà il clic (spada sopra un nemico, mano sopra un personaggio o un forziere).

| Azione | Mouse | Scorciatoia facoltativa |
|---|---|---|
| Camminare | clic sinistro sul terreno (tenendo premuto l'eroe segue il cursore); l'eroe aggira gli ostacoli da solo | WASD o frecce |
| Attaccare con l'arma primaria | clic sinistro su un nemico (tenere premuto per continuare) | J |
| Interagire / parlare / aprire | clic sinistro su personaggio, forziere o porta | F |
| Schivata (capriola) | clic destro, verso il cursore | Spazio |
| Abilità di classe | pulsante nella barra in basso; se va mirata, poi clic sul bersaglio | E |
| Arma secondaria | pulsante nella barra in basso, poi clic sul bersaglio | K |
| Abilità del compagno | pulsante nella barra in basso | Q |
| Barra dei preferiti (pozioni e armi) | clic sullo spazio nella barra in basso | 1 – 6 |
| Inventario | icona dello zaino | I |
| Scheda del personaggio (caratteristiche, equipaggiamento, armature) | icona del ritratto | C |
| Registro quest | icona della pergamena | L |
| Salva | icona del dischetto | F2 |
| Modalità sviluppatore | icona dell'ingranaggio | F8 |

## 14. Verifiche

- I `systems` hanno test automatici (Vitest), eseguiti prima di ogni consegna.
- Ogni fase si chiude con una lista di cose da provare giocando.
- **Modalità sviluppatore (icona dell'ingranaggio o F8):** mostra le aree di colpo, permette di aggiungere oggetti, monete ed esperienza, di diventare invulnerabili e di teletrasportarsi tra le mappe.
- In caso di errore il gioco non deve bloccarsi in silenzio: mostra un messaggio leggibile e lo scrive nella console del browser.

## 15. Fasi di sviluppo

Ogni fase produce un `gioco.html` giocabile e una nota di lezione in `docs/lezioni/`.

1. **Il mondo si muove:** eroe che cammina su una mappa a griglia, collisioni con i muri, telecamera che segue, cambio tra due mappe.
2. **Combattimento:** attacco primario, schivata, nemici con comportamento inseguitore, vita, invulnerabilità dopo il colpo, morte e ricomparsa, modalità sviluppatore.
3. **Il personaggio**, in tre consegne:
   - **3a – Chi sei:** creazione con le 4 classi e le 6 caratteristiche, armi delle classi, esperienza, livelli, punti da assegnare, scheda del personaggio.
   - **3b – Punta e clicca:** controlli col mouse, ricerca del percorso (A\*), attacco cliccando i nemici, capriola col tasto destro, barra in basso e icone dei menu.
   - **3c – Cosa sai fare:** mana, proiettili, le quattro abilità di classe mirate col mouse, nemici non morti.
4. **Oggetti e inventario**, in tre consegne:
   - **4a – Lo zaino:** inventario ampliabile, pozioni ed effetti a tempo, forzieri, bottino, raccolta da terra.
   - **4b – Armi e armature:** arma primaria e secondaria, armature (elmo, corazza, guanti, stivali), rarità, effetti delle armi ed effetti speciali delle armature esotiche, limite di una esotica per tipo, muri segreti e tesori nascosti.
   - **4c – Barra dei preferiti:** 6 spazi configurabili per pozioni e armi, trascinamento dallo zaino, cambio rapido d'arma.
5. **Il villaggio:** Borgo Quercia, dialoghi, monete, mercante, taverna, compagno che combatte con abilità speciale.
6. **Crafting:** materiali, ricette, fabbro, potenziamenti.
7. **Quest:** quest principale e secondarie, registro.
8. **Dungeon e boss:** i 3 dungeon completi con i loro boss.
9. **Rifinitura:** salvataggio con dischetto e 3 slot, menu, grafica pixel art, suoni e musica.

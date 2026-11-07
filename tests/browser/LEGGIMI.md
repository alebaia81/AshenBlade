# Prove nel browser

Queste prove aprono `dist/gioco.html` in un browser automatico (Chromium senza finestra, pilotato con **Playwright**) e lo usano come farebbe un giocatore: clic, tasti, attese. Poi controllano lo stato del gioco e salvano delle schermate.

Sono diverse dai test in `tests/*.test.ts` (Vitest):

| | Test Vitest | Prove nel browser |
|---|---|---|
| Cosa controllano | le regole pure in `src/systems/` | il gioco intero, compilato |
| Velocità | millisecondi | decine di secondi |
| Quando | a ogni modifica | prima di ogni consegna |

Il PC non permette installazioni, quindi le esegue Claude nel suo ambiente di lavoro, dove Playwright e Chromium sono già presenti:

```
node tests/browser/fase-3a.cjs <percorso di gioco.html> <cartella per le schermate>
```

Ogni controllo stampa `OK` o `ERRORE`; alla fine c'è il riepilogo. Se c'è almeno un errore lo script termina con codice 1.

Il gioco espone `window.gioco` (vedi `src/main.ts`): le prove lo usano per leggere lo stato (per esempio la Partita nel registro) e, quando serve, per preparare una situazione senza doverla raggiungere giocando (per esempio mettere uno slime davanti all'eroe).

Le schermate stanno in `docs/schermate/`.

## Le prove

- `fase-3a.cjs`: creazione del personaggio, livelli, scheda.
- `fase-3b.cjs`: controlli col mouse, percorso, attacco cliccando.
- `fase-3c.cjs`: mana, abilità di classe, proiettili.
- `fase-4a.cjs`: zaino, pozioni, forzieri, bottino.
- `fase-4b.cjs`: armi e armature, muro segreto, limite delle esotiche, arma secondaria, effetti speciali.
- `fase-4c.cjs`: barra dei preferiti, trascinamento dallo zaino, cambio rapido d’arma.
- `fase-5a.cjs`: Borgo Quercia, dialoghi, monete, collegamento con la Radura.
- `fase-5b.cjs`: la bottega di Gemma: comprare, vendere, Carisma, zaino pieno.
- `fase-5c.cjs`: la taverna e i compagni: ingaggio, ti segue, combatte, al tappeto e rialzo, abilità speciali e bonus.
- `fase-6a.cjs`: vene di minerale, fucina di Bruno, ricette, pergamene.
- `fase-6b.cjs`: potenziamenti nella fucina: arma in mano e nello zaino, preferiti, materiali mancanti, +5, danno in gioco.
- `fase-7a.cjs`: quest: segni sopra le persone, dialoghi con condizioni, registro, elimina (lupi), raccogli (erbe, carbone), ricompensa a terra con lo zaino pieno.
- `fase-7b.cjs`: Cimitero e Colline Grigie, quest principale e chiave della cripta, cancello e frana, lettera di Bruno a Ugo, mappa del cavaliere e tesoro nascosto.
- `fase-8a.cjs`: Cripta dei Non Morti: cancello e porta d'ossa, forziere chiuso (chiave piccola e Volpe), Re Scheletro (barriere, fasi, evocazione, non ricompare), la verità di Anselmo.
- `fase-8b.cjs`: Miniera dei Goblin: frana sparita, banditi, goblin arcieri (frecce), ragni (carica), vene di cristallo, Troll delle Caverne (carica e massi), Quercia ferita, Rosalba.
- `fase-8c.cjs`: Torre del Negromante: nebbia sparita, Brughiera di notte, cancello e forzieri della torre, il Negromante (teletrasporto, ventaglio, ombre), il finale, Berta, il germoglio.
- `fase-9a.cjs`: menu iniziale, introduzione, slot, dischetto e F2, salvataggio automatico nel borgo, pausa e opzioni, ricarica della pagina e "Continua", esporta/importa, slot rovinati ed eliminati.
- `fase-9b.cjs`: pixel art: fogli Kenney dentro il file, tessere delle mappe su canvas, figure di eroe, persone e nemici, camminata simulata, lampo bianco, tinte, forzieri e muri segreti, ritratto nel dialogo, schermate di tutte le zone (e il confronto prima/dopo).
- `fase-9c.cjs`: suoni e musica: l'audio parte al primo clic, la musica cambia per zona e durante lo scontro col boss, gli effetti (clic, colpo, magia, capriola, bip, raccolta, livello, forziere, porta, boss), i volumi nelle opzioni ricordati dopo una ricarica. Il browser automatico non ha altoparlanti: la prova controlla cosa il gioco CHIEDE di suonare (`window.suoni.stato`).

Dalla fase 9a il gioco si apre sul **menu**: `vaiAllaCreazione` (in `aiuti.cjs`) fa Nuova partita → slot 1 → salta l'introduzione, e `creaPersonaggio` la usa. Le posizioni dei pulsanti del menu sono in `MENU`.

Le prove sono sensibili ai tempi: farne girare molte insieme sullo stesso computer può farne fallire qualcuna per lentezza. Una prova che fallisce solo in gruppo va rifatta da sola prima di cercare un errore.

Dalla fase 5 la partita inizia nel borgo: `creaPersonaggio` porta nella Radura, dove sono state scritte le prove precedenti, a meno che non si passi `'borgo'` come terzo argomento.

Le coordinate della barra in basso sono in `aiuti.cjs` (`BARRA`), condivise da tutte le prove.

## Tutte le prove insieme

Per una verifica completa (prima di una consegna) le prove si eseguono tutte, meglio due alla volta: con più prove insieme il computer rallenta e quelle sensibili ai tempi (cambio d'arma, carica del troll, saltello della camminata) possono fallire per lentezza. Una prova che fallisce solo in gruppo va rifatta da sola prima di cercare un errore nel gioco.

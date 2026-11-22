# Lezione della fase 11: Espandere il mondo con i dati (e pochissimo codice)

In questa fase abbiamo raddoppiato l'Atto I aggiungendo un intero **Prologo** (*La Strada Maestra*) e tre nuove zone nella Valle (*Il Mulino del Ponte*, *Cantine del Mulino*, *La radura di Aldo*), quattro personaggi (**Teodoro**, **Fausto**, **Ottone**, **Tessa**), un mini-boss (**Re Melma**), due nuovi nemici, sette quest e le prime **Ghiande d'oro**.

Il punto più importante per chi viene dallo sviluppo web è notare **quanto poco codice TypeScript abbiamo dovuto toccare** rispetto alla Fase 10.

---

## 1. Architettura "Data-Driven": il motore legge, i JSON raccontano

Nel web siamo abituati a separare un componente React/Vue (il *motore* che sa renderizzare una pagina) dal payload JSON che arriva da un CMS o da un'API REST.
Grazie alle fondamenta costruite nella Fase 10, quasi tutta la Fase 11 è stata **contenuto dichiarativo**:

- **Mappe collegate come rotte di un router** (`src/data/mappe/*.json`):
  In `caricaDati.ts` (`import.meta.glob('./mappe/*.json', { eager: true })`), Vite importa automaticamente ogni nuovo file JSON aggiunto nella cartella `mappe/`.
  Inoltre, `validaMondo()` in `src/systems/mondo.ts` fa da "linter delle rotte": controlla che ogni cella `uscita` (es. `u` nella *Strada Maestra* verso `borgo`, arrivo `o`) trovi nella mappa di destinazione un simbolo di tipo `arrivo` corrispondente, e `tests/datiMappe.test.ts` verifica che nessun nemico nasca a meno di 6 tessere da un ingresso.

- **Negozi multipli parametrizzati** (`src/scenes/ScenaDialogo.ts:137`, `src/scenes/ScenaMondo.ts:1656`):
  Prima c'era solo la bottega di Gemma. Passando `this.idAbitante` da `ScenaDialogo` a `mondo.apri('negozio', idAbitante)`, la scena controlla se esiste `this.dati.negozi[idAbitante]` in `negozio.json`. Così **Teodoro** apre il suo *Carro di Teodoro* (dove vende la `pala` e i materiali) senza duplicare una sola riga di `ScenaNegozio.ts`.

---

## 2. Piccole estensioni mirate ai sistemi: `dividi` e `dardo_diviso`

Quando un nuovo boss o un nuovo oggetto esotico introduce una meccanica inedita, aggiungiamo **un'etichetta** nei dati e una **funzione pura** in `src/systems/`:

1. **L'attacco `dividi` del Re Melma** (`src/systems/boss.ts:15`, `src/scenes/mondo/GestoreBoss.ts:87` e `:155`):
   - In `boss.json`, la seconda fase del Re Melma (`sottoVita: 0.5`) dichiara `{ "tipo": "dividi", "nemico": "melma_piccola", "quanti": 2, "massimo": 4, "ricaricaMs": 6500, "probabilita": 0.5 }`.
   - In `GestoreBoss.aggiorna()`, confrontiamo la vita attuale del boss con `this.ultimaVita`: ogni volta che `attuale < this.ultimaVita` (indipendentemente dal fatto che il danno arrivi da una spada, una freccia, una palla di fuoco o un compagno), parte `this.subitoColpo()`, che con probabilità 50% genera una `melma_piccola` in una cella libera vicina, rispettando sempre il tetto `massimo` calcolato da `quantiEvocare()`.

2. **L'effetto esotico `dardo_diviso` del Bastone della melma** (`src/systems/effettiArmi.ts:77`, `src/scenes/ScenaMondo.ts:1989`):
   - La matematica sta nella funzione pura `direzioniDardoDiviso(direzione, angoloGradi)`: prende il vettore unitario del tiro, calcola l'angolo con `Math.atan2(y, x)` e restituisce due vettori ruotati di `±9°`.
   - In `ScenaMondo.tiraProiettile()`, se l'arma ha l'effetto `'dardo_diviso'` ed è il tiro principale (`!giàDiviso`), la funzione chiama ricorsivamente se stessa due volte con `giàDiviso = true` per le due direzioni angolate.

---

## 3. Quest di caccia al tesoro che uniscono forzieri e tesori sepolti

Nella fase 7 il passo `{ "tipo": "trova", "forziere": "mappa:col:riga" }` controllava solo i forzieri (`celleForziere`).
Nella consegna 11c abbiamo esteso `tuttiIForzieri()` in `src/data/caricaDati.ts:253` e `scavaTesoroSepolto()` in `src/scenes/ScenaMondo.ts:1789` per emettere lo stesso evento `{ tipo: 'aperto', forziere: s.chiave }` anche quando si dissotterra un **tesoro sepolto** con la pala.

In questo modo:
- *L'ascia di mio padre* (`tessa_ascia`) usa `{ "tipo": "trova", "forziere": "radura_nascosta:3:9" }` per verificare che l'eroe abbia dissotterrato l'ascia di Aldo accanto alla sua tomba;
- *La mappa del mugnaio* (`tesoro_mugnaio`) disegna automaticamente la X rossa in `ScenaMappaTesoro.ts` sopra il punto di scavo `mulino_ponte:5:10` e si conclude da sola appena lo scavi!

---

## Esercizio facoltativo

Prova ad aprire `src/data/negozio.json` e aggiungere alla merce di `teodoro` un'arma comune a tua scelta (es. `"mazza"`), oppure aggiungi un nuovo commento contestuale a **Tessa** in `src/data/compagni.json` dentro l'array `"commenti"` per la mappa `"radura_nascosta"`, poi esegui `npx vitest run` e `npx vite build` per vederlo comparire in gioco quando entri nella Radura di Aldo insieme a Tessa e Brina!

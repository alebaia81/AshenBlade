# Lezione della fase 12: Villaggi che cambiano stato, bombe a tempo ed effetti ad area

Nella Fase 12 abbiamo costruito l'intera **Regione II — Le Colline di Pietrafonda**: tre nuove mappe (*Il Passo del Corvo*, *Le Cave di Zolfo*, *Pietrafonda*), il mini-boss **Ferrante il Contrabbandiere**, il salvataggio di **Matteo**, il banco delle **armature** di **Ugo**, il secondo compagno di viaggio **Grisk** (con l'apertura delle **rocce crepate**), il mercante goblin **Krak** e altre quattro **Ghiande d'oro**.

Vediamo i tre concetti tecnici principali introdotti in questa fase.

---

## 1. Un villaggio che evolve con la storia (`cambiaCon` su nemici e strutture)

Nel web, una pagina dashboard cambia stato da *"Onboarding"* a *"Active"* in base a un flag dell'utente nel database, senza cambiare URL.
A **Pietrafonda** (`src/data/mappe/pietrafonda.json:89-99`) abbiamo usato lo stesso principio grazie a `applicaCondizioni()` (`src/systems/condizioniMappa.ts:18`):

- Nella legenda di `pietrafonda.json`, il simbolo `G` rappresenta i goblin che occupano la piazza:
  ```json
  "G": {
    "tipo": "nemico",
    "nemico": "goblin",
    "cambiaCon": {
      "quest": "atto2_pietrafonda",
      "stato": ["pronta", "conclusa"]
    },
    "diventa": "p",
    "colore": "#a39e92",
    "tessera": "pietra_chiara"
  }
  ```
- Finché la quest `atto2_pietrafonda` non è completata, la piazza è un campo di battaglia; appena i 6 goblin vengono sconfitti, ogni cella `G` viene sostituita dalla pavimentazione `p` (`pietra_chiara`), trasformando definitivamente Pietrafonda in un hub pacifico con la sua **Pietra di passaggio**, la fucina d'armature di **Ugo**, **Teodoro** e il banco goblin di **Krak**.

---

## 2. Attacchi boss a preavviso ed esplosioni ad area (`bomba` ed `esplosione`)

Nel combattimento in tempo reale, un attacco ad area istantaneo sarebbe ingiusto per il giocatore: serve sempre una finestra di **telegrafia** (come uno stato *"loading/pending"* prima di un'azione distruttiva in una UI).

1. **Le bombe di zolfo di Ferrante** (`src/systems/boss.ts:21`, `src/scenes/mondo/GestoreBoss.ts:253`):
   - `puntiCrollo()` calcola i punti calpestabili attorno all'eroe (il primo esattamente sotto i suoi piedi, così è costretto a muoversi o fare una capriola).
   - `lanciaBombe()` disegna un cerchio giallo-arancio che cresce durante `preavvisoMs` (`1000 ms` in fase 1, `950 ms` in fase 2); al termine del tween (`onComplete`), il cerchio esplode lasciando una nube di zolfo e infligge il dado di danno se l'eroe si trova ancora entro `a.raggio + 4` pixel.
   - In modalità **Eco** (`creaDefinizioneEco()` in `src/systems/boss.ts:139`), sia la frequenza di lancio (`ricaricaMs × 0.7`) sia il dado di danno (`scalaDado`) vengono potenziati automaticamente.

2. **I dardi esplosivi della Balestra di zolfo** (`src/systems/effettiArmi.ts:88`, `src/scenes/ScenaMondo.ts:2026`):
   - La funzione pura `bersagliEsplosione(centro, candidati, esclusoId, raggio)` filtra in modo deterministico tutti i nemici vivi entro `36 px` dal punto d'impatto, escludendo il bersaglio primario già colpito dal dardo.
   - `ScenaMondo.tiraProiettile()` disegna l'onda d'urto sulfurea e applica il colpo (incluso l'effetto `"fuoco"`) a tutti i nemici vicini restituiti dalla funzione pura.

---

## 3. L'anello tra compagni di viaggio, segreti del mondo e crafting

La Regione II mostra come i sistemi della Fase 10 lavorino in sinergia ("metroidvania leggero"):
1. Liberi **Grisk** nella *Miniera dei Goblin* portandogli `2 × Zolfo giallo` (`grisk_liberato`).
2. Con l'abilità **Polvere nera** (`Q`) di Grisk fai saltare le **rocce crepate** (`W`) nella Miniera e sul *Passo del Corvo*.
3. Dietro le rocce crepate estrai la **Pietra lunare** (`pietra_lunare`) e trovi la *Pergamena: Guanti del titano* e le **Ghiande d'oro**, che sbloccano nuove ricette nel banco **`armature`** di Ugo e ricompense a Pietrafonda.

---

## Esercizio facoltativo

Controlla in `tests/datiMappe.test.ts` il test `'lo scontro comincia solo DENTRO la stanza: da fuori le barriere nessun boss vede l’eroe'`: prova a vedere come in `src/data/mappe/cave_zolfo.json` la parete in colonna 20 e le barriere `!` garantiscono che la distanza euclidea tra l'esterno della stanza e **Ferrante** (`F` in colonna 29) sia sempre maggiore del suo `raggioVista` (`96 px`).

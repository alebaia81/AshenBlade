# Lezione della fase 10: fondamenta dell'espansione

Questa fase ha un ruolo speciale rispetto alle fasi 1–9: invece di aggiungere subito le 15 nuove mappe dell'edizione estesa, abbiamo costruito **tutti i sistemi nuovi** (`systems/` e `scenes/`) e li abbiamo verificati sul mondo già esistente. In questo modo le fasi 11–14 potranno essere quasi interamente **dati JSON** (mappe, dialoghi, quest, nemici e ricette).

---

# Consegna 10a — Bottino dei boss, Eco e migrazione v2

### 1. La prima migrazione vera dei salvataggi (`v1 → v2`)

Nella fase 9a avevamo preparato l'infrastruttura delle migrazioni (`MIGRAZIONI` in [salvataggio.ts](file:///Volumes/Magazzino/Ashen%20Blade/src/systems/salvataggio.ts#L143-L163)), lasciandola vuota perché esisteva solo la versione 1. Con l'espansione, la `Partita` ([partita.ts](file:///Volumes/Magazzino/Ashen%20Blade/src/systems/partita.ts#L34-L75)) ha guadagnato sei novità:

- `ecoSconfitti`: quali boss hai già battuto in versione Eco;
- `sepoltiScavati`: i tesori sepolti già dissotterrati con la pala;
- `pietre`: le pietre di passaggio già risvegliate per il viaggio rapido;
- `ricordiVisti`: i ricordi letti nella Casa sul Colle;
- `commentiVisti`: le frasi contestuali dette dai compagni di viaggio entrando in una mappa;
- `equipaggiamento.amuleto`: il quinto spazio per gli accessori difensivi.

Invece di alzare la versione a ogni micro-consegna, abbiamo raggruppato tutti i nuovi campi in **una sola migrazione** da `1` a `2` (`VERSIONE_SALVATAGGIO = 2`, [salvataggio.ts](file:///Volumes/Magazzino/Ashen%20Blade/src/systems/salvataggio.ts#L19)). Quando un giocatore carica un salvataggio vecchio, `aggiorna()` esegue `MIGRAZIONI[1]` e riempie i campi nuovi con valori iniziali sicuri (`[]` e `amuleto: null`).

Paragone web: è una *schema migration* non distruttiva con valori `DEFAULT` su colonne nuove.

### 2. Bottino deterministico + casuale controllato: `bottinoBoss()`

Fino alla fase 9 i boss usavano la stessa funzione `tiraBottino()` di uno slime. Nella fase 10a i boss hanno regole proprie, scritte come funzione pura in [bottino.ts](file:///Volumes/Magazzino/Ashen%20Blade/src/systems/bottino.ts#L67-L106):

- **Prima vittoria normale (`eco = false`):**
  1. estrae a caso **1 pezzo leggendario garantito** dalla lista `leggendari` del boss;
  2. tira il **25% di probabilità** (`PROBABILITA_ESOTICO_BOSS = 0.25`) per l'`esoticoFirma`, ma **solo se l'eroe non lo possiede già** (`possiedeOggetto`, riga 50, che controlla anche le varianti potenziate `+1…+5` usando `livelloDi(id).base`);
  3. aggiunge sempre **1 `frammento_eco`**.
- **Prima vittoria contro l'Eco (`eco = true`, boss non in `ecoSconfitti`):**
  1. se non possiedi ancora l'`esoticoFirma`, è **garantito al 100%**;
  2. se lo possiedi già, sceglie a caso un esotico dalla lista `ESOTICI_ERRANTI` tra quelli che ancora ti mancano;
  3. se li hai tutti, ti premia con 2 `frammento_eco`.
- **Vittorie Eco successive:** danno un leggendario della lista e monete, senza mai duplicare esotici.

### 3. Trasformare i dati invece di duplicarli: `creaDefinizioneEco()`

Invece di scrivere due volte ogni boss in `boss.json` (`re_scheletro` e `eco_re_scheletro`), la funzione pura `creaDefinizioneEco()` ([boss.ts](file:///Volumes/Magazzino/Ashen%20Blade/src/systems/boss.ts#L126-L152)) prende la definizione del boss e ne restituisce una copia potenziata al volo:

- `vita` moltiplicata per `1.6`;
- `danno` (anche quello degli attacchi speciali come `crollo_massi` e `incantesimo`) scalato di `1.3` tramite `scalaDado()` (riga 115, che trasforma ad esempio `"1d10"` in `"1d13"`);
- `ricaricaMs` degli attacchi ridotta a `×0.7`;
- `tintaEco: "#a0e0ff"` per dare alla figura in pixel art un bagliore spettrale azzurro;
- `finale: false`, così sconfiggere l'Eco del Negromante non fa ripartire i titoli di coda.

---

# Consegna 10b — Compagni di viaggio, amuleto e banchi di crafting

### 1. Il quinto spazio difensivo: `amuleto`

Aggiungere l'amuleto ha richiesto pochissime righe perché `equipaggiamento.ts` era già guidato dall'elenco `PEZZI_ARMATURA` ([equipaggiamento.ts](file:///Volumes/Magazzino/Ashen%20Blade/src/systems/equipaggiamento.ts#L13)):

```ts
export const PEZZI_ARMATURA = ['elmo', 'corazza', 'guanti', 'stivali', 'amuleto'] as const;
```

Poiché `caricaDati.ts` classifica tutti i pezzi di `armature.json` sotto `categoria: 'armatura'`, la regola del limite delle esotiche ("al massimo un pezzo esotico tra armature e amuleto") ha funzionato subito senza alcun `if` speciale.

In [ScenaMondo.ts](file:///Volumes/Magazzino/Ashen%20Blade/src/scenes/ScenaMondo.ts#L1215-L1235) abbiamo poi collegato i tre nuovi effetti esotici:
- `salvavita` (*Ciondolo di Lia*): una volta per zona (`this.salvavitaUsato`), quando la vita scende sotto il 25% cura istantaneamente del 50%;
- `rigenerazione_quercia` (*Cuore della Quercia*): +1 vita ogni 5 secondi;
- `capriola_ombra` (*Velo di Selva*): intercetta `eroe.quandoSchiva` e rende invisibili per 1 secondo dopo ogni capriola.

### 2. I compagni di viaggio e il cane Brina

I tre compagni della storia (*Tessa e Brina*, *Grisk*, *Selva*) stanno nello stesso file `src/data/compagni.json` dei mercenari della taverna, contrassegnati da `"viaggio": true` e `"prezzo": 0`.

- Si uniscono tramite l'azione di dialogo `{ "unisci": "tessa" }` gestita da `unisciCompagno()` ([taverna.ts](file:///Volumes/Magazzino/Ashen%20Blade/src/systems/taverna.ts#L42-L45)).
- Quando entri in una mappa, `commentoAllIngresso()` (riga 51) verifica se il compagno attivo ha una battuta dedicata a quella zona e non ancora registrata in `partita.commentiVisti`.
- Per Tessa, [Compagno.ts](file:///Volumes/Magazzino/Ashen%20Blade/src/entities/Compagno.ts#L50-L54) disegna accanto a lei anche il cane **Brina**, che la segue passo passo senza partecipare alla mischia.

### 3. Una scena, tre banchi di crafting

Invece di creare `ScenaArmature` e `ScenaAlchimia`, abbiamo parametrizzato [ScenaFucina.ts](file:///Volumes/Magazzino/Ashen%20Blade/src/scenes/ScenaFucina.ts#L37-L87) con `dati: { banco?: 'fucina' | 'armature' | 'alchimia' }`:

- `ricetteConosciute()` ([crafting.ts](file:///Volumes/Magazzino/Ashen%20Blade/src/systems/crafting.ts#L28-L39)) filtra le ricette per il `banco` richiesto e sblocca in automatico quelle con `sbloccataDaBoss` appena quel boss entra in `bossSconfitti`;
- la scheda **Potenzia** compare solo quando `banco === 'fucina'` (Bruno).

---

# Consegna 10c — Segreti del mondo e pietre di passaggio

### 1. Cinque nuovi elementi nelle mappe a caratteri

Estendendo `analizzaMappa` ([mappa.ts](file:///Volumes/Magazzino/Ashen%20Blade/src/systems/mappa.ts#L8-L25)) abbiamo aggiunto cinque meccaniche di esplorazione che nelle fasi 11–14 si useranno scrivendo solo JSON:

1. **Tesori sepolti (`"tipo": "sepolto"`)**: sono celle **calpestabili** e invisibili. Diventano visibili (un ciuffo d'erba smossa con bagliore dorato) quando usi **Fiuta!** di Brina o indossi l'**Elmo del veggente**. Cliccandoli si chiama `scavaSepolto()` ([partita.ts](file:///Volumes/Magazzino/Ashen%20Blade/src/systems/partita.ts#L350-L355)), che richiede l'oggetto `pala`.
2. **Rocce crepate (`"tipo": "crepata"`)**: usano la stessa classe `MuroSegreto` con il flag `soloBomba = true` ([MuroSegreto.ts](file:///Volumes/Magazzino/Ashen%20Blade/src/entities/MuroSegreto.ts#L30)). I fendenti delle armi le ignorano; l'esplosione di **Polvere nera** di Grisk le sbriciola e le salva in `muriAperti`.
3. **Porte runiche (`"tipo": "porta", "runica": true`) e leve (`"aspetto": "leva"`)**: una `Porta` con `runica: true` mostra un sigillo viola e si apre cliccandola mentre **Selva** è la compagna attiva, oppure azionando un cartello-leva con `"aprePorta": "col:riga"`.
4. **Ricordi (`"aspetto": "ricordo"`)**: cartelli luminosi che registrano la propria chiave in `ricordiVisti` e aprono `ScenaFinale` passandole il testo del ricordo a tutto schermo ([ScenaFinale.ts](file:///Volumes/Magazzino/Ashen%20Blade/src/scenes/ScenaFinale.ts#L21-L23)).
5. **Pietre di passaggio (`"tipo": "pietra"`)**: ogni villaggio ne ha una (la prima è già attiva nella piazza di Borgo Quercia, [borgo.json](file:///Volumes/Magazzino/Ashen%20Blade/src/data/mappe/borgo.json#L148-L153)). Cliccandola si risveglia la pietra in `partita.pietre` e si apre [ScenaPietra.ts](file:///Volumes/Magazzino/Ashen%20Blade/src/scenes/ScenaPietra.ts), da cui viaggiare istantaneamente verso le altre pietre scoperte o cambiare compagno di viaggio.

---

### Esercizio (facoltativo)

Prova ad aggiungere un **tesoro sepolto** di prova nella Radura (`src/data/mappe/radura.json`):
1. Aggiungi nella `"legenda"` di `radura.json`:
   ```json
   "z": {
     "tipo": "sepolto",
     "contenuto": ["amuleto_quercia"],
     "monete": 50,
     "tessera": "erba"
   }
   ```
2. Sostituisci un punto `.` della `"griglia"` con `z`.
3. Ricompila, unisci **Tessa e Brina** (o indossa l'*Elmo del veggente*), premi **Q** (`Fiuta!`) vicino a quel punto per far spuntare il ciuffo d'erba smossa e scavalo con la **Pala da scavo**!

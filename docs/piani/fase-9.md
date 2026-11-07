# Piano della fase 9: rifinitura

Stato: **completata** (9a, 9b, 9c) (pixel art: strada Kenney, pacchetti verificati in `assets/`)

## Obiettivo

Dal documento di design (§15): *salvataggio con dischetto e 3 slot, menu, grafica pixel art, suoni e musica*. Dettagli:

- §12: **tasto salva sempre disponibile** (il dischetto anni '80 in pixel art, cliccabile anche in combattimento, con animazione e un breve "bip"; scorciatoia F2); **salvataggio automatico** entrando nel villaggio; **3 slot** nel browser (localStorage); morte senza penalità (c'è già);
- §2: pixel art **gratuita con licenza libera** (Kenney, itch.io), **tessere 16×16**;
- §3: il **testo introduttivo** nel menu;
- §4: le scene previste dal design, `Caricamento` e `Menu`.

Alla fine della fase il gioco si apre su un **menu**, si salva e si riprende da dove si era rimasti, ha la sua **grafica** e i suoi **suoni**. Il file resta uno solo, `dist/gioco.html`, e non si collega a internet.

## Proposta: tre consegne

| Consegna | Contenuto |
|---|---|
| **9a – Salvare e ricominciare** | menu iniziale con testo introduttivo, 3 slot, dischetto (animazione, bip, F2), salvataggio automatico nel borgo, menu di pausa, opzioni, esportare e importare un salvataggio |
| **9b – Pixel art** | tessere 16×16 per le mappe, eroe (una figura per classe), nemici, boss, persone, forzieri, porte, vene; camminata simulata (saltello e ribaltamento); il dischetto in pixel art |
| **9c – Suoni e musica** | effetti sonori (colpi, capriola, raccolta, porta, bip del dischetto…) e tre musiche (villaggio, esplorazione, dungeon e boss), volume nelle opzioni |

## Scelte da confermare

| Scelta | Proposta | Perché |
|---|---|---|
| **Da dove prendere la pixel art** | Due pacchetti **Kenney** con licenza **CC0** (libera, anche senza citarli): *Tiny Town* (villaggio, alberi, sentieri) e *Tiny Dungeon* (dungeon, eroi, mostri), entrambi 16×16. Dal mio ambiente il sito di Kenney **non è raggiungibile**, quindi ti chiederei di **scaricare i due file .zip** dal browser (non è un'installazione) e metterli nella cartella `RPG/assets/`. Io li leggo da lì, scelgo le tessere e le incorporo nel file del gioco | È esattamente ciò che chiede il §2, e due pacchetti dello stesso autore hanno uno stile coerente. |
| Se non si possono scaricare | **Piano B:** disegno io la pixel art come **dati** (griglie di caratteri 16×16 con una tavolozza, come le mappe), e il gioco la trasforma in immagini all'avvio | Funziona senza file esterni e si modifica come le mappe; è meno bella di Kenney, e cambia il §2 (lo aggiornerei prima). |
| Cosa si salva | **Tutta la Partita** (personaggio, zaino, quest, porte, boss sconfitti…), la **mappa** e il **punto d'ingresso** in cui ricomparire. Non la posizione esatta né i nemici: si riprende all'ingresso della zona, come dopo una sconfitta (§12) | Coerente con la ricomparsa del §12 e molto più semplice da rendere affidabile. |
| Versione del salvataggio | Ogni salvataggio ha un **numero di versione**. Se in futuro la Partita cambia, una funzione **aggiorna** i salvataggi vecchi invece di buttarli | Come le migrazioni di un database: è la differenza tra un aggiornamento e "ricomincia da capo". |
| Controlli sul caricamento | Un salvataggio rovinato o di una versione sconosciuta **non fa partire il gioco a metà**: compare un messaggio e lo slot si può sovrascrivere | Il localStorage si può modificare a mano: meglio non fidarsi. |
| Salvataggio automatico | Entrando nel **borgo**, nello slot in uso, con un piccolo avviso "Salvato" | Dal §12. |
| Il dischetto | Clic (o F2) in qualsiasi momento: animazione del dischetto che "gira", un **bip** (dalla 9c) e l'avviso "Partita salvata nello slot 2". Dalla 9a è un'icona disegnata; nella 9b diventa pixel art | Dal §12. |
| Menu iniziale | **Nuova partita** (scegli lo slot) → testo introduttivo (2–3 pagine dal §3, saltabili) → creazione del personaggio. **Continua** (l'ultimo salvataggio). **Carica** (i 3 slot con nome, classe, livello, zona e data; da qui anche **Elimina**). **Opzioni**. **Crediti** | Dal §3 (testo introduttivo) e dal §4 (scena Menu). |
| Menu di pausa | **Esc**, quando non è aperto nient'altro, oppure un'icona: Riprendi, Salva, Opzioni, Torna al menu (con conferma) | Oggi Esc chiude i pannelli; resta così, e la pausa si apre solo dal gioco "libero". |
| Esporta e importa | Nel menu Carica: **Esporta** scarica il salvataggio come file `.json`; **Importa** lo ricarica | I salvataggi del browser restano su quel PC e su quel browser: così si possono copiare altrove o tenere al sicuro. |
| Animazioni | I pacchetti Kenney hanno **una sola posa** per personaggio, quindi la camminata è **simulata**: un piccolo saltello ritmato mentre ci si muove e la figura che si **ribalta** guardando a sinistra o a destra. Il resto (colpi, numeri, effetti) resta com'è | Dà vita al gioco con le tessere che abbiamo, senza disegnare fotogrammi a mano. *(Modificato dopo aver visto i pacchetti: prima prevedeva 2 fotogrammi per direzione.)* |
| Suoni e musica | **Generati dal codice** con la Web Audio API del browser, in stile chiptune: nessun file audio, il gioco resta un solo file e funziona senza internet. Le musiche sono **sequenze di note scritte nei dati** (`data/musica.json`) | Niente file da cercare né licenze; e le note si modificano come i dialoghi. |
| Volume | Musica ed effetti regolabili separatamente nelle Opzioni, ricordati nel browser. La musica parte solo dopo il primo clic (i browser lo impongono) | Rispetta il browser e chi gioca in ufficio. |
| Crediti | Una pagina con: chi ha creato il gioco, Kenney (anche se CC0 non lo richiede), Phaser | Buona educazione e trasparenza. |

## File da creare o modificare (in breve)

```
src/
  systems/
    salvataggio.ts       slot, versione, aggiornamento dei vecchi salvataggi, controlli sul caricamento   [9a]
    sequenze.ts          dalla musica scritta nei dati alle note da suonare (con i tempi)                   [9c]
  scenes/
    ScenaCaricamento.ts  prepara immagini e suoni                                                            [9b]
    ScenaMenu.ts, ScenaIntro.ts, ScenaPausa.ts, ScenaOpzioni.ts, ScenaCrediti.ts                              [9a]
    ScenaMondo.ts, ScenaInterfaccia.ts (modifica) dischetto, salvataggio automatico, sprite, suoni
  audio/
    Suoni.ts             sintetizzatore degli effetti e lettore della musica (Web Audio)                      [9c]
  data/
    intro.json, musica.json, sprite.json (quale tessera per quale cosa)                                       [9a–9c]
assets/                  i pacchetti Kenney (solo come sorgente: finiscono dentro gioco.html)                 [9b]
tests/  salvataggio (giro completo, versioni, file rovinati), sequenze, dati (ogni tipo di cella e ogni nemico
        ha la sua immagine); tests/browser/fase-9a.cjs, fase-9b.cjs, fase-9c.cjs
```

## Passi in ordine

**9a – Salvare e ricominciare**

1. `salvataggio.ts` (test prima): salva e carica, 3 slot, versione e aggiornamento, salvataggi rovinati.
2. Menu iniziale, testo introduttivo, Carica/Elimina/Esporta/Importa.
3. Il dischetto (icona, F2, animazione, avviso), salvataggio automatico nel borgo, menu di pausa, opzioni.
4. Verifica, prova nel browser (compreso: salva, ricarica la pagina, continua), schermate, lezione 9a. **Mi fermo.**

**9b – Pixel art**

5. Lettura dei pacchetti, scelta delle tessere, `data/sprite.json`, scena di caricamento.
6. Mappe, eroe, nemici, boss, persone, oggetti del mondo; animazione di camminata.
7. Verifica, prova nel browser, schermate prima/dopo, lezione 9b. **Mi fermo.**

**9c – Suoni e musica**

8. `sequenze.ts` (test prima), sintetizzatore e lettore.
9. Effetti nei punti giusti, musiche per zona, volume.
10. Verifica, prova nel browser, lezione completa, aggiornamento finale di `LEGGIMI`.

## Test previsti (principali)

- **salvataggio:** salvare e ricaricare restituisce la stessa Partita; i 3 slot sono indipendenti; un salvataggio di una versione vecchia viene aggiornato; testo non valido o versione sconosciuta danno un errore chiaro, senza eccezioni; eliminare libera lo slot; il riepilogo dello slot (nome, classe, livello, zona, data) è giusto.
- **sequenze:** una melodia scritta nei dati diventa note con frequenze e tempi giusti; le pause; la ripetizione in loop.
- **dati:** ogni tipo di cella, ogni nemico, ogni persona ha la sua immagine; nessuna immagine citata manca.
- **browser:** nuova partita dal menu, salvataggio con il dischetto, ricarica della pagina, "Continua" riporta nello stesso punto con lo stesso zaino.

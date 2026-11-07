# Piano della fase 1: il mondo si muove

Stato: **approvato** (3 novembre 2026)

## Obiettivo

Dal documento di design (§15): *eroe che cammina su una mappa a griglia, collisioni con i muri, telecamera che segue, cambio tra due mappe.*

Alla fine della fase, aprendo `dist/gioco.html` con doppio clic:

- vedi una mappa fatta di quadrati colorati (erba, muri/alberi), più grande dello schermo;
- muovi l'eroe (un quadrato con un "occhio" che indica dove guarda) con WASD o frecce, anche in diagonale, senza andare più veloce in diagonale;
- l'eroe si ferma contro i muri e scivola lungo di essi;
- la telecamera lo segue e non mostra mai il "fuori mappa";
- camminando su un'uscita passi alla seconda mappa con una dissolvenza, e da lì puoi tornare indietro;
- in alto a sinistra c'è il nome della mappa corrente;
- se una mappa nei dati è sbagliata (righe di lunghezza diversa, simbolo sconosciuto, uscita verso una mappa inesistente) compare un messaggio d'errore leggibile invece di uno schermo nero.

Fuori dalla fase 1 (arrivano dopo): combattimento, nemici, modalità sviluppatore F8 (fase 2), personaggi e menu (fase 3+).

## Scelte tecniche da confermare

| Scelta | Proposta | Perché |
|---|---|---|
| Dimensione tessera | 16×16 unità di mondo, telecamera con zoom ×3 | Già pronta per la pixel art 16×16 della fase 9: cambieremo solo il disegno, non le misure. |
| Risoluzione | 960×540 (16:9), adattata alla finestra mantenendo le proporzioni | Si vedono circa 20×11 tessere: la mappa deve scorrere, così si vede la telecamera al lavoro. |
| Collisioni | Fisica *Arcade* di Phaser: eroe con corpo dinamico; la griglia di caratteri viene trasformata a runtime in una *Tilemap* di Phaser con le tessere muro marcate come solide | È il motore che useremo anche per le aree di colpo nella fase 2. **Modifica in corso di fase (approvata):** la prima versione usava un corpo statico per ogni tessera muro, ma l'eroe si incastrava sulle giunture tra tessere scivolando lungo i muri verticali. La Tilemap ignora i bordi interni tra muri adiacenti e risolve il problema; in più nella fase 9 basterà sostituire l'immagine delle tessere. |
| Cambio mappa | Calpestare una tessera d'uscita; si ricompare su un punto d'arrivo della mappa di destinazione | I punti d'arrivo sono accanto all'uscita di ritorno ma non sopra, così non si rimbalza avanti e indietro. |
| Caricamento mappe | Tutti i JSON in `src/data/mappe/` vengono inclusi automaticamente (`import.meta.glob` di Vite) | Aggiungere una mappa = aggiungere un file, senza toccare il codice (§4). Tutto finisce dentro `gioco.html`: nessun caricamento da internet. |
| Interfaccia | Scena `Interfaccia` separata, sovrapposta alla scena `Mondo` | Come un elemento `position: fixed` sopra la pagina: non scorre e non subisce lo zoom. |

## Formato delle mappe (dettaglio del §4)

Un file JSON per mappa. La griglia è un array di stringhe, una per riga.

```json
{
  "id": "radura",
  "nome": "Radura di Borgo Quercia",
  "legenda": {
    "#": { "tipo": "muro",      "colore": "#2f4f2f" },
    ".": { "tipo": "pavimento", "colore": "#6b9a4b" },
    ",": { "tipo": "pavimento", "colore": "#7fae5a" },
    "@": { "tipo": "partenza" },
    "a": { "tipo": "arrivo" },
    "1": { "tipo": "uscita", "verso": "bosco", "arrivo": "a" }
  },
  "griglia": [
    "##########",
    "#..,...a1#",
    "#.@......#",
    "##########"
  ]
}
```

- `partenza` (`@`): dove compare l'eroe all'avvio; una sola, nella mappa iniziale.
- `arrivo` (lettere minuscole): punti in cui si ricompare entrando da un'altra mappa.
- `uscita` (cifre): portano alla mappa `verso`, sul punto d'arrivo `arrivo`.
- Partenza, arrivi e uscite si disegnano e si calpestano come pavimento.
- La mappa iniziale è indicata in `src/data/mondo.json` (`"mappaIniziale": "radura"`).

Le due mappe della fase: **Radura** (circa 40×25, con alberi sparsi e un corridoio stretto) e **Sentiero nel bosco** (circa 30×40, più verticale, per provare lo scorrimento in altezza).

## File da creare o modificare

```
src/
  main.ts                       (modifica) configurazione di Phaser, registra le scene
  erroreVisibile.ts             mostra gli errori nel riquadro rosso e nella console (§14)
  costanti.ts                   dimensione tessera, risoluzione, zoom
  systems/
    mappa.ts                    legge una definizione di mappa e la valida; domande sulla griglia
    mondo.ts                    valida l'insieme delle mappe (uscite e arrivi esistono)
    coordinate.ts               conversioni cella ↔ pixel
    movimento.ts                da tasti premuti a velocità (diagonale normalizzata) e direzione dello sguardo
    tessere.ts                  da griglia di caratteri a griglia di indici di tessera, colori e tessere solide
    tipi.ts                     tipi condivisi (DefinizioneMappa, Cella, Direzione…)
  data/
    mondo.json                  mappa iniziale
    eroe.json                   velocità dell'eroe e colori
    caricaMappe.ts              raccoglie tutti i JSON di mappe/ (import.meta.glob)
    mappe/radura.json
    mappe/bosco.json
  entities/
    Eroe.ts                     quadrato + corpo fisico + lettura dei tasti
  scenes/
    ScenaMondo.ts               disegna la mappa, crea l'eroe, telecamera, controlla le uscite
    ScenaInterfaccia.ts         nome della mappa in sovrimpressione
    mondo/creaTilemap.ts        genera l'immagine delle tessere colorate e la Tilemap con i muri solidi
tests/
  mappa.test.ts
  mondo.test.ts
  coordinate.test.ts
  movimento.test.ts
  tessere.test.ts
  datiMappe.test.ts             valida le mappe VERE in src/data/mappe
docs/lezioni/fase-1.md          nota di lezione
dist/gioco.html                 gioco compilato
```

## Passi in ordine

1. **Tipi** (`systems/tipi.ts`): forma dei dati di mappa, celle e direzioni.
2. **Coordinate** — prima `tests/coordinate.test.ts`, poi `systems/coordinate.ts`.
3. **Mappa** — prima `tests/mappa.test.ts`, poi `systems/mappa.ts`: analisi della griglia, errori leggibili, `èCalpestabile`, `trovaPunto`, `uscitaIn`.
4. **Mondo** — prima `tests/mondo.test.ts`, poi `systems/mondo.ts`: ogni uscita punta a una mappa e a un arrivo esistenti; esiste la mappa iniziale con una partenza.
5. **Movimento** — prima `tests/movimento.test.ts`, poi `systems/movimento.ts`.
6. **Dati**: le due mappe, `mondo.json`, `eroe.json`, `caricaMappe.ts`, e `tests/datiMappe.test.ts` che le valida.
7. **Errori visibili** (`erroreVisibile.ts`), collegato a `window.onerror` e agli errori di validazione.
8. **Scena Mondo**: Tilemap (disegno e muri solidi), eroe, collisioni, telecamera con limiti e zoom. Prima i test di `systems/tessere.ts`, poi il codice.
9. **Cambio mappa**: rilevamento dell'uscita sotto l'eroe → dissolvenza → riavvio della scena con la nuova mappa e il punto d'arrivo.
10. **Scena Interfaccia**: nome della mappa, aggiornato a ogni cambio tramite eventi.
11. **Verifica**: `npm test`, `tsc` e compilazione; apertura del file compilato in un browser automatico per controllare che parta senza errori in console e senza richieste di rete.
12. **Consegna**: `dist/gioco.html` e `docs/lezioni/fase-1.md`.

## Test previsti (Vitest, solo `systems` e dati)

- **coordinate**: centro della cella (0,0) = (8,8); un pixel dentro la cella dà la cella giusta; bordi tra due celle.
- **mappa**: larghezza e altezza corrette; errore se le righe hanno lunghezze diverse (con numero di riga nel messaggio); errore se un carattere non è in legenda (con riga e colonna); muro non calpestabile; pavimento, partenza, arrivo e uscita calpestabili; fuori dalla mappa non calpestabile; `trovaPunto` trova `@` e gli arrivi; errore se un'uscita non ha `verso` o `arrivo`.
- **mondo**: errore se un'uscita punta a una mappa inesistente; errore se l'arrivo non esiste nella mappa di destinazione; errore se la mappa iniziale non esiste o non ha la partenza; nessun errore per un mondo corretto.
- **movimento**: nessun tasto → fermo; destra → (velocità, 0); diagonale → componenti `velocità/√2` (stessa velocità totale); tasti opposti si annullano; lo sguardo resta sull'ultima direzione quando ci si ferma.
- **tessere**: ogni simbolo della legenda ha un indice; la griglia di indici ha le stesse dimensioni della mappa; solo i muri sono solidi; colori presi dalla legenda o predefiniti.
- **datiMappe**: tutte le mappe reali del gioco superano la validazione (così un errore di battitura in una mappa fa fallire i test prima di arrivare nel browser).

## Cose da provare giocando

1. Il gioco si apre con doppio clic su `dist/gioco.html`, senza connessione internet.
2. L'eroe parte dal punto `@` della Radura; in alto a sinistra c'è "Radura di Borgo Quercia".
3. Si muove con WASD e con le frecce; l'"occhio" indica la direzione.
4. In diagonale non è più veloce che in linea retta.
5. Contro un muro si ferma; camminando in diagonale contro un muro scivola lungo il muro.
6. Passa nel corridoio largo una tessera senza incastrarsi.
7. La telecamera lo segue; arrivando al bordo della mappa la telecamera si ferma e non mostra il nero oltre il bordo.
8. Ridimensionando la finestra del browser il gioco si adatta senza deformarsi.
9. Sull'uscita: dissolvenza, compare nel Sentiero nel bosco, il nome in alto cambia.
10. Tornando indietro ricompare accanto all'uscita della Radura, non al punto di partenza, e non rimbalza subito nell'altra mappa.
11. Andata e ritorno più volte di fila: nessun rallentamento, nessun errore.

## Concetti nuovi che spiegherò nella lezione

Ciclo di gioco (`update` a ~60 fotogrammi al secondo, delta time), scene e loro ciclo di vita, coordinate di mondo e di schermo, tessere e griglie, corpi fisici e collisioni rettangolari (AABB), telecamera, separazione regole/presentazione (`systems` vs `scenes`).

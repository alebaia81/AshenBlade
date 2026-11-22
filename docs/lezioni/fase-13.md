# Lezione della fase 13: Atto III espanso — La Brughiera e Guado delle Lanterne

## Cosa abbiamo costruito

In questa fase abbiamo completato l'espansione del terzo atto (*La Brughiera della Torre*):

1. **Il Guado delle Lanterne e la Palude (`13a`)**:
   - Nuove mappe notturne `guado` (villaggio su palafitte con la terza **Pietra di passaggio**, salvataggio automatico, **Mamma Orsola**, **Teodoro** e **Selva**) e `palude_lanterne` (isolotti nella nebbia con i **Fuochi fatui**).
   - La quest *Il traghetto di Orsola* (`traghetto_orsola`) sblocca dinamicamente il pontile verso la Casa sul Colle tramite `cambiaCon` su una cella di nebbia.
2. **La Casa sul Colle, l'Osservatorio e Selva (`13b`)**:
   - `casa_colle` è una mappa senza nemici basata sulla narrazione ambientale: 6 **Ricordi** (`"aspetto": "ricordo"`) aprono pagine a tutto schermo che mostrano la vita di Orvald e Lia fino alla notte in cui Berta incendiò il laboratorio.
   - `osservatorio` introduce le **porte runiche** apribili tramite **leve** (`"aprePorta"`) e il mini-boss **Selva l'Incantatrice** (`selva_boss`), che evoca **Illusioni** da 1 PV e lascia i leggendari *Bacchetta di Selva* / *Stivali della palude*, l'esotico firma *Velo di Selva* e la ricetta del *Sigillo dell'Eco: Selva*.
   - Completando `selva_liberata`, **Selva** si unisce gratuitamente al gruppo (`unisci: "selva"`), abilita **Velo d'ombra**, apre tutte le porte runiche (compresa la nuova stanza runica in `torre_piani`) e apre il **Banco di alchimia** (`"alchimia"`).
3. **Confronto con Berta, Quaderno di Lia, Alchimia e Finale esteso (`13c`)**:
   - Quest `confronto_berta` (in cui Berta difende la sua scelta: *"L'ho fatto per proteggere il borgo!"*), `selva_quaderno` (ricompensa: amuleto esotico **Ciondolo di Lia**), `ultime_lettere`, `erbe_palude` e `tesoro_luna` (che completa la collezione di tutte le **12 Ghiande d'oro** del mondo).
   - 4 ricette alchemiche di pozioni sul banco `"alchimia"` di Selva e funzione pura `componiPagineFinale()` in `src/systems/partita.ts` che arricchisce il finale con il *Quaderno di Lia* e le battute di **Tessa, Grisk e Selva**.

## Concetti chiave (analogia web)

- **Composizione dinamica delle pagine del finale (`componiPagineFinale`)**: come un template React/HTML che inserisce blocchi condizionali (`if (haQuaderno) ...`) a partire dallo stato applicativo (`Partita`), mantenendo la logica pura e testabile in `src/systems/` senza dipendere da Phaser.
- **Test di raggiungibilità globale del grafo (`datiMappe.test.ts`)**: trattare ogni mappa come un grafo e lanciare una visita in ampiezza (BFS) da ogni punto di ingresso è l'equivalente di un *link checker* automatico per un sito web: garantisce che nessun abitante, forziere, vena o uscita resti murato per errore di battitura.
- **Paginazione nei pannelli UI**: quando il catalogo cresce (14+ ricette in fucina, 19 articoli da Gemma, 20+ quest nel registro), liste a lunghezza fissa senza paginazione sforano dal contenitore proprio come un `<div>` senza `overflow-y: auto` o paginazione.

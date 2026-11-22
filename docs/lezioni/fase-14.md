# Lezione della fase 14: Dopo-storia

## Cosa abbiamo costruito

In questa fase abbiamo completato tutto il **dopo-storia** previsto da `docs/storia.md` (§6.4, §7, §8, §10):

1. **Il Pozzo Profondo e gli Echi regionali (`14a`)**:
   - Nuova mappa opzionale `miniera_profonda` (28×24) collegata a `miniera_tana` dietro una roccia crepata apribile con **Grisk**, ricca di *Pietra lunare*, *Cristalli della miniera*, *Argento* e *Frammenti d'eco*.
   - 3 sfide di dopo-storia degli artigiani (`eco_valle` da **Bruno**, `eco_colline` da **Ugo**, `eco_brughiera` da **Selva**) che valorizzano tutti i **6 Sigilli dell'Eco** e gli **esotici firma** dei boss.
2. **Le Radici e La Radice Marcia (`14b`)**:
   - Accesso protetto da **porta runica** a sud di `borgo.json` (apribile con **Selva**) verso il dungeon segreto su due piani `radici_alte` (32×26) e `radici_cuore` (28×22).
   - 3 nuovi nemici potenziati (`eco_lupo`, `eco_golem`, `eco_spettro`), il boss finale opzionale **La Radice Marcia** (`radice_marcia`, 360 PV, 2 fasi, `legno_vivo`, leggendari `corazza_quercia` / `amuleto_quercia`, esotico firma `guanti_predatore`, ricetta `sigillo_eco_radice_marcia`) e la quest `radici_quercia` da **Nonna Rosalba**.
3. **Collezione delle 12 Ghiande d'oro e Bacheca di Tobia (`14c`)**:
   - Catena di 4 traguardi da **Nonna Rosalba** (`ghiande_3`, `ghiande_6`, `ghiande_9`, `ghiande_12`) che consumano esattamente 3 Ghiande d'oro per passo (3×4 = 12) fino all'amuleto esotico **Cuore della Quercia** (`cuore_quercia`).
   - 3 **commissioni di crafting** sulla bacheca di **Tobia** (`commissione_spada`, `commissione_corazza`, `commissione_pozioni`) che ricompensano con monete, esperienza e **Frammenti d'eco**.

## Concetti chiave (analogia web)

- **Catene di traguardi (milestone quests)**: invece di inventare un nuovo sistema ad hoc per i premi cumulativi a 3/6/9/12 Ghiande d'oro, abbiamo composto 4 normali quest `raccogli` concatenate con `richiede` — esattamente come un *wizard* multi-step che riusa lo stesso componente form invece di duplicare la logica.
- **Test di integrità come rete di sicurezza**: durante la 14b il controllo BFS in `datiMappe.test.ts` ha segnalato subito una porta runica spostata di 1 colonna in `borgo.json`, prima ancora di aprire il browser.

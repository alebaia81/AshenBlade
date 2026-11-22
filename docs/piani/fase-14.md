# Piano della fase 14: Dopo-storia

Stato: **completata** (14a, 14b e 14c completate)

## Obiettivo

Da `docs/storia.md` (§6.4, §7, §8, §10) e `docs/espansione.md` (§4, §6): dare al giocatore un **dopo-storia ricco (~45 min – 1 h 30, livello 17 → 20)** una volta sconfitto il Negromante, senza riaprire la storia conclusa di Orvald e Lia:

- **14a – Le Eco di tutti i 6 boss e il Pozzo Profondo (`miniera_profonda`)**:
  - verificare e collegare con sfide dedicate i **6 Sigilli dell'Eco** (2 da **Bruno** per la Valle, 2 da **Ugo** per le Colline, 2 da **Selva** per la Brughiera) per garantire tutti gli **esotici firma** dei boss;
  - aggiungere il livello opzionale **Il Pozzo Profondo** (`miniera_profonda`, 28×24), raggiungibile dalla `miniera_tana` dietro una **roccia crepata** (serve **Grisk**): vene di *Pietra lunare*, *Cristallo della miniera*, *Argento*, Golem e forzieri ad alto bottino per alimentare il crafting di fine gioco.
- **14b – Le Radici e la Radice Marcia (dungeon segreto su due piani)**:
  - sotto la **Quercia Antica** a `borgo.json`, dopo la sconfitta del Negromante (`cambiaCon: { boss: "negromante" }`), compare l'accesso alle radici protetto da una **porta runica** (serve **Selva**);
  - due nuove mappe: **Le Radici – gallerie alte** (`radici_alte`, 32×26) e **Le Radici – il cuore marcio** (`radici_cuore`, 28×22);
  - tre nemici potenziati ("eco" delle tre regioni: `eco_lupo`, `eco_golem`, `eco_spettro`) e il boss finale opzionale **La Radice Marcia** (`radice_marcia`, 360 PV, 2 fasi, lascia il materiale leggendario `legno_vivo`, i leggendari `corazza_quercia` / `amuleto_quercia` e l'esotico firma `guanti_predatore`);
  - quest `radici_quercia` affidata da **Nonna Rosalba** dopo `atto3_torre`.
- **14c – I premi delle 12 Ghiande d'oro (Nonna Rosalba) e le Commissioni di Tobia**:
  - 4 quest-traguardo da **Nonna Rosalba** per consegnare le **12 Ghiande d'oro** (3 → `zaino_24`; 6 → `corazza_quercia`; 9 → `amuleto_quercia` + 400 esp; 12 → amuleto esotico **Cuore della Quercia** `cuore_quercia`);
  - 3 **commissioni di crafting** affidate da **Tobia** alla taverna (`commissione_spada`, `commissione_corazza`, `commissione_pozioni`) che premiano con monete, esperienza e **Frammenti d'eco** (`frammento_eco`);
  - lezione `docs/lezioni/fase-14.md`.

## Proposta: tre consegne

| Consegna | Contenuto |
|---|---|
| **14a – Il Pozzo Profondo e le sfide degli Echi** | Nuova mappa opzionale `miniera_profonda` (28×24, dietro roccia crepata in `miniera_tana`); 3 quest degli artigiani per le Eco regionali (`eco_valle` da Bruno, `eco_colline` da Ugo, `eco_brughiera` da Selva); prova `fase-14a.cjs`. |
| **14b – Le Radici e la Radice Marcia** | Accesso runico sotto la Quercia in `borgo.json` (dopo il Negromante); nuove mappe `radici_alte` (32×26) e `radici_cuore` (28×22); nemici `eco_lupo`, `eco_golem`, `eco_spettro`; boss opzionale `radice_marcia`, materiale `legno_vivo`, ricetta `sigillo_eco_radice_marcia`; quest `radici_quercia` da Rosalba; prova `fase-14b.cjs`. |
| **14c – Premi delle 12 Ghiande d'oro e Commissioni di Tobia** | 4 quest traguardo da **Nonna Rosalba** (`ghiande_3`, `ghiande_6`, `ghiande_9`, `ghiande_12` → `cuore_quercia`); 3 commissioni di crafting da **Tobia** (`commissione_spada`, `commissione_corazza`, `commissione_pozioni`); prova `fase-14c.cjs` e lezione `docs/lezioni/fase-14.md`. |

## Collegamenti delle nuove mappe del Dopo-storia

```
[miniera_tana] ✅ ──(roccia crepata W, Grisk)──► [miniera_profonda] 🆕 (Pozzo Profondo)

[borgo] ✅ ──(dopo Negromante + porta runica R, Selva)──► [radici_alte] 🆕 ──► [radici_cuore] 🆕 (La Radice Marcia)
```

## File da creare o modificare

```
src/data/
  nemici.json               eco_lupo, eco_golem, eco_spettro                          [14b]
  boss.json                 radice_marcia                                             [14b]
  oggetti.json              legno_vivo, sigillo_eco_radice_marcia                     [14b]
  ricette.json              sigillo_eco_radice_marcia                                 [14b]
  sprite.json               figure per eco_lupo, eco_golem, eco_spettro, radice_marcia [14b]
  musica.json               zone per miniera_profonda, radici_alte, radici_cuore      [14a–14b]
  quest.json                eco_valle, eco_colline, eco_brughiera [14a]; radici_quercia [14b]; ghiande_3/6/9/12, commissione_* [14c]
  dialoghi.json             bruno, ugo, selva [14a]; rosalba [14b–14c]; tobia [14c]
  mappe/
    miniera_tana.json       roccia crepata W verso miniera_profonda                   [14a]
    miniera_profonda.json   nuova mappa 28×24 del Pozzo Profondo                      [14a]
    borgo.json              passaggio runico sotto la Quercia (dopo Negromante)       [14b]
    radici_alte.json        nuova mappa 32×26 delle Radici Alte                       [14b]
    radici_cuore.json       nuova mappa 28×22 del Cuore delle Radici (Radice Marcia)  [14b]
tests/
  datiMappe.test.ts         integrità mappe, raggiungibilità globale, boss, 12 ghiande e commissioni
  browser/fase-14*.cjs      prove nel browser per 14a, 14b e 14c
docs/
  lezioni/fase-14.md        lezione finale della fase 14                              [14c]
```

## Cosa provare giocando (a fine fase 14)

1. Con **Grisk**, tornare nella *Tana del Troll* e far saltare la roccia crepata verso **Il Pozzo Profondo** per raccogliere *Pietra lunare* e *Cristalli*.
2. Forgiare i **Sigilli dell'Eco** da Bruno, Ugo e Selva e riaffrontare i boss potenziati sui rispettivi Altari dell'Eco per ottenere tutti gli esotici firma.
3. Dopo il Negromante, scendere con **Selva** attraverso la porta runica sotto la **Quercia Antica** di Borgo Quercia, attraversare **Le Radici** e sconfiggere **La Radice Marcia**.
4. Consegnare le **12 Ghiande d'oro** a **Nonna Rosalba** (fino al **Cuore della Quercia**) e completare le **commissioni di crafting** di **Tobia**.

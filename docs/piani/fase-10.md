# Piano della fase 10: fondamenta dell'espansione

Stato: **completata** (10a, 10b, 10c)

## Obiettivo

Dal documento di design (§15) e da `docs/espansione.md` (§5–§6): costruire **tutti i sistemi di codice nuovi** che reggono l'espansione a 5–6 ore e provarli subito sulle mappe e sui 3 boss già esistenti, così le fasi 11–14 potranno concentrarsi quasi interamente su mappe, dialoghi, quest e contenuti in JSON.

Alla fine della fase 10:
- i salvataggi della versione 1 vengono migrati automaticamente alla **versione 2** senza perdere nulla;
- i boss usano il nuovo sistema di bottino (**1 leggendario garantito** dalla loro lista, **25% esotico firma**, **1 frammento d'eco**) e dopo la sconfitta lasciano nella stanza un **altare** su cui evocare la loro **Eco** potenziata usando un **Sigillo dell'Eco**;
- i **compagni di viaggio** (`"viaggio": true`) si possono unire tramite dialogo/quest, hanno commenti contestuali per mappa e dispongono delle tre nuove abilità (**Fiuta!**, **Polvere nera**, **Velo d'ombra**);
- la scheda del personaggio ha il **quinto spazio difensivo/accessorio (`amuleto`)**, soggetto al limite di 1 solo pezzo esotico tra armature e amuleto;
- la scena di crafting (`ScenaFucina`) supporta i **tre banchi** (`fucina` di Bruno, `armature` di Ugo, `alchimia` di Selva), ciascuno con le proprie ricette e i Sigilli dell'Eco della propria regione;
- le mappe supportano **tesori sepolti** (scavabili con la **pala**), **rocce crepate** (distruttibili con la **Polvere nera** di Grisk), **porte runiche** (apribili da Selva o con una leva), **pietre di passaggio** (viaggio rapido tra villaggi + cambio compagno) e **ricordi** a tutto schermo.

## Proposta: tre consegne

| Consegna | Contenuto |
|---|---|
| **10a – Bottino dei boss, Eco e migrazione v2** | Migrazione `VERSIONE_SALVATAGGIO = 2` con tutti i nuovi campi della `Partita`; funzione pura `bottinoBoss()` (1 leggendario garantito, 25% esotico firma, 1 frammento d'eco, regola Eco con esotico firma garantito o errante non posseduto); altare dell'Eco nella stanza del boss sconfitto e statistiche potenziate dell'Eco (vita ×1,6, danno ×1,3, ricarica ×0,7, tinta spettrale); verifica sui 3 boss attuali. |
| **10b – Compagni di viaggio, amuleto e banchi di crafting** | Campo `"viaggio": true` e `"commenti"` in `compagni.json`, azione `"unisci"` nei dialoghi, le 3 nuove abilità dei compagni (*Fiuta!* che cerca tutti i segreti entro 12 tessere, *Polvere nera*, *Velo d'ombra*); quinto slot `amuleto` in `equipaggiamento.ts` e `ScenaScheda.ts`; generalizzazione di `ScenaFucina.ts` per i banchi `fucina`, `armature` e `alchimia`. |
| **10c – Segreti del mondo e pietre di passaggio** | Celle `"sepolto"` e oggetto `pala`; celle `"crepata"` (aperte da *Polvere nera*); porte con `"runica": true` e leve; celle `"pietra"` e `ScenaPietra.ts` (viaggio rapido tra pietre attivate + cambio compagno); cartelli con `"aspetto": "ricordo"`; pietra di passaggio a Borgo Quercia per provare subito tutto in gioco. |

## Scelte confermate con Ale

| Scelta | Decisione | Perché |
|---|---|---|
| **Migrazione salvataggi** | Un'unica migrazione `VERSIONE_SALVATAGGIO = 2` nella consegna 10a che inizializza `ecoSconfitti: []`, `sepoltiScavati: []`, `pietre: []`, `ricordiVisti: []`, `commentiVisti: []` e `equipaggiamento.amuleto: null` | Evita di alzare la versione tre volte nella stessa fase e garantisce compatibilità immediata con tutti i salvataggi esistenti. |
| **Abilità *Fiuta!* di Brina** | Cerca **tutto** entro 12 tessere per 10 secondi: rivela i tesori sepolti (erba smossa) e segnala muri segreti, rocce crepate e forzieri chiusi/nascosti non ancora aperti | Rende Brina il vero segugio del gruppo per chi ama esplorare al 100%. |
| **Sigilli dell'Eco** | Ciascun artigiano forgia i sigilli della propria regione: **Bruno** (`fucina`, Valle), **Ugo** (`armature`, Colline), **Selva** (`alchimia`, Brughiera) | Dà un ruolo chiaro nel dopo-storia a tutti e tre i banchi di crafting. |
| **Come provare i sistemi nella Fase 10** | Nella 10c aggiungiamo la **pietra di passaggio** a Borgo Quercia e rendiamo tutti i nuovi tipi di cella/oggetto disponibili anche tramite la Modalità Sviluppatore (F8) e i test automatici | Permette di verificare ogni meccanica in gioco prima ancora di disegnare le 15 mappe nuove delle fasi 11–14. |

## File da creare o modificare

```
src/
  systems/
    partita.ts           nuovi campi della Partita (ecoSconfitti, sepoltiScavati, pietre, ricordiVisti, commentiVisti) [10a]
    salvataggio.ts       VERSIONE_SALVATAGGIO = 2 e MIGRAZIONI[1]                                                      [10a]
    bottino.ts           bottinoBoss() con leggendario garantito, 25% esotico firma, logica Eco ed erranti             [10a]
    boss.ts              moltiplicatori Eco (vita, danno, ricarica, tinta) e validazione leggendari/esoticoFirma       [10a]
    equipaggiamento.ts   quinto pezzo 'amuleto' in PEZZI_ARMATURA e SPAZI_EQUIPAGGIAMENTO                              [10b]
    crafting.ts          filtro ricette per banco ('fucina' | 'armature' | 'alchimia') e supporto armature/oggetti     [10b]
    taverna.ts           compagni di viaggio (gratuiti, sbloccati da storia) e commenti contestuali                    [10b]
    mappa.ts             nuove celle: 'sepolto', 'crepata', 'pietra', porta 'runica', cartello 'ricordo' e leva        [10c]
    tipi.ts              nuove abilità compagno ('fiuta_tutto', 'polvere_nera', 'velo_ombra') e tipi cella             [10b–10c]
  scenes/
    ScenaScheda.ts       layout a 7 spazi (2 armi + 4 armature + amuleto) e icone/testi                                [10b]
    ScenaFucina.ts       apertura parametrizzata per banco (titolo, artigiano, scheda Potenzia solo per 'fucina')      [10b]
    ScenaPietra.ts       nuovo pannello modale per il viaggio rapido tra pietre attivate e cambio compagno             [10c]
    ScenaMondo.ts        altare dell'Eco, scavo con pala, rocce crepate, porte runiche, ricordi, pietre di passaggio   [10a–10c]
    mondo/
      GestoreBoss.ts     supporto boss in modalità Eco (statistiche, ricarica ×0,7, tinta)                             [10a]
  data/
    caricaDati.ts        controlli sui nuovi campi di boss, ricette (armi/armature/oggetti), amuleti e celle mappa     [10a–10c]
    boss.json            leggendari, esoticoFirma e parametri eco sui 3 boss esistenti                                 [10a]
    oggetti.json         frammento_eco, pala, sigilli dell'Eco dei 3 boss esistenti                                    [10a, 10c]
    armature.json        primi leggendari dei boss (stivali_re_sepolto, elmo_troll, mantello_orvald, elmo_luna_nera)   [10a]
    ricette.json         campo 'banco' e ricette dei primi sigilli dell'Eco                                            [10a–10b]
    mappe/borgo.json     pietra di passaggio a Borgo Quercia                                                           [10c]
tests/
  salvataggio.test.ts    migrazione da v1 a v2                                                                         [10a]
  bottino.test.ts        regole bottinoBoss (prima vittoria, Eco, esotico già posseduto, errante)                      [10a]
  equipaggiamento.test.ts quinto spazio amuleto e limite di 1 esotico tra armature e amuleto                           [10b]
  crafting.test.ts       filtro per banco e creazione di armi, armature, pozioni e sigilli                             [10b]
  mappa.test.ts          tesori sepolti, rocce crepate, porte runiche, pietre di passaggio                             [10c]
  browser/fase-10*.cjs   prove end-to-end nel browser per 10a, 10b, 10c                                                [10a–10c]
```

## Passi in ordine

**10a – Bottino dei boss, Eco e migrazione v2**

1. Aggiornare `Partita` e `salvataggio.ts` (test prima): `VERSIONE_SALVATAGGIO = 2`, `MIGRAZIONI[1]`, conservazione dei nuovi elenchi.
2. Scrivere i test e l'implementazione di `bottinoBoss()` in `src/systems/bottino.ts` e aggiornare la validazione di `boss.json` in `boss.ts` e `caricaDati.ts`.
3. Aggiungere in `oggetti.json`, `armature.json`, `ricette.json` e `boss.json` il `frammento_eco`, i leggendari mancanti e i Sigilli dell'Eco per i 3 boss esistenti (Re Scheletro, Troll, Negromante).
4. Aggiungere in `ScenaMondo.ts` e `GestoreBoss.ts` l'altare dell'Eco (che compare nella stanza del boss quando è in `bossSconfitti`) e lo scontro in modalità Eco.
5. Verifica (`tsc`, `vitest`, `vite build`, prova nel browser `fase-10a.cjs`), schermate, aggiornamento `dist/gioco.html`. **Mi fermo.**

**10b – Compagni di viaggio, amuleto e banchi di crafting**

6. Estendere `equipaggiamento.ts` (test prima) con lo spazio `amuleto`, aggiornare `caricaDati.ts` e adattare la colonna sinistra di `ScenaScheda.ts` per mostrare i 7 spazi equipaggiabili.
7. Estendere `crafting.ts` e `caricaDati.ts` (test prima) per accettare il campo `banco` (`fucina` | `armature` | `alchimia`) e risultati di tipo `arma`, `armatura`, `pozione` o `missione` (per i sigilli), aggiornando `ScenaFucina.ts`.
8. Estendere `taverna.ts`, `tipi.ts` e `ScenaMondo.ts` per i compagni con `"viaggio": true`, l'azione di dialogo `"unisci"`, i commenti di mappa una tantum e le 3 abilità (*Fiuta!*, *Polvere nera*, *Velo d'ombra*).
9. Verifica (`tsc`, `vitest`, `vite build`, prova nel browser `fase-10b.cjs`), schermate, aggiornamento `dist/gioco.html`. **Mi fermo.**

**10c – Segreti del mondo e pietre di passaggio**

10. Estendere `mappa.ts` (test prima) e `creaTilemap.ts` / `ScenaMondo.ts` con le nuove celle: `"sepolto"` (invisibile finché non rivelata da *Fiuta!* o *Elmo del veggente*, scavabile con `pala`), `"crepata"` (aperta da *Polvere nera*), porta con `"runica": true` (aperta da Selva o da una leva), cartello con `"aspetto": "ricordo"` (apre il ricordo a tutto schermo).
11. Creare le celle `"pietra"` e `ScenaPietra.ts` (attivazione della pietra, viaggio rapido verso le pietre attivate, cambio compagno attivo) e collocare la prima pietra di passaggio in `borgo.json`.
12. Verifica completa (`tsc`, `vitest`, `vite build`, prova nel browser `fase-10c.cjs`), schermate, lezione `docs/lezioni/fase-10.md` e tabella delle fasi aggiornata. **Mi fermo.**

## Test previsti

- **salvataggio (v1 → v2):** un salvataggio di versione 1 viene migrato a versione 2 con `ecoSconfitti: []`, `sepoltiScavati: []`, `pietre: []`, `ricordiVisti: []`, `commentiVisti: []` e `equipaggiamento.amuleto: null` mantenendo intatti inventario, quest, monete e statistiche.
- **bottino dei boss:**
  - prima sconfitta: restituisce sempre 1 leggendario della lista `leggendari` del boss, 1 `frammento_eco` e, con probabilità 25%, l'`esoticoFirma`;
  - prima sconfitta Eco: restituisce sempre l'`esoticoFirma` se il giocatore non lo possiede (né nello zaino né indossato); se lo possiede già, restituisce un esotico errante non posseduto;
  - vittorie Eco successive: restituiscono un leggendario della lista e monete, senza duplicare esotici.
- **amuleto:** si indossa nello spazio `amuleto`, somma eventuali bonus alle caratteristiche e rispetta il limite di massimo 1 pezzo esotico complessivo tra elmo, corazza, guanti, stivali e amuleto.
- **banchi di crafting:** `ricettePerBanco()` restituisce solo le ricette conoscibili di quel banco; una ricetta può creare armi, armature, pozioni o sigilli dell'Eco.
- **esplorazione e pietre:**
  - un tesoro sepolto non si può scavare senza `pala`; una volta scavato finisce in `sepoltiScavati` e non si scava una seconda volta;
  - una roccia crepata non si apre con gli attacchi normali ma solo con *Polvere nera*;
  - una porta runica si apre solo se Selva è il compagno attivo (o tramite leva);
  - toccare una pietra di passaggio la aggiunge a `pietre` e permette il teletrasporto verso le altre pietre già scoperte.

## Cosa provare giocando (a fine fase 10)

1. Caricare un salvataggio esistente e verificare che tutto funzioni senza errori e che nella Scheda (C) compaia il nuovo spazio **Amuleto**.
2. Sconfiggere un boss (o usare la Modalità Sviluppatore F8 per teletrasportarsi nella Cripta), raccogliere il **leggendario garantito** e il **Frammento d'eco**, forgiare il **Sigillo dell'Eco** da Bruno e attivare l'**Altare dell'Eco** nella stanza del boss per affrontare la sua versione potenziata.
3. Cliccare sulla **Pietra di passaggio** in piazza a Borgo Quercia per aprire il pannello di viaggio rapido e cambio compagno.
4. Provare (anche tramite gli strumenti sviluppatore F8) lo scavo di un tesoro sepolto con la pala e le tre nuove abilità dei compagni (*Fiuta!*, *Polvere nera*, *Velo d'ombra*).

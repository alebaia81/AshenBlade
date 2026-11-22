# Piano della fase 12: Atto II espanso — Le Colline di Pietrafonda

Stato: **completata** (12a, 12b, 12c)

## Obiettivo

Da `docs/storia.md` (§5.2, §6.2, §7–§10) e `docs/espansione.md` (§4, §5.10, §5.12, §6): espandere il secondo atto da ~25 minuti a circa **1 ora e 30 minuti** (livello 7 → 12), trasformando le Colline in una regione completa con il villaggio minerario di **Pietrafonda**, il **Passo del Corvo**, il dungeon di mezzo **Cave di Zolfo** (con il mini-boss **Ferrante il Contrabbandiere** e il salvataggio di **Matteo**, figlio di Bruno), il banco delle **armature** di **Ugo** e il secondo compagno di viaggio **Grisk** (con la sua **Polvere nera** che apre le **rocce crepate**).

Alla fine della fase 12:
- dalle *Colline Grigie* si raggiungono il **Passo del Corvo** (`passo_corvo`), le **Cave di Zolfo** (`cave_zolfo`) e il villaggio di **Pietrafonda** (`pietrafonda`, con la sua **Pietra di passaggio** per il viaggio rapido da e verso Borgo Quercia);
- nelle *Cave di Zolfo* si affronta il mini-boss **Ferrante il Contrabbandiere** (con il nuovo attacco boss `bomba`, i suoi leggendari *Balestra del contrabbandiere* e *Corazza di Ferrante*, l'esotico firma **Balestra di zolfo** con effetto `esplosione` e il **Sigillo dell'Eco: Ferrante** forgiabile da Ugo) e si libera **Matteo**, riportando la notizia al padre Bruno a Borgo Quercia;
- **Pietrafonda** viene liberata dai goblin (`atto2_pietrafonda`) e cambia aspetto con `cambiaCon`: **Ugo** apre il banco di crafting delle **armature** (`"banco": "armature"`);
- nelle gallerie della *Miniera dei Goblin*, prima del Troll, si libera **Grisk** (`grisk_liberato`), che si unisce gratuitamente al gruppo come secondo compagno di viaggio e permette di far saltare le **rocce crepate** (`C`) con **Polvere nera**;
- completando la quest personale di Grisk (*Pace con il clan*, `grisk_clan`) si ottiene la ricetta dei leggendari **Pugnali di Pietrarossa** (`pugnali_pietrarossa`) e si apre il negozio goblin di **Krak** a Pietrafonda;
- le Colline offrono i nuovi materiali (**Argento**, **Zolfo**, **Pietra lunare**), 4 nuove missioni secondarie e altre 4 **Ghiande d'oro** (portando il totale disponibile a 8 su 12).

## Proposta: tre consegne

| Consegna | Contenuto |
|---|---|
| **12a – Il Passo del Corvo, le Cave di Zolfo, Ferrante e Matteo** | Nuove mappe `passo_corvo` (36×20) e `cave_zolfo` (34×26) collegate alle *Colline Grigie*; nuovi nemici `corvo` e `bandito_balestriere`; mini-boss `ferrante` con attacco `bomba` (bombe di zolfo ad area); nuovo effetto arma esotico `esplosione` per la `balestra_zolfo`; materiali `argento`, `zolfo` e `sigillo_spezzato`; leggendari `balestra_contrabbandiere` e `corazza_ferrante`; salvataggio di **Matteo** (`matteo`) e quest `ritorno_matteo` che riunisce padre e figlio. |
| **12b – Pietrafonda, il banco delle armature di Ugo e Grisk** | Nuova mappa `pietrafonda` (40×28) con **Pietra di passaggio**, versione occupata e liberata tramite `cambiaCon` e quest `atto2_pietrafonda`; apertura del banco `"armature"` nel dialogo di **Ugo** con nuove ricette d'armatura (`corazza_argento`, `guanti_titano`); incontro con **Grisk** in `miniera_gallerie.json` e quest `grisk_liberato` che unisce Grisk al gruppo (`unisci: "grisk"`); prime **rocce crepate** nelle Colline e nella Miniera. |
| **12c – Pace con il clan, secondarie e tesori delle Colline** | Quest personale `grisk_clan` (*Pace con il clan* → ricetta leggendaria `pugnali_pietrarossa` e mercante goblin **Krak** a Pietrafonda); materiale raro `pietra_lunare` in vene dietro rocce crepate; secondarie `argento_ugo`, `lanterne_minatori` e `tesoro_ferrante` (*La mappa di Ferrante*); 4 nuove **Ghiande d'oro** nella Regione II e lezione `docs/lezioni/fase-12.md`. |

## Collegamenti tra le mappe della Regione II (Le Colline)

```
                                   [radura] ✅
                                       │
                                  (uscita sud)
                                       ▼
[brughiera] ✅ <──(ovest)── [colline (Colline Grigie)] ✅ ──(est, dopo frana)──> [miniera_gallerie] ✅ (Grisk 🆕)
                                │                     │                                  │
                         (uscita sud-ovest)     (uscita sud)                        (scale giù)
                                ▼                     ▼                                  ▼
                        [passo_corvo] 🆕      [pietrafonda] 🆕 (Pietra P, Ugo)    [miniera_tana] ✅ (Troll)
                                │
                           (ingresso)
                                ▼
                        [cave_zolfo] 🆕 (Ferrante, Matteo)
```

## File da creare o modificare

```
src/
  systems/
    boss.ts                nuovo attacco boss 'bomba' (lancio bomba di zolfo con preavviso e danno ad area)      [12a]
    effettiArmi.ts         nuovo effetto arma 'esplosione' per l'esotico Balestra di zolfo                       [12a]
  scenes/
    ScenaMondo.ts          danno ad area all'impatto per i proiettili con effetto 'esplosione'                   [12a]
    mondo/
      GestoreBoss.ts       esecuzione dell'attacco 'bomba' di Ferrante                                           [12a]
  data/
    abitanti.json          matteo [12a]; grisk (incontro in miniera) [12b]; krak (mercante goblin) [12c]
    negozio.json           negozio 'krak' (zolfo, argento, pietra_lunare, pozioni)                               [12c]
    dialoghi.json          matteo, bruno, ugo, berta [12a–12b]; grisk, krak [12b–12c]
    quest.json             ritorno_matteo, atto2_miniera aggiornata [12a]; atto2_pietrafonda, grisk_liberato [12b]; grisk_clan, argento_ugo, lanterne_minatori, tesoro_ferrante [12c]
    nemici.json            corvo, bandito_balestriere                                                            [12a]
    boss.json              ferrante (fasi, bomba, leggendari, esoticoFirma, eco)                                 [12a]
    oggetti.json           argento, zolfo, sigillo_spezzato, sigillo_eco_ferrante [12a]; pergamena_corazza_argento, pergamena_guanti_titano [12b]; pietra_lunare, pergamena_pugnali_pietrarossa, mappa_ferrante [12c]
    armi.json              balestra_contrabbandiere, balestra_zolfo [12a]; pugnali_pietrarossa [12c]
    armature.json          corazza_ferrante [12a]; corazza_argento [12b]
    ricette.json           sigillo_eco_ferrante [12a]; corazza_argento, guanti_titano (banco 'armature') [12b]; pugnali_pietrarossa [12c]
    sprite.json            figure per matteo, krak, corvo, bandito_balestriere, ferrante, vene argento/zolfo/pietra_lunare [12a–12c]
    musica.json            zone per passo_corvo, cave_zolfo, pietrafonda                                         [12a–12b]
    mappe/
      colline.json         uscite verso passo_corvo e pietrafonda                                                [12a–12b]
      passo_corvo.json     nuova mappa 36×20 del Passo del Corvo (con roccia crepata e tesoro sepolto)           [12a]
      cave_zolfo.json      nuovo dungeon 34×26 delle Cave di Zolfo (con Ferrante e cella di Matteo)              [12a]
      pietrafonda.json     nuovo villaggio 40×28 di Pietrafonda (Pietra di passaggio, Ugo, Krak)                 [12b–12c]
      miniera_gallerie.json cella laterale con Grisk e roccia crepata con tesoro                                 [12b–12c]
tests/
  boss.test.ts             validazione e logica dell'attacco 'bomba' di Ferrante                                 [12a]
  effettiArmi.test.ts      calcolo bersagli nel raggio dell'effetto 'esplosione'                                 [12a]
  datiMappe.test.ts        integrità di mappe, boss, negozi e quest della Regione II                             [12a–12c]
  browser/fase-12*.cjs     prove nel browser per 12a, 12b e 12c                                                  [12a–12c]
```

## Passi in ordine

**12a – Il Passo del Corvo, le Cave di Zolfo, Ferrante e Matteo**

1. Scrivere i test e l'implementazione dell'attacco boss `bomba` in `src/systems/boss.ts` + `GestoreBoss.ts` e dell'effetto esotico `esplosione` in `src/systems/effettiArmi.ts` + `ScenaMondo.ts`.
2. Aggiungere in `nemici.json`, `boss.json`, `oggetti.json`, `armi.json`, `armature.json`, `ricette.json` e `sprite.json`: `corvo`, `bandito_balestriere`, `ferrante`, `argento`, `zolfo`, `sigillo_spezzato`, `balestra_contrabbandiere`, `corazza_ferrante`, `balestra_zolfo` e `sigillo_eco_ferrante`.
3. Creare `passo_corvo.json` (36×20) e `cave_zolfo.json` (34×26), collegarle a `colline.json`, aggiungere **Matteo** (`matteo`) in `abitanti.json` e `dialoghi.json`, e creare la quest `ritorno_matteo` che riunisce Matteo e Bruno.
4. Verifica (`tsc`, `vitest`, `vite build`, prova `fase-12a.cjs`), aggiornamento `dist/gioco.html`. **Mi fermo.**

**12b – Pietrafonda, il banco delle armature di Ugo e Grisk**

5. Creare `pietrafonda.json` (40×28) collegata a sud di `colline.json`, con la seconda **Pietra di passaggio** del mondo (`"nome": "Pietrafonda"`), la fucina delle armature di **Ugo** e i goblin ostili che spariscono con `cambiaCon` al completamento di `atto2_pietrafonda`.
6. Aggiornare il dialogo di **Ugo** per aprire il banco `"armature"` (`ScenaFucina` con `"banco": "armature"`) e aggiungere le ricette d'armatura (`corazza_argento`, `guanti_titano`) e il `sigillo_eco_ferrante` / `sigillo_eco_troll_caverne`.
7. Aggiungere **Grisk** in `miniera_gallerie.json` insieme alla quest `grisk_liberato` (che lo unisce al gruppo con `unisci: "grisk"`) e inserire le prime **rocce crepate** (`C`) nelle Colline e nella Miniera.
8. Verifica (`tsc`, `vitest`, `vite build`, prova `fase-12b.cjs`), aggiornamento `dist/gioco.html`. **Mi fermo.**

**12c – Pace con il clan, secondarie e tesori delle Colline**

9. Aggiungere la quest personale di Grisk `grisk_clan` (*Pace con il clan*), l'arma leggendaria `pugnali_pietrarossa` e il mercante goblin **Krak** (`krak`) a Pietrafonda con il suo negozio in `negozio.json`.
10. Aggiungere il materiale raro `pietra_lunare` (in vene dietro le rocce crepate), le secondarie `argento_ugo`, `lanterne_minatori` e `tesoro_ferrante` (*La mappa di Ferrante*), e le 4 **Ghiande d'oro** della Regione II.
11. Verifica completa (`tsc`, `vitest`, `vite build`, prova `fase-12c.cjs`), lezione `docs/lezioni/fase-12.md`, aggiornamento `dist/gioco.html` e tabella delle fasi aggiornata. **Mi fermo.**

## Test previsti

- **Attacco `bomba` (Ferrante):** sceglie un punto calpestabile vicino all'eroe, scala il danno nella versione Eco e valida il formato del dado in `validaBoss()`.
- **Effetto `esplosione` (Balestra di zolfo):** individua tutti i nemici entro il raggio dell'esplosione attorno al bersaglio colpito e calcola il danno ad area.
- **Integrità dei dati (`datiMappe.test.ts`):**
  - collegamenti bidirezionali `colline` ↔ `passo_corvo` ↔ `cave_zolfo` e `colline` ↔ `pietrafonda`;
  - la Pietra di passaggio di Pietrafonda, il banco `armature` di Ugo, il negozio di Krak e le 4 nuove quest superano tutte le validazioni di `caricaDati()`.

## Cosa provare giocando (a fine fase 12)

1. Dalle *Colline Grigie*, scendere a **Pietrafonda**, attivare la seconda **Pietra di passaggio** per viaggiare rapidamente a Borgo Quercia, liberare il villaggio e aprire il **Banco delle armature** di Ugo.
2. Percorrere il **Passo del Corvo**, entrare nelle **Cave di Zolfo**, sconfiggere **Ferrante il Contrabbandiere** schivando le sue bombe di zolfo, liberare **Matteo** e tornare da **Bruno** al borgo per assistere al loro riabbraccio.
3. Liberare **Grisk** nella *Miniera dei Goblin*, selezionarlo come compagno attivo e usare **Polvere nera (`Q`/`R`)** per far saltare le **rocce crepate** nella Miniera e sul Passo del Corvo, raccogliendo la **Pietra lunare** e le nuove **Ghiande d'oro**.

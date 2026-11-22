# Piano della fase 11: Prologo e Atto I espanso (La Valle)

Stato: **completata** (11a, 11b, 11c)

## Obiettivo

Da `docs/storia.md` (§6.0, §6.1, §7–§10) e `docs/espansione.md` (§4, §5.10, §5.12, §6): espandere l'inizio dell'avventura e il primo atto da ~25 minuti a circa **1 ora e 50 minuti** (Prologo ~20 min + Atto I ~1 h 30, livello 1 → 7), sfruttando i sistemi costruiti nella Fase 10 (tesori sepolti, pala, compagni di viaggio, bottino dei boss ed Eco).

Alla fine della fase 11:
- una nuova partita inizia sulla **Strada Maestra** (`strada_maestra`), di sera, con un tutorial naturale (carro rovesciato, forziere con pozioni, salvataggio del mercante **Teodoro** e difesa del cancello di Borgo Quercia insieme alla guardia **Fausto**);
- **Teodoro** apre il suo negozio ambulante (dove vende anche la **Pala da scavo**, pozioni e materiali di base);
- l'Atto I si arricchisce del **Mulino del Ponte** (`mulino_ponte`) e del dungeon di mezzo **Cantine del Mulino** (`cantine_mulino`), con i nuovi nemici (**Ratto**, **Melma piccola**), il materiale raro **Ambra** e il mini-boss **Re Melma** (con il nuovo attacco `dividi`, i suoi leggendari, il suo esotico firma **Bastone della melma** con effetto `dardo_diviso` e il **Sigillo dell'Eco: Re Melma** forgiabile da Bruno);
- **Ottone il becchino**, liberato al Mulino dopo aver sconfitto il Re Melma, consegna la chiave della Cripta e rivela di aver visto un vecchio col mantello viola aggirarsi di notte tra le tombe;
- al Mulino si incontrano **Tessa e Brina**: seguendo la quest *Le tracce di Aldo* fino alla **Radura nascosta** (`radura_nascosta`) Tessa si unisce gratuitamente al gruppo come prima compagna di viaggio, sbloccando la sua quest personale *L'ascia di mio padre* (che insegna a usare *Fiuta!* e la pala per ottenere la ricetta leggendaria dell'**Arco di Aldo**);
- la Valle offre 3 nuove missioni secondarie (*Un'arma vera per Fausto*, *Il pozzo dei desideri*, *La mappa del mugnaio*) e le prime **Ghiande d'oro** nascoste tra muri segreti e tesori sepolti.

## Proposta: tre consegne

| Consegna | Contenuto |
|---|---|
| **11a – Prologo: la Strada Maestra, Teodoro e il cancello** | Nuova mappa iniziale `strada_maestra` (40×16) collegata all'ingresso ovest di `borgo`; nuovi abitanti **Teodoro** (mercante ambulante con negozio proprio che vende la `pala`) e **Fausto** (guardia al cancello); quest principale automatica `prologo_strada` (*Prologo: la strada dei morti*) che sblocca il cancello del borgo dopo aver respinto gli scheletri; raccordo con il dialogo iniziale della sindaca Berta. |
| **11b – Il Mulino del Ponte, le Cantine e il Re Melma** | Mappe `mulino_ponte` (32×24) e `cantine_mulino` (28×22); abitante **Ottone il becchino**; nuovi nemici `ratto` e `melma_piccola`; mini-boss `re_melma` con attacco `dividi` (si scinde in melme piccole sotto metà vita); materiali `ambra` e `nucleo_melma`; leggendari `mazza_mugnaio` e `guanti_ambra`, esotico firma `bastone_melma` (effetto `dardo_diviso`) e ricetta `sigillo_eco_re_melma`; quest principale `atto1_becchino` inserita tra `atto1_cimitero` e `atto1_cripta`; accenno di frate Anselmo a Selva a fine Atto I. |
| **11c – Tessa e Brina, la Radura nascosta e le secondarie della Valle** | Mappa `radura_nascosta` (20×16) collegata al `bosco` tramite passaggio segreto; abitante/incontro con **Tessa** e quest `tessa_tracce` (*Le tracce di Aldo*, che unisce **Tessa e Brina** al gruppo); quest personale `tessa_ascia` (*L'ascia di mio padre* → tesoro sepolto con `ascia_aldo_rotta` → ricetta leggendaria `arco_aldo`); secondarie `fausto_forcone`, `pozzo_desideri` e `mappa_mugnaio`; prime 4 **Ghiande d'oro** (`ghianda_oro`) della Regione I e dialogo di nonna Rosalba sulla leggenda delle dodici ghiande. |

## Collegamenti tra le mappe della Regione I (La Valle)

```
[strada_maestra] 🆕 ──(cancello ovest)──> [borgo] ✅ ──(uscita est)──> [radura] ✅ ──(uscita nord-est)──> [mulino_ponte] 🆕
                                                                         │                                   │
                                                                    (uscita est)                        (botola)
                                                                         ▼                                   ▼
                                               [radura_nascosta] 🆕 <── [bosco] ✅                   [cantine_mulino] 🆕
                                                                         │
                                                                    (uscita sud)
                                                                         ▼
                                                                    [cimitero] ✅ ──> [cripta_sale / cripta_trono] ✅
```

## File da creare o modificare

```
src/
  systems/
    boss.ts                nuovo attacco boss 'dividi' (evocazione melme quando il boss subisce colpi sotto soglia) [11b]
    effettiArmi.ts         nuovo effetto arma 'dardo_diviso' per l'esotico Bastone della melma                      [11b]
    quest.ts               supporto opzionale a tesori sepolti nel passo 'trova' (per le mappe del tesoro)          [11c]
  scenes/
    ScenaDialogo.ts        passaggio dell'abitante corrente a mondo.apri() per aprire il negozio di Teodoro         [11a]
    ScenaMondo.ts          selezione del negozio in base all'abitante ('gemma' o 'teodoro'), effetto 'dardo_diviso' [11a–11b]
    mondo/
      GestoreBoss.ts       esecuzione dell'attacco 'dividi' del Re Melma                                            [11b]
  data/
    mondo.json             mappaIniziale: 'strada_maestra', salvataggioAutomatico: ['borgo']                        [11a]
    abitanti.json          teodoro, fausto [11a]; ottone [11b]; tessa (incontro prima dell'unione) [11c]
    negozio.json           negozio 'teodoro' (pala, pozioni, materiali di base)                                     [11a]
    dialoghi.json          dialoghi di teodoro, fausto, berta aggiornata [11a]; ottone, anselmo [11b]; tessa, rosalba, bruno [11c]
    quest.json             prologo_strada [11a]; atto1_becchino [11b]; tessa_tracce, tessa_ascia, fausto_forcone, pozzo_desideri, mappa_mugnaio [11c]
    nemici.json            ratto, melma_piccola                                                                     [11b]
    boss.json              re_melma (fasi, leggendari, esoticoFirma, eco)                                           [11b]
    oggetti.json           ambra, nucleo_melma, sigillo_eco_re_melma, chiave_ottone [11b]; ghianda_oro, ascia_aldo_rotta, mappa_mugnaio, pergamena_arco_aldo [11c]
    armi.json              mazza_mugnaio, bastone_melma [11b]; arco_aldo [11c]
    armature.json          guanti_ambra [11b]; corazza_cuoio_rinforzata [11c]
    ricette.json           sigillo_eco_re_melma [11b]; arco_aldo, corazza_cuoio_rinforzata [11c]
    sprite.json            figure per teodoro, fausto, ottone, ratto, re_melma, botte                               [11a–11b]
    musica.json            associazione brani per strada_maestra, mulino_ponte, cantine_mulino, radura_nascosta     [11a–11c]
    mappe/
      strada_maestra.json  nuova mappa 40×16 del Prologo                                                            [11a]
      borgo.json           ingresso ovest dalla Strada Maestra con Fausto                                           [11a]
      radura.json          sentiero verso il Mulino del Ponte                                                       [11b]
      mulino_ponte.json    nuova mappa 32×24 del Mulino del Ponte                                                   [11b]
      cantine_mulino.json  nuovo dungeon 28×22 delle Cantine del Mulino (con Re Melma)                              [11b]
      bosco.json           passaggio segreto verso la Radura nascosta                                               [11c]
      radura_nascosta.json nuova mappa 20×16 della Radura di Aldo                                                   [11c]
tests/
  boss.test.ts             validazione e logica dell'attacco 'dividi' del Re Melma                                  [11b]
  effettiArmi.test.ts      calcolo direzioni/danno per 'dardo_diviso'                                               [11b]
  datiMappe.test.ts        integrità automatica di tutte le nuove mappe, quest, dialoghi, negozi e boss             [11a–11c]
  browser/fase-11*.cjs     prove nel browser per 11a, 11b e 11c                                                     [11a–11c]
```

## Passi in ordine

**11a – Prologo: la Strada Maestra, Teodoro e il cancello**

1. Estendere `ScenaDialogo.ts` e `ScenaMondo.ts` affinché `apri('negozio')` apra il negozio dell'abitante con cui si sta parlando (`teodoro` o `gemma`), aggiungendo il negozio di Teodoro in `negozio.json` (con la `pala` in vendita).
2. Aggiungere `teodoro` e `fausto` in `abitanti.json`, `sprite.json` e `dialoghi.json`, e creare la quest principale `prologo_strada` in `quest.json` (avviata all'inizio della partita o parlando con Teodoro/Fausto).
3. Creare `src/data/mappe/strada_maestra.json` (40×16: carro rovesciato, forziere iniziale con pozioni, Teodoro, 3 scheletri davanti al cancello, Fausto e il cancello che si apre con `cambiaCon` una volta respinti gli scheletri), collegarla all'ingresso ovest di `borgo.json`, registrare la musica in `musica.json` e impostare `mappaIniziale: "strada_maestra"` in `mondo.json`.
4. Verifica (`tsc`, `vitest`, `vite build`, prova `fase-11a.cjs`), aggiornamento `dist/gioco.html`. **Mi fermo.**

**11b – Il Mulino del Ponte, le Cantine e il Re Melma**

5. Scrivere i test e l'implementazione del nuovo attacco boss `dividi` in `src/systems/boss.ts` + `GestoreBoss.ts` e del nuovo effetto esotico `dardo_diviso` in `src/systems/effettiArmi.ts` + `ScenaMondo.ts`.
6. Aggiungere in `nemici.json`, `boss.json`, `oggetti.json`, `armi.json`, `armature.json` e `ricette.json`: `ratto`, `melma_piccola`, `re_melma`, `ambra`, `nucleo_melma`, `mazza_mugnaio`, `guanti_ambra`, `bastone_melma` e `sigillo_eco_re_melma`.
7. Creare `mulino_ponte.json` (32×24) e `cantine_mulino.json` (28×22), collegarle alla `radura`, aggiungere `ottone` in `abitanti.json` e `dialoghi.json`, inserire la quest principale `atto1_becchino` tra `atto1_cimitero` e `atto1_cripta` e aggiornare il dialogo finale di frate Anselmo con l'accenno a Selva.
8. Verifica (`tsc`, `vitest`, `vite build`, prova `fase-11b.cjs`), aggiornamento `dist/gioco.html`. **Mi fermo.**

**11c – Tessa e Brina, la Radura nascosta e le secondarie della Valle**

9. Creare `radura_nascosta.json` (20×16) collegata a `bosco.json` tramite un muro segreto di cespugli, con la tomba di Aldo e il tesoro sepolto dell'ascia.
10. Aggiungere l'incontro con **Tessa** al Mulino del Ponte e i dialoghi/quest `tessa_tracce` (che unisce Tessa e Brina come compagne di viaggio tramite `unisci: "tessa"`) e `tessa_ascia` (che porta a scavare `ascia_aldo_rotta` e a farla riforgiare da Bruno per ottenere la ricetta di `arco_aldo`).
11. Aggiungere le missioni secondarie della Valle (`fausto_forcone`, `pozzo_desideri`, `mappa_mugnaio`), le prime 4 **Ghiande d'oro** (`ghianda_oro`) nascoste nella Regione I e il dialogo di nonna Rosalba sulla collezione delle Ghiande d'oro.
12. Verifica completa (`tsc`, `vitest`, `vite build`, prova `fase-11c.cjs`), lezione `docs/lezioni/fase-11.md`, aggiornamento `dist/gioco.html` e tabella delle fasi aggiornata. **Mi fermo.**

## Test previsti

- **Attacco `dividi` (Re Melma):** sotto metà vita, il Re Melma genera melme piccole fino al tetto massimo consentito; la validazione in `boss.ts` controlla che il nemico diviso esista nel catalogo.
- **Effetto `dardo_diviso` (Bastone della melma):** calcola i due dardi secondari angolati generati dal colpo principale.
- **Integrità dei dati (`datiMappe.test.ts`):**
  - tutte le uscite tra `strada_maestra` ↔ `borgo`, `radura` ↔ `mulino_ponte` ↔ `cantine_mulino` e `bosco` ↔ `radura_nascosta` sono bidirezionali e lontane dai nemici;
  - la catena delle quest principali (`prologo_strada` → `atto1_cimitero` → `atto1_becchino` → `atto1_cripta` → `atto2_miniera`) e tutte le nuove secondarie superano `validaQuest()` e `validaDialogo()`;
  - il negozio di Teodoro e il bottino del Re Melma superano tutti i controlli di `caricaDati()`.

## Cosa provare giocando (a fine fase 11)

1. Avviare una **Nuova Partita**: partire sulla **Strada Maestra**, salvare **Teodoro**, comprare da lui la **Pala da scavo**, sconfiggere gli scheletri al cancello di **Fausto** ed entrare a Borgo Quercia.
2. Dopo aver visitato il Cimitero per Berta, dirigersi al **Mulino del Ponte**, scendere nelle **Cantine del Mulino**, battere il **Re Melma** (ottenendo uno tra *Mazza del mugnaio* e *Guanti d'ambra* + 25% *Bastone della melma*), liberare **Ottone** e ricevere la chiave della Cripta.
3. Parlare con **Tessa** al Mulino, trovare il passaggio segreto nel Bosco verso la **Radura nascosta** per far unire **Tessa e Brina** al gruppo, e usare **Fiuta! (`R`)** + la **pala** per dissotterrare l'ascia di Aldo e i tesori sepolti della Valle.

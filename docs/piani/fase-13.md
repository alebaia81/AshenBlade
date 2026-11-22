# Piano della fase 13: Atto III espanso — La Brughiera e Guado delle Lanterne

Stato: **in corso** (13a completata; 13b e 13c da fare)

## Obiettivo

Da `docs/storia.md` (§5.2, §6.3, §6.4, §7–§12) e `docs/espansione.md` (§4, §5.8–§5.12, §6): espandere il terzo atto da ~25 minuti a circa **1 ora e 30 minuti** (livello 12 → 17), aggiungendo il villaggio su palafitte **Guado delle Lanterne** (con **Mamma Orsola** e la terza **Pietra di passaggio**), la **Palude delle Lanterne**, la **Casa sul Colle** (con i **Ricordi** a tutto schermo che svelano l'incendio appiccato da Berta), il dungeon di mezzo **Osservatorio di Orvald** (con **porte runiche**, **leve** e il mini-boss/terza compagna **Selva**), il **banco di alchimia**, il **confronto con Berta** e il **finale arricchito** con il *Quaderno di Lia* e i tre compagni di viaggio.

Alla fine della fase 13:
- dalla *Brughiera della Torre* si raggiunge il **Guado delle Lanterne** (`guado`, con **Pietra di passaggio**, salvataggio automatico, **Mamma Orsola**, **Teodoro** e **Selva**);
- attraversando la **Palude delle Lanterne** (`palude_lanterne`) e spegnendo i **Fuochi fatui** (`fuoco_fatuo`) per la quest *Il traghetto di Orsola* (`traghetto_orsola`), Orsola apre il passaggio verso la **Casa sul Colle** (`casa_colle`);
- nella **Casa sul Colle** (zona senza nemici) si leggono i **Ricordi** (`"aspetto": "ricordo"`) di Orvald e Lia, scoprendo che vent'anni fa fu **Berta** a bruciare il laboratorio per proteggere il borgo;
- sotto la casa, nell'**Osservatorio di Orvald** (`osservatorio`), si aprono **porte runiche** tramite **leve**, si affronta il mini-boss **Selva l'Incantatrice** (`selva_boss`, che evoca **Illusioni** a 1 punto vita e lascia i leggendari *Bacchetta di Selva* / *Stivali della palude*, l'esotico firma **Velo di Selva** e il *Sigillo dell'Eco: Selva*);
- spezzato l'incantesimo, **Selva** si unisce gratuitamente al gruppo come terza compagna di viaggio (`unisci: "selva"`), permettendo di usare **Velo d'ombra**, aprire direttamente tutte le **porte runiche** e distillare pozioni nel **banco di alchimia** (`"banco": "alchimia"`);
- tornando a Borgo Quercia si affronta **Berta** nel dialogo del **confronto** (`confronto_berta`), in cui Berta difende la sua scelta (*"L'ho fatto per proteggere il borgo!"*);
- con la quest personale di Selva (*Il quaderno di Lia*, `selva_quaderno`) si ottiene l'amuleto esotico **Ciondolo di Lia** (`ciondolo_lia`) e il **Finale** (`ScenaFinale.ts`) si arricchisce con il ricordo del quaderno di Lia e le battute finali di **Tessa, Grisk e Selva**;
- la Brughiera offre le ultime 4 **Ghiande d'oro** (completando tutte le **12 Ghiande d'oro** del mondo).

## Proposta: tre consegne

| Consegna | Contenuto |
|---|---|
| **13a – Il Guado delle Lanterne, la Palude e Mamma Orsola** | Nuove mappe notturne `guado` (30×22, con **Pietra di passaggio** e salvataggio automatico) e `palude_lanterne` (40×30) collegate a `brughiera`; abitante **Mamma Orsola** (`orsola`); nuovo nemico `fuoco_fatuo` (tiratore spettrale); materiali `giunco_palude`, `erica` ed `essenza_ombra`; quest `traghetto_orsola` (*Il traghetto di Orsola*) che sblocca con `cambiaCon` il pontile verso la Casa sul Colle. |
| **13b – La Casa sul Colle (i ricordi), l'Osservatorio e Selva** | Mappa pacifica `casa_colle` (24×20) con i **Ricordi** a tutto schermo (`"aspetto": "ricordo"`), le lettere di Orvald e l'accesso all'`osservatorio` (30×26, con **porte runiche** e **leve**); materiale `inchiostro_luna`; nemico `illusione` (1 vita) e mini-boss `selva_boss` (leggendari `bacchetta_selva` e `stivali_palude`, esotico firma `velo_selva`, ricetta `sigillo_eco_selva_boss`); abitante `selva` e quest `selva_liberata` che unisce **Selva** al gruppo (`unisci: "selva"`). |
| **13c – Il confronto con Berta, il Quaderno di Lia, l'Alchimia e il Finale esteso** | Quest `confronto_berta` (Berta difende la sua scelta di bruciare il laboratorio per proteggere il borgo); quest personale `selva_quaderno` (*Il quaderno di Lia* → amuleto esotico `ciondolo_lia`); banco `"alchimia"` di Selva con nuove ricette di pozioni; secondarie `ultime_lettere`, `erbe_palude` e `tesoro_luna` (*La mappa della luna*); ultime 4 **Ghiande d'oro** (12/12 totali); finale esteso in `ScenaFinale.ts` / `finale.json` con il quaderno di Lia e i tre compagni di viaggio; lezione `docs/lezioni/fase-13.md`. |

## Collegamenti tra le mappe della Regione III (La Brughiera)

```
[torre_cima] ✅ <── [torre_piani] ✅ <── [brughiera] ✅ <──(ovest)── [colline] ✅
                                             │
                                        (uscita sud)
                                             ▼
                                        [guado] 🆕 (Pietra P, Mamma Orsola, Selva/Alchimia)
                                             │
                                        (pontile ovest)
                                             ▼
                                   [palude_lanterne] 🆕 (Fuochi fatui, giunco, erica)
                                             │
                                  (traghetto sbloccato)
                                             ▼
                                     [casa_colle] 🆕 (Ricordi di Orvald e Lia, nessun nemico)
                                             │
                                        (scala giù)
                                             ▼
                                    [osservatorio] 🆕 (Porte runiche, leve, mini-boss Selva)
```

## File da creare o modificare

```
src/
  scenes/
    ScenaMondo.ts          passaggio pagine dinamiche a ScenaFinale (quaderno di Lia e compagni di viaggio) [13c]
  data/
    mondo.json             salvataggioAutomatico: ['borgo', 'pietrafonda', 'guado']                         [13a]
    abitanti.json          orsola [13a]; selva [13b]
    negozio.json           mappa_luna nel negozio di Gemma                                                  [13c]
    dialoghi.json          orsola [13a]; selva [13b]; berta (confronto), anselmo, rosalba [13c]
    quest.json             traghetto_orsola [13a]; selva_liberata [13b]; confronto_berta, selva_quaderno, ultime_lettere, erbe_palude, tesoro_luna [13c]
    nemici.json            fuoco_fatuo [13a]; illusione [13b]
    boss.json              selva_boss (fasi, evocazione illusioni, leggendari, esoticoFirma, eco)           [13b]
    oggetti.json           giunco_palude, erica, essenza_ombra [13a]; inchiostro_luna, lacrima_selva, sigillo_eco_selva_boss, quaderno_lia, lettere_orvald [13b]; mappa_luna, pergamene alchimia [13c]
    armi.json              bacchetta_selva                                                                  [13b]
    armature.json          stivali_palude                                                                   [13b]
    ricette.json           sigillo_eco_selva_boss [13b]; ricette banco 'alchimia' e aggiornamento sigillo_eco_negromante [13c]
    sprite.json            figure per orsola, fuoco_fatuo, illusione, selva_boss, vene giunco/erica/inchiostro_luna [13a–13b]
    musica.json            zone per guado, palude_lanterne, casa_colle, osservatorio                        [13a–13b]
    mappe/
      brughiera.json       uscita verso il Guado delle Lanterne                                             [13a]
      guado.json           nuovo villaggio 30×22 del Guado delle Lanterne (Pietra P, Orsola, Teodoro, Selva) [13a–13b]
      palude_lanterne.json nuova mappa 40×30 della Palude delle Lanterne                                    [13a]
      casa_colle.json      nuova mappa 24×20 della Casa sul Colle (6 ricordi, nessun nemico)                [13b]
      osservatorio.json    nuovo dungeon 30×26 dell'Osservatorio di Orvald (porte runiche, leve, Selva)     [13b]
      torre_piani.json     porta runica opzionale con tesoro prima della cima                               [13c]
tests/
  datiMappe.test.ts        integrità di mappe, ricordi, porte runiche, boss e quest della Regione III       [13a–13c]
  browser/fase-13*.cjs     prove nel browser per 13a, 13b e 13c                                             [13a–13c]
```

## Passi in ordine

**13a – Il Guado delle Lanterne, la Palude e Mamma Orsola**

1. Aggiungere in `nemici.json`, `oggetti.json`, `abitanti.json`, `sprite.json`, `musica.json` e `mondo.json`: `fuoco_fatuo`, `giunco_palude`, `erica`, `essenza_ombra` e **Mamma Orsola** (`orsola`).
2. Creare `guado.json` (30×22, con la terza **Pietra di passaggio** `"nome": "Guado delle Lanterne"`, Orsola e Teodoro) e `palude_lanterne.json` (40×30, con fuochi fatui, spettri, giunco, erica, roccia crepata con Ghianda d'oro e il pontile del traghetto sbloccato con `cambiaCon`), collegandole a `brughiera.json`.
3. Aggiungere la quest `traghetto_orsola` (*Il traghetto di Orsola*) in `quest.json` e il dialogo di `orsola` in `dialoghi.json`.
4. Verifica (`tsc`, `vitest`, `vite build`, prova `fase-13a.cjs`), aggiornamento `dist/gioco.html`. **Mi fermo.**

**13b – La Casa sul Colle (i ricordi), l'Osservatorio e Selva**

5. Aggiungere in `nemici.json`, `boss.json`, `oggetti.json`, `armi.json`, `armature.json`, `ricette.json`, `abitanti.json` e `sprite.json`: `illusione`, `selva_boss`, `inchiostro_luna`, `lacrima_selva`, `bacchetta_selva`, `stivali_palude`, `sigillo_eco_selva_boss`, `quaderno_lia`, `lettere_orvald` e l'abitante `selva`.
6. Creare `casa_colle.json` (24×20, collegata al pontile di `palude_lanterne.json`, senza nemici e con 6 **Ricordi** `"aspetto": "ricordo"`) e `osservatorio.json` (30×26, sotto la Casa sul Colle, con **porte runiche**, **leve**, il forziere con `quaderno_lia` e la stanza di `selva_boss`).
7. Aggiungere la quest `selva_liberata` e il dialogo di `selva` che la unisce gratuitamente al gruppo (`unisci: "selva"`) e apre il banco `"alchimia"`.
8. Verifica (`tsc`, `vitest`, `vite build`, prova `fase-13b.cjs`), aggiornamento `dist/gioco.html`. **Mi fermo.**

**13c – Il confronto con Berta, il Quaderno di Lia, l'Alchimia e il Finale esteso**

9. Aggiungere le quest `confronto_berta` (nel dialogo di Berta, che difende la sua scelta di bruciare il laboratorio per proteggere il borgo), `selva_quaderno` (*Il quaderno di Lia* → ricompensa `ciondolo_lia`), `ultime_lettere`, `erbe_palude` e `tesoro_luna` (*La mappa della luna*), più le ricette del banco `"alchimia"` di Selva e le ultime **Ghiande d'oro** (12/12 totali).
10. Estendere `apriFinale()` in `ScenaMondo.ts` così che, se l'eroe ha completato *Il quaderno di Lia* o ha unito i compagni di viaggio, le pagine del finale includano il momento in cui Orvald sfoglia il quaderno di Lia e i pensieri finali di **Tessa, Grisk e Selva**.
11. Verifica completa (`tsc`, `vitest`, `vite build`, prova `fase-13c.cjs`), lezione `docs/lezioni/fase-13.md`, aggiornamento `dist/gioco.html` e tabella delle fasi aggiornata. **Mi fermo.**

## Test previsti

- **Integrità dei dati (`datiMappe.test.ts`):**
  - collegamenti bidirezionali `brughiera` ↔ `guado` ↔ `palude_lanterne` ↔ `casa_colle` ↔ `osservatorio`;
  - i 6 ricordi della *Casa sul Colle* hanno `"aspetto": "ricordo"` e le leve dell'*Osservatorio* puntano a porte runiche esistenti;
  - `selva_boss` evoca `illusione`, rilascia i leggendari `bacchetta_selva` / `stivali_palude` e ha come esotico firma `velo_selva`;
  - tutte le 12 **Ghiande d'oro** sono ottenibili nel mondo tra segreti e missioni.

## Cosa provare giocando (a fine fase 13)

1. Dalla *Brughiera della Torre*, scendere al **Guado delle Lanterne**, attivare la terza **Pietra di passaggio**, parlare con **Mamma Orsola** e spegnere i **Fuochi fatui** nella **Palude delle Lanterne**.
2. Prendere il traghetto per la **Casa sul Colle**, leggere a tutto schermo i **Ricordi** di Orvald e Lia, scendere nell'**Osservatorio**, azionare le **leve** per aprire le **porte runiche**, sconfiggere **Selva l'Incantatrice** e farla unire al gruppo.
3. Raccogliere il **Quaderno di Lia** (ottenendo il **Ciondolo di Lia**), distillare pozioni nel **Banco di alchimia** di Selva, affrontare **Berta** a Borgo Quercia sul suo segreto e sconfiggere il **Negromante** per vedere il finale esteso con il quaderno di Lia e i tre compagni di viaggio.

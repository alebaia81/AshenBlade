# Piano della fase 15: Bilanciamento e durata (5–6 ore)

Stato: **completata**

## Obiettivo

Da `docs/espansione.md` (§6, §7): verificare la curva di progressione complessiva dell'edizione estesa (**26 mappe**, **41 quest**, **7 boss + 7 Eco**, **12 Ghiande d'oro**, **3 compagni narrativi**, **3 banchi di crafting**) e allineare vita dei boss, livelli consigliati e curva esperienza all'obiettivo di **5–6 ore di gioco**.

## Verifiche e ritocchi eseguiti

1. **Curva di vita ed esperienza dei 7 boss (strettamente crescente):**
   - `re_melma` (Atto I, mini-boss): `85 PV` / `140 XP`
   - `re_scheletro` (Atto I, boss): `110 PV` / `200 XP`
   - `ferrante` (Atto II, mini-boss): `165 PV` / `280 XP`
   - `troll_caverne` (Atto II, boss): `220 PV` / `400 XP`
   - `selva_boss` (Atto III, mini-boss): portata da `210 PV` → **`260 PV`** / `520 XP` (ora strettamente superiore al Troll dell'Atto II)
   - `negromante` (Atto III, boss finale): `300 PV` / `800 XP`
   - `radice_marcia` (Dopo-storia, boss opzionale): `360 PV` / `1.100 XP`
2. **Livelli consigliati aggiornati nel registro quest (`quest.json`):**
   - `atto1_cripta`: `5–7` (dopo Prologo, Mulino, Cantine e Tessa)
   - `atto2_miniera`: `9–12` (dopo Passo del Corvo, Cave di Zolfo e Pietrafonda)
   - `atto3_torre`: `14–17` (dopo Guado, Palude, Casa sul Colle e Osservatorio)
3. **Bilancio esperienza e durata:**
   - XP totale dalle 41 quest: `9.900 XP`
   - XP da un singolo giro di tutti i 115 nemici piazzati nelle 26 mappe: `5.298 XP`
   - Totale disponibile (1 giro + quest): **`15.198 XP`** rispetto alla soglia del livello 20 (`9.500 XP`), garantendo che un giocatore normale (storia + ~60% secondarie) arrivi al Negromante intorno al livello **16–17** e tocchi il livello **19–20** nel dopo-storia.
4. **Test di regressione del bilanciamento** in `tests/datiMappe.test.ts`.

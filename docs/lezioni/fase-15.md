# Lezione della fase 15: Bilanciamento e durata (5–6 ore)

## Cosa abbiamo verificato e rifinito

Con l'ultima fase abbiamo chiuso l'intera espansione (Fasi 10–15) con un controllo quantitativo su tutti i dati di gioco:

- **Scala completa del mondo**: **26 mappe**, **41 quest**, **7 boss unici + 7 Eco**, **115 nemici piazzati**, **12/12 Ghiande d'oro**, **3 compagni di viaggio narrativi** (*Tessa e Brina*, *Grisk*, *Selva*), **3 banchi artigiani** (*Fucina*, *Armature*, *Alchimia*) e **3 Pietre di passaggio**.
- **Curva dei boss monotona**: correggendo la vita di `selva_boss` (`210 → 260 PV`), tutti i 7 boss seguono una scala strettamente crescente sia per punti vita (`85 → 110 → 165 → 220 → 260 → 300 → 360`) sia per esperienza (`140 → 200 → 280 → 400 → 520 → 800 → 1.100`).
- **Livelli consigliati coerenti**: aggiornati i suggerimenti nel registro delle quest principali (`atto1_cripta`: 5–7, `atto2_miniera`: 9–12, `atto3_torre`: 14–17) per rispecchiare il ritmo reale dell'edizione da 5–6 ore.

## Concetto chiave (analogia web)

- **Test di regressione sui dati di bilanciamento**: proprio come nel web si mettono *budget test* su dimensione del bundle o tempi di risposta, un test automatico in `datiMappe.test.ts` verifica che la curva dei boss resti monotona e che l'esperienza totale basti sempre per raggiungere il livello massimo `20`.

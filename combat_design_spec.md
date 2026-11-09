# Specifiche di Design: Sistema di Combattimento (Melee Cleave, Ranged Approach & Level-Based Damage)

## 1. Obiettivi e Visione di Gioco
* **Tipologia di controllo**: Action RPG con schema **Click-to-Move** (stile Diablo / Grim Dawn).
* **Problemi risolti**:
  1. I colpi dell'arma secondaria a distanza sparati a vuoto quando il bersaglio è fuori gittata.
  2. La frustrazione nel selezionare i nemici nel corpo a corpo ravvicinato a causa dello screen shake durante i danni subiti.
  3. Mancanza di reattività e controllo contro nemici ordinari e Boss.
* **Miglioramento Game Feel**: Introduzione dell'animazione del fendente con danno ad area ad arco (**Cleave**).
* **Progressione & Matematica di Combattimento**: Sostituzione dei tiri di dado (RNG a intervalli) con un **sistema deterministico basato su Livelli dell'arma (Liv. 1 - 5)** con scaling sulle statistiche dell'eroe e upgrade dal Fabbro.

---

## 2. Decision Log (Registro delle Decisioni)

| Argomento | Decisione presa | Alternative considerate | Motivazione |
| :--- | :--- | :--- | :--- |
| **Control Scheme** | Click-to-Move ARPG | WASD + Mira Mouse | Standard di riferimento scelto per il gameplay. |
| **Gittata a Distanza** | Auto-avvicinamento + Shift per tiro fermo | Spara sempre a vuoto / Blocca il click | Elimina lo spreco di colpi, consentendo comunque il tiro manuale. |
| **Aggancio Ravvicinato** | Smart Proximity Targeting ($r \le 2$) | Mira millimetrica obbligata | Permette di combattere reattivamente senza missare il click sul mob. |
| **Cadenza Attacco** | Singolo click = 1 colpo; Pressione prolungata = ripetizione continua | Toggle automatico on/off | Massima reattività nei combattimenti contro Boss per schivare e muoversi subito. |
| **Screen Shake** | Solo colpi pesanti/critici + Vignette rossa bordi | Vibrazione sempre attiva / Rimozione totale | Previene lo spostamento dei mob sotto il cursore mantenendo l'impatto visivo. |
| **Fendente Melee** | Cleave ad arco con danno ad area (raggio 2, $100^\circ$) | Bersaglio singolo puramente visivo | Dà peso all'attacco del guerriero e ripulisce gruppi di mostri adiacenti. |
| **Formula Danno** | Livello Deterministico + Scaling Statistiche | Tiri di dado (es. 1d6, 2d8) / RNG puro | Progressione leggibile, trasparente e priva di frustrazione da tiri sfortunati. |
| **Upgrade Armi** | Fabbro / Banco da lavoro (Livello 1 a 5) | Drop casuali / Maestria per uccisioni | Ciclo di ricompensa chiaro: il giocatore reinveste oro e materiali raccolti. |

---

## 3. Macchina a Stati del Personaggio (FSM)

```
[ IDLE ] <------------------------+
   |                              |
   +---> [ MOVING_TO_GROUND ]     | (Arrivo / Nessun comando)
   |                              |
   +---> [ APPROACHING_TARGET ] --+
   |            | (Distanza <= MaxRange)
   |            v
   +---> [ ATTACKING ]
```

### Dettaglio Stati
1. **`IDLE`**: Personaggio fermo in ascolto degli input del mouse.
2. **`MOVING_TO_GROUND`**: Movimento verso le coordinate cliccate a terra se non ci sono nemici entro raggio 2.
3. **`APPROACHING_TARGET`**: Insegue il bersaglio via pathfinding. Appena la distanza $\le \text{arma.effectiveRange}$, ferma il movimento e transiziona a `ATTACKING`.
4. **`ATTACKING`**: Riproduce l'animazione di fendente o di tiro. Se il tasto rimane premuto e il nemico è vivo in range, re-innesca l'attacco; se il tasto viene rilasciato, torna a `IDLE`.

---

## 4. Logica di Combattimento Corpo a Corpo (Melee Cleave)

### 4.1. Smart Proximity Targeting
* Se un click del mouse avviene entro un raggio di prossimità $r \le 2.0$ unità dal Guerriero:
  * Il sistema individua il nemico più vicino alla direzione del puntatore.
  * L'azione viene prioritizzata come **Attacco** anziché spostamento a terra.

### 4.2. Calcolo del Fendente ad Arco (Conical Cleave)
* **Raggio d'azione**: $2.0$ unità dal centro del Guerriero.
* **Angolo di apertura**: $100^\circ$ ($50^\circ$ a sinistra e $50^\circ$ a destra dell'asse frontale verso il bersaglio).
* **Ripartizione danni**:
  * **Bersaglio primario selezionato**: $100\%$ del danno melee calcolato + eventuali effetti secondari.
  * **Nemici secondari entro l'arco**: $70\%$ del danno (danno splash ad area).
* **Effetto visivo (VFX)**: Istanzia una mesh/sprite ad arco (*slash trail*) sincronizzata con l'apice dell'animazione di attacco.

---

## 5. Sistema Danno a Livelli & Potenziamento dal Fabbro (Senza Dadi)

### 5.1. Formula del Danno Deterministico
Il danno finale non si affida a tiri di dado casuali (es. `1d8+2`), ma a una progressione basata sul **Livello dell'Arma** sommata allo scaling delle statistiche dell'eroe:

$$\text{Danno Effettivo} = \Big(\text{DannoBaseArma}[\text{Livello}] + (\text{StatisticaPrimaria} \times \text{CoeffScaling})\Big) \times \text{ModificatoreColpo}$$

* **StatisticaPrimaria**: Per il Guerriero è la **Forza (STR)** per le armi da mischia, o la **Destrezza (DEX)** per archi/balestre.
* **ModificatoreColpo**:
  * Bersaglio principale: $1.0$ ($100\%$).
  * Mob secondari nel Cleave: $0.7$ ($70\%$).
  * Colpo critico (se presente): $1.5$ o $2.0$ fisso.

### 5.2. Tabella Esempio di Progressione Armi (Livelli 1 - 5)

| Livello Arma | Stato Arma | Danno Base Spada (Esempio) | Danno Base Arco/Balestra | Costo Upgrade Fabbro (Materiali + Oro) |
| :---: | :--- | :---: | :---: | :--- |
| **Livello 1** | Base / Iniziale | **10** | **8** | Dotazione iniziale |
| **Livello 2** | Rinforzata | **12** | **10** | 50 Oro + 5 Minerale Ferro |
| **Livello 3** | Affilata | **15** | **13** | 120 Oro + 12 Minerale Ferro + 2 Cuoio |
| **Livello 4** | Magistrale | **17** | **15** | 250 Oro + 20 Minerale Acciaio |
| **Livello 5** | **Maxata (Mastercraft)** | **20** | **18** | 500 Oro + 1 Nucleo Raro / Gemma |

### 5.3. Il Fabbro / Banco da Lavoro
* Presso l'NPC Fabbro o il banco da lavoro, il giocatore può visualizzare la scheda dell'arma equipaggiata o nell'inventario.
* L'interfaccia mostra l'incremento di danno netto garantito dal livello successivo (es. `Spada Liv. 2 -> Liv. 3: Danno 12 -> 15 (+3)`).
* Nessun rischio di fallimento o rottura dell'arma: il potenziamento è sicuro al consumo dei requisiti.

---

## 6. Logica Combattimento a Distanza & Tasto Shift

* **Gittata e traiettoria**:
  * Click su nemico: se $\text{distanza} > \text{arma.maxRange}$, attiva `APPROACHING_TARGET` fino a distanza utile e scocca il dardo/freccia.
* **Tasto Shift (Force Stand)**:
  * Se tenuto premuto insieme al click, il movimento è bloccato al 100%: il guerriero si orienta verso il cursore e spara immediatamente sul posto.

---

## 7. Feedback Subendo Danni & Regolazione Screen Shake

* **Colpi ordinari (mob comuni)**:
  * Nessuno scuotimento della telecamera.
  * Feedback: flash rosso sfumato ai bordi dello schermo (*vignette indicator* per 0.1s) + suono di impatto sul metallo/armatura.
  * Cursore del mouse e hitbox dei nemici rimangono stabili al 100%.
* **Colpi critici / Abilità pesanti dei Boss**:
  * Attivazione di uno *Screen Shake* controllato (durata $\le 0.15$s, ampiezza ridotta).
* **Opzioni utente**:
  * Interruttore dedicato `Vibrazione Schermo: ON / OFF` nel menu delle impostazioni.

---

## 8. Casi Limite (Edge Cases) e Gestione Errori

1. **Il nemico muore mentre il Guerriero si sta avvicinando**:
   * Lo stato `APPROACHING_TARGET` rileva la scomparsa del bersaglio e ritorna immediatamente a `IDLE`, evitando corse inutili verso una posizione vuota.
2. **Ostacolo tra il Guerriero e il bersaglio (Line of Sight)**:
   * Per le armi a distanza, il pathfinding calcola l'avvicinamento non solo in base alla distanza metrica, ma assicurando una linea di tiro libera da muri o ostacoli opachi.
3. **Pressione del tasto durante un'animazione di fendente**:
   * Utilizzo di un breve buffer di input (100ms) prima della fine del colpo, per rendere il chaining dei fendenti continuo e fluido senza stuttering.
4. **Resistenze e armature dei nemici**:
   * Essendo il danno deterministico a livelli, la difesa dei nemici può applicarsi con una semplice sottrazione piatta (es. `Danno - DifesaMob`, con un minimo garantito di 1) o percentuale.


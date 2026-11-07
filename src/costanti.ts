// Numeri che servono a più file. Tenerli qui evita "numeri magici" sparsi nel codice.

/** Lato di una tessera in unità di mondo. 16 come la pixel art della fase 9. */
export const TESSERA = 16;

/** Risoluzione interna del gioco: poi Phaser la adatta alla finestra. */
export const LARGHEZZA_SCHERMO = 960;
export const ALTEZZA_SCHERMO = 540;

/** Altezza della barra in basso (abilità, arma secondaria, compagno): il mondo si vede sopra. */
export const ALTEZZA_BARRA_BASSA = 56;

/** Ingrandimento della telecamera: 960/3 = 320 unità visibili, cioè 20 tessere in larghezza. */
export const ZOOM = 3;

/** Durata della dissolvenza tra una mappa e l'altra, in millisecondi. */
export const DURATA_DISSOLVENZA = 250;

/** Nomi delle scene, usati per avviarle e collegarle. */
export const SCENA_MONDO = 'Mondo';
export const SCENA_INTERFACCIA = 'Interfaccia';
export const SCENA_SVILUPPATORE = 'Sviluppatore';
export const SCENA_CREAZIONE = 'Creazione';
export const SCENA_SCHEDA = 'Scheda';
export const SCENA_INVENTARIO = 'Inventario';
export const SCENA_DIALOGO = 'Dialogo';
export const SCENA_NEGOZIO = 'Negozio';
export const SCENA_TAVERNA = 'Taverna';
export const SCENA_FUCINA = 'Fucina';
export const SCENA_REGISTRO = 'Registro';
export const SCENA_MAPPA_TESORO = 'MappaTesoro';
export const SCENA_FINALE = 'Finale';
export const SCENA_CARICAMENTO = 'Caricamento';
export const SCENA_MENU = 'Menu';
export const SCENA_INTRO = 'Intro';
export const SCENA_PAUSA = 'Pausa';
export const SCENA_OPZIONI = 'Opzioni';

/** Chiavi del "registro" condiviso tra le scene. */
export const CHIAVE_NOME_MAPPA = 'nomeMappa';
export const CHIAVE_PARTITA = 'partita'; // la Partita (systems/partita.ts)
export const CHIAVE_ABILITA = 'abilita'; // StatoAbilita: quando l'abilità di classe è di nuovo pronta
export const CHIAVE_ABILITA_COMPAGNO = 'abilitaCompagno'; // StatoAbilita dell'abilità speciale del compagno
export const CHIAVE_AVVISO = 'avviso'; // { testo, id }: messaggio temporaneo in alto
export const CHIAVE_BOSS = 'boss'; // { nome, vita, massima } | null: la barra della vita del boss in alto (fase 8)
export const CHIAVE_MESSAGGIO = 'messaggio'; // scritta grande al centro ("" = nessuna)
export const CHIAVE_SLOT = 'slot'; // numero dello slot di salvataggio in uso (1–3), o undefined
export const CHIAVE_SVIL_AREE = 'sviluppatoreAree';
export const CHIAVE_SVIL_INVULNERABILE = 'sviluppatoreInvulnerabile';

/** Quanto resta a schermo "Sei stato sconfitto" prima della ricomparsa. */
export const ATTESA_SCONFITTA = 1400;

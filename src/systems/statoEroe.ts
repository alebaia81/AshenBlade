// Macchina a stati dell'eroe.
//
// In ogni istante l'eroe è in UNO solo di questi stati, e ogni stato decide
// cosa è permesso: da "libero" si può attaccare o schivare; durante "attacco"
// no; durante "colpito" i comandi sono ignorati. Le transizioni avvengono per
// un comando (provaAttacco), per un evento (riceviColpo) o per il tempo che passa
// (aggiornaStato). Così i casi impossibili non possono proprio accadere.
//
// Le funzioni sono pure: ricevono lo stato e l'ora attuale (in millisecondi)
// e restituiscono il nuovo stato, oppure lo stesso oggetto se non cambia nulla.

export type NomeStato = 'libero' | 'attacco' | 'schivata' | 'colpito' | 'parata' | 'sconfitto';

export interface StatoEroe {
  nome: NomeStato;
  /** Quando è iniziato lo stato attuale. */
  inizio: number;
  /** Fino a quando l'eroe è invulnerabile dopo un colpo subito. */
  invulnerabileFino: number;
  /** Da quando si può attaccare di nuovo. */
  attaccoPronto: number;
  /** Da quando si può schivare di nuovo. */
  schivataPronta: number;
  /** Stivali del vento: c'è ancora una capriola "in più" da usare prima della ricarica. */
  capriolaExtra: boolean;
}

export interface RegoleEroe {
  durataAttaccoMs: number;
  ricaricaAttaccoMs: number;
  durataSchivataMs: number;
  ricaricaSchivataMs: number;
  durataRespintaMs: number;
  invulnerabilitaMs: number;
  /** Durata della parata del Guerriero (0 per le altre classi). */
  durataParataMs: number;
  /** Capriole di fila prima della ricarica: 1, oppure 2 con gli Stivali del vento. */
  capriole?: number;
}

export function creaStatoEroe(): StatoEroe {
  return { nome: 'libero', inizio: 0, invulnerabileFino: 0, attaccoPronto: 0, schivataPronta: 0, capriolaExtra: false };
}

/** Transizioni dovute al tempo: attacco, schivata e respinta finiscono da sole. */
export function aggiornaStato(s: StatoEroe, adesso: number, r: RegoleEroe): StatoEroe {
  const trascorso = adesso - s.inizio;
  const finito =
    (s.nome === 'attacco' && trascorso >= r.durataAttaccoMs) ||
    (s.nome === 'schivata' && trascorso >= r.durataSchivataMs) ||
    (s.nome === 'colpito' && trascorso >= r.durataRespintaMs) ||
    (s.nome === 'parata' && trascorso >= r.durataParataMs);
  return finito ? { ...s, nome: 'libero', inizio: adesso } : s;
}

export function provaAttacco(s: StatoEroe, adesso: number, r: RegoleEroe): StatoEroe {
  if (s.nome !== 'libero' || adesso < s.attaccoPronto) return s;
  return { ...s, nome: 'attacco', inizio: adesso, attaccoPronto: adesso + r.durataAttaccoMs + r.ricaricaAttaccoMs };
}

/**
 * Capriola. Con gli Stivali del vento (capriole: 2) la prima capriola dopo la
 * ricarica lascia "in tasca" una capriola extra, usabile subito dopo; la
 * ricarica parte comunque dalla prima, poi tornano disponibili tutte e due.
 */
export function provaSchivata(s: StatoEroe, adesso: number, r: RegoleEroe): StatoEroe {
  if (s.nome !== 'libero') return s;
  if (adesso >= s.schivataPronta) {
    return {
      ...s,
      nome: 'schivata',
      inizio: adesso,
      schivataPronta: adesso + r.durataSchivataMs + r.ricaricaSchivataMs,
      capriolaExtra: (r.capriole ?? 1) >= 2,
    };
  }
  if (s.capriolaExtra) return { ...s, nome: 'schivata', inizio: adesso, capriolaExtra: false };
  return s;
}

/** Dopo un cambio d'arma non si attacca per un po' (ma una ricarica più lunga resta). */
export function attendiAttacco(s: StatoEroe, adesso: number, attesaMs: number): StatoEroe {
  return { ...s, attaccoPronto: Math.max(s.attaccoPronto, adesso + attesaMs) };
}

/**
 * Parata (abilità del Guerriero): per un po' l'eroe resta fermo con lo scudo alzato.
 * NON rende invulnerabili: è chi colpisce a controllare se il colpo arriva davanti.
 */
export function provaParata(s: StatoEroe, adesso: number, _r: RegoleEroe): StatoEroe {
  if (s.nome !== 'libero') return s;
  return { ...s, nome: 'parata', inizio: adesso };
}

/** Durante la capriola, dopo un colpo subito e da sconfitti i colpi non hanno effetto. */
export function èInvulnerabile(s: StatoEroe, adesso: number): boolean {
  return s.nome === 'schivata' || s.nome === 'sconfitto' || adesso < s.invulnerabileFino;
}

/** Un colpo andato a segno: respinta e invulnerabilità. Se si è invulnerabili non cambia nulla. */
export function riceviColpo(s: StatoEroe, adesso: number, r: RegoleEroe): StatoEroe {
  if (èInvulnerabile(s, adesso)) return s;
  return { ...s, nome: 'colpito', inizio: adesso, invulnerabileFino: adesso + r.invulnerabilitaMs };
}

export function sconfiggi(s: StatoEroe, adesso: number): StatoEroe {
  return { ...s, nome: 'sconfitto', inizio: adesso };
}

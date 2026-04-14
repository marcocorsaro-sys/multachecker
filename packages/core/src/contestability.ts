import type { VerbaleData, ContestabilityResult, Vizio } from "./types";
import { calcolaScadenze } from "./scadenze";

/**
 * Analizza un verbale e restituisce una lista di possibili vizi formali
 * e un punteggio di contestabilità.
 *
 * Il punteggio è una somma pesata dei vizi trovati, cappata a 100.
 * Il semaforo si basa sul punteggio:
 *   - verde (>= 60): alta probabilità di contestazione con successo
 *   - giallo (30-59): contestazione possibile ma non certa
 *   - rosso (< 30): contestazione improbabile
 */
export function valutaContestabilita(
  verbale: VerbaleData,
  oggi?: Date
): ContestabilityResult {
  const vizi: Vizio[] = [];

  // 1. Dati anagrafici mancanti (vizio formale leggero)
  if (!verbale.numero_verbale) {
    vizi.push({
      id: "numero_verbale_mancante",
      titolo: "Numero verbale non rilevato",
      descrizione:
        "Il numero del verbale non è leggibile. Un verbale senza numero identificativo può essere nullo per indeterminatezza.",
      peso: 25,
      riferimento_normativo: "Art. 383 Reg. Att. CdS",
    });
  }

  if (!verbale.data_violazione) {
    vizi.push({
      id: "data_violazione_mancante",
      titolo: "Data della violazione non rilevata",
      descrizione:
        "La data della violazione è un elemento essenziale del verbale.",
      peso: 40,
      riferimento_normativo: "Art. 383 Reg. Att. CdS",
    });
  }

  if (!verbale.luogo && !verbale.via) {
    vizi.push({
      id: "luogo_mancante",
      titolo: "Luogo della violazione non indicato",
      descrizione:
        "Il verbale deve indicare con precisione il luogo della violazione.",
      peso: 35,
      riferimento_normativo: "Art. 383 Reg. Att. CdS",
    });
  }

  if (!verbale.organo_accertatore) {
    vizi.push({
      id: "organo_accertatore_mancante",
      titolo: "Organo accertatore non indicato",
      descrizione:
        "Il verbale deve riportare l'organo che ha effettuato l'accertamento.",
      peso: 30,
      riferimento_normativo: "Art. 201 CdS",
    });
  }

  // 2. Notifica tardiva (vizio molto forte)
  if (verbale.data_violazione && verbale.data_notifica) {
    const violazione = new Date(verbale.data_violazione);
    const notifica = new Date(verbale.data_notifica);
    const giorni = Math.floor(
      (notifica.getTime() - violazione.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (giorni > 90) {
      vizi.push({
        id: "notifica_tardiva",
        titolo: `Notifica tardiva (${giorni} giorni)`,
        descrizione: `La notifica è stata effettuata ${giorni} giorni dopo la violazione. La legge prevede un termine massimo di 90 giorni. Il verbale è estinto.`,
        peso: 80,
        riferimento_normativo: "Art. 201 c. 1 CdS",
      });
    }
  }

  // 3. Vizi specifici per velocità (autovelox)
  if (verbale.tipo_infrazione === "velocita") {
    if (!verbale.modello_apparecchio) {
      vizi.push({
        id: "modello_apparecchio_mancante",
        titolo: "Modello dell'autovelox non indicato",
        descrizione:
          "Il verbale deve indicare il modello dell'apparecchio e i riferimenti dell'omologazione.",
        peso: 45,
        riferimento_normativo: "Art. 142 CdS",
      });
    }

    // Taratura: vizio presunto finché non si prova il contrario (Cass. 113/2015)
    vizi.push({
      id: "taratura_non_documentata",
      titolo: "Taratura periodica da verificare",
      descrizione:
        "La Corte Costituzionale (sent. 113/2015) ha stabilito che gli autovelox devono essere sottoposti a taratura periodica. Se il verbale non dimostra la taratura recente, è annullabile.",
      peso: 35,
      riferimento_normativo: "Corte Cost. 113/2015",
    });

    if (
      verbale.velocita_rilevata &&
      verbale.velocita_consentita &&
      verbale.velocita_rilevata - verbale.velocita_consentita < 10
    ) {
      vizi.push({
        id: "tolleranza_5pct",
        titolo: "Tolleranza del 5% non applicata",
        descrizione:
          "Va applicata la tolleranza strumentale del 5% (min. 5 km/h) sulla velocità rilevata.",
        peso: 20,
        riferimento_normativo: "DM 29/10/1997",
      });
    }
  }

  // 4. Vizi ZTL
  if (verbale.tipo_infrazione === "ztl") {
    vizi.push({
      id: "segnaletica_ztl",
      titolo: "Segnaletica ZTL da verificare",
      descrizione:
        "La segnaletica della ZTL deve essere chiaramente visibile e conforme. Verificare la presenza di preavviso e la corretta indicazione degli orari.",
      peso: 30,
      riferimento_normativo: "Art. 7 CdS",
    });
  }

  // 5. Calcolo punteggio finale
  const pesoTotale = vizi.reduce((sum, v) => sum + v.peso, 0);
  const score = Math.min(100, pesoTotale);

  let semaforo: "verde" | "giallo" | "rosso";
  if (score >= 60) semaforo = "verde";
  else if (score >= 30) semaforo = "giallo";
  else semaforo = "rosso";

  // 6. Scadenze
  const scadenze = verbale.data_notifica
    ? calcolaScadenze(verbale.data_notifica, oggi)
    : [];

  return { score, semaforo, vizi, scadenze };
}

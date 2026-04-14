import { differenceInCalendarDays, parseISO } from "date-fns";
import { calcolaScadenze } from "./scadenze";
import type { ContestabilityResult, VerbaleData, Vizio } from "./types";

/**
 * Analizza un verbale e restituisce vizi, scadenze, score e livello.
 *
 * La logica è intenzionalmente deterministica e basata su regole: nessuna
 * dipendenza DB o rete. I controlli sono conservativi — forniscono al
 * cittadino indicatori preliminari e vanno sempre validati da un professionista
 * prima di procedere con una contestazione reale.
 */
export function analizzaVerbale(
  data: VerbaleData,
  oggi: Date = new Date()
): ContestabilityResult {
  const vizi: Vizio[] = [
    ...vizComuni(data, oggi),
    ...viziPerTipo(data),
  ];

  // Score = somma pesi vizi, capato a 100
  const sommaPesi = vizi.reduce((acc, v) => acc + v.peso, 0);
  const score = Math.max(0, Math.min(100, sommaPesi));

  const semaforo: ContestabilityResult["semaforo"] =
    score >= 60 ? "verde" : score >= 30 ? "giallo" : "rosso";

  const scadenze = data.data_notifica
    ? calcolaScadenze(data.data_notifica, oggi)
    : [];

  return { score, semaforo, vizi, scadenze };
}

// ─────────────────────────────────────────────────────────────────────────────
// Vizi comuni a tutti i tipi di infrazione
// ─────────────────────────────────────────────────────────────────────────────
function vizComuni(data: VerbaleData, oggi: Date): Vizio[] {
  const out: Vizio[] = [];

  // 1. Notifica tardiva (> 90 giorni dalla violazione — art. 201 CdS)
  if (data.data_violazione && data.data_notifica) {
    const giorni = differenceInCalendarDays(
      parseISO(data.data_notifica),
      parseISO(data.data_violazione)
    );
    if (giorni > 90) {
      out.push({
        id: "notifica_tardiva",
        titolo: "Notifica tardiva",
        descrizione: `Il verbale è stato notificato dopo ${giorni} giorni dalla violazione. L'art. 201 CdS impone la notifica entro 90 giorni: oltre questo termine il verbale è nullo.`,
        peso: 80,
        riferimento_normativo: "Art. 201 CdS",
      });
    }
  }

  // 2. Dati obbligatori mancanti (art. 383 Reg. CdS)
  const missing: string[] = [];
  if (!data.numero_verbale) missing.push("numero verbale");
  if (!data.articolo_cds) missing.push("articolo violato");
  if (!data.organo_accertatore) missing.push("organo accertatore");
  if (!data.luogo && !data.via) missing.push("luogo della violazione");
  if (!data.data_violazione) missing.push("data della violazione");

  if (missing.length > 0) {
    out.push({
      id: "dati_obbligatori_mancanti",
      titolo: "Dati obbligatori mancanti",
      descrizione: `Mancano elementi essenziali (${missing.join(", ")}). L'art. 383 Reg. CdS elenca i dati che devono essere presenti nel verbale.`,
      peso: missing.length >= 3 ? 40 : 20,
      riferimento_normativo: "Art. 383 Reg. CdS",
    });
  }

  // 3. Termini di ricorso ancora aperti? (informativo, non aumenta lo score)
  //    Se sono già scaduti, annota come vizio bloccante.
  if (data.data_notifica) {
    const [pagamento, prefetto, gdp] = calcolaScadenze(
      data.data_notifica,
      oggi
    );
    const tuttiScaduti =
      pagamento.giorni_rimanenti === 0 &&
      prefetto.giorni_rimanenti === 0 &&
      gdp.giorni_rimanenti === 0;
    if (tuttiScaduti) {
      out.push({
        id: "termini_scaduti",
        titolo: "Termini per il ricorso scaduti",
        descrizione:
          "Tutti i termini (pagamento ridotto, Prefetto, Giudice di Pace) risultano scaduti. Resta eventualmente possibile l'opposizione in cartella esattoriale.",
        peso: -100, // annulla lo score
        riferimento_normativo: "Artt. 202–204 bis CdS",
      });
    }
  }

  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Vizi specifici per tipo di infrazione
// ─────────────────────────────────────────────────────────────────────────────
function viziPerTipo(data: VerbaleData): Vizio[] {
  switch (data.tipo_infrazione) {
    case "velocita":
      return viziVelocita(data);
    case "sosta":
      return viziSosta(data);
    case "ztl":
      return viziZTL(data);
    case "semaforo":
      return viziSemaforo(data);
    case "telefono":
      return viziTelefono(data);
    case "altro":
    default:
      return [];
  }
}

function viziVelocita(data: VerbaleData): Vizio[] {
  const out: Vizio[] = [];

  // Apparecchio non indicato
  if (!data.modello_apparecchio) {
    out.push({
      id: "apparecchio_non_indicato",
      titolo: "Modello apparecchio non indicato",
      descrizione:
        "Il verbale non specifica il modello dello strumento di rilevazione. Senza questa informazione non è possibile verificarne omologazione e taratura, requisiti essenziali (Corte Cost. 113/2015).",
      peso: 35,
      riferimento_normativo: "Corte Cost. 113/2015",
    });
  }

  // Manca riferimento a taratura annuale
  out.push({
    id: "taratura_da_verificare",
    titolo: "Taratura periodica da verificare",
    descrizione:
      "Gli apparecchi di misura della velocità devono essere sottoposti a verifica periodica annuale. In assenza di prova di taratura il rilevamento può essere contestato.",
    peso: 20,
    riferimento_normativo: "Corte Cost. 113/2015, L. 11/08/1991 n. 273",
  });

  // Velocità di poco superiore (tolleranza 5% o 5 km/h)
  if (
    data.velocita_rilevata != null &&
    data.velocita_consentita != null &&
    data.velocita_consentita > 0
  ) {
    const eccesso = data.velocita_rilevata - data.velocita_consentita;
    const tolleranza = Math.max(5, data.velocita_consentita * 0.05);
    if (eccesso > 0 && eccesso <= tolleranza) {
      out.push({
        id: "eccesso_entro_tolleranza",
        titolo: "Eccesso entro la tolleranza strumentale",
        descrizione: `L'eccesso rilevato (${eccesso} km/h) rientra nella tolleranza tecnica riconosciuta (${tolleranza.toFixed(0)} km/h). Il verbale può essere contestato per margine di errore.`,
        peso: 25,
      });
    }
  }

  return out;
}

function viziSosta(data: VerbaleData): Vizio[] {
  const out: Vizio[] = [];

  // Verbale non contestato immediatamente → prevista foto o testimone
  // (art. 201 CdS, giurisprudenza consolidata)
  if (
    data.data_notifica &&
    data.data_violazione &&
    data.data_notifica !== data.data_violazione
  ) {
    out.push({
      id: "sosta_foto_obbligatoria",
      titolo: "Mancata contestazione immediata",
      descrizione:
        "Per le violazioni di sosta non contestate sul posto è necessario che il verbale riporti foto o altra prova documentale. In assenza, il verbale è annullabile.",
      peso: 30,
      riferimento_normativo: "Art. 201 CdS",
    });
  }

  return out;
}

function viziZTL(data: VerbaleData): Vizio[] {
  const out: Vizio[] = [];

  out.push({
    id: "ztl_segnaletica",
    titolo: "Segnaletica e preavviso da verificare",
    descrizione:
      "Le ZTL devono essere precedute da cartelli di preavviso leggibili e da segnaletica conforme. Un difetto segnaletico rende il verbale contestabile.",
    peso: 20,
    riferimento_normativo: "D.M. 29/10/1997",
  });

  if (!data.modello_apparecchio) {
    out.push({
      id: "ztl_apparecchio_non_indicato",
      titolo: "Varco elettronico non identificato",
      descrizione:
        "Il verbale non indica il varco elettronico utilizzato. Senza questo dato non è verificabile la sua omologazione ministeriale.",
      peso: 20,
    });
  }

  return out;
}

function viziSemaforo(data: VerbaleData): Vizio[] {
  const out: Vizio[] = [];

  out.push({
    id: "semaforo_giallo_durata",
    titolo: "Durata del giallo da verificare",
    descrizione:
      "La durata minima del giallo deve essere conforme (≥ 3s con limite 50 km/h, ≥ 4s con 60 km/h, ≥ 5s con 70 km/h). Una durata inferiore rende il verbale nullo.",
    peso: 30,
    riferimento_normativo: "Direttiva MIT 27/04/2006",
  });

  if (!data.modello_apparecchio) {
    out.push({
      id: "semaforo_apparecchio_non_indicato",
      titolo: "Apparecchio semaforico non identificato",
      descrizione:
        "Il verbale non indica il modello di apparecchio (es. T-Red, Photored). Senza questa informazione non è possibile verificarne omologazione e taratura.",
      peso: 25,
    });
  }

  return out;
}

function viziTelefono(_data: VerbaleData): Vizio[] {
  return [
    {
      id: "telefono_prova_visiva",
      titolo: "Prova visiva necessaria",
      descrizione:
        "La violazione per uso del telefono alla guida richiede una constatazione diretta e inequivocabile da parte dell'agente. In assenza di foto o testimoni, l'accertamento può essere contestato.",
      peso: 25,
      riferimento_normativo: "Art. 173 CdS",
    },
  ];
}

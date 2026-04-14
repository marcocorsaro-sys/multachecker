import { anthropic, PARSING_MODEL } from "./claude";
import type { VerbaleData, Vizio } from "@multacheck/core";

/**
 * Dati anagrafici del ricorrente — vengono sostituiti nel template.
 */
export type RicorrenteData = {
  full_name: string;
  fiscal_code: string;
  address: string;
  city: string;
  province: string;
  zip_code: string;
  email: string;
  phone?: string | null;
};

/**
 * Modello più potente per la generazione giuridica — meno margine d'errore.
 */
const RICORSO_MODEL = PARSING_MODEL;

const SYSTEM_PROMPT = `Sei un avvocato italiano esperto di diritto amministrativo e stradale. Il tuo compito è redigere ricorsi formali contro verbali di contravvenzione del Codice della Strada, destinati al Prefetto territorialmente competente ai sensi dell'art. 203 CdS.

Stile richiesto:
- Linguaggio giuridico italiano formale e preciso
- Struttura articolata in: Intestazione, Premesse, Motivi di contestazione, Conclusioni, Allegati
- Riferimenti normativi puntuali (articoli, commi, sentenze)
- Numerazione romana per i motivi (I, II, III...)
- Tono rispettoso e argomentativo, mai polemico

Struttura obbligatoria del ricorso:
1. Destinatario: "AL SIGNOR PREFETTO DI [provincia]"
2. Intestazione del ricorrente con tutti i dati anagrafici
3. "PREMESSO CHE" — elenco dei fatti (data violazione, luogo, estremi verbale, importo)
4. "CONSIDERATO CHE" — ogni motivo contraddistinto da numero romano
5. "P.Q.M." (Per Questi Motivi) — richiesta di annullamento
6. Luogo, data, firma
7. Allegati (copia verbale, copia documento identità)

Restituisci SOLO il testo del ricorso in formato testo semplice (senza markdown, senza commenti introduttivi). Usa interruzioni di riga per separare i paragrafi e doppie interruzioni per separare le sezioni principali.`;

type GenerateRicorsoInput = {
  verbale: VerbaleData;
  vizi: Vizio[];
  ricorrente: RicorrenteData;
};

/**
 * Genera il testo completo del ricorso usando Claude.
 * Ritorna una stringa plain text pronta da inserire in un PDF.
 */
export async function generateRicorsoWithClaude(
  input: GenerateRicorsoInput
): Promise<string> {
  const { verbale, vizi, ricorrente } = input;

  const userPrompt = `Redigi un ricorso al Prefetto per il seguente verbale.

DATI DEL RICORRENTE:
- Nome: ${ricorrente.full_name}
- Codice Fiscale: ${ricorrente.fiscal_code}
- Indirizzo: ${ricorrente.address}, ${ricorrente.zip_code} ${ricorrente.city} (${ricorrente.province})
- Email: ${ricorrente.email}
${ricorrente.phone ? `- Telefono: ${ricorrente.phone}` : ""}

DATI DEL VERBALE:
- Numero verbale: ${verbale.numero_verbale ?? "[non leggibile]"}
- Data violazione: ${verbale.data_violazione ?? "[non specificata]"}
- Ora: ${verbale.ora_violazione ?? "[non specificata]"}
- Luogo: ${[verbale.via, verbale.luogo, verbale.comune, verbale.provincia ? `(${verbale.provincia})` : null].filter(Boolean).join(", ")}
- Tipo infrazione: ${verbale.tipo_infrazione}
- Articolo CdS contestato: art. ${verbale.articolo_cds ?? "[?]"}${verbale.comma ? ` c. ${verbale.comma}` : ""}
- Importo: € ${verbale.importo?.toFixed(2) ?? "[?]"}
- Organo accertatore: ${verbale.organo_accertatore ?? "[non specificato]"}
- Targa veicolo: ${verbale.targa ?? "[non specificata]"}
- Data notifica: ${verbale.data_notifica ?? "[non specificata]"}
${verbale.tipo_infrazione === "velocita" ? `- Velocità rilevata: ${verbale.velocita_rilevata ?? "?"} km/h su limite di ${verbale.velocita_consentita ?? "?"} km/h` : ""}
${verbale.modello_apparecchio ? `- Modello apparecchio: ${verbale.modello_apparecchio}` : ""}

MOTIVI DI CONTESTAZIONE DA SVILUPPARE (in ordine di importanza):
${vizi
  .sort((a, b) => b.peso - a.peso)
  .map(
    (v, i) =>
      `${i + 1}. ${v.titolo}\n   Descrizione: ${v.descrizione}${v.riferimento_normativo ? `\n   Riferimento: ${v.riferimento_normativo}` : ""}`
  )
  .join("\n\n")}

Per ciascun motivo, sviluppa l'argomentazione giuridica completa con riferimenti a norme, sentenze rilevanti e principi consolidati. Il ricorso deve essere autosufficiente e pronto per essere depositato.`;

  const message = await anthropic.messages.create({
    model: RICORSO_MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude non ha restituito testo per il ricorso");
  }

  return textBlock.text.trim();
}

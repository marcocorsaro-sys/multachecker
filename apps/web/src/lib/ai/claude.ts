import Anthropic from "@anthropic-ai/sdk";
import { verbaleSchema, type VerbaleData } from "@multacheck/core";

/**
 * Istanza globale del client Anthropic.
 * La chiave viene letta da env — ANTHROPIC_API_KEY.
 */
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Modello usato per il parsing dei verbali.
 * Claude Sonnet 4.6 è il miglior rapporto qualità/prezzo per OCR strutturato.
 */
export const PARSING_MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `Sei un assistente legale esperto di diritto stradale italiano, specializzato nell'analisi di verbali di contravvenzione del Codice della Strada.

Il tuo compito è estrarre in modo PRECISO i dati strutturati da un'immagine di un verbale italiano.

Regole:
1. Leggi TUTTI i dati visibili sull'immagine
2. Restituisci SOLO JSON valido, senza testo introduttivo o commenti
3. Se un campo non è leggibile, ometti la chiave (NON usare null o stringhe vuote)
4. Le date devono essere in formato ISO YYYY-MM-DD
5. Gli orari in formato HH:MM
6. Gli importi in euro come numeri decimali (es. 173.00)
7. Classifica tipo_infrazione come una di: velocita, sosta, ztl, semaforo, telefono, altro
8. Normalizza la targa in maiuscolo senza spazi

Schema di output:
{
  "numero_verbale": string,
  "data_violazione": "YYYY-MM-DD",
  "ora_violazione": "HH:MM",
  "luogo": string,
  "via": string,
  "comune": string,
  "provincia": string (sigla 2 lettere),
  "tipo_infrazione": "velocita" | "sosta" | "ztl" | "semaforo" | "telefono" | "altro",
  "articolo_cds": string (es. "142"),
  "comma": string,
  "importo": number,
  "importo_ridotto": number,
  "punti_patente": number,
  "targa": string,
  "data_notifica": "YYYY-MM-DD",
  "organo_accertatore": string,
  "modello_apparecchio": string (solo se autovelox),
  "velocita_rilevata": number (km/h),
  "velocita_consentita": number (km/h)
}

IMPORTANTE: restituisci SOLO il JSON, nient'altro.`;

/**
 * Estrae i dati strutturati da un verbale usando Claude.
 * Accetta un'immagine come base64 + mediaType (es. "image/jpeg").
 */
export async function parseVerbaleWithClaude(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf"
): Promise<{ data: VerbaleData; rawText: string }> {
  const isPdf = mediaType === "application/pdf";

  const message = await anthropic.messages.create({
    model: PARSING_MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          isPdf
            ? {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: imageBase64,
                },
              }
            : {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: imageBase64,
                },
              },
          {
            type: "text",
            text: "Analizza questo verbale e restituisci il JSON strutturato.",
          },
        ],
      },
    ],
  });

  // Estraiamo il testo dalla risposta
  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude non ha restituito testo");
  }

  const rawText = textBlock.text.trim();

  // Rimuove eventuali fence ```json ... ```
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(
      `Claude ha restituito JSON non valido: ${(e as Error).message}\n\nOutput: ${cleaned.slice(0, 500)}`
    );
  }

  // Validiamo contro lo schema Zod
  const result = verbaleSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `I dati estratti non rispettano lo schema: ${result.error.message}`
    );
  }

  return { data: result.data, rawText };
}

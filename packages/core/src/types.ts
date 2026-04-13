import { z } from "zod";

export const tipoInfrazioneEnum = [
  "velocita",
  "sosta",
  "ztl",
  "semaforo",
  "telefono",
  "altro",
] as const;

export type TipoInfrazione = (typeof tipoInfrazioneEnum)[number];

export const verbaleSchema = z.object({
  numero_verbale: z.string().optional(),
  data_violazione: z.string(),
  ora_violazione: z.string().optional(),
  luogo: z.string().optional(),
  via: z.string().optional(),
  comune: z.string().optional(),
  provincia: z.string().optional(),
  tipo_infrazione: z.enum(tipoInfrazioneEnum),
  articolo_cds: z.string().optional(),
  comma: z.string().optional(),
  importo: z.number().optional(),
  importo_ridotto: z.number().optional(),
  punti_patente: z.number().optional(),
  targa: z.string().optional(),
  data_notifica: z.string().optional(),
  organo_accertatore: z.string().optional(),
  modello_apparecchio: z.string().optional(),
  velocita_rilevata: z.number().optional(),
  velocita_consentita: z.number().optional(),
});

export type VerbaleData = z.infer<typeof verbaleSchema>;

export type ContestabilityResult = {
  score: number; // 0-100
  semaforo: "verde" | "giallo" | "rosso";
  vizi: Vizio[];
  scadenze: Scadenza[];
};

export type Vizio = {
  id: string;
  titolo: string;
  descrizione: string;
  peso: number; // 0-100
  riferimento_normativo?: string;
};

export type Scadenza = {
  tipo: "pagamento_ridotto" | "ricorso_prefetto" | "ricorso_gdp";
  data_limite: string;
  giorni_rimanenti: number;
};

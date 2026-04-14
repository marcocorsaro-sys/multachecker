"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  analizzaVerbale,
  verbaleSchema,
  tipoInfrazioneEnum,
  type VerbaleData,
} from "@multacheck/core";

type ActionState = { error?: string; ok?: boolean };

function parseNum(v: FormDataEntryValue | null): number | undefined {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function parseStr(v: FormDataEntryValue | null): string | undefined {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s === "" ? undefined : s;
}

export async function saveAnalisi(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const verbaleId = String(formData.get("verbale_id") ?? "");
  if (!verbaleId) return { error: "ID verbale mancante." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessione scaduta." };

  const rawTipo = parseStr(formData.get("tipo_infrazione"));
  const tipo = (
    tipoInfrazioneEnum.includes(rawTipo as (typeof tipoInfrazioneEnum)[number])
      ? rawTipo
      : "altro"
  ) as VerbaleData["tipo_infrazione"];

  const candidate: Partial<VerbaleData> = {
    numero_verbale: parseStr(formData.get("numero_verbale")),
    data_violazione: parseStr(formData.get("data_violazione")),
    ora_violazione: parseStr(formData.get("ora_violazione")),
    luogo: parseStr(formData.get("luogo")),
    via: parseStr(formData.get("via")),
    comune: parseStr(formData.get("comune")),
    provincia: parseStr(formData.get("provincia")),
    tipo_infrazione: tipo,
    articolo_cds: parseStr(formData.get("articolo_cds")),
    comma: parseStr(formData.get("comma")),
    importo: parseNum(formData.get("importo")),
    importo_ridotto: parseNum(formData.get("importo_ridotto")),
    punti_patente: parseNum(formData.get("punti_patente")),
    targa: parseStr(formData.get("targa")),
    data_notifica: parseStr(formData.get("data_notifica")),
    organo_accertatore: parseStr(formData.get("organo_accertatore")),
    modello_apparecchio: parseStr(formData.get("modello_apparecchio")),
    velocita_rilevata: parseNum(formData.get("velocita_rilevata")),
    velocita_consentita: parseNum(formData.get("velocita_consentita")),
  };

  const parsed = verbaleSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      error:
        "Dati non validi: " +
        parsed.error.issues.map((i) => i.message).join(", "),
    };
  }
  const data = parsed.data;

  // Analisi
  const result = analizzaVerbale(data);

  // Scadenze → colonne dedicate
  const scadenzaMap = Object.fromEntries(
    result.scadenze.map((s) => [s.tipo, s.data_limite])
  );

  const { error: upErr } = await supabase
    .from("verbali")
    .update({
      numero_verbale: data.numero_verbale ?? null,
      data_violazione: data.data_violazione ?? null,
      ora_violazione: data.ora_violazione ?? null,
      luogo: data.luogo ?? null,
      via: data.via ?? null,
      comune: data.comune ?? null,
      provincia: data.provincia ?? null,
      tipo_infrazione: data.tipo_infrazione,
      articolo_cds: data.articolo_cds ?? null,
      comma: data.comma ?? null,
      importo: data.importo ?? null,
      importo_ridotto: data.importo_ridotto ?? null,
      punti_patente: data.punti_patente ?? null,
      targa: data.targa ?? null,
      data_notifica: data.data_notifica ?? null,
      organo_accertatore: data.organo_accertatore ?? null,
      modello_apparecchio: data.modello_apparecchio ?? null,
      velocita_rilevata: data.velocita_rilevata ?? null,
      velocita_consentita: data.velocita_consentita ?? null,
      parsed_json: data,
      livello: result.semaforo,
      score: result.score,
      vizi: result.vizi,
      scadenza_pagamento_ridotto: scadenzaMap["pagamento_ridotto"] ?? null,
      scadenza_ricorso_prefetto: scadenzaMap["ricorso_prefetto"] ?? null,
      scadenza_ricorso_gdp: scadenzaMap["ricorso_gdp"] ?? null,
    })
    .eq("id", verbaleId)
    .eq("user_id", user.id);

  if (upErr) return { error: upErr.message };

  // Crea pratica se non esiste e il verbale è contestabile
  if (result.semaforo !== "rosso") {
    const { data: existing } = await supabase
      .from("pratiche")
      .select("id")
      .eq("verbale_id", verbaleId)
      .maybeSingle();

    if (!existing) {
      await supabase.from("pratiche").insert({
        user_id: user.id,
        verbale_id: verbaleId,
        stato: "analisi",
      });
    }
  }

  revalidatePath(`/analisi/${verbaleId}`);
  revalidatePath("/pratiche");
  redirect("/pratiche");
}

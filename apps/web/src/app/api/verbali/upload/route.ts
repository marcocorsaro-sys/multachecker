import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseVerbaleWithClaude } from "@/lib/ai/claude";
import { analizzaVerbale } from "@multacheck/core";
import type { TablesInsert } from "@multacheck/db";

// Claude parsing può richiedere qualche secondo → estendiamo la durata
export const maxDuration = 60;
export const runtime = "nodejs";

const BUCKET = "verbali";
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

type AllowedMedia =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "application/pdf";

const ALLOWED_TYPES: AllowedMedia[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    // 1. Valida il file caricato
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "File mancante" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File troppo grande (max 10 MB)" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type as AllowedMedia)) {
      return NextResponse.json(
        { error: "Formato non supportato. Usa JPG, PNG, WebP o PDF." },
        { status: 400 }
      );
    }

    const mediaType = file.type as AllowedMedia;

    // 2. Legge il file e lo converte in base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");

    // 3. Upload su Supabase Storage
    const ext = file.name.split(".").pop() ?? "bin";
    const storagePath = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: mediaType,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload fallito: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

    // 4. Parsing con Claude
    let parsed;
    try {
      parsed = await parseVerbaleWithClaude(base64, mediaType);
    } catch (e) {
      // Cleanup dello storage se il parsing fallisce
      await supabase.storage.from(BUCKET).remove([storagePath]);
      return NextResponse.json(
        {
          error: `Analisi fallita: ${(e as Error).message}`,
        },
        { status: 422 }
      );
    }

    // 5. Valutazione contestabilità tramite l'engine deterministico
    const contest = analizzaVerbale(parsed.data);

    // 6. Insert nel DB — verbali
    const verbaleInsert: TablesInsert<"verbali"> = {
      user_id: user.id,
      image_path: storagePath,
      image_url: publicUrl,
      ocr_raw_text: parsed.rawText,
      parsed_json: parsed.data as unknown as TablesInsert<"verbali">["parsed_json"],
      numero_verbale: parsed.data.numero_verbale ?? null,
      data_violazione: parsed.data.data_violazione ?? null,
      ora_violazione: parsed.data.ora_violazione ?? null,
      luogo: parsed.data.luogo ?? null,
      via: parsed.data.via ?? null,
      comune: parsed.data.comune ?? null,
      provincia: parsed.data.provincia ?? null,
      tipo_infrazione: parsed.data.tipo_infrazione,
      articolo_cds: parsed.data.articolo_cds ?? null,
      comma: parsed.data.comma ?? null,
      importo: parsed.data.importo ?? null,
      importo_ridotto: parsed.data.importo_ridotto ?? null,
      punti_patente: parsed.data.punti_patente ?? null,
      targa: parsed.data.targa ?? null,
      data_notifica: parsed.data.data_notifica ?? null,
      organo_accertatore: parsed.data.organo_accertatore ?? null,
      modello_apparecchio: parsed.data.modello_apparecchio ?? null,
      velocita_rilevata: parsed.data.velocita_rilevata ?? null,
      velocita_consentita: parsed.data.velocita_consentita ?? null,
      score: contest.score,
      livello: contest.semaforo,
      vizi: contest.vizi as unknown as TablesInsert<"verbali">["vizi"],
      scadenza_pagamento_ridotto:
        contest.scadenze.find((s) => s.tipo === "pagamento_ridotto")
          ?.data_limite ?? null,
      scadenza_ricorso_prefetto:
        contest.scadenze.find((s) => s.tipo === "ricorso_prefetto")
          ?.data_limite ?? null,
      scadenza_ricorso_gdp:
        contest.scadenze.find((s) => s.tipo === "ricorso_gdp")?.data_limite ??
        null,
    };

    const { data: verbale, error: insertError } = await supabase
      .from("verbali")
      .insert(verbaleInsert)
      .select()
      .single();

    if (insertError || !verbale) {
      await supabase.storage.from(BUCKET).remove([storagePath]);
      return NextResponse.json(
        { error: `Salvataggio fallito: ${insertError?.message}` },
        { status: 500 }
      );
    }

    // 7. Crea la pratica collegata
    const praticaInsert: TablesInsert<"pratiche"> = {
      user_id: user.id,
      verbale_id: verbale.id,
      stato: "analisi",
    };

    const { data: pratica, error: praticaError } = await supabase
      .from("pratiche")
      .insert(praticaInsert)
      .select()
      .single();

    if (praticaError || !pratica) {
      return NextResponse.json(
        { error: `Creazione pratica fallita: ${praticaError?.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      verbale_id: verbale.id,
      pratica_id: pratica.id,
    });
  } catch (e) {
    console.error("[/api/verbali/upload]", e);
    return NextResponse.json(
      { error: (e as Error).message ?? "Errore interno" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateRicorsoWithClaude,
  type RicorrenteData,
} from "@/lib/ai/ricorso";
import { renderRicorsoPdf } from "@/lib/pdf/ricorso-pdf";
import type { VerbaleData, Vizio } from "@multacheck/core";
import type { TablesUpdate } from "@multacheck/db";

export const maxDuration = 90;
export const runtime = "nodejs";

const BUCKET = "verbali";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  try {
    const { id: praticaId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    // 1. Carica la pratica + il verbale
    const { data: pratica, error: praticaErr } = await supabase
      .from("pratiche")
      .select("*, verbali!inner(*)")
      .eq("id", praticaId)
      .eq("user_id", user.id)
      .single();

    if (praticaErr || !pratica) {
      return NextResponse.json(
        { error: "Pratica non trovata" },
        { status: 404 }
      );
    }

    const verbale = pratica.verbali;
    if (!verbale) {
      return NextResponse.json(
        { error: "Verbale collegato non trovato" },
        { status: 404 }
      );
    }

    // 2. Carica il profilo utente
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json(
        {
          error:
            "Profilo non trovato. Completa il tuo profilo prima di generare il ricorso.",
        },
        { status: 400 }
      );
    }

    // Campi obbligatori per un ricorso valido
    const missing: string[] = [];
    if (!profile.full_name) missing.push("nome completo");
    if (!profile.fiscal_code) missing.push("codice fiscale");
    if (!profile.address) missing.push("indirizzo");
    if (!profile.city) missing.push("città");
    if (!profile.province) missing.push("provincia");
    if (!profile.zip_code) missing.push("CAP");

    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: `Profilo incompleto. Campi mancanti: ${missing.join(", ")}.`,
          redirect: "/profilo",
        },
        { status: 400 }
      );
    }

    const ricorrente: RicorrenteData = {
      full_name: profile.full_name!,
      fiscal_code: profile.fiscal_code!,
      address: profile.address!,
      city: profile.city!,
      province: profile.province!,
      zip_code: profile.zip_code!,
      email: profile.email ?? user.email ?? "",
      phone: profile.phone,
    };

    // 3. Ricostruisce VerbaleData da riga DB
    const verbaleData: VerbaleData = {
      numero_verbale: verbale.numero_verbale ?? undefined,
      data_violazione: verbale.data_violazione ?? "",
      ora_violazione: verbale.ora_violazione ?? undefined,
      luogo: verbale.luogo ?? undefined,
      via: verbale.via ?? undefined,
      comune: verbale.comune ?? undefined,
      provincia: verbale.provincia ?? undefined,
      tipo_infrazione: verbale.tipo_infrazione,
      articolo_cds: verbale.articolo_cds ?? undefined,
      comma: verbale.comma ?? undefined,
      importo: verbale.importo ?? undefined,
      importo_ridotto: verbale.importo_ridotto ?? undefined,
      punti_patente: verbale.punti_patente ?? undefined,
      targa: verbale.targa ?? undefined,
      data_notifica: verbale.data_notifica ?? undefined,
      organo_accertatore: verbale.organo_accertatore ?? undefined,
      modello_apparecchio: verbale.modello_apparecchio ?? undefined,
      velocita_rilevata: verbale.velocita_rilevata ?? undefined,
      velocita_consentita: verbale.velocita_consentita ?? undefined,
    };

    const vizi: Vizio[] = Array.isArray(verbale.vizi)
      ? (verbale.vizi as unknown as Vizio[])
      : [];

    if (vizi.length === 0) {
      return NextResponse.json(
        {
          error:
            "Nessun vizio rilevato su questo verbale — non è consigliabile generare un ricorso.",
        },
        { status: 422 }
      );
    }

    // 4. Genera il testo con Claude
    let testoRicorso: string;
    try {
      testoRicorso = await generateRicorsoWithClaude({
        verbale: verbaleData,
        vizi,
        ricorrente,
      });
    } catch (e) {
      return NextResponse.json(
        { error: `Generazione fallita: ${(e as Error).message}` },
        { status: 502 }
      );
    }

    // 5. Rende il PDF
    const pdfBytes = await renderRicorsoPdf({
      testo: testoRicorso,
      numeroVerbale: verbale.numero_verbale,
    });

    // 6. Upload PDF su Supabase Storage
    const storagePath = `${user.id}/ricorsi/${praticaId}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload PDF fallito: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

    // 7. Aggiorna la pratica
    const update: TablesUpdate<"pratiche"> = {
      stato: "generazione_ricorso",
      ricorso_testo: testoRicorso,
      ricorso_pdf_path: storagePath,
      ricorso_pdf_url: publicUrl,
      ricorso_generato_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from("pratiche")
      .update(update)
      .eq("id", praticaId);

    if (updateError) {
      return NextResponse.json(
        { error: `Aggiornamento pratica fallito: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      pratica_id: praticaId,
      pdf_url: publicUrl,
    });
  } catch (e) {
    console.error("[/api/pratiche/genera-ricorso]", e);
    return NextResponse.json(
      { error: (e as Error).message ?? "Errore interno" },
      { status: 500 }
    );
  }
}

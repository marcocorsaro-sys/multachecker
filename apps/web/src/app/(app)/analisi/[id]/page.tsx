import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { analizzaVerbale, verbaleSchema } from "@multacheck/core";
import type { VerbaleData } from "@multacheck/core";
import { AnalisiForm } from "./AnalisiForm";
import { ResultPanel } from "./ResultPanel";
import { saveAnalisi } from "./actions";

type PageProps = { params: Promise<{ id: string }> };

export default async function AnalisiPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: verbale, error } = await supabase
    .from("verbali")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !verbale) notFound();

  // Firma URL immagine per preview (bucket privato)
  let previewUrl: string | null = null;
  if (verbale.image_path) {
    const { data: signed } = await supabase.storage
      .from("verbali")
      .createSignedUrl(verbale.image_path, 60 * 10);
    previewUrl = signed?.signedUrl ?? null;
  }

  // Se abbiamo già i dati essenziali, ricalcoliamo al volo il risultato
  // (mostra anteprima prima del salvataggio).
  const initialData: Partial<VerbaleData> = {
    numero_verbale: verbale.numero_verbale ?? undefined,
    data_violazione: verbale.data_violazione ?? undefined,
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

  const parsed = verbaleSchema.safeParse(initialData);
  const result = parsed.success ? analizzaVerbale(parsed.data) : null;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analisi del verbale</h1>
          <p className="mt-1 text-sm text-muted">
            Completa i dati del verbale per ottenere un&apos;analisi di
            contestabilità. I campi contrassegnati con * sono obbligatori.
          </p>
        </div>
        <Link
          href="/pratiche"
          className="text-sm text-muted hover:text-foreground"
        >
          ← Le mie pratiche
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        {previewUrl ? (
          <div className="rounded-lg border border-border bg-card p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Verbale caricato"
              className="h-auto w-full rounded"
            />
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted">
            Nessuna immagine caricata
          </div>
        )}

        <div className="space-y-6">
          <AnalisiForm
            verbaleId={verbale.id}
            initial={initialData}
            action={saveAnalisi}
          />
          {result && <ResultPanel result={result} />}
        </div>
      </div>
    </div>
  );
}

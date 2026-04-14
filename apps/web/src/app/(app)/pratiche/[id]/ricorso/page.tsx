import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { Suspense } from "react";
import { AutoGenerateRicorso } from "./auto-generate";

type Props = { params: Promise<{ id: string }> };

export default async function RicorsoPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: pratica, error } = await supabase
    .from("pratiche")
    .select("*, verbali!inner(id, numero_verbale, tipo_infrazione)")
    .eq("id", id)
    .single();

  if (error || !pratica) notFound();

  const v = pratica.verbali;
  const hasRicorso = Boolean(pratica.ricorso_testo);

  return (
    <div className="space-y-6">
      <Link
        href={v ? `/verbali/${v.id}` : "/pratiche"}
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Torna al verbale
      </Link>

      <Suspense fallback={null}>
        <AutoGenerateRicorso
          praticaId={pratica.id}
          alreadyGenerated={hasRicorso}
        />
      </Suspense>

      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Ricorso</h1>
          <p className="mt-1 text-sm text-muted">
            {v?.numero_verbale
              ? `Verbale n. ${v.numero_verbale}`
              : "Ricorso al Prefetto"}
          </p>
        </div>
        {pratica.ricorso_pdf_url && (
          <a
            href={pratica.ricorso_pdf_url}
            target="_blank"
            rel="noopener"
            download
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition hover:bg-card-hover"
          >
            <Download className="h-4 w-4" /> Scarica PDF
          </a>
        )}
      </header>

      {!hasRicorso ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-3 text-sm text-muted">
            Il ricorso non è ancora stato generato.
          </p>
          <Link
            href={v ? `/verbali/${v.id}` : "/pratiche"}
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            Genera dal verbale
          </Link>
        </div>
      ) : (
        <article className="rounded-xl border border-border bg-card p-8">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
            {pratica.ricorso_testo}
          </pre>
          {pratica.ricorso_generato_at && (
            <p className="mt-6 border-t border-border pt-4 text-xs text-muted">
              Generato il{" "}
              {new Date(pratica.ricorso_generato_at).toLocaleString("it-IT")}
            </p>
          )}
        </article>
      )}
    </div>
  );
}

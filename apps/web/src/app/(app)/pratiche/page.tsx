import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Upload } from "lucide-react";

const SEMAFORO_STYLE: Record<string, string> = {
  verde: "bg-success/15 text-success",
  giallo: "bg-warning/15 text-warning",
  rosso: "bg-danger/15 text-danger",
};

const STATO_LABEL: Record<string, string> = {
  analisi: "In analisi",
  pagamento: "In pagamento",
  generazione_ricorso: "Generazione ricorso",
  invio_pec: "Invio PEC",
  attesa_risposta: "In attesa",
  chiusa: "Chiusa",
};

export default async function PratichePage() {
  const supabase = await createClient();

  const { data: pratiche } = await supabase
    .from("pratiche")
    .select(
      `
        id,
        stato,
        created_at,
        verbale:verbali!inner (
          id,
          numero_verbale,
          tipo_infrazione,
          data_violazione,
          luogo,
          comune,
          importo,
          score,
          livello
        )
      `
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Le mie pratiche</h1>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          <Upload className="h-4 w-4" /> Nuova
        </Link>
      </div>

      {!pratiche || pratiche.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-muted">Nessuna pratica ancora.</p>
          <Link
            href="/upload"
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            Carica il tuo primo verbale
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {pratiche.map((p) => {
            const v = p.verbale;
            if (!v) return null;
            const livello = v.livello ?? "rosso";
            return (
              <li key={p.id}>
                <Link
                  href={`/verbali/${v.id}`}
                  className="block rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-card-hover"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold capitalize">
                          {v.tipo_infrazione}
                        </span>
                        {v.numero_verbale && (
                          <span className="text-xs text-muted">
                            · N. {v.numero_verbale}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-sm text-muted">
                        {[v.luogo, v.comune].filter(Boolean).join(" — ") ||
                          "Luogo sconosciuto"}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {v.data_violazione
                          ? new Date(v.data_violazione).toLocaleDateString(
                              "it-IT"
                            )
                          : "Data sconosciuta"}
                        {v.importo ? ` · € ${v.importo.toFixed(2)}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${SEMAFORO_STYLE[livello]}`}
                      >
                        {v.score ?? 0}/100
                      </span>
                      <span className="text-xs text-muted">
                        {STATO_LABEL[p.stato] ?? p.stato}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

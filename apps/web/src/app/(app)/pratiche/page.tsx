import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const SEMAFORO: Record<string, { label: string; cls: string }> = {
  verde: {
    label: "Contestabile",
    cls: "border-success/40 bg-success/10 text-success",
  },
  giallo: {
    label: "Con riserve",
    cls: "border-warning/40 bg-warning/10 text-warning",
  },
  rosso: {
    label: "Non contestabile",
    cls: "border-danger/40 bg-danger/10 text-danger",
  },
};

const TIPO_LABEL: Record<string, string> = {
  velocita: "Eccesso velocità",
  sosta: "Sosta vietata",
  ztl: "Accesso ZTL",
  semaforo: "Rosso semaforico",
  telefono: "Uso telefono",
  altro: "Altro",
};

function formatDate(s: string | null): string {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("it-IT");
}

function formatMoney(n: number | null): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

export default async function PratichePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: verbali }, { data: pratiche }] = await Promise.all([
    supabase
      .from("verbali")
      .select(
        "id, numero_verbale, tipo_infrazione, data_violazione, importo, livello, score, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("pratiche")
      .select("id, verbale_id, stato")
      .eq("user_id", user.id),
  ]);

  const list = verbali ?? [];
  const praticheByVerbale = new Map(
    (pratiche ?? []).map((p) => [p.verbale_id, p])
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Le mie pratiche</h1>
          <p className="mt-1 text-sm text-muted">
            Tutti i verbali caricati e le relative analisi.
          </p>
        </div>
        <Link
          href="/upload"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          + Nuovo verbale
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="mt-8 rounded-lg border border-border bg-card p-12 text-center text-muted">
          <p>Nessun verbale ancora.</p>
          <Link
            href="/upload"
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            Carica il tuo primo verbale →
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {list.map((v) => {
            const livello = v.livello ?? null;
            const semStyle = livello ? SEMAFORO[livello] : null;
            const pratica = praticheByVerbale.get(v.id);
            return (
              <li key={v.id}>
                <Link
                  href={`/analisi/${v.id}`}
                  className="block rounded-lg border border-border bg-card p-4 transition hover:border-primary/60 hover:bg-card-hover"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">
                        {v.numero_verbale ?? "Verbale senza numero"}
                      </p>
                      <p className="text-xs text-muted">
                        {TIPO_LABEL[v.tipo_infrazione] ?? v.tipo_infrazione} ·{" "}
                        {formatDate(v.data_violazione)} ·{" "}
                        {formatMoney(v.importo)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {pratica && (
                        <span className="rounded-full border border-border px-2 py-1 text-xs text-muted">
                          {pratica.stato}
                        </span>
                      )}
                      {semStyle ? (
                        <span
                          className={`rounded-full border px-2 py-1 text-xs ${semStyle.cls}`}
                        >
                          {semStyle.label} · {v.score ?? 0}
                        </span>
                      ) : (
                        <span className="rounded-full border border-border px-2 py-1 text-xs text-muted">
                          Da analizzare
                        </span>
                      )}
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

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Clock } from "lucide-react";
import type { Vizio, Scadenza } from "@multacheck/core";
import { GeneraRicorsoButton } from "./genera-ricorso-button";

type Props = {
  params: Promise<{ id: string }>;
};

const SEMAFORO_LABEL: Record<string, string> = {
  verde: "Alta probabilità di contestazione",
  giallo: "Contestazione possibile",
  rosso: "Contestazione improbabile",
};

const SEMAFORO_STYLE: Record<string, string> = {
  verde: "bg-success/10 text-success border-success/30",
  giallo: "bg-warning/10 text-warning border-warning/30",
  rosso: "bg-danger/10 text-danger border-danger/30",
};

const SCADENZA_LABEL: Record<Scadenza["tipo"], string> = {
  pagamento_ridotto: "Pagamento in misura ridotta",
  ricorso_prefetto: "Ricorso al Prefetto",
  ricorso_gdp: "Ricorso al Giudice di Pace",
};

export default async function VerbaleDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: verbale, error } = await supabase
    .from("verbali")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !verbale) notFound();

  // Carica la pratica collegata (per il bottone "Genera ricorso")
  const { data: pratica } = await supabase
    .from("pratiche")
    .select("id, ricorso_generato_at, pagato_at")
    .eq("verbale_id", id)
    .maybeSingle();

  const vizi: Vizio[] = Array.isArray(verbale.vizi)
    ? (verbale.vizi as unknown as Vizio[])
    : [];

  const scadenze: Scadenza[] = buildScadenze(verbale);

  const livello = verbale.livello ?? "rosso";

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/pratiche"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Torna alle pratiche
      </Link>

      {/* Header con score */}
      <div
        className={`rounded-2xl border p-6 ${SEMAFORO_STYLE[livello]}`}
      >
        <div className="flex items-center gap-4">
          <div className="text-5xl font-bold">{verbale.score ?? 0}</div>
          <div>
            <p className="text-xs uppercase tracking-wide opacity-70">
              Punteggio contestabilità
            </p>
            <p className="text-lg font-semibold">
              {SEMAFORO_LABEL[livello]}
            </p>
          </div>
        </div>
      </div>

      {/* Dati verbale */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Dati del verbale</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <Field label="Numero verbale" value={verbale.numero_verbale} />
          <Field label="Tipo infrazione" value={verbale.tipo_infrazione} />
          <Field
            label="Data violazione"
            value={formatDate(verbale.data_violazione)}
          />
          <Field label="Ora" value={verbale.ora_violazione} />
          <Field
            label="Luogo"
            value={
              [verbale.via, verbale.luogo].filter(Boolean).join(" — ") ||
              verbale.comune
            }
          />
          <Field
            label="Comune"
            value={
              [verbale.comune, verbale.provincia].filter(Boolean).join(" (") +
              (verbale.provincia ? ")" : "")
            }
          />
          <Field label="Targa" value={verbale.targa} />
          <Field
            label="Articolo CdS"
            value={
              verbale.articolo_cds
                ? `Art. ${verbale.articolo_cds}${verbale.comma ? ` c. ${verbale.comma}` : ""}`
                : null
            }
          />
          <Field
            label="Importo"
            value={verbale.importo ? `€ ${verbale.importo.toFixed(2)}` : null}
          />
          <Field
            label="Importo ridotto"
            value={
              verbale.importo_ridotto
                ? `€ ${verbale.importo_ridotto.toFixed(2)}`
                : null
            }
          />
          <Field
            label="Punti patente"
            value={verbale.punti_patente?.toString()}
          />
          <Field label="Organo accertatore" value={verbale.organo_accertatore} />
          {verbale.tipo_infrazione === "velocita" && (
            <>
              <Field
                label="Velocità rilevata"
                value={
                  verbale.velocita_rilevata
                    ? `${verbale.velocita_rilevata} km/h`
                    : null
                }
              />
              <Field
                label="Limite"
                value={
                  verbale.velocita_consentita
                    ? `${verbale.velocita_consentita} km/h`
                    : null
                }
              />
              <Field
                label="Modello apparecchio"
                value={verbale.modello_apparecchio}
              />
            </>
          )}
          <Field
            label="Data notifica"
            value={formatDate(verbale.data_notifica)}
          />
        </dl>
      </section>

      {/* Vizi rilevati */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">
          Vizi formali rilevati ({vizi.length})
        </h2>
        {vizi.length === 0 ? (
          <p className="text-sm text-muted">
            Nessun vizio formale rilevato da MultaCheck.
          </p>
        ) : (
          <ul className="space-y-3">
            {vizi.map((v) => (
              <li
                key={v.id}
                className="rounded-lg border border-border bg-background p-4"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium">{v.titolo}</h3>
                      <span className="rounded bg-card-hover px-2 py-0.5 text-xs text-muted">
                        +{v.peso} punti
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted">{v.descrizione}</p>
                    {v.riferimento_normativo && (
                      <p className="mt-2 text-xs text-muted">
                        Rif.: {v.riferimento_normativo}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Scadenze */}
      {scadenze.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Scadenze</h2>
          <ul className="space-y-2">
            {scadenze.map((s) => {
              const urgent = s.giorni_rimanenti < 10;
              return (
                <li
                  key={s.tipo}
                  className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex items-center gap-3">
                    <Clock
                      className={`h-4 w-4 ${urgent ? "text-danger" : "text-muted"}`}
                    />
                    <span className="text-sm">{SCADENZA_LABEL[s.tipo]}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatDate(s.data_limite)}
                    </p>
                    <p
                      className={`text-xs ${urgent ? "text-danger" : "text-muted"}`}
                    >
                      {s.giorni_rimanenti > 0
                        ? `${s.giorni_rimanenti} giorni rimanenti`
                        : "Scaduta"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* CTA */}
      {livello !== "rosso" && pratica && (
        <section className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-6">
          <div>
            <p className="font-semibold">Genera il ricorso</p>
            <p className="mt-1 text-sm text-muted">
              MultaCheck prepara un ricorso formale pronto da scaricare in PDF.
            </p>
          </div>
          <GeneraRicorsoButton
            praticaId={pratica.id}
            alreadyGenerated={Boolean(pratica.ricorso_generato_at)}
            paid={Boolean(pratica.pagato_at)}
          />
        </section>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium">{value || "—"}</dd>
    </div>
  );
}

function formatDate(d: string | null | undefined): string | null {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

function buildScadenze(verbale: {
  scadenza_pagamento_ridotto: string | null;
  scadenza_ricorso_prefetto: string | null;
  scadenza_ricorso_gdp: string | null;
}): Scadenza[] {
  const now = new Date();
  const out: Scadenza[] = [];

  const entries: { tipo: Scadenza["tipo"]; data: string | null }[] = [
    { tipo: "pagamento_ridotto", data: verbale.scadenza_pagamento_ridotto },
    { tipo: "ricorso_prefetto", data: verbale.scadenza_ricorso_prefetto },
    { tipo: "ricorso_gdp", data: verbale.scadenza_ricorso_gdp },
  ];

  for (const e of entries) {
    if (!e.data) continue;
    const limite = new Date(e.data);
    const diff = Math.floor(
      (limite.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    out.push({
      tipo: e.tipo,
      data_limite: e.data,
      giorni_rimanenti: Math.max(0, diff),
    });
  }

  return out;
}

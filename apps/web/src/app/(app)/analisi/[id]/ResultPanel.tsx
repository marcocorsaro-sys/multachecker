import type { ContestabilityResult } from "@multacheck/core";

const SEMAFORO_STYLES = {
  verde: {
    bg: "bg-success/10",
    border: "border-success/40",
    text: "text-success",
    label: "Altamente contestabile",
  },
  giallo: {
    bg: "bg-warning/10",
    border: "border-warning/40",
    text: "text-warning",
    label: "Contestabile con riserve",
  },
  rosso: {
    bg: "bg-danger/10",
    border: "border-danger/40",
    text: "text-danger",
    label: "Difficilmente contestabile",
  },
} as const;

const SCAD_LABEL: Record<string, string> = {
  pagamento_ridotto: "Pagamento ridotto (−30%)",
  ricorso_prefetto: "Ricorso al Prefetto",
  ricorso_gdp: "Ricorso al Giudice di Pace",
};

export function ResultPanel({ result }: { result: ContestabilityResult }) {
  const style = SEMAFORO_STYLES[result.semaforo];

  return (
    <section className="space-y-4">
      <div
        className={`rounded-lg border p-4 ${style.bg} ${style.border}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-xs font-semibold uppercase ${style.text}`}>
              Esito
            </p>
            <p className="text-lg font-bold">{style.label}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted">Score</p>
            <p className={`text-3xl font-bold ${style.text}`}>
              {result.score}/100
            </p>
          </div>
        </div>
      </div>

      {result.vizi.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">
            Vizi individuati ({result.vizi.length})
          </h3>
          <ul className="space-y-2">
            {result.vizi.map((v) => (
              <li
                key={v.id}
                className="rounded-md border border-border bg-card p-3"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium">{v.titolo}</p>
                  <span className="text-xs text-muted">+{v.peso}</span>
                </div>
                <p className="mt-1 text-xs text-muted">{v.descrizione}</p>
                {v.riferimento_normativo && (
                  <p className="mt-1 text-xs italic text-muted">
                    {v.riferimento_normativo}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.scadenze.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Scadenze</h3>
          <ul className="space-y-1">
            {result.scadenze.map((s) => (
              <li
                key={s.tipo}
                className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm"
              >
                <span>{SCAD_LABEL[s.tipo] ?? s.tipo}</span>
                <span
                  className={
                    s.giorni_rimanenti === 0
                      ? "text-danger"
                      : s.giorni_rimanenti <= 5
                        ? "text-warning"
                        : "text-muted"
                  }
                >
                  {s.data_limite}
                  {s.giorni_rimanenti > 0
                    ? ` (${s.giorni_rimanenti}gg)`
                    : " (scaduto)"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs italic text-muted">
        Questa analisi è automatica e meramente indicativa. Prima di procedere
        con una contestazione reale consulta sempre un legale.
      </p>
    </section>
  );
}

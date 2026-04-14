"use client";

import { useActionState } from "react";
import type { VerbaleData } from "@multacheck/core";

type ActionState = { error?: string; ok?: boolean };
type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

const TIPI: { value: VerbaleData["tipo_infrazione"]; label: string }[] = [
  { value: "velocita", label: "Eccesso di velocità" },
  { value: "sosta", label: "Sosta vietata" },
  { value: "ztl", label: "Accesso ZTL" },
  { value: "semaforo", label: "Passaggio con rosso" },
  { value: "telefono", label: "Uso del telefono" },
  { value: "altro", label: "Altro" },
];

export function AnalisiForm({
  verbaleId,
  initial,
  action,
}: {
  verbaleId: string;
  initial: Partial<VerbaleData>;
  action: Action;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    {}
  );

  const tipo = initial.tipo_infrazione ?? "altro";
  const showVelocita = tipo === "velocita";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="verbale_id" value={verbaleId} />

      <Field label="Tipo di infrazione *">
        <select
          name="tipo_infrazione"
          defaultValue={tipo}
          className="input"
          required
        >
          {TIPI.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Numero verbale">
          <input
            name="numero_verbale"
            defaultValue={initial.numero_verbale ?? ""}
            className="input"
            placeholder="es. 12345/2026"
          />
        </Field>
        <Field label="Targa">
          <input
            name="targa"
            defaultValue={initial.targa ?? ""}
            className="input"
            placeholder="es. AB123CD"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Data violazione *">
          <input
            name="data_violazione"
            type="date"
            defaultValue={initial.data_violazione ?? ""}
            className="input"
            required
          />
        </Field>
        <Field label="Ora violazione">
          <input
            name="ora_violazione"
            type="time"
            defaultValue={initial.ora_violazione ?? ""}
            className="input"
          />
        </Field>
      </div>

      <Field label="Data notifica">
        <input
          name="data_notifica"
          type="date"
          defaultValue={initial.data_notifica ?? ""}
          className="input"
        />
      </Field>

      <Field label="Luogo / via">
        <input
          name="via"
          defaultValue={initial.via ?? initial.luogo ?? ""}
          className="input"
          placeholder="es. Via Roma 12"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Comune">
          <input
            name="comune"
            defaultValue={initial.comune ?? ""}
            className="input"
          />
        </Field>
        <Field label="Provincia">
          <input
            name="provincia"
            defaultValue={initial.provincia ?? ""}
            className="input"
            maxLength={2}
            placeholder="es. RM"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Articolo CdS">
          <input
            name="articolo_cds"
            defaultValue={initial.articolo_cds ?? ""}
            className="input"
            placeholder="es. 142"
          />
        </Field>
        <Field label="Comma">
          <input
            name="comma"
            defaultValue={initial.comma ?? ""}
            className="input"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Importo (€)">
          <input
            name="importo"
            type="number"
            step="0.01"
            defaultValue={initial.importo ?? ""}
            className="input"
          />
        </Field>
        <Field label="Importo ridotto (€)">
          <input
            name="importo_ridotto"
            type="number"
            step="0.01"
            defaultValue={initial.importo_ridotto ?? ""}
            className="input"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Punti patente">
          <input
            name="punti_patente"
            type="number"
            defaultValue={initial.punti_patente ?? ""}
            className="input"
          />
        </Field>
        <Field label="Organo accertatore">
          <input
            name="organo_accertatore"
            defaultValue={initial.organo_accertatore ?? ""}
            className="input"
            placeholder="es. Polizia Municipale"
          />
        </Field>
      </div>

      {showVelocita && (
        <div className="grid grid-cols-3 gap-3">
          <Field label="Modello apparecchio">
            <input
              name="modello_apparecchio"
              defaultValue={initial.modello_apparecchio ?? ""}
              className="input"
            />
          </Field>
          <Field label="Velocità rilevata">
            <input
              name="velocita_rilevata"
              type="number"
              defaultValue={initial.velocita_rilevata ?? ""}
              className="input"
            />
          </Field>
          <Field label="Velocità consentita">
            <input
              name="velocita_consentita"
              type="number"
              defaultValue={initial.velocita_consentita ?? ""}
              className="input"
            />
          </Field>
        </div>
      )}

      {state?.error && (
        <p className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Analisi in corso..." : "Analizza e salva"}
      </button>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid var(--color-border);
          background-color: var(--color-card);
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          color: var(--color-foreground);
        }
        .input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 1px var(--color-primary);
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

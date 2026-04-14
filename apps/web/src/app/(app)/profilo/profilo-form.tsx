"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Check } from "lucide-react";

type Initial = {
  full_name: string;
  fiscal_code: string;
  address: string;
  city: string;
  province: string;
  zip_code: string;
  phone: string;
  email: string;
};

export function ProfiloForm({
  userId,
  initial,
}: {
  userId: string;
  initial: Initial;
}) {
  const [state, setState] = useState<Initial>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  function update<K extends keyof Initial>(key: K, value: Initial[K]) {
    setState((s) => ({ ...s, [key]: value }));
    setSaved(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        full_name: state.full_name || null,
        fiscal_code: state.fiscal_code.toUpperCase() || null,
        address: state.address || null,
        city: state.city || null,
        province: state.province.toUpperCase() || null,
        zip_code: state.zip_code || null,
        phone: state.phone || null,
        email: state.email || null,
      });

    if (upsertError) {
      setError(upsertError.message);
    } else {
      setSaved(true);
    }
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field
        label="Nome e cognome"
        value={state.full_name}
        onChange={(v) => update("full_name", v)}
        required
        autoComplete="name"
      />
      <Field
        label="Codice fiscale"
        value={state.fiscal_code}
        onChange={(v) => update("fiscal_code", v.toUpperCase())}
        required
        autoComplete="off"
        maxLength={16}
        monospace
      />
      <Field
        label="Email"
        type="email"
        value={state.email}
        onChange={(v) => update("email", v)}
        autoComplete="email"
      />
      <Field
        label="Telefono"
        type="tel"
        value={state.phone}
        onChange={(v) => update("phone", v)}
        autoComplete="tel"
      />
      <Field
        label="Indirizzo"
        value={state.address}
        onChange={(v) => update("address", v)}
        required
        autoComplete="street-address"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field
          label="CAP"
          value={state.zip_code}
          onChange={(v) => update("zip_code", v)}
          required
          maxLength={5}
          autoComplete="postal-code"
        />
        <Field
          label="Città"
          value={state.city}
          onChange={(v) => update("city", v)}
          required
          autoComplete="address-level2"
        />
        <Field
          label="Provincia (sigla)"
          value={state.province}
          onChange={(v) => update("province", v.toUpperCase())}
          required
          maxLength={2}
        />
      </div>

      {error && (
        <p className="rounded-lg border border-danger/50 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {saved && !saving && <Check className="h-4 w-4" />}
        {saved ? "Salvato" : saving ? "Salvataggio..." : "Salva profilo"}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  maxLength,
  autoComplete,
  monospace,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  maxLength?: number;
  autoComplete?: string;
  monospace?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        maxLength={maxLength}
        autoComplete={autoComplete}
        className={`w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
          monospace ? "font-mono" : ""
        }`}
      />
    </div>
  );
}

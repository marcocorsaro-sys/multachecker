"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";

export function GeneraRicorsoButton({
  praticaId,
  alreadyGenerated,
}: {
  praticaId: string;
  alreadyGenerated: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    if (alreadyGenerated) {
      router.push(`/pratiche/${praticaId}/ricorso`);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/pratiche/${praticaId}/genera-ricorso`, {
        method: "POST",
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Errore sconosciuto");
        if (json.redirect) {
          router.push(json.redirect);
        }
        setLoading(false);
        return;
      }

      router.push(`/pratiche/${praticaId}/ricorso`);
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generazione in corso...
          </>
        ) : alreadyGenerated ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Vedi ricorso
          </>
        ) : (
          "Genera ricorso"
        )}
      </button>
      {error && (
        <p className="max-w-xs text-right text-xs text-danger">{error}</p>
      )}
    </div>
  );
}

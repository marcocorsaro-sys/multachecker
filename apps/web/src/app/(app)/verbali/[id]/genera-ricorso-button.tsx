"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, Lock } from "lucide-react";

export function GeneraRicorsoButton({
  praticaId,
  alreadyGenerated,
  paid,
}: {
  praticaId: string;
  alreadyGenerated: boolean;
  paid: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    // Caso 1: ricorso già generato → vai alla pagina ricorso
    if (alreadyGenerated) {
      router.push(`/pratiche/${praticaId}/ricorso`);
      return;
    }

    setLoading(true);
    setError("");

    // Caso 2: pagato ma non ancora generato → genera direttamente
    if (paid) {
      try {
        const res = await fetch(`/api/pratiche/${praticaId}/genera-ricorso`, {
          method: "POST",
        });
        const json = await res.json();

        if (!res.ok) {
          setError(json.error ?? "Errore sconosciuto");
          if (json.redirect) router.push(json.redirect);
          setLoading(false);
          return;
        }

        router.push(`/pratiche/${praticaId}/ricorso`);
      } catch (e) {
        setError((e as Error).message);
        setLoading(false);
      }
      return;
    }

    // Caso 3: non pagato → crea Stripe Checkout Session e redirigi
    try {
      const res = await fetch(`/api/stripe/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pratica_id: praticaId }),
      });
      const json = await res.json();

      if (!res.ok || !json.url) {
        setError(json.error ?? "Errore Stripe");
        setLoading(false);
        return;
      }

      window.location.href = json.url;
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
            {paid ? "Generazione in corso..." : "Reindirizzamento..."}
          </>
        ) : alreadyGenerated ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Vedi ricorso
          </>
        ) : paid ? (
          "Genera ricorso"
        ) : (
          <>
            <Lock className="h-4 w-4" />
            Sblocca ricorso · €19
          </>
        )}
      </button>
      {error && (
        <p className="max-w-xs text-right text-xs text-danger">{error}</p>
      )}
    </div>
  );
}

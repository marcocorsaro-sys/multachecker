"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";

/**
 * Quando l'utente arriva su questa pagina con ?just_paid=1 (dopo
 * Stripe Checkout) e il ricorso non è ancora stato generato, triggera
 * la generazione automaticamente e poi fa router.refresh().
 */
export function AutoGenerateRicorso({
  praticaId,
  alreadyGenerated,
}: {
  praticaId: string;
  alreadyGenerated: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const justPaid = params.get("just_paid") === "1";

  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [error, setError] = useState("");
  const triggered = useRef(false);

  useEffect(() => {
    if (!justPaid || alreadyGenerated || triggered.current) return;
    triggered.current = true;
    setStatus("loading");

    (async () => {
      try {
        const res = await fetch(`/api/pratiche/${praticaId}/genera-ricorso`, {
          method: "POST",
        });
        const json = await res.json();

        if (!res.ok) {
          setError(json.error ?? "Errore durante la generazione");
          setStatus("error");
          return;
        }

        setStatus("done");
        router.refresh();
      } catch (e) {
        setError((e as Error).message);
        setStatus("error");
      }
    })();
  }, [justPaid, alreadyGenerated, praticaId, router]);

  if (!justPaid && !alreadyGenerated) return null;

  if (justPaid && status === "loading") {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div>
            <p className="font-semibold">Pagamento ricevuto. Generazione del ricorso in corso...</p>
            <p className="mt-1 text-sm text-muted">
              Claude sta redigendo il ricorso. Richiede 20–40 secondi.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (justPaid && status === "error") {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger/5 p-6">
        <p className="font-semibold text-danger">
          Generazione fallita: {error}
        </p>
        <p className="mt-2 text-sm text-muted">
          Il pagamento è stato ricevuto. Riprova dalla pagina del verbale o
          contattaci se il problema persiste.
        </p>
      </div>
    );
  }

  if (justPaid && status === "done") {
    return (
      <div className="rounded-xl border border-success/30 bg-success/5 p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <p className="text-sm font-medium">
            Ricorso generato con successo. Pagamento confermato.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, FileImage, X } from "lucide-react";

type Status = "idle" | "uploading" | "parsing" | "done" | "error";

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";

export function UploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  function handleFile(selected: File | null) {
    setError("");
    if (!selected) return;

    if (selected.size > MAX_SIZE) {
      setError("File troppo grande (max 10 MB)");
      return;
    }

    const allowed = ACCEPT.split(",");
    if (!allowed.includes(selected.type)) {
      setError("Formato non supportato. Usa JPG, PNG, WebP o PDF.");
      return;
    }

    setFile(selected);

    if (selected.type.startsWith("image/")) {
      const url = URL.createObjectURL(selected);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  function clear() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setError("");
    setStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function submit() {
    if (!file) return;
    setError("");
    setStatus("uploading");

    const form = new FormData();
    form.append("file", file);

    try {
      setStatus("parsing");
      const res = await fetch("/api/verbali/upload", {
        method: "POST",
        body: form,
      });

      const json = await res.json();

      if (!res.ok) {
        setStatus("error");
        setError(json.error ?? "Errore sconosciuto");
        return;
      }

      setStatus("done");
      router.push(`/verbali/${json.verbale_id}`);
    } catch (e) {
      setStatus("error");
      setError((e as Error).message);
    }
  }

  const busy = status === "uploading" || status === "parsing";

  return (
    <div className="w-full max-w-xl">
      {/* Dropzone */}
      {!file && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files[0] ?? null);
          }}
          className={`flex h-64 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-card"
          }`}
        >
          <Upload className="h-10 w-10 text-muted" />
          <p className="text-sm font-medium">
            Trascina qui il verbale o clicca per selezionare
          </p>
          <p className="text-xs text-muted">JPG, PNG, WebP o PDF · max 10 MB</p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>
      )}

      {/* Preview */}
      {file && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start gap-4">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Anteprima verbale"
                className="h-32 w-32 rounded-lg border border-border object-cover"
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-lg border border-border bg-background">
                <FileImage className="h-10 w-10 text-muted" />
              </div>
            )}
            <div className="flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="mt-1 text-xs text-muted">
                {(file.size / 1024).toFixed(0)} KB · {file.type}
              </p>
              {!busy && (
                <button
                  onClick={clear}
                  className="mt-3 flex items-center gap-1 text-xs text-muted hover:text-foreground"
                >
                  <X className="h-3 w-3" /> Rimuovi
                </button>
              )}
            </div>
          </div>

          <button
            onClick={submit}
            disabled={busy}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {status === "uploading" ? "Caricamento..." : "Analisi in corso..."}
              </>
            ) : (
              "Analizza verbale"
            )}
          </button>

          {busy && (
            <p className="mt-3 text-center text-xs text-muted">
              L&apos;analisi richiede circa 10–20 secondi. Non chiudere la pagina.
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-lg border border-danger/50 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

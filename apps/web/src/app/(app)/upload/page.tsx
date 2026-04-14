"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  function pickFile(next: File | null) {
    setError(null);
    if (!next) return setFile(null);
    if (next.size > MAX_SIZE) {
      setError("File troppo grande (max 10 MB).");
      return;
    }
    if (!ACCEPT.split(",").includes(next.type)) {
      setError("Formato non supportato. Usa JPG, PNG, WEBP o PDF.");
      return;
    }
    setFile(next);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessione scaduta, effettua di nuovo il login.");

      // path: <uid>/<timestamp>-<filename>
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/${Date.now()}-${safeName}`;

      const { error: upErr } = await supabase.storage
        .from("verbali")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage
        .from("verbali")
        .getPublicUrl(path);

      const { data: verbale, error: insErr } = await supabase
        .from("verbali")
        .insert({
          user_id: user.id,
          image_path: path,
          image_url: urlData.publicUrl,
          tipo_infrazione: "altro",
        })
        .select("id")
        .single();

      if (insErr) throw insErr;
      if (!verbale) throw new Error("Errore nella creazione del verbale.");

      router.push(`/analisi/${verbale.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore imprevisto.");
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Carica il tuo verbale</h1>
        <p className="mt-2 max-w-md text-muted">
          Scatta una foto o carica un&apos;immagine (o PDF) del verbale. Lo
          analizzeremo per individuare eventuali vizi e scadenze.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          pickFile(e.dataTransfer.files[0] ?? null);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        className={`flex h-64 w-full max-w-md cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 text-center transition ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/60 hover:bg-card"
        }`}
      >
        {file ? (
          <>
            <p className="font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted">
              {(file.size / 1024).toFixed(0)} KB — clicca per cambiare
            </p>
          </>
        ) : (
          <>
            <svg
              className="h-10 w-10 text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 0 1-.88-7.9 5 5 0 0 1 9.76 0A4 4 0 0 1 16 16m-6-4v8m0-8 2 2m-2-2-2 2"
              />
            </svg>
            <p className="text-sm text-muted">
              Trascina qui il file o <span className="text-primary">clicca per sfogliare</span>
            </p>
            <p className="text-xs text-muted">JPG, PNG, WEBP, PDF — max 10 MB</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploading ? "Caricamento in corso..." : "Analizza verbale"}
      </button>
    </div>
  );
}

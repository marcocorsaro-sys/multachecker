export default function UploadPage() {
  return (
    <div className="flex flex-col items-center gap-6 py-12">
      <h1 className="text-3xl font-bold">Carica il tuo verbale</h1>
      <p className="max-w-md text-center text-muted">
        Scatta una foto o carica un&apos;immagine del verbale. La nostra AI lo
        analizzerà in pochi secondi.
      </p>
      <div className="flex h-64 w-full max-w-md items-center justify-center rounded-xl border-2 border-dashed border-border text-muted">
        Upload component — Fase 3
      </div>
    </div>
  );
}

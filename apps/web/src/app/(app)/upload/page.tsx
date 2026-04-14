import { UploadForm } from "./upload-form";

export default function UploadPage() {
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Carica il tuo verbale</h1>
        <p className="mt-2 max-w-md text-muted">
          Scatta una foto o carica un&apos;immagine del verbale. La nostra AI lo
          analizzerà in pochi secondi e ti dirà se vale la pena contestarlo.
        </p>
      </div>
      <UploadForm />
    </div>
  );
}

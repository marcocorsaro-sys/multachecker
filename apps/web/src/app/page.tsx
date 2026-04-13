export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-4xl font-bold tracking-tight">
        Multa<span className="text-primary">Check</span>
      </h1>
      <p className="max-w-md text-center text-muted">
        Scopri gratuitamente se puoi contestare la tua multa. Carica una foto
        del verbale e ricevi un&apos;analisi AI in pochi secondi.
      </p>
      <div className="flex gap-4">
        <a
          href="/upload"
          className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:opacity-90"
        >
          Analizza multa
        </a>
        <a
          href="/magazine"
          className="rounded-lg border border-border px-6 py-3 font-medium transition hover:bg-card"
        >
          Multa Magazine
        </a>
      </div>
    </main>
  );
}

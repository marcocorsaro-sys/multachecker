import Link from "next/link";

export default function MagazineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Magazine Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/magazine" className="text-xl font-bold">
            Multa<span className="text-primary">Magazine</span>
          </Link>

          <div className="hidden items-center gap-6 text-sm md:flex">
            <Link
              href="/magazine/categoria/velocita"
              className="text-muted hover:text-foreground transition"
            >
              Velocita
            </Link>
            <Link
              href="/magazine/categoria/sosta"
              className="text-muted hover:text-foreground transition"
            >
              Sosta
            </Link>
            <Link
              href="/magazine/categoria/ztl"
              className="text-muted hover:text-foreground transition"
            >
              ZTL
            </Link>
            <Link
              href="/magazine/categoria/semaforo"
              className="text-muted hover:text-foreground transition"
            >
              Semaforo
            </Link>
            <Link
              href="/magazine/guida"
              className="text-muted hover:text-foreground transition"
            >
              Guide
            </Link>
            <Link
              href="/magazine/domande-frequenti"
              className="text-muted hover:text-foreground transition"
            >
              FAQ
            </Link>
          </div>

          <Link
            href="/upload"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Analizza multa
          </Link>
        </nav>
      </header>

      {/* Main content */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="font-bold">
                Multa<span className="text-primary">Magazine</span>
              </h3>
              <p className="mt-2 text-sm text-muted">
                Il portale italiano per capire, contestare e vincere le multe
                stradali.
              </p>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-semibold">Categorie</h4>
              <ul className="space-y-1 text-sm text-muted">
                <li>
                  <Link href="/magazine/categoria/velocita" className="hover:text-foreground">
                    Eccesso di velocita
                  </Link>
                </li>
                <li>
                  <Link href="/magazine/categoria/sosta" className="hover:text-foreground">
                    Divieto di sosta
                  </Link>
                </li>
                <li>
                  <Link href="/magazine/categoria/ztl" className="hover:text-foreground">
                    ZTL
                  </Link>
                </li>
                <li>
                  <Link href="/magazine/glossario" className="hover:text-foreground">
                    Glossario
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-semibold">MultaCheck</h4>
              <ul className="space-y-1 text-sm text-muted">
                <li>
                  <Link href="/upload" className="hover:text-foreground">
                    Analizza verbale
                  </Link>
                </li>
                <li>
                  <Link href="/prezzi" className="hover:text-foreground">
                    Prezzi
                  </Link>
                </li>
                <li>
                  <Link href="/chi-siamo" className="hover:text-foreground">
                    Chi siamo
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-4 text-center text-xs text-muted">
            &copy; {new Date().getFullYear()} MultaCheck. Tutti i diritti
            riservati.
          </div>
        </div>
      </footer>
    </div>
  );
}

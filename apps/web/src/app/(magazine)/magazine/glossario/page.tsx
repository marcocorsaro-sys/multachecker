import type { Metadata } from "next";
import Link from "next/link";
import { sanityFetch } from "@/lib/sanity/live";
import type { GlossaryTermItem } from "@/lib/sanity/types";
import { GLOSSARY_TERMS_QUERY } from "@/lib/sanity/queries";
import { Breadcrumbs } from "@/components/magazine/Breadcrumbs";

export const metadata: Metadata = {
  title: "Glossario delle multe stradali",
  description:
    "Tutti i termini legali e tecnici legati a multe, Codice della Strada, ricorsi e contestazioni.",
};

export default async function GlossaryPage() {
  const terms = await sanityFetch<GlossaryTermItem[]>({
    query: GLOSSARY_TERMS_QUERY,
    tags: ["glossaryTerm"], fallback: [],
  });

  // Group alphabetically
  const grouped = terms.reduce(
    (acc, term) => {
      const letter = (term.term?.[0] || "#").toUpperCase();
      if (!acc[letter]) acc[letter] = [];
      acc[letter].push(term);
      return acc;
    },
    {} as Record<string, typeof terms>
  );

  const letters = Object.keys(grouped).sort();

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Magazine", href: "/magazine" },
          { label: "Glossario" },
        ]}
      />

      <h1 className="mb-4 text-3xl font-bold">Glossario</h1>
      <p className="mb-8 text-muted">
        Termini legali e tecnici del Codice della Strada e delle procedure di
        contestazione.
      </p>

      {/* A-Z nav */}
      <nav className="mb-8 flex flex-wrap gap-2">
        {letters.map((letter) => (
          <a
            key={letter}
            href={`#${letter}`}
            className="flex h-8 w-8 items-center justify-center rounded border border-border text-sm font-medium transition hover:border-primary hover:text-primary"
          >
            {letter}
          </a>
        ))}
      </nav>

      {letters.map((letter) => (
        <section key={letter} id={letter} className="mb-8">
          <h2 className="mb-3 text-2xl font-bold text-primary">{letter}</h2>
          <div className="space-y-3">
            {grouped[letter].map((term) => (
              <Link
                key={term._id}
                href={`/magazine/glossario/${term.slug?.current}`}
                className="block rounded-lg border border-border p-4 transition hover:border-primary/30 hover:bg-card"
              >
                <h3 className="font-semibold">{term.term}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted">
                  {term.definition}
                </p>
                {term.articoloCds && (
                  <span className="mt-2 inline-block text-xs text-muted">
                    {term.articoloCds}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

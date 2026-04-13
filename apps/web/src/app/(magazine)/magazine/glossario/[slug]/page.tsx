import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sanityFetch } from "@/lib/sanity/live";
import type { GlossaryTermFull } from "@/lib/sanity/types";
import { GLOSSARY_TERM_BY_SLUG_QUERY } from "@/lib/sanity/queries";
import { Breadcrumbs } from "@/components/magazine/Breadcrumbs";
import { JsonLd } from "@/components/magazine/JsonLd";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const term = await sanityFetch<GlossaryTermFull | null>({
    query: GLOSSARY_TERM_BY_SLUG_QUERY,
    params: { slug },
    tags: ["glossaryTerm"], fallback: null,
  });

  if (!term) return { title: "Termine non trovato" };

  return {
    title: `${term.term} — Glossario Multa Magazine`,
    description: term.definition?.substring(0, 155),
  };
}

export default async function GlossaryTermPage({ params }: Props) {
  const { slug } = await params;
  const term = await sanityFetch<GlossaryTermFull | null>({
    query: GLOSSARY_TERM_BY_SLUG_QUERY,
    params: { slug },
    tags: ["glossaryTerm"], fallback: null,
  });

  if (!term) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: term.term,
    description: term.definition,
  };

  return (
    <div>
      <JsonLd data={jsonLd} />
      <Breadcrumbs
        items={[
          { label: "Magazine", href: "/magazine" },
          { label: "Glossario", href: "/magazine/glossario" },
          { label: term.term || "" },
        ]}
      />

      <h1 className="mb-4 text-3xl font-bold">{term.term}</h1>

      {term.articoloCds && (
        <span className="mb-4 inline-block rounded-full border border-border px-3 py-1 text-sm text-muted">
          {term.articoloCds}
        </span>
      )}

      <div className="mb-8 text-lg leading-relaxed">{term.definition}</div>

      {term.relatedArticles && term.relatedArticles.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold">Articoli correlati</h2>
          <div className="space-y-3">
            {term.relatedArticles.map((article) => (
              <Link
                key={article._id}
                href={`/magazine/${article.slug?.current}`}
                className="block rounded-lg border border-border p-4 transition hover:border-primary/30"
              >
                <h3 className="font-semibold">{article.title}</h3>
                {article.excerpt && (
                  <p className="mt-1 text-sm text-muted">{article.excerpt}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

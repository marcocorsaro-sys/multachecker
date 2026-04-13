import type { Metadata } from "next";
import Link from "next/link";
import { sanityFetch } from "@/lib/sanity/live";
import type { ArticleListItem, CategoryItem, GuideListItem } from "@/lib/sanity/types";
import {
  ARTICLES_QUERY,
  FEATURED_ARTICLES_QUERY,
  CATEGORIES_QUERY,
  GUIDES_QUERY,
} from "@/lib/sanity/queries";
import { ArticleCard } from "@/components/magazine/ArticleCard";

export const metadata: Metadata = {
  title: "Multa Magazine — Guide e articoli su multe stradali",
  description:
    "Tutto sulle multe stradali: guide pratiche, news legali, consigli per contestare. Velocita, sosta, ZTL, semafori e altro.",
};

export default async function MagazineHomePage() {
  const [articles, featured, categories, guides] = await Promise.all([
    sanityFetch<ArticleListItem[]>({ query: ARTICLES_QUERY, tags: ["article"], fallback: [] }),
    sanityFetch<ArticleListItem[]>({ query: FEATURED_ARTICLES_QUERY, tags: ["article"], fallback: [] }),
    sanityFetch<CategoryItem[]>({ query: CATEGORIES_QUERY, tags: ["category"], fallback: [] }),
    sanityFetch<GuideListItem[]>({ query: GUIDES_QUERY, tags: ["guide"], fallback: [] }),
  ]);

  return (
    <div>
      {/* Hero / Featured */}
      <section className="mb-12">
        <h1 className="text-3xl font-bold md:text-4xl">
          Multa<span className="text-primary">Magazine</span>
        </h1>
        <p className="mt-2 text-muted">
          Guide, articoli e news per capire e contestare le multe stradali.
        </p>
      </section>

      {/* Categories */}
      <section className="mb-10">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Link
              key={cat._id}
              href={`/magazine/categoria/${cat.slug?.current}`}
              className="rounded-full border border-border px-4 py-1.5 text-sm transition hover:border-primary hover:text-primary"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Articles */}
      {featured.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold">In evidenza</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {featured.map((article) => (
              <ArticleCard key={article._id} {...article} />
            ))}
          </div>
        </section>
      )}

      {/* Latest Articles */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-bold">Ultimi articoli</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article._id} {...article} />
          ))}
        </div>
      </section>

      {/* Guides */}
      {guides.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold">Guide</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {guides.map((guide) => (
              <Link
                key={guide._id}
                href={`/magazine/guida/${guide.slug?.current}`}
                className="flex items-center gap-4 rounded-lg border border-border p-4 transition hover:border-primary/30 hover:bg-card"
              >
                <div className="flex-1">
                  <h3 className="font-semibold">{guide.title}</h3>
                  {guide.subtitle && (
                    <p className="mt-1 text-sm text-muted">{guide.subtitle}</p>
                  )}
                  <div className="mt-2 flex gap-3 text-xs text-muted">
                    {guide.readingTime && (
                      <span>{guide.readingTime} min lettura</span>
                    )}
                    {guide.difficulty && <span>Livello: {guide.difficulty}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="rounded-xl bg-primary/10 border border-primary/20 p-8 text-center">
        <h2 className="text-2xl font-bold">Hai ricevuto una multa?</h2>
        <p className="mt-2 text-muted">
          Scopri gratuitamente se puoi contestarla. Carica una foto del verbale.
        </p>
        <Link
          href="/upload"
          className="mt-4 inline-block rounded-lg bg-primary px-8 py-3 font-medium text-primary-foreground transition hover:opacity-90"
        >
          Analizza il tuo verbale
        </Link>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { sanityFetch } from "@/lib/sanity/live";
import type { CategoryItem, ArticleListItem } from "@/lib/sanity/types";
import {
  CATEGORY_BY_SLUG_QUERY,
  ARTICLES_BY_CATEGORY_QUERY,
} from "@/lib/sanity/queries";
import { ArticleCard } from "@/components/magazine/ArticleCard";
import { Breadcrumbs } from "@/components/magazine/Breadcrumbs";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await sanityFetch<CategoryItem | null>({
    query: CATEGORY_BY_SLUG_QUERY,
    params: { slug },
    tags: ["category"], fallback: null,
  });

  if (!category) return { title: "Categoria non trovata" };

  return {
    title: category.seo?.metaTitle || `${category.name} — Multa Magazine`,
    description:
      category.seo?.metaDescription ||
      category.description ||
      `Articoli e guide su ${category.name?.toLowerCase()}`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const [category, articles] = await Promise.all([
    sanityFetch<CategoryItem | null>({
      query: CATEGORY_BY_SLUG_QUERY,
      params: { slug },
      tags: ["category"], fallback: null,
    }),
    sanityFetch<ArticleListItem[]>({
      query: ARTICLES_BY_CATEGORY_QUERY,
      params: { categorySlug: slug, start: 0, end: 12 },
      tags: ["article"], fallback: [],
    }),
  ]);

  if (!category) notFound();

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Magazine", href: "/magazine" },
          { label: category.name || "" },
        ]}
      />

      <header className="mb-8">
        <h1 className="text-3xl font-bold">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-muted">{category.description}</p>
        )}
      </header>

      {articles.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article._id} {...article} />
          ))}
        </div>
      ) : (
        <p className="text-muted">
          Nessun articolo in questa categoria ancora. Torna presto!
        </p>
      )}
    </div>
  );
}

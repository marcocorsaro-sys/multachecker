import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sanityFetch } from "@/lib/sanity/live";
import type { ArticleFull } from "@/lib/sanity/types";
import { ARTICLE_BY_SLUG_QUERY } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/image";
import { PortableTextRenderer } from "@/components/magazine/PortableTextRenderer";
import { Breadcrumbs } from "@/components/magazine/Breadcrumbs";
import { InlineCTA } from "@/components/magazine/InlineCTA";
import { JsonLd } from "@/components/magazine/JsonLd";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await sanityFetch<ArticleFull | null>({
    query: ARTICLE_BY_SLUG_QUERY,
    params: { slug },
    tags: ["article"], fallback: null,
  });

  if (!article) return { title: "Articolo non trovato" };

  return {
    title: article.seo?.metaTitle || article.title,
    description: article.seo?.metaDescription || article.excerpt,
    openGraph: {
      title: article.seo?.metaTitle || article.title,
      description: article.seo?.metaDescription || article.excerpt,
      type: "article",
      publishedTime: article.publishedAt || undefined,
      ...(article.mainImage?.asset
        ? { images: [urlFor(article.mainImage).width(1200).height(630).url()] }
        : {}),
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await sanityFetch<ArticleFull | null>({
    query: ARTICLE_BY_SLUG_QUERY,
    params: { slug },
    tags: ["article"], fallback: null,
  });

  if (!article) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.seo?.metaDescription || article.excerpt,
    datePublished: article.publishedAt,
    dateModified: article._updatedAt,
    ...(article.author ? { author: { "@type": "Person", name: article.author.name } } : {}),
    publisher: {
      "@type": "Organization",
      name: "MultaCheck",
    },
    ...(article.mainImage?.asset
      ? { image: urlFor(article.mainImage).width(1200).height(630).url() }
      : {}),
  };

  return (
    <article>
      <JsonLd data={jsonLd} />

      <Breadcrumbs
        items={[
          { label: "Magazine", href: "/magazine" },
          ...(article.category
            ? [
                {
                  label: article.category.name,
                  href: `/magazine/categoria/${article.category.slug?.current}`,
                },
              ]
            : []),
          { label: article.title || "" },
        ]}
      />

      {/* Header */}
      <header className="mb-8">
        {article.category && (
          <Link
            href={`/magazine/categoria/${article.category.slug?.current}`}
            className="text-xs font-medium uppercase tracking-wide text-primary"
          >
            {article.category.name}
          </Link>
        )}
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">
          {article.title}
        </h1>
        {article.excerpt && (
          <p className="mt-3 text-lg text-muted">{article.excerpt}</p>
        )}
        <div className="mt-4 flex items-center gap-3 text-sm text-muted">
          {article.author && (
            <span className="font-medium text-foreground">
              {article.author.name}
            </span>
          )}
          {article.publishedAt && (
            <time dateTime={article.publishedAt}>
              {new Date(article.publishedAt).toLocaleDateString("it-IT", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
          )}
        </div>
      </header>

      {/* Main Image */}
      {article.mainImage?.asset && (
        <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-xl">
          <Image
            src={urlFor(article.mainImage).width(1200).height(675).url()}
            alt={article.mainImage.alt || article.title || ""}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 800px"
          />
        </div>
      )}

      {/* Body */}
      {article.body && <PortableTextRenderer value={article.body} />}

      {/* Legal References */}
      {article.legalReferences && article.legalReferences.length > 0 && (
        <div className="mt-8 rounded-lg border border-border bg-card p-4">
          <h3 className="mb-2 font-semibold">Riferimenti normativi</h3>
          <ul className="space-y-1 text-sm">
            {article.legalReferences.map((ref: { norma?: string; titolo?: string; url?: string }, i: number) => (
              <li key={i}>
                <strong>{ref.norma}</strong>
                {ref.titolo && <> — {ref.titolo}</>}
                {ref.url && (
                  <>
                    {" "}
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary"
                    >
                      Vedi norma
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bottom CTA */}
      <InlineCTA
        heading={article.cta?.heading}
        text={article.cta?.text}
        buttonText={article.cta?.buttonText}
        buttonUrl={article.cta?.buttonUrl}
        variant="banner"
      />
    </article>
  );
}

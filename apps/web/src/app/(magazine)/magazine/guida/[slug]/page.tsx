import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sanityFetch } from "@/lib/sanity/live";
import type { GuideFull } from "@/lib/sanity/types";
import { GUIDE_BY_SLUG_QUERY } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/image";
import { PortableTextRenderer } from "@/components/magazine/PortableTextRenderer";
import { Breadcrumbs } from "@/components/magazine/Breadcrumbs";
import { InlineCTA } from "@/components/magazine/InlineCTA";
import { JsonLd } from "@/components/magazine/JsonLd";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = await sanityFetch<GuideFull | null>({
    query: GUIDE_BY_SLUG_QUERY,
    params: { slug },
    tags: ["guide"], fallback: null,
  });

  if (!guide) return { title: "Guida non trovata" };

  return {
    title: guide.seo?.metaTitle || guide.title,
    description: guide.seo?.metaDescription || guide.excerpt,
    openGraph: {
      title: guide.seo?.metaTitle || guide.title,
      description: guide.seo?.metaDescription || guide.excerpt,
      type: "article",
      ...(guide.mainImage?.asset
        ? { images: [urlFor(guide.mainImage).width(1200).height(630).url()] }
        : {}),
    },
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = await sanityFetch<GuideFull | null>({
    query: GUIDE_BY_SLUG_QUERY,
    params: { slug },
    tags: ["guide"], fallback: null,
  });

  if (!guide) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: guide.title,
    description: guide.seo?.metaDescription || guide.excerpt,
    datePublished: guide.publishedAt,
    dateModified: guide.updatedAt || guide._updatedAt,
    ...(guide.author
      ? { author: { "@type": "Person", name: guide.author.name } }
      : {}),
    publisher: { "@type": "Organization", name: "MultaCheck" },
  };

  return (
    <article>
      <JsonLd data={jsonLd} />

      <Breadcrumbs
        items={[
          { label: "Magazine", href: "/magazine" },
          { label: "Guide", href: "/magazine" },
          ...(guide.category
            ? [
                {
                  label: guide.category.name,
                  href: `/magazine/categoria/${guide.category.slug?.current}`,
                },
              ]
            : []),
          { label: guide.title || "" },
        ]}
      />

      <header className="mb-8">
        <h1 className="text-3xl font-bold md:text-4xl">{guide.title}</h1>
        {guide.subtitle && (
          <p className="mt-2 text-xl text-muted">{guide.subtitle}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted">
          {guide.author && (
            <span className="font-medium text-foreground">
              {guide.author.name}
            </span>
          )}
          {guide.readingTime && <span>{guide.readingTime} min di lettura</span>}
          {guide.difficulty && (
            <span className="rounded-full border border-border px-2 py-0.5 text-xs">
              {guide.difficulty}
            </span>
          )}
          {guide.updatedAt && (
            <span>
              Aggiornato:{" "}
              {new Date(guide.updatedAt).toLocaleDateString("it-IT")}
            </span>
          )}
        </div>
      </header>

      {guide.mainImage?.asset && (
        <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-xl">
          <Image
            src={urlFor(guide.mainImage).width(1200).height(675).url()}
            alt={guide.mainImage.alt || guide.title || ""}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 800px"
          />
        </div>
      )}

      {guide.body && <PortableTextRenderer value={guide.body} />}

      {/* FAQ Section */}
      {guide.faqEntries && guide.faqEntries.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-bold">Domande frequenti</h2>
          <div className="space-y-4">
            {guide.faqEntries.map((faq) => (
              <details
                key={faq._id}
                className="rounded-lg border border-border p-4"
              >
                <summary className="cursor-pointer font-semibold">
                  {faq.question}
                </summary>
                <p className="mt-2 text-sm text-muted">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Related Guides */}
      {guide.relatedGuides && guide.relatedGuides.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold">Guide correlate</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {guide.relatedGuides.map((related) => (
              <Link
                key={related.slug?.current}
                href={`/magazine/guida/${related.slug?.current}`}
                className="rounded-lg border border-border p-4 transition hover:border-primary/30"
              >
                <h3 className="font-semibold">{related.title}</h3>
                {related.excerpt && (
                  <p className="mt-1 text-sm text-muted line-clamp-2">
                    {related.excerpt}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      <InlineCTA variant="banner" />
    </article>
  );
}

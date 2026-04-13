import type { Metadata } from "next";
import { sanityFetch } from "@/lib/sanity/live";
import type { FaqItem } from "@/lib/sanity/types";
import { FAQ_ENTRIES_QUERY } from "@/lib/sanity/queries";
import { Breadcrumbs } from "@/components/magazine/Breadcrumbs";
import { JsonLd } from "@/components/magazine/JsonLd";

export const metadata: Metadata = {
  title: "Domande frequenti sulle multe stradali",
  description:
    "Le risposte alle domande piu comuni su multe, contestazioni, scadenze e ricorsi.",
};

export default async function FAQPage() {
  const faqEntries = await sanityFetch<FaqItem[]>({
    query: FAQ_ENTRIES_QUERY,
    tags: ["faqEntry"], fallback: [],
  });

  // Group by category
  const grouped = faqEntries.reduce(
    (acc, faq) => {
      const cat = faq.category?.name || "Generale";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(faq);
      return acc;
    },
    {} as Record<string, typeof faqEntries>
  );

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqEntries.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <div>
      <JsonLd data={faqJsonLd} />
      <Breadcrumbs
        items={[
          { label: "Magazine", href: "/magazine" },
          { label: "Domande frequenti" },
        ]}
      />

      <h1 className="mb-8 text-3xl font-bold">Domande frequenti</h1>

      {Object.entries(grouped).map(([categoryName, faqs]) => (
        <section key={categoryName} className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">{categoryName}</h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq._id}
                className="rounded-lg border border-border p-4 transition hover:bg-card"
              >
                <summary className="cursor-pointer font-medium">
                  {faq.question}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

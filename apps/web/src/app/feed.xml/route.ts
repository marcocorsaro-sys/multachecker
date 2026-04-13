import { client } from "@/lib/sanity/client";
import { ARTICLES_QUERY } from "@/lib/sanity/queries";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://multacheck.it";

export async function GET() {
  // Skip Sanity fetch if projectId is not configured yet
  const articles = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    ? await client.fetch(ARTICLES_QUERY)
    : [];

  const items = (articles || [])
    .map(
      (a: {
        title: string;
        slug: { current: string };
        excerpt?: string;
        publishedAt?: string;
      }) => `
    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>${SITE_URL}/magazine/${a.slug.current}</link>
      <description><![CDATA[${a.excerpt || ""}]]></description>
      ${a.publishedAt ? `<pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>` : ""}
      <guid isPermaLink="true">${SITE_URL}/magazine/${a.slug.current}</guid>
    </item>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Multa Magazine</title>
    <link>${SITE_URL}/magazine</link>
    <description>Guide, articoli e news per capire e contestare le multe stradali.</description>
    <language>it</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

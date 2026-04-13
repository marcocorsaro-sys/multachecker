import { client } from "@/lib/sanity/client";
import { SITEMAP_QUERY } from "@/lib/sanity/queries";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://multacheck.it";

export async function GET() {
  // Skip Sanity fetch if projectId is not configured yet
  const data = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    ? await client.fetch(SITEMAP_QUERY)
    : null;

  const staticPages = [
    { url: "/", priority: 1.0 },
    { url: "/magazine", priority: 0.9 },
    { url: "/magazine/domande-frequenti", priority: 0.7 },
    { url: "/magazine/glossario", priority: 0.7 },
    { url: "/upload", priority: 0.9 },
    { url: "/prezzi", priority: 0.8 },
  ];

  const urls = [
    ...staticPages.map(
      (p) => `
    <url>
      <loc>${SITE_URL}${p.url}</loc>
      <priority>${p.priority}</priority>
    </url>`
    ),
    ...(data?.articles || []).map(
      (a: { slug: { current: string }; _updatedAt: string }) => `
    <url>
      <loc>${SITE_URL}/magazine/${a.slug.current}</loc>
      <lastmod>${a._updatedAt}</lastmod>
      <priority>0.8</priority>
    </url>`
    ),
    ...(data?.guides || []).map(
      (g: { slug: { current: string }; _updatedAt: string }) => `
    <url>
      <loc>${SITE_URL}/magazine/guida/${g.slug.current}</loc>
      <lastmod>${g._updatedAt}</lastmod>
      <priority>0.8</priority>
    </url>`
    ),
    ...(data?.categories || []).map(
      (c: { slug: { current: string }; _updatedAt: string }) => `
    <url>
      <loc>${SITE_URL}/magazine/categoria/${c.slug.current}</loc>
      <lastmod>${c._updatedAt}</lastmod>
      <priority>0.6</priority>
    </url>`
    ),
    ...(data?.glossaryTerms || []).map(
      (t: { slug: { current: string }; _updatedAt: string }) => `
    <url>
      <loc>${SITE_URL}/magazine/glossario/${t.slug.current}</loc>
      <lastmod>${t._updatedAt}</lastmod>
      <priority>0.5</priority>
    </url>`
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.join("")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

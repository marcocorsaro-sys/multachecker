import { defineQuery } from "next-sanity";

// --- Articles ---

export const ARTICLES_QUERY = defineQuery(`
  *[_type == "article" && defined(slug.current)] | order(publishedAt desc) [0...12] {
    _id, title, slug, excerpt, publishedAt, featured,
    mainImage { asset->{ _id, url }, alt },
    category->{ name, slug, infractionType },
    author->{ name, slug, image }
  }
`);

export const ARTICLE_BY_SLUG_QUERY = defineQuery(`
  *[_type == "article" && slug.current == $slug][0] {
    _id, title, slug, excerpt, publishedAt, _updatedAt,
    mainImage { asset->{ _id, url, metadata { dimensions, lqip } }, alt },
    body,
    category->{ name, slug, infractionType },
    author->{ name, slug, image, bio, role },
    relatedInfractions[]->{ name, slug, appType, avgContestabilityScore },
    legalReferences,
    cta,
    seo
  }
`);

export const FEATURED_ARTICLES_QUERY = defineQuery(`
  *[_type == "article" && featured == true] | order(publishedAt desc) [0...3] {
    _id, title, slug, excerpt, publishedAt,
    mainImage { asset->{ _id, url }, alt },
    category->{ name, slug }
  }
`);

// --- Categories ---

export const CATEGORIES_QUERY = defineQuery(`
  *[_type == "category"] | order(order asc) {
    _id, name, slug, description, icon, infractionType
  }
`);

export const ARTICLES_BY_CATEGORY_QUERY = defineQuery(`
  *[_type == "article" && category->slug.current == $categorySlug] | order(publishedAt desc) [$start...$end] {
    _id, title, slug, excerpt, publishedAt,
    mainImage { asset->{ _id, url }, alt },
    author->{ name, slug }
  }
`);

export const CATEGORY_BY_SLUG_QUERY = defineQuery(`
  *[_type == "category" && slug.current == $slug][0] {
    _id, name, slug, description, icon, infractionType, seo
  }
`);

// --- Guides ---

export const GUIDES_QUERY = defineQuery(`
  *[_type == "guide" && defined(slug.current)] | order(publishedAt desc) {
    _id, title, slug, subtitle, excerpt, readingTime, difficulty,
    mainImage { asset->{ _id, url }, alt },
    category->{ name, slug }
  }
`);

export const GUIDE_BY_SLUG_QUERY = defineQuery(`
  *[_type == "guide" && slug.current == $slug][0] {
    _id, title, slug, subtitle, excerpt, publishedAt, updatedAt, readingTime, difficulty, tableOfContents, _updatedAt,
    mainImage { asset->{ _id, url, metadata { dimensions, lqip } }, alt },
    body,
    category->{ name, slug },
    author->{ name, slug, image, bio, role },
    relatedGuides[]->{ title, slug, excerpt, readingTime },
    faqEntries[]->{ _id, question, answer },
    relatedInfractions[]->{ name, slug, appType },
    cta, seo
  }
`);

// --- FAQ ---

export const FAQ_ENTRIES_QUERY = defineQuery(`
  *[_type == "faqEntry"] | order(order asc) {
    _id, question, answer, category->{ name, slug }
  }
`);

// --- Glossary ---

export const GLOSSARY_TERMS_QUERY = defineQuery(`
  *[_type == "glossaryTerm"] | order(term asc) {
    _id, term, slug, definition, articoloCds
  }
`);

export const GLOSSARY_TERM_BY_SLUG_QUERY = defineQuery(`
  *[_type == "glossaryTerm" && slug.current == $slug][0] {
    _id, term, slug, definition, articoloCds,
    relatedArticles[]->{ _id, title, slug, excerpt }
  }
`);

// --- Site Settings ---

export const SITE_SETTINGS_QUERY = defineQuery(`
  *[_type == "siteSettings"][0] {
    title, description, logo, ogImage, newsletterCta
  }
`);

// --- Sitemap ---

export const SITEMAP_QUERY = defineQuery(`
  {
    "articles": *[_type == "article" && defined(slug.current)] { slug, publishedAt, _updatedAt },
    "guides": *[_type == "guide" && defined(slug.current)] { slug, _updatedAt },
    "categories": *[_type == "category" && defined(slug.current)] { slug, _updatedAt },
    "glossaryTerms": *[_type == "glossaryTerm" && defined(slug.current)] { slug, _updatedAt }
  }
`);

// --- Related content for app ---

export const ARTICLES_BY_INFRACTION_TYPE_QUERY = defineQuery(`
  *[_type == "article" && category->infractionType == $infractionType] | order(publishedAt desc) [0...3] {
    _id, title, slug, excerpt,
    mainImage { asset->{ _id, url }, alt }
  }
`);

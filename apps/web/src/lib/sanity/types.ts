/**
 * Manual Sanity query result types.
 * These will be replaced by auto-generated types from TypeGen
 * once the Sanity project is created.
 */

type SanityImage = unknown;

export type SanitySlug = { current: string };

export type ArticleListItem = {
  _id: string;
  title: string;
  slug: SanitySlug;
  excerpt?: string;
  publishedAt?: string;
  featured?: boolean;
  mainImage?: { asset?: { _id: string; url: string }; alt?: string };
  category?: { name: string; slug: SanitySlug; infractionType?: string };
  author?: { name: string; slug?: SanitySlug; image?: SanityImage };
};

export type ArticleFull = ArticleListItem & {
  _updatedAt?: string;
  body?: unknown[];
  legalReferences?: { norma?: string; titolo?: string; url?: string }[];
  relatedInfractions?: {
    name: string;
    slug: SanitySlug;
    appType?: string;
    avgContestabilityScore?: number;
  }[];
  cta?: {
    enabled?: boolean;
    heading?: string;
    text?: string;
    buttonText?: string;
    buttonUrl?: string;
    variant?: string;
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    metaImage?: SanityImage;
    keywords?: string[];
    noIndex?: boolean;
  };
};

export type CategoryItem = {
  _id: string;
  name: string;
  slug: SanitySlug;
  description?: string;
  icon?: string;
  infractionType?: string;
  seo?: ArticleFull["seo"];
};

export type GuideListItem = {
  _id: string;
  title: string;
  slug: SanitySlug;
  subtitle?: string;
  excerpt?: string;
  readingTime?: number;
  difficulty?: string;
  mainImage?: ArticleListItem["mainImage"];
  category?: { name: string; slug: SanitySlug };
};

export type GuideFull = GuideListItem & {
  _updatedAt?: string;
  publishedAt?: string;
  updatedAt?: string;
  tableOfContents?: boolean;
  body?: unknown[];
  author?: { name: string; slug?: SanitySlug; image?: SanityImage; bio?: string; role?: string };
  relatedGuides?: { title: string; slug: SanitySlug; excerpt?: string; readingTime?: number }[];
  faqEntries?: { _id: string; question: string; answer: string }[];
  relatedInfractions?: { name: string; slug: SanitySlug; appType?: string }[];
  cta?: ArticleFull["cta"];
  seo?: ArticleFull["seo"];
};

export type FaqItem = {
  _id: string;
  question: string;
  answer: string;
  category?: { name: string; slug: SanitySlug };
};

export type GlossaryTermItem = {
  _id: string;
  term: string;
  slug: SanitySlug;
  definition: string;
  articoloCds?: string;
};

export type GlossaryTermFull = GlossaryTermItem & {
  relatedArticles?: { _id: string; title: string; slug: SanitySlug; excerpt?: string }[];
};

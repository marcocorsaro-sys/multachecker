// Objects
import { seo } from "./objects/seo";
import { cta } from "./objects/cta";
import { legalReference } from "./objects/legalReference";
import { portableTextBlock } from "./objects/portableTextBlock";

// Documents
import { article } from "./documents/article";
import { guide } from "./documents/guide";
import { category } from "./documents/category";
import { author } from "./documents/author";
import { faqEntry } from "./documents/faqEntry";
import { glossaryTerm } from "./documents/glossaryTerm";
import { infraction } from "./documents/infraction";
import { siteSettings } from "./documents/siteSettings";

export const schemaTypes = [
  // Objects (must be defined before documents that reference them)
  seo,
  cta,
  legalReference,
  portableTextBlock,
  // Documents
  article,
  guide,
  category,
  author,
  faqEntry,
  glossaryTerm,
  infraction,
  siteSettings,
];

// Re-export individual schemas for direct imports
export {
  seo,
  cta,
  legalReference,
  portableTextBlock,
  article,
  guide,
  category,
  author,
  faqEntry,
  glossaryTerm,
  infraction,
  siteSettings,
};

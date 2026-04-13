import { defineType, defineField } from "sanity";

export const glossaryTerm = defineType({
  name: "glossaryTerm",
  title: "Termine glossario",
  type: "document",
  fields: [
    defineField({
      name: "term",
      title: "Termine",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "term" },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "definition",
      title: "Definizione",
      type: "text",
      rows: 6,
      validation: (r) => r.required(),
    }),
    defineField({
      name: "articoloCds",
      title: "Articolo CdS",
      type: "string",
      description: "Es: Art. 142",
    }),
    defineField({
      name: "relatedArticles",
      title: "Articoli correlati",
      type: "array",
      of: [{ type: "reference", to: [{ type: "article" }] }],
    }),
  ],
  preview: {
    select: { title: "term", subtitle: "articoloCds" },
  },
  orderings: [
    {
      title: "Alfabetico",
      name: "termAsc",
      by: [{ field: "term", direction: "asc" }],
    },
  ],
});

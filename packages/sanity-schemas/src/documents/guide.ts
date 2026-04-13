import { defineType, defineField } from "sanity";

export const guide = defineType({
  name: "guide",
  title: "Guida",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Titolo",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title" },
      validation: (r) => r.required(),
    }),
    defineField({ name: "subtitle", title: "Sottotitolo", type: "string" }),
    defineField({
      name: "excerpt",
      title: "Estratto",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "mainImage",
      title: "Immagine principale",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({ name: "alt", type: "string", title: "Alt text" }),
      ],
    }),
    defineField({ name: "body", title: "Corpo", type: "portableTextBlock" }),
    defineField({
      name: "tableOfContents",
      title: "Sommario automatico",
      type: "boolean",
      description: "Genera il sommario dai titoli H2/H3",
      initialValue: true,
    }),
    defineField({
      name: "category",
      type: "reference",
      to: [{ type: "category" }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: "relatedInfractions",
      type: "array",
      of: [{ type: "reference", to: [{ type: "infraction" }] }],
    }),
    defineField({
      name: "relatedGuides",
      title: "Guide correlate",
      type: "array",
      of: [{ type: "reference", to: [{ type: "guide" }] }],
    }),
    defineField({
      name: "faqEntries",
      title: "FAQ correlate",
      type: "array",
      of: [{ type: "reference", to: [{ type: "faqEntry" }] }],
    }),
    defineField({
      name: "author",
      type: "reference",
      to: [{ type: "author" }],
    }),
    defineField({ name: "publishedAt", type: "datetime" }),
    defineField({
      name: "updatedAt",
      title: "Ultimo aggiornamento",
      type: "datetime",
    }),
    defineField({
      name: "difficulty",
      title: "Difficolta",
      type: "string",
      options: { list: ["base", "intermedio", "avanzato"] },
    }),
    defineField({
      name: "readingTime",
      title: "Tempo di lettura (min)",
      type: "number",
    }),
    defineField({ name: "cta", type: "cta" }),
    defineField({ name: "seo", type: "seo" }),
  ],
  preview: {
    select: { title: "title", subtitle: "category.name", media: "mainImage" },
  },
});

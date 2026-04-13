import { defineType, defineField } from "sanity";

export const article = defineType({
  name: "article",
  title: "Articolo",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Titolo",
      type: "string",
      validation: (r) => r.required().max(100),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Estratto",
      type: "text",
      rows: 3,
      validation: (r) => r.max(200),
    }),
    defineField({
      name: "mainImage",
      title: "Immagine principale",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "string",
          validation: (r) => r.required(),
        }),
      ],
    }),
    defineField({
      name: "body",
      title: "Corpo",
      type: "portableTextBlock",
    }),
    defineField({
      name: "category",
      title: "Categoria",
      type: "reference",
      to: [{ type: "category" }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: "relatedInfractions",
      title: "Infrazioni correlate",
      type: "array",
      of: [{ type: "reference", to: [{ type: "infraction" }] }],
    }),
    defineField({
      name: "author",
      title: "Autore",
      type: "reference",
      to: [{ type: "author" }],
    }),
    defineField({
      name: "publishedAt",
      title: "Data pubblicazione",
      type: "datetime",
    }),
    defineField({
      name: "featured",
      title: "In evidenza",
      type: "boolean",
      initialValue: false,
    }),
    defineField({ name: "cta", title: "Call to Action", type: "cta" }),
    defineField({ name: "seo", title: "SEO", type: "seo" }),
    defineField({
      name: "legalReferences",
      title: "Riferimenti normativi",
      type: "array",
      of: [{ type: "legalReference" }],
    }),
  ],
  preview: {
    select: {
      title: "title",
      media: "mainImage",
      subtitle: "category.name",
    },
  },
  orderings: [
    {
      title: "Data pubblicazione",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
});

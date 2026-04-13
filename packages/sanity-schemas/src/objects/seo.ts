import { defineType, defineField } from "sanity";

export const seo = defineType({
  name: "seo",
  title: "SEO",
  type: "object",
  fields: [
    defineField({
      name: "metaTitle",
      title: "Meta Title",
      type: "string",
      description: "Sovrascrive il titolo. Max 60 caratteri.",
      validation: (r) => r.max(60),
    }),
    defineField({
      name: "metaDescription",
      title: "Meta Description",
      type: "text",
      rows: 3,
      description: "Max 155 caratteri.",
      validation: (r) => r.max(155),
    }),
    defineField({
      name: "metaImage",
      title: "Immagine OG",
      type: "image",
      description: "1200x630px consigliato",
    }),
    defineField({
      name: "keywords",
      title: "Keywords",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "noIndex",
      title: "No Index",
      type: "boolean",
      initialValue: false,
    }),
  ],
});

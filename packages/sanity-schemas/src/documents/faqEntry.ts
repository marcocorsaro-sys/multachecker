import { defineType, defineField } from "sanity";

export const faqEntry = defineType({
  name: "faqEntry",
  title: "FAQ",
  type: "document",
  fields: [
    defineField({
      name: "question",
      title: "Domanda",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "answer",
      title: "Risposta",
      type: "text",
      rows: 5,
      validation: (r) => r.required(),
    }),
    defineField({
      name: "category",
      title: "Categoria",
      type: "reference",
      to: [{ type: "category" }],
    }),
    defineField({
      name: "order",
      title: "Ordine",
      type: "number",
    }),
  ],
  preview: {
    select: { title: "question", subtitle: "category.name" },
  },
  orderings: [
    {
      title: "Ordine",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
});

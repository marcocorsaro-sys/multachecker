import { defineType, defineField } from "sanity";

export const category = defineType({
  name: "category",
  title: "Categoria",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Nome",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "name" },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "description",
      title: "Descrizione",
      type: "text",
    }),
    defineField({
      name: "icon",
      title: "Icona",
      type: "string",
      description: 'Nome icona Lucide (es: "gauge", "parking-circle")',
    }),
    defineField({
      name: "infractionType",
      title: "Tipo infrazione app",
      type: "string",
      options: {
        list: ["velocita", "sosta", "ztl", "semaforo", "telefono", "altro"],
      },
      description:
        "Collega alla tipologia usata nel motore di contestabilita",
    }),
    defineField({ name: "seo", type: "seo" }),
    defineField({ name: "order", title: "Ordine", type: "number" }),
  ],
  preview: {
    select: { title: "name", subtitle: "infractionType" },
  },
});

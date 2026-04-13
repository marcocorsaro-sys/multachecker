import { defineType, defineField } from "sanity";

export const author = defineType({
  name: "author",
  title: "Autore",
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
      name: "image",
      title: "Foto",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "bio",
      title: "Bio",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "role",
      title: "Ruolo",
      type: "string",
      description: "Es: Avvocato, Giornalista, Esperto CdS",
    }),
  ],
  preview: {
    select: { title: "name", media: "image", subtitle: "role" },
  },
});

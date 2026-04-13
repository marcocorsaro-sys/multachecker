import { defineType, defineField } from "sanity";

export const legalReference = defineType({
  name: "legalReference",
  title: "Riferimento normativo",
  type: "object",
  fields: [
    defineField({
      name: "norma",
      type: "string",
      description: "Es: Art. 201 D.Lgs. 285/1992",
    }),
    defineField({
      name: "titolo",
      type: "string",
    }),
    defineField({
      name: "url",
      type: "url",
      description: "Link a normattiva.it o simile",
    }),
  ],
  preview: {
    select: { title: "norma", subtitle: "titolo" },
  },
});

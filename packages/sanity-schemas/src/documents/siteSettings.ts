import { defineType, defineField } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Impostazioni sito",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Nome sito",
      type: "string",
      initialValue: "Multa Magazine",
    }),
    defineField({
      name: "description",
      title: "Descrizione",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
    }),
    defineField({
      name: "ogImage",
      title: "Immagine OG default",
      type: "image",
      description: "Usata quando un contenuto non ha immagine OG propria",
    }),
    defineField({
      name: "newsletterCta",
      title: "CTA Newsletter",
      type: "object",
      fields: [
        { name: "heading", type: "string", title: "Titolo" },
        { name: "text", type: "text", title: "Testo" },
      ],
    }),
  ],
});

import { defineType, defineArrayMember } from "sanity";

export const portableTextBlock = defineType({
  name: "portableTextBlock",
  title: "Contenuto",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [
        { title: "Normal", value: "normal" },
        { title: "H2", value: "h2" },
        { title: "H3", value: "h3" },
        { title: "H4", value: "h4" },
        { title: "Citazione", value: "blockquote" },
      ],
      marks: {
        decorators: [
          { title: "Bold", value: "strong" },
          { title: "Italic", value: "em" },
          { title: "Code", value: "code" },
        ],
        annotations: [
          {
            name: "link",
            type: "object",
            title: "Link esterno",
            fields: [
              { name: "href", type: "url", title: "URL" },
              {
                name: "blank",
                type: "boolean",
                title: "Apri in nuova tab",
                initialValue: true,
              },
            ],
          },
          {
            name: "internalLink",
            type: "object",
            title: "Link interno",
            fields: [
              {
                name: "reference",
                type: "reference",
                to: [
                  { type: "article" },
                  { type: "guide" },
                  { type: "glossaryTerm" },
                ],
              },
            ],
          },
          {
            name: "legalRef",
            type: "object",
            title: "Rif. normativo",
            fields: [
              { name: "norma", type: "string", title: "Articolo" },
              { name: "url", type: "url", title: "URL normattiva.it" },
            ],
          },
        ],
      },
    }),
    defineArrayMember({
      type: "image",
      options: { hotspot: true },
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alt text",
          validation: (r) => r.required(),
        },
        { name: "caption", type: "string", title: "Didascalia" },
      ],
    }),
    defineArrayMember({ type: "cta" }),
    defineArrayMember({
      name: "infoBox",
      type: "object",
      title: "Box informativo",
      fields: [
        { name: "title", type: "string", title: "Titolo" },
        { name: "content", type: "text", title: "Contenuto" },
        {
          name: "variant",
          type: "string",
          title: "Tipo",
          options: { list: ["info", "warning", "tip", "legal"] },
          initialValue: "info",
        },
      ],
      preview: {
        select: { title: "title", subtitle: "variant" },
      },
    }),
  ],
});

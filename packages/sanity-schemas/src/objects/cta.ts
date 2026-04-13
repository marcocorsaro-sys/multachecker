import { defineType, defineField } from "sanity";

export const cta = defineType({
  name: "cta",
  title: "Call to Action",
  type: "object",
  fields: [
    defineField({
      name: "enabled",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "heading",
      type: "string",
      initialValue: "Hai ricevuto una multa?",
    }),
    defineField({
      name: "text",
      type: "text",
      rows: 2,
      initialValue:
        "Scopri gratuitamente se puoi contestarla. Carica una foto del verbale.",
    }),
    defineField({
      name: "buttonText",
      type: "string",
      initialValue: "Analizza il tuo verbale",
    }),
    defineField({
      name: "buttonUrl",
      type: "string",
      initialValue: "/upload",
    }),
    defineField({
      name: "variant",
      type: "string",
      options: { list: ["inline", "banner", "sidebar"] },
      initialValue: "inline",
    }),
  ],
});

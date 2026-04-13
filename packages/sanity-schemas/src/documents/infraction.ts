import { defineType, defineField } from "sanity";

export const infraction = defineType({
  name: "infraction",
  title: "Tipo Infrazione",
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
    }),
    defineField({
      name: "appType",
      title: "Codice app",
      type: "string",
      options: {
        list: ["velocita", "sosta", "ztl", "semaforo", "telefono", "altro"],
      },
      description: "Deve corrispondere a tipo_infrazione in Supabase",
    }),
    defineField({
      name: "description",
      title: "Descrizione",
      type: "text",
    }),
    defineField({
      name: "articoloCds",
      title: "Articolo CdS",
      type: "string",
    }),
    defineField({
      name: "sanzioneMin",
      title: "Sanzione minima (EUR)",
      type: "number",
    }),
    defineField({
      name: "sanzioneMax",
      title: "Sanzione massima (EUR)",
      type: "number",
    }),
    defineField({
      name: "punti",
      title: "Punti patente",
      type: "number",
    }),
    defineField({
      name: "commonDefects",
      title: "Vizi comuni",
      type: "array",
      of: [{ type: "string" }],
      description: "Vizi frequentemente riscontrati per questo tipo",
    }),
    defineField({
      name: "avgContestabilityScore",
      title: "Score medio contestabilita",
      type: "number",
      description: "Calcolato dai dati reali. NON modificare.",
      readOnly: true,
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "appType" },
  },
});

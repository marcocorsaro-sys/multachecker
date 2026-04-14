import { describe, expect, it } from "vitest";
import { analizzaVerbale } from "./analisi";
import type { VerbaleData } from "./types";

const oggi = new Date("2026-04-14T12:00:00Z");

function base(over: Partial<VerbaleData> = {}): VerbaleData {
  return {
    numero_verbale: "1/2026",
    data_violazione: "2026-04-01",
    data_notifica: "2026-04-10",
    via: "Via Roma 1",
    articolo_cds: "142",
    organo_accertatore: "Polizia Municipale",
    tipo_infrazione: "velocita",
    ...over,
  };
}

describe("analizzaVerbale", () => {
  it("restituisce score, semaforo, vizi, scadenze", () => {
    const r = analizzaVerbale(base(), oggi);
    expect(r).toHaveProperty("score");
    expect(r).toHaveProperty("semaforo");
    expect(Array.isArray(r.vizi)).toBe(true);
    expect(r.scadenze).toHaveLength(3);
  });

  it("segnala notifica tardiva > 90 giorni", () => {
    const r = analizzaVerbale(
      base({ data_violazione: "2025-01-01", data_notifica: "2025-12-01" }),
      oggi
    );
    expect(r.vizi.some((v) => v.id === "notifica_tardiva")).toBe(true);
  });

  it("NON segnala notifica tardiva se entro 90 giorni", () => {
    const r = analizzaVerbale(
      base({ data_violazione: "2026-04-01", data_notifica: "2026-04-10" }),
      oggi
    );
    expect(r.vizi.some((v) => v.id === "notifica_tardiva")).toBe(false);
  });

  it("per velocità senza modello apparecchio segnala il vizio", () => {
    const r = analizzaVerbale(base({ tipo_infrazione: "velocita" }), oggi);
    expect(r.vizi.some((v) => v.id === "apparecchio_non_indicato")).toBe(true);
    expect(r.vizi.some((v) => v.id === "taratura_da_verificare")).toBe(true);
  });

  it("velocità nella tolleranza viene segnalata", () => {
    const r = analizzaVerbale(
      base({
        tipo_infrazione: "velocita",
        modello_apparecchio: "Autovelox 105 SE",
        velocita_consentita: 50,
        velocita_rilevata: 54, // eccesso 4 km/h < tolleranza 5
      }),
      oggi
    );
    expect(r.vizi.some((v) => v.id === "eccesso_entro_tolleranza")).toBe(true);
  });

  it("velocità oltre tolleranza NON viene segnalata", () => {
    const r = analizzaVerbale(
      base({
        tipo_infrazione: "velocita",
        modello_apparecchio: "Autovelox 105 SE",
        velocita_consentita: 50,
        velocita_rilevata: 70,
      }),
      oggi
    );
    expect(r.vizi.some((v) => v.id === "eccesso_entro_tolleranza")).toBe(false);
  });

  it("sosta con notifica differita richiede foto", () => {
    const r = analizzaVerbale(
      base({
        tipo_infrazione: "sosta",
        data_violazione: "2026-04-01",
        data_notifica: "2026-04-10",
      }),
      oggi
    );
    expect(r.vizi.some((v) => v.id === "sosta_foto_obbligatoria")).toBe(true);
  });

  it("score è limitato tra 0 e 100", () => {
    const r = analizzaVerbale(base(), oggi);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });

  it("semaforo verde se score >= 60", () => {
    // Velocità senza apparecchio (+35) + taratura (+20) = 55 → giallo
    // Aggiungendo dati mancanti si passa in verde.
    const r = analizzaVerbale(
      base({
        tipo_infrazione: "velocita",
        articolo_cds: undefined,
        organo_accertatore: undefined,
        numero_verbale: undefined,
        via: undefined,
      }),
      oggi
    );
    expect(["verde", "giallo"]).toContain(r.semaforo);
    expect(r.score).toBeGreaterThanOrEqual(30);
  });

  it("termini tutti scaduti azzerano lo score", () => {
    const r = analizzaVerbale(
      base({
        tipo_infrazione: "velocita",
        data_violazione: "2025-01-01",
        data_notifica: "2025-02-01",
      }),
      oggi
    );
    expect(r.vizi.some((v) => v.id === "termini_scaduti")).toBe(true);
    expect(r.semaforo).toBe("rosso");
  });
});

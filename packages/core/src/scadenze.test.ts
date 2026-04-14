import { describe, expect, it } from "vitest";
import { calcolaScadenze } from "./scadenze";

describe("calcolaScadenze", () => {
  const oggi = new Date("2026-04-14T12:00:00Z");

  it("restituisce tre scadenze (ridotto, prefetto, gdp)", () => {
    const s = calcolaScadenze("2026-04-10", oggi);
    expect(s).toHaveLength(3);
    expect(s.map((x) => x.tipo)).toEqual([
      "pagamento_ridotto",
      "ricorso_prefetto",
      "ricorso_gdp",
    ]);
  });

  it("calcola correttamente i giorni rimanenti", () => {
    const s = calcolaScadenze("2026-04-10", oggi);
    const pagamento = s.find((x) => x.tipo === "pagamento_ridotto")!;
    // Notifica 10/04 + 5 giorni = 15/04. Oggi è 14/04 → 1 giorno.
    expect(pagamento.data_limite).toBe("2026-04-15");
    expect(pagamento.giorni_rimanenti).toBe(1);
  });

  it("blocca i giorni rimanenti a 0 se la scadenza è passata", () => {
    const s = calcolaScadenze("2026-01-01", oggi);
    const pagamento = s.find((x) => x.tipo === "pagamento_ridotto")!;
    expect(pagamento.giorni_rimanenti).toBe(0);
  });

  it("il ricorso al Prefetto è a 60 giorni, il GdP a 30", () => {
    const s = calcolaScadenze("2026-04-10", oggi);
    const prefetto = s.find((x) => x.tipo === "ricorso_prefetto")!;
    const gdp = s.find((x) => x.tipo === "ricorso_gdp")!;
    expect(prefetto.data_limite).toBe("2026-06-09");
    expect(gdp.data_limite).toBe("2026-05-10");
  });
});

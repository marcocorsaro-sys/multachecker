import { addDays, differenceInCalendarDays, parseISO } from "date-fns";
import type { Scadenza } from "./types";

/**
 * Calcola le scadenze a partire dalla data di notifica del verbale.
 * - Pagamento ridotto: 5 giorni dalla notifica
 * - Ricorso al Prefetto: 60 giorni dalla notifica
 * - Ricorso al GdP: 30 giorni dalla notifica
 */
export function calcolaScadenze(
  dataNotifica: string,
  oggi?: Date
): Scadenza[] {
  const notifica = parseISO(dataNotifica);
  const now = oggi ?? new Date();

  const scadenze: { tipo: Scadenza["tipo"]; giorni: number }[] = [
    { tipo: "pagamento_ridotto", giorni: 5 },
    { tipo: "ricorso_prefetto", giorni: 60 },
    { tipo: "ricorso_gdp", giorni: 30 },
  ];

  return scadenze.map(({ tipo, giorni }) => {
    const dataLimite = addDays(notifica, giorni);
    const giorniRimanenti = differenceInCalendarDays(dataLimite, now);

    return {
      tipo,
      data_limite: dataLimite.toISOString().split("T")[0],
      giorni_rimanenti: Math.max(0, giorniRimanenti),
    };
  });
}

import Stripe from "stripe";

/**
 * Istanza globale del client Stripe (server-side).
 * La chiave segreta viene letta da env — STRIPE_SECRET_KEY.
 *
 * Pinning della API version: importante per evitare breaking change
 * silenziosi quando Stripe rilascia nuove versioni.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-03-25.dahlia",
  typescript: true,
});

/**
 * Prezzo del piano "Ricorso PDF" in centesimi (€19.00).
 * Hardcoded per ora — in futuro spostare in env / Sanity.
 */
export const RICORSO_PRICE_CENTS = 1900;
export const RICORSO_CURRENCY = "eur";
export const RICORSO_PLAN_NAME = "Ricorso PDF";
export const RICORSO_PLAN_DESC =
  "Generazione del ricorso al Prefetto in PDF, redatto da Claude in base ai vizi rilevati sul tuo verbale.";

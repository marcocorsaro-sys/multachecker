import Stripe from "stripe";

/**
 * Lazy-initialized Stripe client.
 *
 * IMPORTANTE: il costruttore di Stripe valida la API key e fa throw
 * se è vuota o malformata. Se istanziamo a module-level, l'errore
 * viene lanciato durante "collect page data" di Next.js build,
 * facendo fallire la build su Vercel quando le env var non sono
 * ancora state aggiunte. La lazy init garantisce che la build passi
 * sempre — l'errore arriverà solo a runtime, sulla prima chiamata.
 */
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;

  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error(
      "STRIPE_SECRET_KEY non è configurata. Aggiungila nelle env var del progetto."
    );
  }

  _stripe = new Stripe(apiKey, {
    apiVersion: "2026-03-25.dahlia",
    typescript: true,
  });

  return _stripe;
}

/**
 * Prezzo del piano "Ricorso PDF" in centesimi (€19.00).
 * Hardcoded per ora — in futuro spostare in env / Sanity.
 */
export const RICORSO_PRICE_CENTS = 1900;
export const RICORSO_CURRENCY = "eur";
export const RICORSO_PLAN_NAME = "Ricorso PDF";
export const RICORSO_PLAN_DESC =
  "Generazione del ricorso al Prefetto in PDF, redatto da Claude in base ai vizi rilevati sul tuo verbale.";

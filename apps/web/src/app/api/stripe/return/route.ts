import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";

export const runtime = "nodejs";

/**
 * Stripe Checkout success URL handler.
 *
 * Recupera la sessione, verifica il pagamento, marca la pratica come
 * pagata (anche se il webhook non è ancora arrivato) e redirige
 * l'utente alla pagina del ricorso.
 *
 * Questa rotta è una belt-and-suspenders rispetto al webhook:
 * permette all'utente di vedere subito il ricorso anche se il webhook
 * è in ritardo.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");
  const origin = url.origin;

  if (!sessionId) {
    return NextResponse.redirect(`${origin}/pratiche?error=missing_session`);
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.redirect(
        `${origin}/pratiche?error=payment_not_completed`
      );
    }

    const praticaId = session.metadata?.pratica_id;
    if (!praticaId) {
      return NextResponse.redirect(
        `${origin}/pratiche?error=missing_metadata`
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(
        `${origin}/login?redirectTo=/pratiche/${praticaId}/ricorso`
      );
    }

    // Aggiorna la pratica se non è già stata aggiornata dal webhook.
    // Idempotente: usa COALESCE-like logic tramite check esistenza.
    const { data: existing } = await supabase
      .from("pratiche")
      .select("id, pagato_at, user_id")
      .eq("id", praticaId)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.redirect(`${origin}/pratiche?error=not_found`);
    }

    if (!existing.pagato_at) {
      const amountCents = session.amount_total ?? 0;
      await supabase
        .from("pratiche")
        .update({
          pagato_at: new Date().toISOString(),
          importo_pagato: amountCents / 100,
          stripe_payment_intent_id:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : (session.payment_intent?.id ?? null),
          piano: "ricorso_pdf",
        })
        .eq("id", praticaId);
    }

    // Redirige direttamente alla pagina ricorso, che poi triggera la
    // generazione se non è già stata fatta.
    return NextResponse.redirect(
      `${origin}/pratiche/${praticaId}/ricorso?just_paid=1`
    );
  } catch (e) {
    console.error("[/api/stripe/return]", e);
    return NextResponse.redirect(
      `${origin}/pratiche?error=${encodeURIComponent((e as Error).message)}`
    );
  }
}

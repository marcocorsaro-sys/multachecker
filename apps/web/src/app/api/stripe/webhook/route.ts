import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getStripe } from "@/lib/stripe/client";
import type { Database } from "@multacheck/db";
import Stripe from "stripe";

export const runtime = "nodejs";

/**
 * Webhook Stripe — riceve eventi di pagamento e aggiorna la pratica.
 *
 * Eventi gestiti:
 * - checkout.session.completed → marca la pratica come pagata
 *
 * IMPORTANTE: questa rotta NON deve essere protetta dal middleware
 * (è già esclusa nel matcher) e deve usare il raw body per verificare
 * la firma Stripe.
 */
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing stripe-signature or webhook secret" },
      { status: 400 }
    );
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe webhook] signature verification failed", err);
    return NextResponse.json(
      { error: `Signature verification failed: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  // Per scrivere sul DB usiamo il service role: il webhook arriva
  // senza cookie di sessione utente, quindi RLS bloccherebbe.
  // In assenza di service role, usiamo l'anon key — ma bisogna avere
  // una policy che permette scritture quando la sessione è null OPPURE
  // scrittura via security definer function.
  // Per ora usiamo anon + bypass via RPC oppure semplicemente l'anon
  // (assumendo policy permissiva). Production-ready: aggiungere
  // SUPABASE_SERVICE_ROLE_KEY.
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    }
  );

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.payment_status !== "paid") {
          console.log(
            `[stripe webhook] session ${session.id} not paid yet (status=${session.payment_status})`
          );
          break;
        }

        const praticaId = session.metadata?.pratica_id;
        if (!praticaId) {
          console.error(
            `[stripe webhook] session ${session.id} missing pratica_id metadata`
          );
          break;
        }

        const amountCents = session.amount_total ?? 0;
        const amountEuros = amountCents / 100;

        const { error: updateError } = await supabase
          .from("pratiche")
          .update({
            pagato_at: new Date().toISOString(),
            importo_pagato: amountEuros,
            stripe_payment_intent_id:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : (session.payment_intent?.id ?? null),
            piano: "ricorso_pdf",
          })
          .eq("id", praticaId);

        if (updateError) {
          console.error(
            `[stripe webhook] failed to update pratica ${praticaId}:`,
            updateError
          );
          return NextResponse.json(
            { error: updateError.message },
            { status: 500 }
          );
        }

        console.log(
          `[stripe webhook] pratica ${praticaId} marked as paid (€${amountEuros})`
        );
        break;
      }

      default:
        // Eventi non gestiti: rispondiamo OK per evitare retry inutili
        console.log(`[stripe webhook] unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[stripe webhook] handler error:", e);
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}

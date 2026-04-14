import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  stripe,
  RICORSO_PRICE_CENTS,
  RICORSO_CURRENCY,
  RICORSO_PLAN_NAME,
  RICORSO_PLAN_DESC,
} from "@/lib/stripe/client";

export const runtime = "nodejs";

/**
 * Crea una Stripe Checkout Session per sbloccare la generazione del
 * ricorso su una pratica specifica.
 *
 * Body: { pratica_id: string }
 * Response: { url: string }
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const body = (await req.json()) as { pratica_id?: string };
    const praticaId = body.pratica_id;

    if (!praticaId) {
      return NextResponse.json(
        { error: "pratica_id mancante" },
        { status: 400 }
      );
    }

    // Verifica che la pratica esista e appartenga all'utente
    const { data: pratica, error } = await supabase
      .from("pratiche")
      .select("id, user_id, pagato_at, verbale_id")
      .eq("id", praticaId)
      .eq("user_id", user.id)
      .single();

    if (error || !pratica) {
      return NextResponse.json(
        { error: "Pratica non trovata" },
        { status: 404 }
      );
    }

    if (pratica.pagato_at) {
      return NextResponse.json(
        { error: "Pratica già pagata" },
        { status: 409 }
      );
    }

    // Origin per success/cancel URL
    const origin =
      req.headers.get("origin") ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: user.email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: RICORSO_CURRENCY,
            unit_amount: RICORSO_PRICE_CENTS,
            product_data: {
              name: RICORSO_PLAN_NAME,
              description: RICORSO_PLAN_DESC,
            },
          },
        },
      ],
      metadata: {
        pratica_id: pratica.id,
        user_id: user.id,
        verbale_id: pratica.verbale_id,
      },
      success_url: `${origin}/api/stripe/return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/verbali/${pratica.verbale_id}?stripe_cancelled=1`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe non ha restituito un URL" },
        { status: 502 }
      );
    }

    // Salviamo l'ID della sessione per riferimento
    await supabase
      .from("pratiche")
      .update({
        stripe_checkout_session_id: session.id,
        stato: "pagamento",
      })
      .eq("id", pratica.id);

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[/api/stripe/checkout]", e);
    return NextResponse.json(
      { error: (e as Error).message ?? "Errore interno" },
      { status: 500 }
    );
  }
}

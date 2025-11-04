import Stripe from "stripe";
import { processStripeEvent } from "@/backend/stripe/stripe-sync";
import { env } from "@/env";
import { after, NextRequest, NextResponse } from "next/server";
import { logger } from "@/backend/lib/log";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) return NextResponse.json({}, { status: 400 });

  if (typeof signature !== "string") {
    throw new Error("[STRIPE HOOK] Signature header isn't a string");
  }

  try {
    const event = await Stripe.webhooks.constructEventAsync(
      body,
      signature,
      env.STRIPE_SIGNING_SECRET
    );

    after(async () => await processStripeEvent(event));

    return Response.json({ success: true });
  } catch (err) {
    logger.error(`[STRIPE HOOK] Signing failed`, { error: err });
    return Response.json(
      { success: false, error: "Signing Failed" },
      { status: 400 }
    );
  }
}

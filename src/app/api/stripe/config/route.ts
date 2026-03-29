import { NextResponse } from "next/server";

import { isStripeCheckoutConfigured } from "../../../../lib/stripeEnv";

export async function GET() {
  return NextResponse.json({
    checkoutEnabled: isStripeCheckoutConfigured(),
  });
}

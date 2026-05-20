import Stripe from "stripe";

const globalForStripe = globalThis as unknown as {
  stripe: Stripe | undefined;
};

function createStripeClient(): Stripe {
  // In production the key is always set; returning an empty-key client at
  // build time is safe — no API calls are made until request time.
  return new Stripe(process.env.STRIPE_SECRET_KEY ?? "");
}

export const stripe = globalForStripe.stripe ?? createStripeClient();

if (process.env.NODE_ENV !== "production") {
  globalForStripe.stripe = stripe;
}

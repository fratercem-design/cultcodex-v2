import Stripe from "stripe";

const globalForStripe = globalThis as unknown as {
  stripe: Stripe | undefined;
};

/**
 * Returns the Stripe client, creating it on first call.
 * Lazy initialization prevents build-time failures when STRIPE_SECRET_KEY
 * is not available in the build environment (module is imported but no
 * Stripe client is needed until an actual request arrives).
 */
export function getStripe(): Stripe {
  if (globalForStripe.stripe) return globalForStripe.stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY environment variable is not set");
  const client = new Stripe(key);
  if (process.env.NODE_ENV !== "production") {
    globalForStripe.stripe = client;
  }
  return client;
}

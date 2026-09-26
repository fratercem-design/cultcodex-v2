// Analytics placeholders for the Stream Alchemist funnel. Events go to Google
// Analytics when the visitor has accepted cookies (the site's CookieConsent
// only loads gtag after consent), and are also dispatched as a DOM event so
// another tool (PostHog, Plausible) can be attached later without touching
// call sites.

export type StreamAlchemistEvent =
  | "sa_landing_view"
  | "sa_demo_used"
  | "sa_analysis_started"
  | "sa_export_clicked"
  | "sa_checkout_clicked";

type Props = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (command: "event", name: string, params?: Props) => void;
  }
}

export function track(event: StreamAlchemistEvent, props: Props = {}): void {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", event, props);
    window.dispatchEvent(new CustomEvent("stream-alchemist:track", { detail: { event, props } }));
    if (process.env.NODE_ENV !== "production") console.debug("[stream-alchemist]", event, props);
  } catch {
    // Analytics must never break the page.
  }
}

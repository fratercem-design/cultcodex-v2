import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

// The pack store must only say "No packs available" when the API actually
// returned an empty list. While loading, and after a failed fetch (a cold
// database answers the first request with an error and the second one fine),
// it must say something else — the audit's "empty store" was this bug.

vi.mock("@/components/cards/pack-opener", () => ({ PackOpener: () => null }));

// The store renders <CreditBundlesStrip /> under the wallet, and that component
// calls useRouter(). RTL mounts the tree with no App Router context, so the hook
// throws and every test in this file fails. Stub only the hook, via
// importOriginal, so the rest of next/navigation keeps working and the strip
// still renders -- these tests assert on the page's real composition, and the
// strip adds no role="status"/"alert"/"Retry" of its own to collide with them.
// Identity is stable (vi.hoisted) so the router is safe to use in effect deps.
const nav = vi.hoisted(() => ({
  router: {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  },
}));
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => nav.router,
}));

import PackStorePage from "./page";

const PACK = {
  id: "p1", slug: "signal-archive", name: "Signal Archive Pack", description: null, flavourText: null,
  cost: 50, cardCount: 5, artTheme: "terminal",
  weightStatic: 55, weightSignal: 28, weightTransmission: 12, weightAnomaly: 4,
  weightOracle: 1, weightLegendary: 0, weightMythic: 0, weightForbidden: 0,
  _count: { packCards: 204 },
};
const WALLET = { signalCredits: 120, lastDailyClaimAt: null };

function ok(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}
function fail(): Response {
  return { ok: false, status: 500, json: async () => ({ error: "boom" }) } as unknown as Response;
}

/** Route fetch by URL; each queue entry is consumed once per call. */
function mockFetch(packsQueue: Response[], statsResponse: Response = ok(WALLET)) {
  const spy = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/cards/packs")) return packsQueue.shift() ?? fail();
    if (url.includes("/api/cards/stats")) return statsResponse;
    return fail();
  });
  vi.stubGlobal("fetch", spy);
  return spy;
}

describe("PackStorePage store states", () => {
  beforeEach(() => vi.useRealTimers());
  afterEach(() => vi.unstubAllGlobals());

  it("shows a loading line, never 'No packs', while the API is pending", () => {
    mockFetch([new Promise(() => {}) as unknown as Response]);
    render(<PackStorePage />);
    expect(screen.getByRole("status")).toHaveTextContent("Opening the vault");
    expect(screen.queryByText(/No packs available/)).toBeNull();
  });

  it("renders packs on success", async () => {
    mockFetch([ok([PACK])]);
    render(<PackStorePage />);
    expect(await screen.findByText("Signal Archive Pack")).toBeInTheDocument();
    expect(screen.queryByText(/No packs available/)).toBeNull();
  });

  it("retries once, so a cold-start failure followed by success shows packs", async () => {
    const spy = mockFetch([fail(), ok([PACK])]);
    render(<PackStorePage />);
    expect(await screen.findByText("Signal Archive Pack")).toBeInTheDocument();
    const packCalls = spy.mock.calls.filter(([u]) => String(u).includes("/api/cards/packs"));
    expect(packCalls).toHaveLength(2);
    expect(screen.queryByText(/No packs available/)).toBeNull();
  });

  it("shows an error with a Retry control when both attempts fail, and Retry recovers", async () => {
    mockFetch([fail(), fail(), ok([PACK])]);
    render(<PackStorePage />);
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("The vault didn't answer");
    expect(screen.queryByText(/No packs available/)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("Signal Archive Pack")).toBeInTheDocument();
  });

  it("says 'No packs available' only for a genuinely empty list", async () => {
    mockFetch([ok([])]);
    render(<PackStorePage />);
    await waitFor(() => expect(screen.getByText(/No packs available/)).toBeInTheDocument());
  });

  it("does not blank the store when only the wallet call fails", async () => {
    mockFetch([ok([PACK])], fail());
    render(<PackStorePage />);
    expect(await screen.findByText("Signal Archive Pack")).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { EpisodeViewerProvider, ViewerFavoriteButton } from "../episode-viewer";
import { SaveSignalButton } from "../../codex/save-signal-button";

// The app mounts no next-auth <SessionProvider>, so next-auth's useSession()
// throws during render. On the cached episode and topic pages that took the
// whole route down with a 500. These components must read the session via
// useSessionLite instead. Server-rendering them bare reproduces the crash.

vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response("{}"))));

describe("per-viewer widgets render without a SessionProvider", () => {
  it("EpisodeViewerProvider", () => {
    expect(() =>
      renderToString(
        <EpisodeViewerProvider slug="ep">
          <ViewerFavoriteButton slug="ep" initialCount={3} />
        </EpisodeViewerProvider>
      )
    ).not.toThrow();
  });

  it("SaveSignalButton", () => {
    expect(() => renderToString(<SaveSignalButton slug="topic" initialCount={2} />)).not.toThrow();
  });
});

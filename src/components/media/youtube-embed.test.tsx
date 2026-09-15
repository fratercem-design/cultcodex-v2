import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { YouTubeEmbed } from "./youtube-embed";

describe("YouTubeEmbed", () => {
  beforeEach(() => {
    document.head.querySelectorAll('script[src="https://www.youtube.com/iframe_api"]').forEach((node) => node.remove());
    window.YT = undefined as unknown as typeof window.YT;
    window.onYouTubeIframeAPIReady = undefined;
  });

  it("does not contact YouTube until the visitor presses play", async () => {
    const player = vi.fn();
    render(<YouTubeEmbed videoId="abc123" title="Archive episode" startSeconds={42} />);

    expect(document.querySelector('script[src*="youtube.com"]')).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Play Archive episode" }));
    expect(document.querySelector('script[src="https://www.youtube.com/iframe_api"]')).not.toBeNull();

    window.YT = { Player: player as unknown as typeof window.YT.Player };
    window.onYouTubeIframeAPIReady?.();

    await waitFor(() => expect(player).toHaveBeenCalled());
    expect(player.mock.calls[0][1]).toMatchObject({
      videoId: "abc123",
      host: "https://www.youtube-nocookie.com",
      playerVars: { autoplay: 1, start: 42 },
    });
  });
});

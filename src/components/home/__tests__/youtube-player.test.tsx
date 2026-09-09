import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { YouTubePlayer } from "../youtube-player";

const PROPS = {
  videoId: "xlpOB2eXM1o",
  playlistId: "PLvfZtruvrMTufahIz2Mx9GI_4SJP-ySMw",
  title: "Cult of Psyche — Signal Stream",
};

describe("YouTubePlayer", () => {
  it("requests nothing from YouTube before the visitor presses play", () => {
    const { container } = render(<YouTubePlayer {...PROPS} />);
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByText(/loads from youtube/i)).toBeInTheDocument();
  });

  it("mounts a privacy-enhanced embed only after the play control is used", () => {
    const { container } = render(<YouTubePlayer {...PROPS} />);

    fireEvent.click(screen.getByRole("button", { name: /signal stream/i }));

    const iframe = container.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute("src")).toContain("youtube-nocookie.com/embed/");
    expect(iframe?.getAttribute("src")).not.toContain("//www.youtube.com/");
  });
});

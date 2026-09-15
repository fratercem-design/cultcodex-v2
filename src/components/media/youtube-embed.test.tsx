import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { YouTubeEmbed } from "./youtube-embed";

describe("YouTubeEmbed", () => {
  it("does not contact YouTube until the visitor presses play", () => {
    const { container } = render(
      <YouTubeEmbed videoId="abc123" title="Archive episode" startSeconds={42} />,
    );

    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByText(/loads from youtube/i)).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Play Archive episode" }));

    const frame = screen.getByTitle("Archive episode");
    expect(frame).toHaveAttribute(
      "src",
      expect.stringContaining("https://www.youtube-nocookie.com/embed/abc123"),
    );
    expect(frame).toHaveAttribute("src", expect.stringContaining("start=42"));
  });
});

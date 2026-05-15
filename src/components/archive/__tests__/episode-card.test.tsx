import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EpisodeCard } from "../episode-card";

const mockEpisode = {
  id: "1",
  title: "Welcome to the Cult",
  slug: "welcome-to-the-cult",
  episodeNumber: 1,
  airDate: new Date("2024-01-15"),
  summaryShort: "The inaugural episode.",
  status: "published" as const,
  thumbnailUrl: null,
  hasVideo: true,
  segmentCount: 42,
  guestNames: ["Dr. Arcana"],
  topicNames: ["Consciousness", "Tarot"],
};

describe("EpisodeCard", () => {
  it("renders episode title", () => {
    render(<EpisodeCard episode={mockEpisode} />);
    expect(screen.getByText("Welcome to the Cult")).toBeInTheDocument();
  });

  it("renders episode number", () => {
    render(<EpisodeCard episode={mockEpisode} />);
    expect(screen.getByText(/EP\.001/)).toBeInTheDocument();
  });

  it("renders guest names", () => {
    render(<EpisodeCard episode={mockEpisode} />);
    expect(screen.getByText("Dr. Arcana")).toBeInTheDocument();
  });

  it("links to episode detail", () => {
    render(<EpisodeCard episode={mockEpisode} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/episodes/welcome-to-the-cult");
  });
});

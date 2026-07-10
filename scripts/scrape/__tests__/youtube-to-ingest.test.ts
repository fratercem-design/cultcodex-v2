import { describe, it, expect } from "vitest";
import { transformVideo } from "../youtube-to-ingest";
import type { YouTubeVideo } from "../types";

const sampleVideo: YouTubeVideo = {
  videoId: "abc123",
  title: "Friday Night with Psyche-- White Claws, Open Panel, Tarot and Cats",
  description:
    "https://streamyard.com/pal/d/6114733978943488\nSupport: http://psycheawakens.com",
  publishedAt: "2025-09-06T02:30:00Z",
  duration: "5:05:03",
  thumbnailUrl: "https://i.ytimg.com/vi/abc123/hqdefault.jpg",
  viewCount: 1113,
  channelTitle: "Cult of Psyche",
};

describe("transformVideo", () => {
  it("maps YouTube video to EpisodeRow format", () => {
    const result = transformVideo(sampleVideo, 42);

    expect(result.title).toBe(
      "Friday Night with Psyche-- White Claws, Open Panel, Tarot and Cats",
    );
    expect(result.episodeNumber).toBe(42);
    expect(result.airDate).toBe("2025-09-06");
    expect(result.duration).toBe("5:05:03");
    expect(result.youtubeVideoId).toBe("abc123");
    expect(result.thumbnailUrl).toBe(
      "https://i.ytimg.com/vi/abc123/hqdefault.jpg",
    );
    expect(result.guests).toEqual([]);
    expect(result.topics).toEqual([]);
    expect(result.lore).toEqual([]);
  });

  it("uses description as summaryShort if not just URLs", () => {
    const video: YouTubeVideo = {
      ...sampleVideo,
      description: "Tonight we discuss the tarot and cosmic consciousness",
    };
    const result = transformVideo(video, 1);
    expect(result.summaryShort).toBe(
      "Tonight we discuss the tarot and cosmic consciousness",
    );
  });

  it("sets summaryShort to undefined if description is only URLs", () => {
    const result = transformVideo(sampleVideo, 1);
    expect(result.summaryShort).toBeUndefined();
  });

  it("handles empty description", () => {
    const video: YouTubeVideo = { ...sampleVideo, description: "" };
    const result = transformVideo(video, 1);
    expect(result.summaryShort).toBeUndefined();
  });

  it("strips StreamYard promo prose, keeping real content", () => {
    const video: YouTubeVideo = {
      ...sampleVideo,
      description:
        "🎙️ New to streaming or looking to level up? Check out StreamYard and get $10 discount! 😍\nTonight we discuss the tarot and cosmic consciousness",
    };
    const result = transformVideo(video, 1);
    expect(result.summaryShort).toBe("Tonight we discuss the tarot and cosmic consciousness");
  });

  it("drops summaries that are pure promo boilerplate", () => {
    const video: YouTubeVideo = {
      ...sampleVideo,
      description:
        "🎙️ New to streaming or looking to level up? Check out StreamYard and get $10 discount! 😍",
    };
    const result = transformVideo(video, 1);
    expect(result.summaryShort).toBeUndefined();
  });
});

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CultCodex — The Living Archive",
    short_name: "CultCodex",
    description:
      "The definitive archive of Cult of Psyche. Transcripts, guest profiles, psychological patterns, and more.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      {
        src: "/favicon.jpg",
        sizes: "any",
        type: "image/jpeg",
      },
    ],
    categories: ["entertainment", "education"],
  };
}

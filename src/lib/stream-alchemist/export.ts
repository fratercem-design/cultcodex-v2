import { formatTime } from "./transcript";
import type { Clip } from "./types";

const CSV_COLUMNS: Array<[string, (c: Clip) => string]> = [
  ["rank", (c) => String(c.rank)],
  ["score", (c) => String(c.score)],
  ["start", (c) => formatTime(c.start)],
  ["end", (c) => formatTime(c.end)],
  ["title", (c) => c.title],
  ["hook", (c) => c.hook],
  ["shorts_description", (c) => c.shortsDescription],
  ["tiktok_caption", (c) => c.tiktokCaption],
  ["thumbnail_text", (c) => c.thumbnailText.join(" | ")],
  ["hashtags", (c) => c.hashtags.join(" ")],
  ["why", (c) => c.why.join("; ")],
  ["excerpt", (c) => c.excerpt],
];

function csvCell(value: string): string {
  // Spreadsheet apps execute cells starting with these characters as formulas.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(clips: Clip[]): string {
  const header = CSV_COLUMNS.map(([name]) => name).join(",");
  const rows = clips.map((c) => CSV_COLUMNS.map(([, get]) => csvCell(get(c))).join(","));
  return [header, ...rows].join("\r\n") + "\r\n";
}

export function toMarkdown(clips: Clip[], opts: { generatedAt?: Date } = {}): string {
  const date = (opts.generatedAt ?? new Date()).toISOString().slice(0, 10);
  const lines: string[] = [`# Stream Alchemist clip plan`, "", `Generated ${date}. ${clips.length} clips.`, ""];
  for (const c of clips) {
    const time = c.start !== null ? ` (${formatTime(c.start)}–${formatTime(c.end)})` : "";
    lines.push(
      `## ${c.rank}. ${c.title}${time}`,
      "",
      `**Score:** ${c.score}/100  `,
      `**Starts with:** “${c.excerpt}”`,
      "",
      `**Hook (first 2 seconds):** ${c.hook}`,
      "",
      `**YouTube Shorts description**`,
      "",
      c.shortsDescription,
      "",
      `**TikTok / Reels caption**`,
      "",
      c.tiktokCaption,
      "",
      `**Thumbnail text:** ${c.thumbnailText.join(" · ")}  `,
      `**Hashtags:** ${c.hashtags.join(" ")}  `,
      `**Why it works:** ${c.why.join("; ")}`,
      "",
    );
  }
  return lines.join("\n");
}

export const DISCORD_LIMIT = 2000;

/**
 * Splits text into Discord-sized messages. Prefers breaking on paragraph,
 * line, then word boundaries, and keeps ``` code fences balanced across
 * chunks so syntax highlighting survives the split.
 */
export function chunkMessage(text: string, limit = DISCORD_LIMIT): string[] {
  const chunks: string[] = [];
  let rest = text.trim();
  let openFence: string | null = null;
  // Room for a reopened fence at the start and a closing fence at the end.
  const budget = limit - 24;

  while (rest.length > 0) {
    const prefix = openFence ? `${openFence}\n` : "";
    if (prefix.length + rest.length <= limit) {
      chunks.push(prefix + rest);
      break;
    }
    const room = budget - prefix.length;
    const window = rest.slice(0, room);
    let cut = Math.max(window.lastIndexOf("\n\n"), -1);
    if (cut < room * 0.5) cut = window.lastIndexOf("\n");
    if (cut < room * 0.5) cut = window.lastIndexOf(" ");
    if (cut <= 0) cut = room;

    let piece = rest.slice(0, cut).trimEnd();
    rest = rest.slice(cut).replace(/^\s+/, "");

    let fence: string | null = openFence;
    for (const match of piece.matchAll(/^```(\S*)/gm)) {
      fence = fence ? null : `\`\`\`${match[1]}`;
    }
    piece = prefix + piece;
    if (fence) piece += "\n```";
    chunks.push(piece);
    openFence = fence;
  }
  return chunks.length ? chunks : [""];
}

/** Trims a streaming preview to one message, keeping the tail visible. */
export function previewText(text: string, limit = DISCORD_LIMIT): string {
  const cursor = " ▌";
  if (text.length + cursor.length <= limit) return text + cursor;
  return "…" + text.slice(text.length - (limit - cursor.length - 1)) + cursor;
}

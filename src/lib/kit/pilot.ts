import { z } from "zod/v4";
import type { KitPilotRequestEmail } from "@/lib/notifications";

const link = z.url({ protocol: /^https?$/ }).max(500);

const pilotSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.email().max(254),
  channelUrl: link,
  replayUrl: link.optional(),
  note: z.string().max(1000).optional(),
});

const MESSAGES: Record<string, string> = {
  name: "Tell us your name or channel name.",
  email: "Enter a valid email so we can reply.",
  channelUrl: "Paste the full link to your channel (starting with https://).",
  replayUrl: "Paste the full link to your replay, or leave it blank.",
  note: "Keep the note under 1,000 characters.",
};

const trimmed = (v: unknown) => (typeof v === "string" ? v.trim() : v);
const optional = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : trimmed(v));

export type PilotParseResult =
  | { ok: true; request: KitPilotRequestEmail }
  | { ok: true; spam: true }
  | { ok: false; error: string };

export function parsePilotRequest(body: unknown): PilotParseResult {
  const raw = (body ?? {}) as Record<string, unknown>;
  // Honeypot: a hidden field people never see. Anything in it is a bot.
  if (typeof raw.website === "string" && raw.website !== "") return { ok: true, spam: true };

  const result = pilotSchema.safeParse({
    name: trimmed(raw.name),
    email: typeof raw.email === "string" ? raw.email.trim().toLowerCase() : raw.email,
    channelUrl: trimmed(raw.channelUrl),
    replayUrl: optional(raw.replayUrl),
    note: optional(raw.note),
  });
  if (!result.success) {
    const field = String(result.error.issues[0]?.path[0] ?? "");
    return { ok: false, error: MESSAGES[field] ?? "Check the form and try again." };
  }
  return { ok: true, request: result.data };
}

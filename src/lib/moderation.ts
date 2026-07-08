import { anthropic, bedrockModelId } from "@/lib/anthropic";
import { consumeLlmBudget } from "@/lib/llm-budget";

export async function moderateComment(
  content: string,
): Promise<{ flagged: boolean; reason?: string }> {
  // Each call is an LLM request; cap total/day so comment-spam can't run up the
  // bill. Over budget → skip AI moderation (comment still subject to auth +
  // rate limits). Tune via MODERATION_DAILY_CAP.
  const budget = await consumeLlmBudget("moderation", Number(process.env.MODERATION_DAILY_CAP ?? "500"));
  if (!budget.ok) return { flagged: false };

  try {
    const response = await anthropic.messages.create({
      // Own knob (was silently coupled to ORACLE_MODEL — retuning the oracle
      // changed the moderation model). Binary spam checks only need haiku-class.
      model: bedrockModelId(process.env.MODERATION_MODEL ?? "us.anthropic.claude-haiku-4-5-20251001-v1:0"),
      max_tokens: 50,
      messages: [
        {
          role: "user",
          content: `You are a content moderator. Is the following comment spam, hate speech, or abusive? Reply with ONLY "YES" or "NO" on the first line. If YES, add a brief reason on the second line.\n\nComment: "${content}"`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const lines = text.trim().split("\n");
    const verdict = lines[0]?.trim().toUpperCase();

    if (verdict === "YES") {
      return { flagged: true, reason: lines[1]?.trim() || "Flagged by AI" };
    }

    return { flagged: false };
  } catch (error) {
    console.error("Moderation error:", error);
    return { flagged: false };
  }
}

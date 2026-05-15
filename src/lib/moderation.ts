import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function moderateComment(
  content: string,
): Promise<{ flagged: boolean; reason?: string }> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-20250414",
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

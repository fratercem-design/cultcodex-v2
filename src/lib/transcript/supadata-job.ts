/**
 * Reads a Supadata async transcript job (GET /v1/transcript/{jobId}).
 *
 * Per https://docs.supadata.ai/api-reference/endpoint/transcript/transcript-get
 * `status` is one of queued | active | completed | failed, and a finished
 * job carries `content` at the top level. The sync route used to wait for
 * "done" and read `result.content`, so it never consumed a finished job.
 * "done" and a nested `result` are still accepted in case either shape is
 * served.
 */
export type SupadataJob<C> =
  | { state: "pending"; status: string }
  | { state: "failed"; status: string }
  | { state: "done"; status: string; content: C[] | null };

export function readSupadataJob<C>(body: unknown): SupadataJob<C> {
  const b = (body ?? {}) as { status?: unknown; content?: unknown; result?: { content?: unknown } };
  const status = typeof b.status === "string" ? b.status : "unknown";

  if (status === "failed" || status === "error") return { state: "failed", status };
  if (status !== "completed" && status !== "done") return { state: "pending", status };

  const content = b.content ?? b.result?.content;
  return { state: "done", status, content: Array.isArray(content) && content.length > 0 ? (content as C[]) : null };
}

// Long-conversation stability: keep a rolling brief of older turns so we never
// blow the context window or pay to re-process the same history every call.
//
// Strategy:
//   - If the active history has > KEEP_RECENT messages, we trim the older
//     portion out of the model request and inject the stored conversation
//     `summary` as a system block.
//   - After each successful turn, if older history exists and the stored
//     summary is stale, we rebuild it in the background via a small/fast model.
// Failure is always silent — falls back to plain truncation.

import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const KEEP_RECENT = 12;
export const SUMMARIZE_THRESHOLD = 16;

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const SUMMARY_MODEL = "google/gemini-2.5-flash-lite";
const SUMMARY_TIMEOUT_MS = 8000;

export interface ChatTurn {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface TrimmedHistory {
  messages: ChatTurn[];
  summary: string | null;
  trimmedCount: number;
}

export async function loadConversationSummary(conversationId: string): Promise<string | null> {
  try {
    const { data } = await supabaseAdmin
      .from("conversations")
      .select("summary")
      .eq("id", conversationId)
      .maybeSingle();
    const summary = (data as { summary?: string | null } | null)?.summary;
    return summary && summary.trim() ? summary : null;
  } catch {
    return null;
  }
}

/**
 * Returns the messages to actually send upstream plus an optional brief of
 * everything that was trimmed. Safe under any input — never throws.
 */
export function trimHistoryWithSummary(
  messages: ChatTurn[],
  storedSummary: string | null,
): TrimmedHistory {
  if (!Array.isArray(messages) || messages.length <= SUMMARIZE_THRESHOLD) {
    return { messages, summary: storedSummary, trimmedCount: 0 };
  }
  const tail = messages.slice(-KEEP_RECENT);
  const trimmedCount = messages.length - tail.length;
  return { messages: tail, summary: storedSummary, trimmedCount };
}

export function formatSummaryForPrompt(summary: string | null, trimmedCount: number): string | null {
  if (!summary) return null;
  const header = trimmedCount > 0
    ? `Compressed brief of the earlier ${trimmedCount} turns of this conversation (use as context, do not quote verbatim):`
    : "Compressed brief of the earlier turns of this conversation:";
  return `${header}\n${summary.trim()}`;
}

/**
 * Fire-and-forget background refresh. Rebuilds the brief from the older
 * portion of history and persists it on the conversation row. Bounded by
 * timeout; failure is silent.
 */
export function maybeRefreshSummary(params: {
  conversationId: string;
  apiKey: string;
  messages: ChatTurn[];
  existingSummary: string | null;
}): void {
  const { conversationId, apiKey, messages, existingSummary } = params;
  if (!apiKey) return;
  if (!Array.isArray(messages) || messages.length <= SUMMARIZE_THRESHOLD) return;

  // Only summarize the older portion; the recent tail stays verbatim in-context.
  const older = messages.slice(0, messages.length - KEEP_RECENT);
  if (older.length < 4) return;

  void (async () => {
    try {
      const transcript = older
        .map((m) => `${m.role.toUpperCase()}: ${m.content.replace(/\s+/g, " ").slice(0, 1200)}`)
        .join("\n")
        .slice(0, 12_000);

      const system = [
        "You compress chat history into a tight operational brief for an AI assistant.",
        "Capture: user identity hints, goals/projects/tasks they care about, decisions made, open questions, preferences, and anything the assistant promised.",
        "Drop pleasantries, repeated context, and chain-of-thought.",
        "Output: 6-12 short bullet points. No preamble. No quotes. No headings.",
      ].join(" ");

      const seed = existingSummary?.trim()
        ? `Existing brief to merge with the new content (keep what's still true, drop what's outdated):\n${existingSummary}`
        : "No prior brief exists. Build one from scratch.";

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), SUMMARY_TIMEOUT_MS);
      let summary = "";
      try {
        const res = await fetch(GATEWAY_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: SUMMARY_MODEL,
            stream: false,
            messages: [
              { role: "system", content: system },
              { role: "user", content: `${seed}\n\nConversation excerpt:\n${transcript}` },
            ],
          }),
          signal: controller.signal,
        });
        if (!res.ok) return;
        const json = await res.json().catch(() => null) as {
          choices?: Array<{ message?: { content?: string } }>;
        } | null;
        summary = json?.choices?.[0]?.message?.content?.trim() ?? "";
      } finally {
        clearTimeout(timeout);
      }

      if (!summary) return;
      summary = summary.slice(0, 3000);

      await supabaseAdmin
        .from("conversations")
        .update({ summary })
        .eq("id", conversationId);
      console.log("[summarizer] refreshed", { conversationId, chars: summary.length, fromTurns: older.length });
    } catch (err) {
      console.warn("[summarizer] failed", { err: String(err) });
    }
  })();
}

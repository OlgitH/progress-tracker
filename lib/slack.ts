import "server-only";

const SLACK_API = "https://slack.com/api";

export type SlackResult = { ok: true } | { ok: false; reason: string };

// Slack mrkdwn treats & < > as control characters, so user text must be escaped.
export function escapeSlack(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function slackCall(method: string, token: string, init: RequestInit & { query?: Record<string, string> }) {
  const url = new URL(`${SLACK_API}/${method}`);
  for (const [key, value] of Object.entries(init.query ?? {})) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...init.headers },
    cache: "no-store",
  });

  return (await response.json()) as { ok: boolean; error?: string; user?: { id: string } };
}

async function resolveSlackUserId(token: string, email: string | null, slackUserId: string | null) {
  if (slackUserId) {
    return slackUserId;
  }

  if (!email) {
    return null;
  }

  const result = await slackCall("users.lookupByEmail", token, { method: "GET", query: { email } });
  return result.ok ? (result.user?.id ?? null) : null;
}

/** Sends a Slack DM from the My Studio app. Never throws: callers decide how to surface failures. */
export async function sendSlackDirectMessage(
  recipient: { email: string | null; slackUserId: string | null },
  text: string
): Promise<SlackResult> {
  const token = process.env.SLACK_BOT_TOKEN?.trim();

  if (!token) {
    return { ok: false, reason: "SLACK_BOT_TOKEN is not configured." };
  }

  try {
    const userId = await resolveSlackUserId(token, recipient.email, recipient.slackUserId);

    if (!userId) {
      return { ok: false, reason: "No Slack account is linked to this member yet." };
    }

    // Posting to a user id opens (or reuses) the DM between that user and the app.
    const result = await slackCall("chat.postMessage", token, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ channel: userId, text, mrkdwn: true }),
    });

    return result.ok ? { ok: true } : { ok: false, reason: `Slack error: ${result.error ?? "unknown"}` };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : "Slack request failed." };
  }
}

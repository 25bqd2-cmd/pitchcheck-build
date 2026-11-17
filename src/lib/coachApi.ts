export interface CoachChatTurn {
  role: "user" | "model";
  text: string;
}

export async function requestCoachReply(
  messages: CoachChatTurn[],
): Promise<string> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  const rawText = await response.text();
  let parsed: { reply?: string; error?: string; message?: string } | null = null;
  if (rawText) {
    try {
      parsed = JSON.parse(rawText) as {
        reply?: string;
        error?: string;
        message?: string;
      };
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    const serverMsg =
      parsed?.error ||
      parsed?.message ||
      (rawText && !rawText.trimStart().startsWith("<")
        ? rawText.trim().slice(0, 300)
        : "") ||
      `Server returned HTTP ${response.status} ${response.statusText}`.trim();
    throw new Error(serverMsg);
  }

  if (!parsed?.reply) {
    throw new Error("Server response did not include a coach reply.");
  }

  return parsed.reply;
}

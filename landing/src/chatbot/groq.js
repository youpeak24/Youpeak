const MAX_HISTORY = 10;

export class ChatError extends Error {
  constructor(message, { retryable = true } = {}) {
    super(message);
    this.retryable = retryable;
  }
}

export async function streamReply(history, { onToken, onStatus, signal }) {
  onStatus?.("Connecting securely…");
  let response;
  try {
    response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: history.slice(-MAX_HISTORY).map(({ role, content }) => ({ role, content })),
      }),
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ChatError("Can't reach the assistant. Check your connection and try again.");
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new ChatError(
      payload.error || "The assistant is temporarily unavailable. Please try again shortly.",
      { retryable: response.status !== 503 },
    );
  }

  onStatus?.(null);
  return readStream(response, onToken);
}

async function readStream(response, onToken) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();
    for (const line of lines) {
      const data = line.trim();
      if (!data.startsWith("data:")) continue;
      const payload = data.slice(5).trim();
      if (payload === "[DONE]") return text;
      try {
        const delta = JSON.parse(payload).choices?.[0]?.delta?.content;
        if (delta) {
          text += delta;
          onToken(text);
        }
      } catch {
        // Ignore upstream keep-alive events.
      }
    }
  }
  return text;
}

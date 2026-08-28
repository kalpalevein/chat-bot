const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6"; // update as newer models become available

/**
 * Sends a chat completion request to Claude with retrieved context injected
 * into the system prompt, and streams the response back as an async
 * generator of text deltas.
 */
async function* streamChatCompletion({ systemPrompt, messages }) {
  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    throw new Error(`Claude API request failed: ${res.status} ${body}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop(); // keep incomplete line for next chunk

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6);
      if (payload === "[DONE]") return;

      try {
        const event = JSON.parse(payload);
        if (
          event.type === "content_block_delta" &&
          event.delta?.type === "text_delta"
        ) {
          yield event.delta.text;
        }
      } catch {
        // ignore malformed/partial SSE lines
      }
    }
  }
}

module.exports = { streamChatCompletion };

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

async function* streamChatCompletion({ systemPrompt, messages }) {
  const model = process.env.OPENAI_MODEL;
  if (!model) {
    throw new Error("OPENAI_MODEL env var is required when LLM_PROVIDER=openai");
  }

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      max_completion_tokens: 1024,
      stream: true,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    }),
  });

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    throw new Error(`OpenAI API request failed: ${res.status} ${body}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6);
      if (payload === "[DONE]") return;

      try {
        const event = JSON.parse(payload);
        const text = event.choices?.[0]?.delta?.content;
        if (text) yield text;
      } catch {
        // ignore partial lines
      }
    }
  }
}

module.exports = { streamChatCompletion };
const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";

/**
 * Embeds an array of text strings. `inputType` should be "document" when
 * embedding chunks for storage, and "query" when embedding a user's
 * question at chat time — Voyage tunes the embedding slightly differently
 * for each, which improves retrieval quality.
 */
async function embed(texts, inputType) {
  const res = await fetch(VOYAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "voyage-3",
      input: texts,
      input_type: inputType,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Voyage embedding request failed: ${res.status} ${body}`);
  }

  const data = await res.json();
  return data.data.map((d) => d.embedding);
}

module.exports = { embed };

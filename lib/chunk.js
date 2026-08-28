/**
 * Splits text into overlapping chunks, roughly by word count as a cheap
 * proxy for tokens (a word is ~1.3 tokens in English on average).
 */
function chunkText(text, { targetWords = 350, overlapWords = 50 } = {}) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const chunks = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + targetWords, words.length);
    chunks.push(words.slice(start, end).join(" "));
    if (end === words.length) break;
    start = end - overlapWords;
  }

  return chunks;
}

module.exports = { chunkText };

// One-off / periodic batch script. Run manually with: npm run ingest
// Not part of the live Express server — nothing here is exposed over HTTP.

require("dotenv").config();

const { pool } = require("./db");
const sources = require("./sources");
const { chunkText } = require("./lib/chunk");
const { embed } = require("./lib/embed");
const { extractFromUrl, extractFromFile } = require("./lib/extract");

async function ingestSource(source) {
  console.log(`\n[ingest] Processing source: ${source.id} (${source.type})`);

  const { title, text } =
    source.type === "url"
      ? await extractFromUrl(source.value)
      : await extractFromFile(source.value);

  if (!text || text.length < 20) {
    console.warn(`[ingest] Skipping ${source.id} — little/no extractable text`);
    return;
  }

  const chunks = chunkText(text);
  console.log(`[ingest] "${title}" -> ${chunks.length} chunks`);

  // Embed in batches to stay within API request limits
  const BATCH_SIZE = 20;
  const embeddings = [];
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const batchEmbeddings = await embed(batch, "document");
    embeddings.push(...batchEmbeddings);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Remove previous chunks for this source so re-running ingest doesn't
    // create duplicates when content changes.
    await client.query("DELETE FROM document_chunks WHERE source_id = $1", [
      source.id,
    ]);

    for (let i = 0; i < chunks.length; i++) {
      await client.query(
        `INSERT INTO document_chunks
           (source_id, source_type, source_value, title, chunk_index, content, embedding)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          source.id,
          source.type,
          source.value,
          title,
          i,
          chunks[i],
          `[${embeddings[i].join(",")}]`,
        ]
      );
    }

    await client.query("COMMIT");
    console.log(`[ingest] Stored ${chunks.length} chunks for ${source.id}`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function main() {
  console.log(`[ingest] Starting ingestion of ${sources.length} source(s)...`);

  for (const source of sources) {
    try {
      await ingestSource(source);
    } catch (err) {
      // One bad source shouldn't stop the rest from ingesting
      console.error(`[ingest] Failed on ${source.id}:`, err.message);
    }
  }

  console.log("\n[ingest] Done.");
  await pool.end();
}

main().catch((err) => {
  console.error("[ingest] Fatal error:", err);
  process.exit(1);
});

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { pool } = require("./db");
const { embed } = require("./lib/embed");
const { streamChatCompletion } = require("./lib/claude");

const app = express();

// In production, set ALLOWED_ORIGIN to your WordPress site's URL
// (e.g. https://skinaestheticshaleema.co.uk) so only that site can call
// this API. Falls back to allowing all origins for local development.
const allowedOrigin = process.env.ALLOWED_ORIGIN;
// app.use(
//   cors(
//     allowedOrigin
//       ? { origin: allowedOrigin }
//       : {} // permissive default for local dev
//   )
// );
app.use(cors());
app.use(express.json());

const TOP_K = 5;

async function retrieveContext(question) {
  const [queryEmbedding] = await embed([question], "query");
  const vectorLiteral = `[${queryEmbedding.join(",")}]`;

  const { rows } = await pool.query(
    `SELECT source_id, source_value, title, content,
            1 - (embedding <=> $1) AS similarity
     FROM document_chunks
     ORDER BY embedding <=> $1
     LIMIT $2`,
    [vectorLiteral, TOP_K]
  );

  return rows;
}

const BOOKING_URL =
  "https://partner-uk.pabau.com/online-bookings/SkinAndAestheticsByHaleema";

function buildSystemPrompt(chunks) {
  const referenceBlock = chunks
    .map(
      (c, i) =>
        `[${i + 1}] Source: ${c.title} (${c.source_value})\n${c.content}`
    )
    .join("\n\n---\n\n");

  return `You are a helpful assistant for a skin clinic/pharmacy. Answer the
user's question using ONLY the reference material below. If the answer is
not contained in the reference material, say you don't have that
information and suggest the user contact the clinic directly. Do not
guess or use outside knowledge, especially for anything medical or
treatment-related.

Scope: only answer questions related to this clinic, its treatments,
consultations, bookings, aftercare, memberships, or policies. If the
user asks about anything unrelated to the clinic (for example general
knowledge questions, translations, recommendations for other
businesses, or requests to perform a task like writing, coding, or
solving a problem), do not attempt to fulfill any part of that request.
Simply reply that you can only help with questions about the clinic and
its treatments, and ask if there is anything clinic-related you can help
with. Keep this reply brief, do not suggest other tools, websites, or
resources to find the answer elsewhere.

You may use emojis occasionally if
it fits naturally, but do not overuse them. Never use the em dash
character (—); use a comma, period, or separate
sentence instead. A single hyphen "-" for hyphenated words is fine.
Keep answers concise and friendly. Do not include source numbers,
citations, or references like "[1]" in your answer, just answer
naturally in plain conversational text.

If the user wants to make a booking, asks how to book, wants to schedule
or reschedule an appointment, or their question is clearly leading toward
wanting an appointment (e.g. "can I get this done", "how do I start"),
share this booking link: ${BOOKING_URL}
Do not share this link for unrelated questions. In particular, do not
share this link just because you are suggesting the user contact the
clinic directly (for example, when the answer isn't in the reference
material) unless they were specifically asking about booking or
scheduling. General contact questions are not booking questions.

Reference material:
${referenceBlock}`;
}

app.post("/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "`message` is required" });
    }

    const chunks = await retrieveContext(message);
    const systemPrompt = buildSystemPrompt(chunks);

    const messages = [
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    for await (const delta of streamChatCompletion({ systemPrompt, messages })) {
      res.write(`data: ${JSON.stringify({ text: delta })}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("[chat] Error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Something went wrong" });
    } else {
      res.end();
    }
  }
});

app.post("/leads", async (req, res) => {
  try {
    const { url } = req.query;
    const credentials = btoa(`${process.env.WORDPRESS_API_USER}:${process.env.WORDPRESS_APP_PASSWORD}`);

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "`url` query parameter is required" });
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${credentials}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json().catch(() => null);

    res.status(response.status).json(data);
  } catch (err) {
    console.error("[leads] Error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Something went wrong" });
    } else {
      res.end();
    }
  }
});

app.get("/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

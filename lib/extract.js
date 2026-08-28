const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

/** Fetches a URL and extracts readable article text (strips nav, footer, etc). */
async function extractFromUrl(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; PharmacyBot/1.0)" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  const html = await res.text();

  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (article && article.textContent && article.textContent.trim().length > 0) {
    return { title: article.title || url, text: article.textContent.trim() };
  }

  // Fallback: strip tags crudely if Readability finds nothing usable
  const text = dom.window.document.body.textContent.replace(/\s+/g, " ").trim();
  return { title: url, text };
}

/** Reads a local file (pdf, docx, txt, md) and extracts plain text. */
async function extractFromFile(relativePath) {
  const fullPath = path.resolve(__dirname, "..", relativePath);
  const ext = path.extname(fullPath).toLowerCase();
  const title = path.basename(fullPath);

  if (ext === ".pdf") {
    const buffer = fs.readFileSync(fullPath);
    const data = await pdfParse(buffer);
    return { title, text: data.text.trim() };
  }

  if (ext === ".docx") {
    const buffer = fs.readFileSync(fullPath);
    const result = await mammoth.extractRawText({ buffer });
    return { title, text: result.value.trim() };
  }

  if (ext === ".txt" || ext === ".md") {
    const text = fs.readFileSync(fullPath, "utf-8");
    return { title, text: text.trim() };
  }

  throw new Error(`Unsupported file type: ${ext} (${fullPath})`);
}

module.exports = { extractFromUrl, extractFromFile };

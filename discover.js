// One-off helper: crawls a starting URL for same-domain links and prints
// them as ready-to-paste sources.js entries for you to review.
// This does NOT modify sources.js or ingest anything automatically —
// it's a discovery aid, you decide what actually gets added.
//
// Usage: node discover.js https://dev.skinaestheticshaleema.co.uk/

const { JSDOM } = require("jsdom");

const START_URL = process.argv[2];
const MAX_PAGES = 50;

// Pages you almost never want grounding chatbot answers — adjust freely
const EXCLUDE_PATTERNS = [
  /\/login/i,
  /\/cart/i,
  /\/checkout/i,
  /\/account/i,
  /\/privacy-policy/i,
  /\/terms/i,
  /\/cookie-policy/i,
  /\.(jpg|jpeg|png|gif|svg|pdf|zip|css|js)$/i,
  /#/, // in-page anchors, not separate pages
];

function toSlugId(url) {
  const path = new URL(url).pathname
    .replace(/\/$/, "")
    .replace(/^\//, "")
    .replace(/\//g, "-");
  return path || "home";
}

async function fetchLinks(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; PharmacyBot/1.0)" },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const html = await res.text();
  const dom = new JSDOM(html, { url });

  const anchors = [...dom.window.document.querySelectorAll("a[href]")];
  const base = new URL(url);

  const links = anchors
    .map((a) => {
      try {
        return new URL(a.getAttribute("href"), base).href;
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .filter((href) => new URL(href).hostname === base.hostname) // same domain only
    .filter((href) => !EXCLUDE_PATTERNS.some((pattern) => pattern.test(href)))
    .map((href) => href.split("?")[0].split("#")[0]); // strip query/hash

  return [...new Set(links)];
}

async function main() {
  if (!START_URL) {
    console.error("Usage: node discover.js <start-url>");
    process.exit(1);
  }

  console.log(`[discover] Crawling ${START_URL} for internal links...\n`);

  const discovered = new Set([START_URL]);
  const queue = [START_URL];
  const visited = new Set();

  while (queue.length > 0 && discovered.size < MAX_PAGES) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);

    try {
      const links = await fetchLinks(current);
      for (const link of links) {
        if (!discovered.has(link) && discovered.size < MAX_PAGES) {
          discovered.add(link);
          queue.push(link);
        }
      }
    } catch (err) {
      console.warn(`[discover] Skipped ${current}: ${err.message}`);
    }
  }

  const sorted = [...discovered].sort();

  console.log(`[discover] Found ${sorted.length} candidate page(s):\n`);
  sorted.forEach((url) => console.log(`  ${url}`));

  console.log(`\n[discover] Paste any you want into sources.js:\n`);
  sorted.forEach((url) => {
    console.log(
      `  { id: "${toSlugId(url)}", type: "url", value: "${url}" },`
    );
  });

  console.log(
    `\n[discover] Review the list above — remove anything that shouldn't ground chatbot answers, then paste the rest into sources.js and run: npm run ingest`
  );
}

main().catch((err) => {
  console.error("[discover] Fatal error:", err);
  process.exit(1);
});

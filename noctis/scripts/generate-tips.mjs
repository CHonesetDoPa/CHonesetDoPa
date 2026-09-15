/**
 * generate-tips.mjs - Generate docs/index.html (poem splash page) from docs/tips.md
 *
 * Usage: pnpm docs:tips
 *
 * tips.md format: all non-empty lines = poem verses. The page plays the poem,
 * then redirects to the real homepage. Styles live in docs/style.css,
 * behaviour in docs/tips.js.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = join(__dirname, "..", "..", "docs");
const SRC = join(DOCS_DIR, "tips.md");
const OUT = join(DOCS_DIR, "index.html");

const TITLE = "Nocat";

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const verses = readFileSync(SRC, "utf8")
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l.length > 0);

if (verses.length === 0) {
  console.error("✗ docs/tips.md is empty");
  process.exit(1);
}

const verseHtml = verses
  .map((v) => `        <p>${escapeHtml(v)}</p>`)
  .join("\n");

// Must stay in sync with tips.js: 0.15s base + 0.18s per line + 0.9s fade.
const playSeconds = 0.15 + Math.max(verses.length - 1, 0) * 0.18 + 0.9;
const refreshSeconds = Math.ceil(playSeconds) + 1;

const html = `<!--
 * index.html - Poem splash page on CH's GitHub Pages, then redirects home.
 * AUTO-GENERATED from tips.md — do not edit by hand.
-->
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <meta http-equiv="refresh" content="${refreshSeconds};url=https://me.nekoc.cc" />
    <link rel="canonical" href="https://me.nekoc.cc" />
    <link rel="icon" href="data:," />
    <link rel="stylesheet" href="./style.css" />
    <title>${TITLE} — CH</title>
  </head>

  <body>
    <div class="sky" aria-hidden="true">
      <div class="moon"></div>
      <svg class="bat" viewBox="0 0 34 18">
        <path
          d="M17 4c2-3 5-3 7-1 2-2 5-2 7 0-2 0-3 2-3 4-2-1-4 0-5 3-2-2-4-3-6-3s-4 1-6 3c-1-3-3-4-5-3 0-2-1-4-3-4 2-2 5-2 7 0 2-2 5-2 7 1z"
        />
      </svg>
    </div>

    <main class="poem">
      <h1>${TITLE}</h1>
      <div class="lines">
${verseHtml}
      </div>
      <p class="author">CH</p>
    </main>

    <p class="back"><a href="https://me.nekoc.cc">← me.nekoc.cc <span id="countdown">(${refreshSeconds}s)</span></a></p>

    <script src="./tips.js" defer></script>
  </body>
</html>
`;

writeFileSync(OUT, html, "utf8");
console.log(`✓ ${TITLE} — ${verses.length} Lines → docs/index.html`);

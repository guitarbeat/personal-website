#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const SNIPPET_PATH = path.join(__dirname, "html-head-snippet.html");
const VITE_HTML_PATH = path.join(ROOT, "index.html");
const checkOnly = process.argv.includes("--check");

const snippet = fs.readFileSync(SNIPPET_PATH, "utf8");

function renderHtml({ assetPrefix, bodyScripts }) {
  const head = snippet.replaceAll("{{ASSET_PREFIX}}", assetPrefix);

  return `<!DOCTYPE html>
<html lang="en" prefix="og: https://ogp.me/ns#">
  <head>
${head}  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
${bodyScripts}  </body>
</html>
`;
}

const expectedContents = renderHtml({
  assetPrefix: "",
  bodyScripts: '    <script type="module" src="/src/index.tsx"></script>\n',
});

if (checkOnly) {
  if (!fs.existsSync(VITE_HTML_PATH)) {
    console.error("Missing index.html — run: pnpm run sync:html");
    process.exit(1);
  }

  if (fs.readFileSync(VITE_HTML_PATH, "utf8") !== expectedContents) {
    console.error(
      "index.html is out of sync with scripts/html-head-snippet.html",
    );
    console.error("Run: pnpm run sync:html");
    process.exit(1);
  }

  console.log("index.html is in sync.");
  process.exit(0);
}

fs.writeFileSync(VITE_HTML_PATH, expectedContents);
console.log("Synced index.html from scripts/html-head-snippet.html");

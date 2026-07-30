#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const SNIPPET_PATH = path.join(__dirname, "html-head-snippet.html");
const VITE_HTML_PATH = path.join(ROOT, "index.html");
const CRACO_HTML_PATH = path.join(ROOT, "public", "index.html");
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

const expected = {
  [VITE_HTML_PATH]: renderHtml({
    assetPrefix: "",
    bodyScripts: '    <script type="module" src="/src/index.tsx"></script>\n',
  }),
  [CRACO_HTML_PATH]: renderHtml({
    assetPrefix: "%PUBLIC_URL%",
    bodyScripts: "",
  }),
};

if (checkOnly) {
  const outOfSync = Object.entries(expected).filter(([filePath, contents]) => {
    if (!fs.existsSync(filePath)) {
      return true;
    }

    return fs.readFileSync(filePath, "utf8") !== contents;
  });

  if (outOfSync.length > 0) {
    console.error(
      "HTML entry files are out of sync with scripts/html-head-snippet.html:",
    );
    for (const [filePath] of outOfSync) {
      console.error(`  - ${path.relative(ROOT, filePath)}`);
    }
    console.error("Run: pnpm run sync:html");
    process.exit(1);
  }

  console.log("HTML entry files are in sync.");
  process.exit(0);
}

for (const [filePath, contents] of Object.entries(expected)) {
  fs.writeFileSync(filePath, contents);
}

console.log("Synced index.html and public/index.html from html-head-snippet.html");

#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const SNIPPET_PATH = path.join(__dirname, "html-head-snippet.html");
const VITE_HTML_PATH = path.join(ROOT, "index.html");
const CRACO_HTML_PATH = path.join(ROOT, "public", "index.html");

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

const viteHtml = renderHtml({
  assetPrefix: "",
  bodyScripts: '    <script type="module" src="/src/index.tsx"></script>\n',
});

const cracoHtml = renderHtml({
  assetPrefix: "%PUBLIC_URL%",
  bodyScripts: "",
});

fs.writeFileSync(VITE_HTML_PATH, viteHtml);
fs.writeFileSync(CRACO_HTML_PATH, cracoHtml);

console.log("Synced index.html and public/index.html from html-head-snippet.html");

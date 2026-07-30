#!/usr/bin/env node
const fs = require("node:fs");
const { shTry } = require("../lib/exec.js");

const REPO = "guitarbeat/personal-website";
const analysis = JSON.parse(
  fs
    .readFileSync("/tmp/branch-analysis.json", "utf8")
    .replace(/^warning:.*\n/, ""),
);

const deleted = [];
const failed = [];

for (const item of analysis.toDelete) {
  const result = shTry(
    `gh api -X DELETE repos/${REPO}/git/refs/heads/${encodeURIComponent(item.branch)}`,
  );
  if (result.ok) deleted.push(item.branch);
  else failed.push(item.branch);
  process.stderr.write(`${result.ok ? "✓" : "✗"} ${item.branch}\n`);
}

console.log(
  JSON.stringify({
    deleted,
    failed,
  }),
);

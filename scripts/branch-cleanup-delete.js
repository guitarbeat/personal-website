#!/usr/bin/env node
const { execSync } = require("node:child_process");
const fs = require("node:fs");

const REPO = "guitarbeat/personal-website";
const analysis = JSON.parse(
  fs
    .readFileSync("/tmp/branch-analysis.json", "utf8")
    .replace(/^warning:.*\n/, ""),
);

function shTry(cmd) {
  try {
    execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
    return true;
  } catch {
    return false;
  }
}

const deleted = [];
const failed = [];

for (const item of analysis.toDelete) {
  const ok = shTry(
    `gh api -X DELETE repos/${REPO}/git/refs/heads/${encodeURIComponent(item.branch)}`,
  );
  if (ok) deleted.push(item.branch);
  else failed.push(item.branch);
  process.stderr.write(`${ok ? "✓" : "✗"} ${item.branch}\n`);
}

console.log(
  JSON.stringify({
    deleted,
    failed,
  }),
);

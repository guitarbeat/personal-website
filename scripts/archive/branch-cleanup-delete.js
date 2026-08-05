#!/usr/bin/env node
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");

const REPO = "guitarbeat/personal-website";
const analysis = JSON.parse(
  fs
    .readFileSync("/tmp/branch-analysis.json", "utf8")
    .replace(/^warning:.*\n/, ""),
);

const deleted = [];
const failed = [];

for (const item of analysis.toDelete) {
  let ok = false;
  try {
    execFileSync("gh", [
      "api",
      "-X",
      "DELETE",
      `repos/${REPO}/git/refs/heads/${encodeURIComponent(item.branch)}`,
    ]);
    ok = true;
    deleted.push(item.branch);
  } catch (error) {
    failed.push(item.branch);
  }
  process.stderr.write(`${ok ? "✓" : "✗"} ${item.branch}\n`);
}

console.log(
  JSON.stringify({
    deleted,
    failed,
  }),
);

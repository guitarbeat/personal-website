#!/usr/bin/env node
/**
 * PR cleanup: merge winners, close remaining open PRs, delete branches.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const REPO = "guitarbeat/personal-website";
const LOG = path.join(ROOT, "docs/pr-cleanup-log.md");

function sh(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
}

function shTry(cmd) {
  try {
    return { ok: true, out: sh(cmd) };
  } catch (e) {
    return { ok: false, err: e.stderr?.toString() || e.message };
  }
}

const winners = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/pr-cleanup-winners.json"), "utf8"));
const inventory = JSON.parse(
  sh(
    'gh pr list --state open --limit 200 --json number,title,headRefName,mergeable,additions,deletions,changedFiles | node scripts/pr-cleanup-inventory.js',
  ),
);

const mergeSet = new Set(winners.merge.map((m) => m.number));
const clusterWinner = {};
for (const m of winners.merge) {
  clusterWinner[m.cluster] = m.number;
}

const log = [];
log.push("# PR Cleanup Log", "", `Started: ${new Date().toISOString()}`, "", "## Merged", "");

let mergeOk = 0;
let mergeFail = 0;

for (const entry of winners.merge) {
  const { number, reason } = entry;
  process.stderr.write(`Merging #${number}...\n`);
  const result = shTry(`gh pr merge ${number} --squash --delete-branch --repo ${REPO}`);
  if (result.ok) {
    log.push(`- **#${number}** merged (squash): ${reason}`);
    mergeOk++;
  } else {
    log.push(`- **#${number}** MERGE FAILED: ${reason}`);
    log.push(`  - Error: ${result.err}`);
    mergeFail++;
  }
}

log.push("", "## Closed", "");

const openPrs = JSON.parse(sh(`gh pr list --state open --limit 200 --json number,title,headRefName,mergeable --repo ${REPO}`));
let closeOk = 0;
let closeFail = 0;

for (const pr of openPrs) {
  if (mergeSet.has(pr.number)) continue;

  const inv = inventory.prs.find((p) => p.number === pr.number);
  const cluster = inv?.cluster || "misc";
  const winner = clusterWinner[cluster];
  let comment;
  if (winner) {
    comment = `Closing as part of PR cleanup. Duplicate or superseded by #${winner}.`;
  } else if (pr.mergeable === "CONFLICTING") {
    comment = "Closing as part of PR cleanup. Branch has merge conflicts with main and is not the chosen implementation.";
  } else {
    comment = "Closing as part of PR cleanup. Change does not provide sufficient value relative to maintenance cost or overlaps with merged work.";
  }

  process.stderr.write(`Closing #${pr.number}...\n`);
  const closeResult = shTry(`gh pr close ${pr.number} --comment "${comment.replace(/"/g, '\\"')}" --repo ${REPO}`);
  if (closeResult.ok) {
    shTry(`gh api -X DELETE repos/${REPO}/git/refs/heads/${encodeURIComponent(pr.headRefName)}`);
    log.push(`- **#${pr.number}** closed (\`${pr.headRefName}\`): ${comment}`);
    closeOk++;
  } else {
    log.push(`- **#${pr.number}** CLOSE FAILED: ${closeResult.err}`);
    closeFail++;
  }
}

log.push("", "## Summary", "");
log.push(`- Merged: ${mergeOk} (failed: ${mergeFail})`);
log.push(`- Closed: ${closeOk} (failed: ${closeFail})`);
log.push(`- Finished: ${new Date().toISOString()}`);

fs.writeFileSync(LOG, log.join("\n") + "\n");
console.log(JSON.stringify({ mergeOk, mergeFail, closeOk, closeFail }));

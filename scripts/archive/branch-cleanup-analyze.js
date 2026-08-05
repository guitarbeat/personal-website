#!/usr/bin/env node
const { sh } = require("../lib/exec.cjs");

const KEEP = new Set(["main", "gh-pages"]);

const escapeShell = (arg) => "'" + arg.replace(/'/g, "'\\''") + "'";

const branches = sh(
  'gh api "repos/guitarbeat/personal-website/branches?per_page=100" --paginate -q "[.[].name][]"',
)
  .split("\n")
  .filter(Boolean);

const results = [];

for (const branch of branches) {
  if (KEEP.has(branch)) {
    results.push({
      branch,
      action: "keep",
      reason: "protected/default branch",
    });
    continue;
  }

  let merged = false;
  try {
    sh(`git merge-base --is-ancestor ${escapeShell("origin/" + branch)} origin/main`);
    merged = true;
  } catch {
    merged = false;
  }

  let ahead = 0;
  let behind = 0;
  let diffStat = "";
  try {
    ahead = Number(
      sh(`git rev-list --count origin/main..${escapeShell("origin/" + branch)}`) || 0,
    );
    behind = Number(
      sh(`git rev-list --count ${escapeShell("origin/" + branch)}..origin/main`) || 0,
    );
    if (ahead > 0) {
      diffStat = sh(`git diff --shortstat origin/main...${escapeShell("origin/" + branch)}`);
    }
  } catch (e) {
    results.push({
      branch,
      action: "keep",
      reason: `analysis failed: ${e.message}`,
    });
    continue;
  }

  const filesChanged = diffStat.match(/(\d+) files? changed/);
  const insertions = diffStat.match(/(\d+) insertions?/);
  const fileCount = filesChanged ? Number(filesChanged[1]) : 0;
  const addCount = insertions ? Number(insertions[1]) : 0;

  if (merged || ahead === 0) {
    results.push({
      branch,
      action: "delete",
      reason: merged ? "merged into main" : "no unique commits",
    });
    continue;
  }

  // Heuristic: interesting if meaningful unique work not superseded
  const isDraft = branch.startsWith("draft/");
  const isBotChurn =
    /^(jules-|codeantai-|fix-|add-|perf\/|test|testing-|dependabot)/.test(
      branch,
    ) ||
    branch.includes("google-sheets") ||
    branch.includes("cors") ||
    branch.includes("magic");

  if (isDraft) {
    results.push({
      branch,
      action: "delete",
      reason: `stale draft branch (${ahead} ahead, ${behind} behind)`,
    });
    continue;
  }

  if (isBotChurn && fileCount <= 25 && addCount < 500) {
    results.push({
      branch,
      action: "delete",
      reason: `orphan bot/agent branch; ${ahead} commits, ${diffStat || "no diff"}`,
    });
    continue;
  }

  if (behind > 50 && fileCount <= 30) {
    results.push({
      branch,
      action: "delete",
      reason: `stale (${behind} commits behind main); ${diffStat || "small diff"}`,
    });
    continue;
  }

  results.push({
    branch,
    action: "keep",
    reason: `possibly interesting: ${ahead} ahead, ${behind} behind — ${diffStat || "no stat"}`,
  });
}

const toDelete = results.filter((r) => r.action === "delete");
const toKeep = results.filter((r) => r.action === "keep");

console.log(
  JSON.stringify(
    { delete: toDelete.length, keep: toKeep.length, toDelete, toKeep },
    null,
    2,
  ),
);

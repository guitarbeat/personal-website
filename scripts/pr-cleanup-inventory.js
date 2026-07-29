#!/usr/bin/env node
/**
 * Cluster open PRs for cleanup. Reads gh pr list JSON from stdin.
 */
const fs = require("fs");

const input = fs.readFileSync(0, "utf8");
const prs = JSON.parse(input);

function cluster(title) {
  const t = title.toLowerCase();
  if (/google sheets|api key|spreadsheet|printful.*key|doc id|client bundle/.test(t))
    return "security-google-sheets";
  if (/cors|redos|wildcard/.test(t)) return "security-cors";
  if (/innerhtml|xss/.test(t)) return "security-xss";
  if (/prng|math\.random|random.*id|generateid|timing attack|timingSafeCompare/.test(t))
    return "security-rng";
  if (/error log|sensitive.*leak/.test(t)) return "security-logging";
  if (/_magic|chroma-js/.test(t)) return "code-health-magic";
  if (/authcontext.*any|any.*authcontext/.test(t)) return "code-health-auth";
  if (/usescrollutils|scroll.*hook|scrollthreshold/.test(t)) return "tests-scroll";
  if (/backdrop-filter|backdrop filter/.test(t)) return "perf-backdrop";
  if (/project filter|filter.*set|filter.*includes/.test(t)) return "perf-filters";
  if (/github actions|ci caching|biome/.test(t)) return "ci-tooling";
  if (/dependabot|deps/.test(t)) return "dependabot";
  if (/imgbot/.test(t)) return "imgbot";
  if (/notioncontent|notion context|notion/.test(t)) return "tests-notion";
  if (/audio|knight rider/.test(t)) return "tests-audio";
  if (/mobile detection/.test(t)) return "tests-mobile";
  if (/empty catch/.test(t)) return "code-health-catch";
  if (/matrix/.test(t)) return "misc-matrix";
  if (/test/.test(t)) return "tests-other";
  if (/perf|optim/.test(t)) return "perf-other";
  if (/code health|refactor|remove unused|cleanup|chore/.test(t)) return "code-health-other";
  return "misc";
}

const enriched = prs.map((pr) => ({
  number: pr.number,
  title: pr.title,
  branch: pr.headRefName,
  mergeable: pr.mergeable,
  additions: pr.additions,
  deletions: pr.deletions,
  changedFiles: pr.changedFiles,
  cluster: cluster(pr.title),
}));

const byCluster = {};
for (const pr of enriched) {
  (byCluster[pr.cluster] ||= []).push(pr);
}

console.log(JSON.stringify({ total: enriched.length, byCluster, prs: enriched }, null, 2));

const { execSync } = require("node:child_process");

function getGitCommitHash() {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

function getBuildDate() {
  return new Date().toISOString();
}

module.exports = {
  getGitCommitHash,
  getBuildDate,
};

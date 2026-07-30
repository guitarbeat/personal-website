const { execSync } = require("node:child_process");
const path = require("node:path");

const ROOT = path.join(__dirname, "..", "..");

function sh(cmd, { cwd = ROOT } = {}) {
  return execSync(cmd, {
    cwd,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();
}

function shTry(cmd, { cwd = ROOT } = {}) {
  try {
    return { ok: true, out: sh(cmd, { cwd }) };
  } catch (error) {
    return {
      ok: false,
      err: error.stderr?.toString() || error.message,
    };
  }
}

module.exports = { ROOT, sh, shTry };

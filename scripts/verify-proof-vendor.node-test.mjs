import assert from "node:assert/strict";
import {
  copyFile,
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test, { afterEach } from "node:test";
import { verifyProofVendor } from "./verify-proof-vendor.mjs";

const fixtureRoots = [];
const repoVendor = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../src/vendor/proof",
);

async function copyVendorTree(source, target) {
  const entries = await readdir(source, { withFileTypes: true });
  await mkdir(target, { recursive: true });
  for (const entry of entries) {
    const from = resolve(source, entry.name);
    const to = resolve(target, entry.name);
    if (entry.isDirectory()) {
      await copyVendorTree(from, to);
    } else if (entry.isFile()) {
      await copyFile(from, to);
    }
  }
}

async function fixtureFromRepoVendor() {
  const root = await mkdtemp(resolve(tmpdir(), "proof-verify-"));
  fixtureRoots.push(root);
  const target = resolve(root, "proof");
  await copyVendorTree(repoVendor, target);
  return target;
}

afterEach(async () => {
  await Promise.all(
    fixtureRoots.splice(0).map((root) =>
      rm(root, { force: true, recursive: true }),
    ),
  );
});

test("verifies a clean vendored Proof tree", async () => {
  const target = await fixtureFromRepoVendor();
  const result = await verifyProofVendor(target);
  assert.equal(result.package, "@aarons-sprites/proof-react");
  assert.equal(result.version, "0.2.0");
  assert.ok(result.fileCount > 0);
});

test("detects a missing vendored file", async () => {
  const target = await fixtureFromRepoVendor();
  await rm(resolve(target, "index.ts"));
  await assert.rejects(verifyProofVendor(target), /missing files: index\.ts/);
});

test("detects an edited vendored file", async () => {
  const target = await fixtureFromRepoVendor();
  await writeFile(resolve(target, "index.ts"), "// edited\n");
  await assert.rejects(verifyProofVendor(target), /were edited: index\.ts/);
});

test("detects an unexpected extra file", async () => {
  const target = await fixtureFromRepoVendor();
  await writeFile(resolve(target, "extra.ts"), "export {};\n");
  await assert.rejects(
    verifyProofVendor(target),
    /unexpected files: extra\.ts/,
  );
});

test("detects a stale manifest digest", async () => {
  const target = await fixtureFromRepoVendor();
  const manifestPath = resolve(target, ".proof-vendor.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.sourceDigest = "0".repeat(64);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await assert.rejects(verifyProofVendor(target), /stale or inconsistent/);
});

test("requires an absolute target path", async () => {
  await assert.rejects(
    verifyProofVendor("src/vendor/proof"),
    /absolute directory path/,
  );
});

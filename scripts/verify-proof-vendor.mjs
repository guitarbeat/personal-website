import { createHash } from "node:crypto";
import { lstat, readdir, readFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const MANIFEST_NAME = ".proof-vendor.json";
const SCHEMA_VERSION = 1;
const REQUIRED_ASSETS = ["assets/atlas.json", "assets/spritesheet.webp"];

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function portablePath(path) {
  return path.split(sep).join("/");
}

async function pathExists(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

async function listFiles(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((first, second) =>
    first.name.localeCompare(second.name),
  )) {
    const absolute = resolve(current, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`Vendor trees cannot contain symlinks: ${absolute}`);
    }
    if (entry.isDirectory()) {
      files.push(...(await listFiles(root, absolute)));
    } else if (entry.isFile()) {
      files.push(portablePath(relative(root, absolute)));
    } else {
      throw new Error(`Unsupported vendor tree entry: ${absolute}`);
    }
  }
  return files;
}

async function fileDigests(root, files) {
  const entries = await Promise.all(
    files.map(async (file) => [
      file,
      digest(await readFile(resolve(root, file))),
    ]),
  );
  return Object.fromEntries(entries);
}

function combinedDigest(files) {
  return digest(
    Object.entries(files)
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([file, hash]) => `${file}\0${hash}\n`)
      .join(""),
  );
}

function sameFileMap(first, second) {
  const firstEntries = Object.entries(first);
  const secondEntries = Object.entries(second);
  return (
    firstEntries.length === secondEntries.length &&
    firstEntries.every(([file, hash]) => second[file] === hash)
  );
}

export async function verifyProofVendor(target) {
  if (!target || !isAbsolute(target)) {
    throw new Error("Proof vendor target must be an absolute directory path.");
  }

  const resolvedTarget = resolve(target);
  if (!(await pathExists(resolvedTarget))) {
    throw new Error(`Proof vendor target is missing: ${resolvedTarget}`);
  }

  const manifestPath = resolve(resolvedTarget, MANIFEST_NAME);
  if (!(await pathExists(manifestPath))) {
    throw new Error(`Proof vendor is missing ${MANIFEST_NAME}.`);
  }

  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    throw new Error(`Could not read ${MANIFEST_NAME}: ${error.message}`);
  }

  if (
    manifest.schemaVersion !== SCHEMA_VERSION ||
    typeof manifest.package !== "string" ||
    typeof manifest.version !== "string" ||
    typeof manifest.sourceDigest !== "string" ||
    typeof manifest.atlasDigest !== "string" ||
    typeof manifest.files !== "object" ||
    manifest.files === null
  ) {
    throw new Error(`Unsupported or invalid ${MANIFEST_NAME}.`);
  }

  const actualFiles = (await listFiles(resolvedTarget)).filter(
    (file) => file !== MANIFEST_NAME,
  );
  const expectedFiles = Object.keys(manifest.files).sort((first, second) =>
    first.localeCompare(second),
  );
  const actualFileSet = new Set(actualFiles);
  const expectedFileSet = new Set(expectedFiles);

  const missing = expectedFiles.filter((file) => !actualFileSet.has(file));
  if (missing.length > 0) {
    throw new Error(`Proof vendor is missing files: ${missing.join(", ")}.`);
  }

  const unexpected = actualFiles.filter((file) => !expectedFileSet.has(file));
  if (unexpected.length > 0) {
    throw new Error(
      `Proof vendor has unexpected files: ${unexpected.join(", ")}.`,
    );
  }

  for (const asset of REQUIRED_ASSETS) {
    if (!expectedFileSet.has(asset)) {
      throw new Error(`Proof vendor manifest is missing ${asset}.`);
    }
  }

  const actualHashes = await fileDigests(resolvedTarget, actualFiles);
  const edited = expectedFiles.filter(
    (file) => actualHashes[file] !== manifest.files[file],
  );
  if (edited.length > 0) {
    throw new Error(`Proof vendor files were edited: ${edited.join(", ")}.`);
  }

  const expectedSourceDigest = combinedDigest(actualHashes);
  const expectedAtlasDigest = combinedDigest(
    Object.fromEntries(
      REQUIRED_ASSETS.map((asset) => [asset, actualHashes[asset]]),
    ),
  );

  if (
    manifest.sourceDigest !== expectedSourceDigest ||
    manifest.atlasDigest !== expectedAtlasDigest ||
    !sameFileMap(actualHashes, manifest.files)
  ) {
    throw new Error("Proof vendor manifest is stale or inconsistent.");
  }

  return {
    package: manifest.package,
    version: manifest.version,
    sourceDigest: manifest.sourceDigest,
    atlasDigest: manifest.atlasDigest,
    fileCount: actualFiles.length,
  };
}

function defaultTarget() {
  return resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../src/vendor/proof",
  );
}

async function main() {
  const targetArgumentIndex = process.argv.indexOf("--target");
  const target =
    targetArgumentIndex === -1
      ? defaultTarget()
      : process.argv[targetArgumentIndex + 1];

  const result = await verifyProofVendor(target);
  console.log(
    `Proof vendor verified (${result.package}@${result.version}, ${result.fileCount} files).`,
  );
}

const invokedPath = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : null;
if (invokedPath === import.meta.url) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

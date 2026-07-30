const fs = require("node:fs").promises;
const path = require("node:path");
const sharp = require("sharp");

// imagemin and its plugins are ESM-only, so they are loaded dynamically
const loadImagemin = async () => (await import("imagemin")).default;
const loadMozjpeg = async () => (await import("imagemin-mozjpeg")).default;
const loadPngquant = async () => (await import("imagemin-pngquant")).default;

const ROOT = path.resolve(__dirname, "..");
const imagesDir = path.join(ROOT, "src", "assets", "images");
const lcpDir = path.join(ROOT, "public", "lcp");
const LCP_AVATAR_MAX_PX = 400;
const PROFILE_AVATAR_PREFIX = "profile-avatar-";
const DEFAULT_LCP_BASENAME = "profile-avatar-default.webp";

async function listFiles(dir) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((d) => {
      const res = path.resolve(dir, d.name);
      return d.isDirectory() ? listFiles(res) : res;
    }),
  );
  return files.flat();
}

async function generateProfileWebp(sourcePath) {
  const baseName = path.basename(sourcePath, path.extname(sourcePath));
  if (!baseName.startsWith(PROFILE_AVATAR_PREFIX)) {
    return null;
  }

  const webpPath = path.join(path.dirname(sourcePath), `${baseName}.webp`);
  await sharp(sourcePath)
    .rotate()
    .resize(LCP_AVATAR_MAX_PX, LCP_AVATAR_MAX_PX, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82, effort: 4 })
    .toFile(webpPath);

  return webpPath;
}

async function syncDefaultLcpAsset(defaultWebpPath) {
  await fs.mkdir(lcpDir, { recursive: true });
  await fs.copyFile(defaultWebpPath, path.join(lcpDir, DEFAULT_LCP_BASENAME));
}

async function compressImages() {
  const imagemin = await loadImagemin();
  const imageminMozjpeg = await loadMozjpeg();
  const imageminPngquant = await loadPngquant();

  try {
    const allFiles = await listFiles(imagesDir);
    const images = allFiles.filter((f) => /\.(jpe?g|png)$/i.test(f));

    if (images.length === 0) {
      console.log("No images found to compress.");
      return;
    }

    await Promise.all(
      images.map(async (file) => {
        try {
          const data = await fs.readFile(file);
          const out = await imagemin.buffer(data, {
            plugins: [
              imageminMozjpeg({ quality: 75 }),
              imageminPngquant({ quality: [0.6, 0.8] }),
            ],
          });

          await fs.writeFile(file, out);
        } catch (err) {
          console.error(`Failed to compress ${file}:`, err);
        }
      }),
    );

    console.log(`Compressed ${images.length} images in place.`);

    const profileSources = images.filter((file) =>
      path.basename(file).startsWith(PROFILE_AVATAR_PREFIX),
    );
    let defaultWebpPath = null;

    for (const file of profileSources) {
      try {
        const webpPath = await generateProfileWebp(file);
        if (path.basename(webpPath) === DEFAULT_LCP_BASENAME) {
          defaultWebpPath = webpPath;
        }
      } catch (err) {
        console.error(`Failed to generate WebP for ${file}:`, err);
      }
    }

    if (defaultWebpPath) {
      await syncDefaultLcpAsset(defaultWebpPath);
      console.log(`Synced ${DEFAULT_LCP_BASENAME} to public/lcp/.`);
    } else {
      console.warn(
        `Missing ${DEFAULT_LCP_BASENAME}; public LCP preload may be stale.`,
      );
    }
  } catch (error) {
    console.error("Image compression failed:", error);
    process.exitCode = 1;
  }
}

compressImages();

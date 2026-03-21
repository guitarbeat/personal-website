// Health check endpoint for Vercel serverless function

// CORS configuration and module-level cache
let corsConfigCache = null;

const PRODUCTION_WHITELIST = [
  "https://aaronwoods.info",
  "https://www.aaronwoods.info",
  "https://pixel-pal-follow.lovable.app",
];

function isOriginAllowed(origin) {
  if (!origin) return false;

  // Build the cache if it doesn't exist
  if (!corsConfigCache) {
    const envOrigins = process.env.ALLOWED_ORIGINS;

    if (!envOrigins) {
      corsConfigCache = {
        exact: PRODUCTION_WHITELIST,
        regexes: [],
        allowAll: false,
      };
    } else if (envOrigins === "*") {
      corsConfigCache = {
        exact: [],
        regexes: [],
        allowAll: true,
      };
    } else {
      const parts = envOrigins
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const exact = [];
      const regexes = [];

      for (const part of parts) {
        if (part.includes("*")) {
          // Escape regex chars except *
          const escaped = part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          // Replace \* with .* or [^.]+
          const regexStr = `^${escaped.replace(/\\\*/g, ".*")}$`;
          regexes.push(new RegExp(regexStr));
        } else {
          exact.push(part);
        }
      }

      corsConfigCache = { exact, regexes, allowAll: false };
    }
  }

  if (corsConfigCache.allowAll) return true;
  if (corsConfigCache.exact.includes(origin)) return true;
  return corsConfigCache.regexes.some((regex) => regex.test(origin));
}

export default function handler(req, res) {
  const origin = req.headers.origin;
  if (isOriginAllowed(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET");

  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: "vercel-serverless",
  });
}

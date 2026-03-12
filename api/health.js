// Health check endpoint for Vercel serverless function

// Dynamically load CORS allowed origins from the ALLOWED_ORIGINS environment variable.
// Parsed configuration is cached at the module level for performance.
let cachedOrigins = null;

function isOriginAllowed(origin) {
  if (!origin) return false;

  if (!cachedOrigins) {
    const envOrigins = process.env.ALLOWED_ORIGINS;
    if (envOrigins) {
      cachedOrigins = envOrigins
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean);
    } else {
      // Strictly fall back to a production whitelist (omitting local dev URLs)
      cachedOrigins = [
        "https://aaronwoods.info",
        "https://www.aaronwoods.info",
        "https://pixel-pal-follow.lovable.app",
      ];
    }
  }

  if (cachedOrigins.includes("*")) return true;

  return cachedOrigins.some((allowed) => {
    if (allowed === origin) return true;
    if (allowed.includes("*")) {
      // Support regex-based subdomain wildcards (e.g., https://*.lovable.app)
      // Escaping regex special characters except asterisk
      const escaped = allowed.replace(/[.+?^$()|[\]\\]/g, "\\$&");
      const regexStr = `^${escaped.replace(/\*/g, "[^/]+")}$`;
      try {
        return new RegExp(regexStr).test(origin);
      } catch (_e) {
        return false;
      }
    }
    return false;
  });
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

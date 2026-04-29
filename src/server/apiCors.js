const PRODUCTION_WHITELIST = [
  "https://aaronwoods.info",
  "https://www.aaronwoods.info",
  "https://pixel-pal-follow.lovable.app",
];

let corsConfigCache = null;

function buildCorsConfig(env = process.env) {
  const envOrigins = env.ALLOWED_ORIGINS;

  if (!envOrigins) {
    return PRODUCTION_WHITELIST;
  }

  return envOrigins
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function isOriginAllowed(origin, env = process.env) {
  if (!origin) {
    return false;
  }

  if (!corsConfigCache) {
    corsConfigCache = buildCorsConfig(env);
  }

  return corsConfigCache.includes(origin);
}

export function applyCors(
  req,
  res,
  { methods = "GET", headers = "Content-Type", env = process.env } = {},
) {
  const origin = req.headers.origin;

  if (isOriginAllowed(origin, env)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", methods);
  res.setHeader("Access-Control-Allow-Headers", headers);
}

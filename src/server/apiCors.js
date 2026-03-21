const PRODUCTION_WHITELIST = [
  "https://aaronwoods.info",
  "https://www.aaronwoods.info",
  "https://pixel-pal-follow.lovable.app",
];

let corsConfigCache = null;

function buildCorsConfig(env = process.env) {
  const envOrigins = env.ALLOWED_ORIGINS;

  if (!envOrigins) {
    return {
      exact: PRODUCTION_WHITELIST,
      regexes: [],
      allowAll: false,
    };
  }

  if (envOrigins === "*") {
    return {
      exact: [],
      regexes: [],
      allowAll: true,
    };
  }

  const parts = envOrigins
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const exact = [];
  const regexes = [];

  for (const part of parts) {
    if (part.includes("*")) {
      const escaped = part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regexStr = `^${escaped.replace(/\\\*/g, ".*")}$`;
      regexes.push(new RegExp(regexStr));
    } else {
      exact.push(part);
    }
  }

  return { exact, regexes, allowAll: false };
}

export function isOriginAllowed(origin, env = process.env) {
  if (!origin) {
    return false;
  }

  if (!corsConfigCache) {
    corsConfigCache = buildCorsConfig(env);
  }

  if (corsConfigCache.allowAll) {
    return true;
  }

  if (corsConfigCache.exact.includes(origin)) {
    return true;
  }

  return corsConfigCache.regexes.some((regex) => regex.test(origin));
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

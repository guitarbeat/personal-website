const PRODUCTION_WHITELIST = [
  "https://aaronwoods.info",
  "https://www.aaronwoods.info",
  "https://pixel-pal-follow.lovable.app",
];

const corsConfigCache = new Map();

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
  const regexStrs = [];
  const ESCAPE_REGEX = /[.*+?^${}()|[\]\\]/g;
  const WILDCARD_REGEX = /\\\*/g;

  for (const part of parts) {
    if (part.includes("*")) {
      const escaped = part.replace(ESCAPE_REGEX, "\\$&");
      const regexStr = escaped.replace(WILDCARD_REGEX, "[a-zA-Z0-9-]+");
      regexStrs.push(regexStr);
    } else {
      exact.push(part);
    }
  }

  const regexes =
    regexStrs.length > 0 ? [new RegExp(`^(${regexStrs.join("|")})$`)] : [];

  return { exact, regexes, allowAll: false };
}

export function isOriginAllowed(origin, env = process.env) {
  if (!origin) {
    return false;
  }

  const envOrigins = env.ALLOWED_ORIGINS || "default";

  if (!corsConfigCache.has(envOrigins)) {
    corsConfigCache.set(envOrigins, buildCorsConfig(env));
  }

  const config = corsConfigCache.get(envOrigins);

  if (config.allowAll) {
    return true;
  }

  if (config.exact.includes(origin)) {
    return true;
  }

  return config.regexes.some((regex) => regex.test(origin));
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

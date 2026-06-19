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
  const regexes = [];

  for (const part of parts) {
    if (part.includes("*")) {
      // Security Fix: Prevent partial wildcard matching like https://*-domain.com
      // Only allow wildcards as full subdomains, e.g., https://*.example.com
      try {
        const _url = new URL(part.replace(/\*/g, 'test'));
        const originalHostParts = part.split('://')[1].split('/')[0].split('.');
        const isValidWildcard = originalHostParts.every(p => !p.includes('*') || p === '*');

        if (isValidWildcard) {
          const escaped = part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const regexStr = `^${escaped.replace(/\\\*/g, "[a-zA-Z0-9-]+")}$`;
          regexes.push(new RegExp(regexStr));
        }
      } catch (_e) {
        // Invalid URL structure, ignore
      }
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

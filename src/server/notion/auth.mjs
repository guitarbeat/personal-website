import crypto from "node:crypto";

function timingSafeCompare(a, b) {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }

  const aHash = crypto.createHash("sha256").update(a).digest();
  const bHash = crypto.createHash("sha256").update(b).digest();

  return crypto.timingSafeEqual(aHash, bHash);
}

export function isAuthorizedCronRequest(req, env = process.env) {
  const secret = env.CRON_SECRET;

  if (!secret) {
    return false;
  }

  const authorization = req.headers.authorization;
  const headerSecret = req.headers["x-cron-secret"];

  const isBearerValid = timingSafeCompare(
    authorization || "",
    `Bearer ${secret}`,
  );
  const isHeaderValid = timingSafeCompare(headerSecret || "", secret);

  return isBearerValid || isHeaderValid;
}

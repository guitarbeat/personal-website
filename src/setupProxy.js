const { createProxyMiddleware } = require("http-proxy-middleware");

/**
 * Proxies /api/* to the Vite dev server (local API routes in vite.config.ts).
 * Without this, CRACO serves index.html for /api/content and the client sees
 * "Content API returned an invalid response."
 *
 * Set CONTENT_API_PROXY_TARGET to override (e.g. a deployed preview).
 */
module.exports = function setupProxy(app) {
  const target =
    process.env.CONTENT_API_PROXY_TARGET || "http://127.0.0.1:8080";

  app.use(
    "/api",
    createProxyMiddleware({
      target,
      changeOrigin: true,
    }),
  );
};

// Health check endpoint for Vercel serverless function

// Get allowed origins from environment variable, fallback to defaults
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [
      "https://aaronwoods.info",
      "https://www.aaronwoods.info",
      "https://pixel-pal-follow.lovable.app",
      "http://localhost:3000",
      "http://localhost:5173",
    ];

export default function handler(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET");

  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: "vercel-serverless",
  });
}

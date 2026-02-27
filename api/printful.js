// Vercel Serverless Function for Printful API proxy
// This replaces the direct client-side calls to Printful API

const PRINTFUL_API_BASE = "https://api.printful.com";

// CORS origin whitelist
const ALLOWED_ORIGINS = [
  "https://aaronwoods.info",
  "https://www.aaronwoods.info",
  "https://pixel-pal-follow.lovable.app",
  "http://localhost:3000",
  "http://localhost:5173",
];

export default async function handler(req, res) {
  // Enable CORS with origin whitelist
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get Printful API key from environment variable
    const printfulApiKey = process.env.PRINTFUL_API_KEY;

    if (!printfulApiKey) {
      console.error("Printful API key not configured");
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Extract endpoint from query parameter
    // Expecting requests like /api/printful?endpoint=store/products&limit=10
    const { endpoint } = req.query;

    if (!endpoint) {
      return res.status(400).json({ error: "Endpoint parameter is required" });
    }

    // Validate endpoint to prevent SSRF
    // Allow alphanumeric characters, forward slash, underscore, hyphen, question mark, ampersand, and equals sign.
    // This allows query parameters (e.g., store/products?limit=10).
    if (!/^[a-zA-Z0-9\/_\-?&=]+$/.test(endpoint)) {
       return res.status(400).json({ error: "Invalid endpoint format" });
    }

    // Construct the full URL
    // Ensure we don't have double slashes
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint.substring(1) : endpoint;
    const url = `${PRINTFUL_API_BASE}/${cleanEndpoint}`;

    // Make request to Printful
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${printfulApiKey}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Printful API error:", data);
      return res.status(response.status).json({
        error: "Printful API request failed",
        details: data
      });
    }

    // Cache success responses
    // Cache for 5 minutes, allow stale for 1 hour
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=3600",
    );

    return res.status(200).json(data);

  } catch (error) {
    console.error("[Printful API] ERROR:", error.message, error.stack);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}

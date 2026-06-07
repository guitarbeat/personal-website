// Simple Express server to proxy Notion API requests
// This avoids CORS issues when calling Notion API from the browser

const express = require("express");
const cors = require("cors");

// Ensure fetch is available (Node 18+)
if (typeof fetch === "undefined") {
  global.fetch = require("node-fetch");
}
const app = express();
const PORT = 3001;

// Notion API configuration
const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";
const NOTION_TOKEN = process.env.NOTION_TOKEN;

// Database IDs
const DATABASE_IDS = {
  PROJECTS: "29dda682bcf6806eaa2efe20631dab6c",
  WORK: "b589d1ef5ef64b35abcc88558bf5574f",
  ABOUT: "aab0a96e279d48b6833f6727e6301266",
};

// Enable CORS for local development
const corsOptions = {
  origin: (origin, callback) => {
    if (
      !origin ||
      origin.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?$/)
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};
app.use(cors(corsOptions));

// Restrict to local loopback IPs
app.use((req, res, next) => {
  const localIps = ["127.0.0.1", "::1", "::ffff:127.0.0.1"];
  if (localIps.includes(req.ip) || !req.ip) {
    next();
  } else {
    res.status(403).json({ error: "Forbidden: Local access only" });
  }
});

app.use(express.json());

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Proxy endpoint for querying Notion databases
app.post("/api/notion/database/:databaseType/query", async (req, res) => {
  try {
    const { databaseType } = req.params;
    const databaseId = DATABASE_IDS[databaseType.toUpperCase()];

    if (!databaseId) {
      return res.status(400).json({ error: "Invalid database type" });
    }

    if (!NOTION_TOKEN) {
      return res.status(500).json({ error: "Notion token not configured" });
    }

    // Whitelist allowed payload fields to prevent injection
    const allowedFields = ["filter", "sorts", "page_size", "start_cursor"];
    const safeBody = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        safeBody[key] = req.body[key];
      }
    }

    const response = await fetch(
      `${NOTION_API_BASE}/databases/${databaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NOTION_TOKEN}`,
          "Notion-Version": NOTION_VERSION,
          "Content-Type": "application/json",
        },
        body:
          Object.keys(safeBody).length > 0
            ? JSON.stringify(safeBody)
            : undefined,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Notion API error:", data);
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Notion proxy server running on http://localhost:${PORT}`);
  console.log(`Notion token configured: ${!!NOTION_TOKEN}`);
});

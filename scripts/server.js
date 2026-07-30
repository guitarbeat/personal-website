// Simple Express server to proxy Notion API requests
// This avoids CORS issues when calling Notion API from the browser

const express = require("express");
const cors = require("cors");
const notionConfig = require("../config/notion.json");

// Ensure fetch is available (Node 18+)
if (typeof fetch === "undefined") {
  global.fetch = require("node-fetch");
}
const app = express();
const PORT = 3001;

const NOTION_API_BASE = notionConfig.apiBase;
const NOTION_VERSION = notionConfig.version;
const NOTION_TOKEN = process.env.NOTION_TOKEN;

const DATABASE_IDS = {
  PROJECTS: notionConfig.databases.projects,
  WORK: notionConfig.databases.work,
  ABOUT: notionConfig.databases.about,
};

// Enable CORS for local development
app.use(cors());
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

    const response = await fetch(
      `${NOTION_API_BASE}/databases/${databaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NOTION_TOKEN}`,
          "Notion-Version": NOTION_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
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

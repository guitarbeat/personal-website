const mockResponse = (payload, { ok = true, status = 200 } = {}) => ({
  ok,
  status,
  json: async () => payload,
});

const title = (text) => [{ plain_text: text }];
const richText = (text) => [{ plain_text: text }];

const createAboutPage = (category, description) => ({
  id: `${category.toLowerCase()}-page`,
  properties: {
    Category: { title: title(category) },
    Description: { rich_text: richText(description) },
  },
});

const createProjectPage = ({
  titleText,
  slug,
  keywords = ["React"],
  hook = `${titleText} hook`,
  detail = `${titleText} detail`,
  published = true,
  sortOrder = null,
  date = 2024,
} = {}) => ({
  id: `${slug}-page`,
  properties: {
    Name: { title: title(titleText) },
    Hook: { rich_text: hook ? richText(hook) : [] },
    Detail: { rich_text: detail ? richText(detail) : [] },
    Date: { number: date },
    Link: { url: `https://example.com/${slug}` },
    Slug: { rich_text: richText(slug) },
    Published: { checkbox: published },
    "Sort Order": { number: sortOrder },
    Keyword: {
      multi_select: keywords.map((keyword) => ({
        name: keyword,
      })),
    },
  },
});

const createWorkPage = ({
  titleText = "Engineer",
  slug = "engineer",
  from = "2024-01-01",
  to = "2024-06-01",
} = {}) => ({
  id: `${slug}-page`,
  properties: {
    Title: { title: title(titleText) },
    Company: { rich_text: richText("Acme Corp") },
    Description: { rich_text: richText("Building resilient systems.") },
    From: { date: { start: from } },
    To: { date: to ? { start: to } : null },
    Place: { rich_text: richText("Remote") },
    Slug: { rich_text: richText(slug) },
  },
});

const snapshotEnvelope = {
  schemaVersion: 3,
  updatedAt: "2026-03-21T10:00:00.000Z",
  datasetCounts: {
    about: 1,
    projects: 1,
    work: 1,
  },
  data: {
    about: [{ category: "Bio", description: "Hello" }],
    projects: [
      {
        title: "Snapshot Project",
        hook: "Cached hook",
        detail: "Cached detail",
        date: 2024,
        link: "https://example.com/snapshot-project",
        slug: "snapshot-project",
        image: null,
        keywords: ["Cached"],
      },
    ],
    work: [
      {
        title: "Snapshot Role",
        company: "Cached Corp",
        description: "Cached timeline entry",
        from: "01-2024",
        to: "06-2024",
        place: "Remote",
        slug: "snapshot-role",
      },
    ],
  },
};

module.exports = {
  createAboutPage,
  createProjectPage,
  createWorkPage,
  mockResponse,
  snapshotEnvelope,
};

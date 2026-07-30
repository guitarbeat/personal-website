# Archived maintenance scripts

One-off tools used during PR/branch cleanup (July 2026). Kept for reference; not part of day-to-day development.

- `split-notion-content.js` — split monolithic Notion server into `src/server/notion/` (barrel: `index.js`)
- `pr-cleanup-inventory.js` — enrich `gh pr list` JSON with cluster tags
- `pr-cleanup-run.js` — merge winners and close duplicate PRs
- `branch-cleanup-analyze.js` — classify remote branches for deletion
- `branch-cleanup-delete.js` — delete branches flagged by analyze script

Active scripts live in `scripts/` (e.g. `setup.sh`, `compress-images.js`, `server.js`).

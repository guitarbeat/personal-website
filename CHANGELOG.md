# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-07-29

### Added

- `CHANGELOG.md` and repository hygiene baseline
- Shared Notion config at `config/notion.json`
- Split Notion server modules under `src/server/notion/`
- Split Matrix effect into hooks and `HackTerminalPanel`
- `scripts/lib/exec.js` for shared shell helpers
- Archived one-off PR/branch cleanup scripts under `scripts/archive/`

### Changed

- `CONTRIBUTING.md` aligned with pnpm and dual CRACO/Vite workflow
- README project structure section updated for TypeScript and Notion
- `docs/DEVELOPMENT_NOTES.md` and `docs/CODE_AUDIT_REPORT.md` marked/refreshed for current stack
- Notion tests split into `src/server/notion/__tests__/`

### Removed

- Dead Google Sheets integration and related utilities
- Monolithic `notionContent.test.js` (replaced by module tests)

### Maintenance

- PR cleanup: 127 open PRs resolved (22 merged, 105 closed)
- Remote branch cleanup: orphan branches deleted; only `main` and `gh-pages` remain

[0.1.0]: https://github.com/guitarbeat/personal-website/releases/tag/v0.1.0

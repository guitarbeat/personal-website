# Personal Website

This is a personal website designed to highlight my work and experience. The site currently focuses on four primary sections—Header, About, Projects, and Work—that present a concise overview of who I am, what I build, and how I work.

The website is built with React, Sass, and modern JavaScript. Its layout emphasizes clarity and polish so visitors can quickly explore the featured sections and learn more about my background.

## Features

- Responsive layout optimized for both mobile and desktop viewing
- Hero-style header with social links, a theme toggle, and quick navigation
- About section with a concise biography and supplemental media embeds
- Projects grid that spotlights selected work with dynamic tag styling
- Work timeline outlining professional experience and key achievements
- Back to top button and sticky navigation for smooth browsing

## How to Use

Visit the live site on any device to explore the content. The navigation bar and in-page anchor links let you jump directly to the Header, About, Projects, and Work sections. Use the theme toggle in the header to switch between light and dark modes, and the floating back-to-top button to quickly return to the top of the page.

## Future Plans

Upcoming improvements include expanding the showcased projects, refining the work timeline with additional context, and introducing new interactive elements that complement the existing sections.

## Documentation

Detailed technical documentation, design specifications, and migration plans are available in the [docs/](docs/) folder:

- [Changelog](CHANGELOG.md) – Release history (current: v0.1.1).
- [Architecture](docs/ARCHITECTURE.md) – Dev/build flows, app layers, Notion and Sass maps.
- [Notion Integration](docs/NOTION_INTEGRATION.md) – Comprehensive guide for the Google Sheets to Notion migration.
- [Matrix Component](docs/MATRIX_COMPONENT.md) – Easter-egg authentication effect and usage notes.
- [Code Audit Report](docs/CODE_AUDIT_REPORT.md) – Security and quality analysis of the codebase.
- [Development Notes](docs/DEVELOPMENT_NOTES.md) – Technical notes and refactoring opportunities.
- [Archive](docs/archive/) – Historical implementation debates and analyses.

## Development Notes

- Run `./scripts/setup.sh` after cloning to install dependencies.
- Run `pnpm run compress-images` to compress JPEG/PNG files in place under `src/assets/images/`.
- A pre-commit hook runs this command automatically.
- Consider using Git LFS for large image files.
- [Vercel Analytics](https://vercel.com/docs/analytics/quickstart) and [Speed Insights](https://vercel.com/docs/speed-insights/quickstart) are included in the app bundle and activate automatically on Vercel deployments (enable each in the project dashboard).

## Project Structure

### Directory Overview

| Directory                  | Description                          | Key files                                              |
| -------------------------- | ------------------------------------ | ------------------------------------------------------ |
| `/docs`                    | Technical documentation and archives | `NOTION_INTEGRATION.md`, `DEVELOPMENT_NOTES.md`        |
| `/src`                     | TypeScript/React application source  | `App.tsx`, `index.tsx`                                 |
| `/src/components/content`  | Page sections                        | `About/`, `Header/`, `NavBar/`, `Projects/`, `Work/`   |
| `/src/components/effects`  | Visual effects                       | `Matrix/`, `Moire/`, `Blur/`, `Loading/`               |
| `/src/server/notion`       | Notion content API modules           | `api.js`, `snapshot.js`, `validate.js`                 |
| `/src/hooks`               | Custom React hooks                   | `useMobileDetection.ts`, `useScrollUtils.ts`           |
| `/src/utils`               | Shared utilities                     | `commonUtils.ts`, `audioUtils.ts`, `colorUtils.ts`     |
| `/api`                     | Vercel serverless routes             | `content.js`, `health.js`                              |
| `/config`                  | Shared configuration                 | `notion.json`                                          |
| `/public`                  | Static assets served as-is           | `index.html`                                           |

### Build outputs

| Path    | Tool                                           | Used for                         |
| ------- | ---------------------------------------------- | -------------------------------- |
| `dist/` | Vite (`pnpm run build` / `pnpm run build:dev`) | CI, Lighthouse, Vercel deploy    |

Both build scripts emit to `dist/`. `build:dev` uses Vite development mode flags (CI/Lighthouse); `build` is the production profile Vercel uses. Local dev uses `pnpm start` on port `8080`.

See [AGENTS.md](AGENTS.md) for the full command reference.

## Analysis Tools

- **Motion blur**: Toggle via `.motion-blur-on` and `.motion-blur-off` utility classes in [`src/sass/base/_utilities.scss`](src/sass/base/_utilities.scss).

## Component Documentation

See [docs/MATRIX_COMPONENT.md](docs/MATRIX_COMPONENT.md) for the Matrix easter-egg effect (`src/components/effects/Matrix/`).

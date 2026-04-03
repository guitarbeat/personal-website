# AGENTS.md

## Project Snapshot

- Personal website built with React, CRACO, Sass, and a supplemental Vite build path.
- Local interactive development still runs through CRACO and `react-scripts`.
- CI, Lighthouse, and the checked-in `dist/` output currently depend on the Vite build path.
- Production deploys to GitHub Pages use the CRACO build output in `build/`.

## Environment

- Preferred local runtime: Node.js `22.x` and `pnpm >= 9` (`package.json` engines).
- CI runtime: Node.js `20` with `pnpm 9` in GitHub Actions.
- Initial setup: `./scripts/setup.sh`
- Copy `.env.example` to `.env` when testing auth, Notion, Printful, or analytics paths.
- To match **Vercel serverless env** locally: run `vercel link` once, then `pnpm env:vercel` (Development → `.env.vercel.development`) and/or `pnpm env:vercel:prod` (Production → `.env.vercel.production`). Vite merges those before `.env` / `.env.local`. **Sensitive** vars are not included in CLI pulls — set those in `.env.local` manually. Do not commit env files.

## Daily Commands

### Core app

- `pnpm start` / `pnpm run dev`
  Starts Vite on port `8080` (local `/api/*` routes from `api/`) and CRACO on port `3000`, with `src/setupProxy.js` forwarding `/api` to Vite. Run these for interactive dev with live Notion content.
- `pnpm run dev:api`
  Vite only on `8080` (use if you run CRACO manually and need the API).
- `pnpm run build`
  Creates the production CRACO build in `build/`.
- `pnpm run build:dev`
  Runs the Vite build used by CI and Lighthouse. Output goes to `dist/`.
- `pnpm test`
  Runs the Jest test suite once with `--watchAll=false`.

### Quality checks

- `pnpm run lint`
  Runs Biome linting on `src/`.
- `pnpm run format`
  Formats `src/` with Biome.
- `pnpm run check`
  Runs `biome check --write .`.
- `pnpm exec tsc --noEmit`
  Matches the TypeScript GitHub Actions check.
- `pnpm run lint:md`
  Lints Markdown files with `markdownlint-cli2`.
- `pnpm run lint:md:fix`
  Auto-fixes Markdown lint issues where possible.
- `pnpm run sass:check`
  Compiles Sass into `public/build/css` as a verification step.

### Content and asset utilities

- `pnpm run compress-images`
  Compresses JPG and PNG assets in place under `src/assets/images`. The pre-commit hook runs this automatically.
- `node scripts/fix-ts-imports.js`
  One-off migration utility for removing extension suffixes from TS/TSX imports.

### Local services and verification

- `node scripts/server.js`
  Starts the local Notion proxy on `http://localhost:3001`.
- `python3 scripts/verify.py`
  Uses Playwright to capture a screenshot of the app at `http://localhost:3000` into `verification.png`.

### Deployment

- `pnpm run deploy`
  Publishes the CRACO `build/` directory to GitHub Pages.
- `pnpm run predeploy`
  Runs automatically before `pnpm run deploy` and builds the app.

## Workflow Map

### Local workflow

1. Run `./scripts/setup.sh`.
2. Start the app with `pnpm start`.
3. For source changes, prefer validating with `pnpm run lint`, `pnpm test`, and `pnpm run build:dev`.
4. For docs-only changes, run `pnpm run lint:md`.

### Git hooks

- `.husky/pre-commit` runs `pnpm run compress-images`.
- Expect image files under `src/assets/images` to be rewritten in place if they were changed.

### GitHub Actions

- `CI` (`.github/workflows/ci.yml`)
  Runs on pull requests and pushes to `main`. Installs with `pnpm`, then runs `pnpm run lint`, `pnpm test`, and `pnpm run build:dev`.
- `Code Quality` (`.github/workflows/code-quality.yml`)
  Runs on pull requests and pushes to `main`. Executes `pnpm exec biome check --write` and `pnpm exec tsc --noEmit`.
- `Lighthouse CI` (`.github/workflows/lighthouse.yml`)
  Runs on pull requests when app, public, build, or lockfile inputs change. Builds with `pnpm run build:dev` and uploads a temporary Lighthouse report.
- `Dependabot Auto-Merge` (`.github/workflows/dependabot-auto-merge.yml`)
  Auto-merges Dependabot patch and minor updates when the PR is eligible.

## Build Output Notes

- `build/` is the CRACO production bundle used by `pnpm run deploy`.
- `dist/` is the Vite bundle produced by `pnpm run build:dev` and referenced by CI-related workflows.
- Do not rewrite generated output directories unless the task requires updated build artifacts.

## Agent Guidance

- Prefer `pnpm` for local work and dependency installs; CI already uses `pnpm`.
- Keep the CRACO path and Vite path aligned when touching tooling, config, or environment variables.
- If you change Markdown docs, run `pnpm run lint:md`.
- If you change app code, run the narrowest relevant checks and note any checks you did not run.

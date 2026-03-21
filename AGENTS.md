# AGENTS.md

## Project Snapshot

- Personal website built with React, CRACO, Sass, and a supplemental Vite build path.
- Local interactive development still runs through CRACO and `react-scripts`.
- CI, Lighthouse, and the checked-in `dist/` output currently depend on the Vite build path.
- Production deploys to GitHub Pages use the CRACO build output in `build/`.

## Environment

- Preferred local runtime: Node.js `22.x` and `npm >= 8` (`package.json` engines).
- CI runtime: Node.js `20` with `pnpm 9` in GitHub Actions.
- Initial setup: `./scripts/setup.sh`
- Copy `.env.example` to `.env` when testing auth, Notion, Printful, or analytics paths.

## Daily Commands

### Core app

- `npm start`
  Starts the CRACO development server.
- `npm run dev`
  Alias for `npm start`.
- `npm run build`
  Creates the production CRACO build in `build/`.
- `npm run build:dev`
  Runs the Vite build used by CI and Lighthouse. Output goes to `dist/`.
- `npm test`
  Runs the Jest test suite once with `--watchAll=false`.

### Quality checks

- `npm run lint`
  Runs Biome linting on `src/`.
- `npm run format`
  Formats `src/` with Biome.
- `npm run check`
  Runs `biome check --write .`.
- `pnpm exec tsc --noEmit`
  Matches the TypeScript GitHub Actions check.
- `npm run lint:md`
  Lints Markdown files with `markdownlint-cli2`.
- `npm run lint:md:fix`
  Auto-fixes Markdown lint issues where possible.
- `npm run sass:check`
  Compiles Sass into `public/build/css` as a verification step.

### Content and asset utilities

- `npm run compress-images`
  Compresses JPG and PNG assets in place under `src/assets/images`. The pre-commit hook runs this automatically.
- `node scripts/fix-ts-imports.js`
  One-off migration utility for removing extension suffixes from TS/TSX imports.

### Local services and verification

- `node scripts/server.js`
  Starts the local Notion proxy on `http://localhost:3001`.
- `python3 scripts/verify.py`
  Uses Playwright to capture a screenshot of the app at `http://localhost:3000` into `verification.png`.

### Deployment

- `npm run deploy`
  Publishes the CRACO `build/` directory to GitHub Pages.
- `npm run predeploy`
  Runs automatically before `npm run deploy` and builds the app.

## Workflow Map

### Local workflow

1. Run `./scripts/setup.sh`.
2. Start the app with `npm start`.
3. For source changes, prefer validating with `npm run lint`, `npm test`, and `npm run build:dev`.
4. For docs-only changes, run `npm run lint:md`.

### Git hooks

- `.husky/pre-commit` runs `npm run compress-images`.
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

- `build/` is the CRACO production bundle used by `npm run deploy`.
- `dist/` is the Vite bundle produced by `npm run build:dev` and referenced by CI-related workflows.
- Do not rewrite generated output directories unless the task requires updated build artifacts.

## Agent Guidance

- Prefer `npm` scripts for local work unless you are explicitly reproducing CI, in which case use `pnpm`.
- Keep the CRACO path and Vite path aligned when touching tooling, config, or environment variables.
- If you change Markdown docs, run `npm run lint:md`.
- If you change app code, run the narrowest relevant checks and note any checks you did not run.

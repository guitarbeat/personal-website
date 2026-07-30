# AGENTS.md

## Project Snapshot

- Personal website built with React, TypeScript, Sass, and Vite.
- Local development and production builds both use **Vite** on port `8080` (`pnpm start`). Vite middleware serves local `/api/*` routes from [api/](api/).
- CI and Lighthouse use Vite; output goes to `dist/` (gitignored, built in CI).
- **Production hosting is Vercel only** — frontend and `/api/*` on the same project (`vercel.json`). Push to `main` or run `pnpm dlx vercel` to deploy.
- Tests run via `react-scripts` Jest (`pnpm test`) with the `@/` path alias.

## Environment

- Preferred local runtime: Node.js `22.x` and `pnpm >= 9` (`package.json` engines).
- CI runtime: Node.js `20` with `pnpm 9` in GitHub Actions.
- Initial setup: `./scripts/setup.sh`
- Copy `.env.example` to `.env` when testing auth, Notion, Printful, or analytics paths.
- To match **Vercel serverless env** locally: run `vercel link` once, then `pnpm env:vercel` (Development → `.env.vercel.development`) and/or `pnpm env:vercel:prod` (Production → `.env.vercel.production`). Vite merges those before `.env` / `.env.local`. **Sensitive** vars are not included in CLI pulls — set those in `.env.local` manually. Do not commit env files.

## Daily Commands

### Core app

- `pnpm start` / `pnpm run dev` / `pnpm run dev:api`
  Vite dev server on port `8080` (UI + local `/api/*` from [vite.config.ts](vite.config.ts)).
- `pnpm run build`
  Vite production build (`vite build`). Output goes to `dist/`. Matches what Vercel runs in production.
- `pnpm run build:dev`
  Vite build in development mode (`vite build --mode development`). Same output directory as `build`; used by CI and Lighthouse.
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
- `pnpm run sync:html`
  Regenerates root `index.html` from `scripts/html-head-snippet.html`. Edit the snippet, not the HTML file directly.
- `pnpm run sync:html:check`
  Fails if `index.html` drifted from the snippet (runs in Code Quality CI).
- `node scripts/fix-ts-imports.js`
  One-off migration utility for removing extension suffixes from TS/TSX imports.

### Local services and verification

- **Notion content locally:** `pnpm start` on `http://localhost:8080` — `/api/content` uses the same handlers as Vercel ([api/](api/) via Vite middleware).
- **`node scripts/server.js`** — legacy Express proxy on `:3001` from the pre–`/api/content` era; not used by the current app path.
- **`python3 scripts/verify.py`** — Playwright screenshot at `http://localhost:8080` into `verification.png`.

### Deployment

- **Vercel** — connect the repo or deploy with `pnpm dlx vercel` from a linked project. Custom domain: `https://woods.engineer` (configure in the Vercel dashboard).
- Pull env vars locally: `pnpm env:vercel` / `pnpm env:vercel:prod` after `vercel link`.

## Workflow Map

### Local workflow

1. Run `./scripts/setup.sh`.
2. Start the app with `pnpm start` and open `http://localhost:8080`.
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

- `dist/` is the Vite bundle from `pnpm run build`, `pnpm run build:dev`, and CI (not committed). Vercel serves this output in production.
- `public/build/css/` is Sass verification output from `pnpm run sass:check` (not committed).
- Do not rewrite generated output directories unless the task requires updated build artifacts.

## Agent Guidance

- Prefer `pnpm` for local work and dependency installs; CI already uses `pnpm`.
- Keep Vite config, env vars, and docs aligned when touching tooling (`REACT_APP_*` names are retained for compatibility).
- See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for module boundaries and request flows.
- If you change Markdown docs, run `pnpm run lint:md`.
- If you change app code, run the narrowest relevant checks and note any checks you did not run.

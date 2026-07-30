# Contributing

Thank you for your interest in contributing. This repo uses **pnpm**, **Vite** for production builds and deploy, and **CRACO** only for the local dev server on port `3000`.

## Development Setup

1. Fork and clone the repository.
2. Run the setup script (installs dependencies with pnpm):

   ```bash
   ./scripts/setup.sh
   ```

3. Copy `.env.example` to `.env` when testing Notion, auth, Printful, or analytics paths.
4. Start development (CRACO on `:3000`, Vite API on `:8080`):

   ```bash
   pnpm start
   ```

   Or run Vite API only if you manage CRACO separately:

   ```bash
   pnpm run dev:api
   ```

5. Create a feature branch from `main`.

See [AGENTS.md](AGENTS.md) for the full command reference, CI workflows, and environment notes.

## Tech Stack

- **React + TypeScript** with **Vite** (build/deploy) and **CRACO** (`react-scripts`, local dev only)
- **Sass** for styling
- **Biome** for linting and formatting
- **Jest** for tests
- **Husky** pre-commit hook (image compression)

## Code Quality

Run checks locally before pushing:

```bash
pnpm run lint
pnpm test
pnpm exec tsc --noEmit
pnpm run build:dev
```

For Markdown-only changes:

```bash
pnpm run lint:md
```

All PRs must pass CI before merging.

## Pull Request Process

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Make changes with clear commit messages
3. Push and open a PR against `main`
4. Ensure CI passes
5. Request review

## Commit Messages

Use clear, descriptive messages:

- `feat: add new feature`
- `fix: resolve bug`
- `docs: update documentation`
- `chore: maintenance task`

# Contributing

Thank you for your interest in contributing! Here's how to get started.

## Development Setup

1. Fork and clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Create a feature branch from `main`

## Tech Stack

- **React + TypeScript** with **Vite**
- **Biome** for linting & formatting
- **Stylelint** for SCSS
- **Husky + lint-staged** for pre-commit hooks

## Code Quality

This project enforces code quality standards automatically:

- **Biome** handles linting and formatting for TypeScript/React code
- **Stylelint** handles SCSS linting
- **Husky + lint-staged** run checks on staged files before each commit
- All PRs must pass CI checks before merging

Run checks locally before pushing:
```bash
npx biome check .
```

## Pull Request Process

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Make your changes and commit with clear messages
3. Push and open a PR against `main`
4. Ensure CI passes
5. Request review

## Commit Messages

Use clear, descriptive commit messages:

- `feat: add new feature`
- `fix: resolve bug`
- `docs: update documentation`
- `chore: maintenance task`

#!/bin/bash
# Install project dependencies for Codex testing and linting
pnpm install
pnpm exec husky install >/dev/null 2>&1 || true

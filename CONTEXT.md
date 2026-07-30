# Domain Glossary

Canonical terms for this project. Implementation details live in code and `AGENTS.md`.

## Design token bridge

Sass token maps compiled into runtime CSS custom properties (for example theme switching and semantic color variables).

## Enhanced tokens

Secondary Sass token maps consumed by `enhanced/*` style partials, distinct from core tokens under `sass/tokens/`. Runtime CSS custom properties for enhanced tokens are emitted through the design token bridge (see `docs/adr/0001-enhanced-css-variables-in-token-bridge.md`).

## In-place compression

Image optimization that overwrites JPEG/PNG source files under `src/assets/images/` with no separate output subfolder.

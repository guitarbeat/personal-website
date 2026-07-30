---
status: accepted
---

# Core vs enhanced Sass token maps

The stylesheet stack uses two complementary Sass token layers:

- **Core tokens** (`src/sass/tokens/_tokens.scss`) — legacy theme colors, spacing, typography, and layout values consumed across base styles, components, and the runtime CSS-variable bridge in `_css-variables.scss`.
- **Enhanced tokens** (`src/sass/enhanced/_tokens.scss`) — extended design-system maps (`$enhanced-*`) for navigation, micro-interactions, accessibility helpers, and advanced effects.

`main.scss` imports core tokens first, then enhanced partials. Enhanced files compile against Sass variables at build time; semantic runtime custom properties are emitted only through the core bridge (see [ADR 0001](0001-enhanced-css-variables-in-token-bridge.md)).

## Consequences

- Neither file alone is the full “single source of truth”; each owns a distinct layer.
- New shared values should land in core tokens when they affect global theme or `:root` variables, and in enhanced tokens when they are scoped to enhanced partials only.
- Enhanced partials share a repeated `@use` header (`sass:map`, `./tokens`, `./typography`, optional `./micro-interactions`). A shared `@forward` barrel was not adopted: duplicate `enhanced-type` functions and mixin scope rules under `@forward` break compilation.

---
status: accepted
---

# Core vs enhanced Sass token maps

The stylesheet stack uses two complementary Sass token layers:

- **Core tokens** (`src/sass/tokens/_tokens.scss`) — legacy theme colors, spacing, typography, and layout values consumed across base styles, components, and the runtime CSS-variable bridge in `_css-variables.scss`.
- **Enhanced tokens** (`src/sass/enhanced/_tokens.scss`) — extended design-system maps (`$enhanced-*`) for navigation, micro-interactions, accessibility helpers, and advanced effects.

`main.scss` imports core tokens first, then enhanced partials. Enhanced files compile against Sass variables at build time; semantic runtime custom properties are emitted only through the core bridge (see [ADR 0001](0001-enhanced-css-variables-in-token-bridge.md)).

## Typography accessors

`enhanced-type()` and related typography helpers live in `_typography.scss` and read from `tokens.$enhanced-*` maps. A duplicate `enhanced-type()` in `_tokens.scss` was removed; callers use `typography.enhanced-type()` (or unqualified calls inside `_typography.scss`).

## Import pattern (no shared barrel)

Enhanced partials repeat:

```scss
@use "sass:map";
@use "./tokens" as tokens;
@use "./typography" as typography; // when needed
@use "./micro-interactions" as interactions; // when needed
```

A shared `@forward` barrel was evaluated and rejected: Sass mixins that reference `tokens.$` lose that namespace when their module is loaded through a forward-only barrel (including top-level partials such as `_accessibility.scss`). Sub-partials that are `@forward`ed have the same constraint.

## Consequences

- Neither token file alone is the full “single source of truth”; each owns a distinct layer.
- New shared values should land in core tokens when they affect global theme or `:root` variables, and in enhanced tokens when they are scoped to enhanced partials only.
- Do not reintroduce duplicate function names across `_tokens.scss` and `_typography.scss`.

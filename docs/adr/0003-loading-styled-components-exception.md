---
status: accepted
---

# Loading effects use styled-components

Most UI styling uses Sass ([src/sass/main.scss](../src/sass/main.scss)). The initial loading sequence ([FrameEffect.tsx](../src/components/effects/Loading/FrameEffect.tsx), [LoadingSequence.tsx](../src/components/effects/Loading/LoadingSequence.tsx)) uses `styled-components` for animated frame chrome.

## Decision

Keep `styled-components` scoped to Loading effects until those components are rewritten in Sass or removed. Do not add new styled-components usage elsewhere without an ADR update.

## Consequences

- `styled-components` remains a production dependency.
- Theme tokens from Sass are not automatically shared with Loading styled wrappers; keep visual tweaks localized to those files.

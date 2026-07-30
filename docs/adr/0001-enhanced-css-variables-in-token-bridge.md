---
status: accepted
---

# Enhanced runtime CSS variables emit through the core token bridge

The site maintains two Sass token maps: core tokens in `src/sass/tokens/_tokens.scss` and enhanced tokens in `src/sass/enhanced/_tokens.scss`. Enhanced partials consume Sass variables at compile time, but several also reference runtime custom properties such as `var(--text-primary)` that were previously defined only in an unused `enhanced/_css-variables.scss` file.

We merged enhanced runtime variable generation into `src/sass/tokens/_css-variables.scss` and deleted the orphan enhanced copy. Enhanced Sass maps stay in `enhanced/_tokens.scss`; only the core bridge file emits `:root`, `.dark-theme`, and related CSS custom properties.

## Considered options

- **Wire `enhanced/_css-variables.scss` into `main.scss`** — rejected because it duplicated bridge logic and split runtime variables across two generators.
- **Delete the orphan file without merging** — rejected because styles already referenced undefined variables at runtime.
- **Merge into the core bridge (chosen)** — one import path in `main.scss`, restored semantic variables, explicit conflict rules for overlapping keys.

## Consequences

- Overlapping `--shadow-*` and `--font-weight-*` keys prefer enhanced values when both maps define the same name.
- Enhanced semantic spacing (`--spacing-xs`, etc.) is omitted from the bridge to avoid overwriting core spacing names with different values; enhanced numeric scale (`--spacing-0` … `--spacing-15`) is emitted instead.
- The `.text-primary` helper class (sage brand color) remains separate from the `--text-primary` custom property (semantic body text).

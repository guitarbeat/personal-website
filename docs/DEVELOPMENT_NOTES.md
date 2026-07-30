# Development Notes

Reference documentation for troubleshooting and future improvements.

> **Data source:** Content is loaded from **Notion** via `src/server/notion/` and `NotionContext`. Google Sheets integration was removed in 2026.

## Known Issues & Fixes

### TypeScript Event Listener Error

- **Error**: `TS2769: No overload matches this call` for `addEventListener` with `handleScroll`
- **Root cause**: Throttle function returned a callback without proper event parameter typing
- **Fix**: Added event parameter to throttled handlers
- **File**: `src/components/effects/Moire/Moire.tsx`

### Node.js Version Conflicts

- **Error**: Deprecated Node.js 18.x warning in deployments
- **Root cause**: Duplicate `engines` specifications with conflicting versions
- **Fix**: Removed duplicate, kept single engines block with Node 22.x
- **File**: `package.json`

## Refactoring Opportunities

### 1. Unify Navigation Bar Dragging

`NavBar` has separate touch and mouse event handlers doing similar work.

- **Suggestion**: Use pointer events or a shared drag-handler utility
- **Benefits**: Fewer callbacks, less duplication
- **File**: `src/components/content/NavBar/NavBar.tsx`

### 2. Extract Expandable Card Pattern

Projects and Work both reveal extra content on interaction, but the patterns differ enough that a shared hook is not a drop-in refactor yet.

- **Projects**: Per-card click-to-reveal (`isClicked` on each `ProjectCard`); filter bar uses an `activeFilters` string array unrelated to card expansion
- **Work**: Multi-select `activeCards` `Set` synced with the timeline (`TimelineBar`, hover state, `aria-expanded` on job buttons)
- **Suggestion**: A future `useExpandableCards` hook would need to support both single-card reveal and multi-select Set modes, or stay thin (Set state + toggle only) with section-specific markup kept separate
- **Files**: `src/components/content/Projects/Projects.tsx`, `src/components/content/Work/Work.tsx`

### 3. Externalize Filter Button Styling

Project filters rebuild inline style objects on every render.

- **Suggestion**: SCSS modifiers (e.g. `.tag--active`) or a `getTagStyles()` helper
- **Benefits**: Cleaner JSX, easier maintenance
- **File**: `src/components/content/Projects/Projects.tsx`

### 4. Slim `App.tsx`

Routing, auth gate, and layout still live in one ~450-line component.

- **Suggestion**: Extract route config and layout shell
- **File**: `src/App.tsx`

## Notes

- These improvements are optional optimizations
- Current implementation works well
- Prioritize based on development needs

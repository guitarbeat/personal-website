💡 **What:** Optimize the O(M * N) complexity in the filter callback to O(M) by converting the `allKeywords` array into a `Set` for O(1) lookups.
🎯 **Why:** `allKeywords.includes(filter)` is called for each item during theme change. A Set reduces the time complexity significantly.
📊 **Measured Improvement:** In a standalone benchmark, using `Set.has()` took 201.67ms compared to `Array.includes()` at 22996.10ms (114x faster for 10000 iterations over 500 items against 1000 items).
✅ **Verification:** The targeted component tests (`pnpm test src/components/content/Projects`) ran successfully. The full test suite (`pnpm run test`) fails due to pre-existing, out-of-scope errors. The linting check `npx @biomejs/biome check src/components/content/Projects/Projects.tsx` also passed successfully.
✨ **Result:** Faster and more efficient updates in `Projects` during rendering and theme changes.

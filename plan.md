1. **Analyze:** We need to fix the "Overly Long Function" issue in `src/components/effects/Moire/Moire.tsx`. The `MagicComponent` function is long because all of the WebGL initialization, rendering loop, and event listener setups are defined directly inside `useEffect`.
2. **Refactor:** Extract the core OGL logic (initialization, `resize`, `initScene`, `initPointsMesh`, `animate`, event setup, and cleanup) into a separate function `initMoireEffect` (or a class) outside of the React component `MagicComponent`. This keeps the React component lean and readable, while separating the imperative WebGL code.
3. **Verify:**
   - Run formatting and linting: `npx @biomejs/biome check --write src/components/effects/Moire/Moire.tsx`
   - Run tests: `pnpm test src/components/effects/Moire/Moire.test.tsx`

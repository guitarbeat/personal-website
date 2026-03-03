Title: "🧹 Remove deprecated throttleTS alias and standardise throttle usage"
Description:
* 🎯 **What:** Removed the `throttleTS` alias from `src/utils/commonUtils.ts` and replaced its usage with the standard `throttle` function in `src/components/effects/Blur/scrollSpeed.ts`.
* 💡 **Why:** This change standardises code conventions by relying on a single underlying throttle implementation rather than maintaining redundant backward-compatibility aliases, thereby improving maintainability and reducing confusion for developers.
* ✅ **Verification:**
  - Ran `npx biome format` and `npx biome lint` to ensure code style consistency.
  - Re-ran the full Jest test suite with JSDOM configured (`npm test`/`npx jest`) confirming all unit tests across `commonUtils.test.ts` passed successfully.
  - Used an explicit Node standalone script (`scripts/verify_fix.ts`) to further validate `throttle` execution semantics independent of Jest's fake timers configuration.
* ✨ **Result:** A cleaner utility file with identical functionality, zero impact to runtime behavior, and a unified internal vocabulary for limiting execution frequency.

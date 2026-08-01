# Matrix unlock is presentational, not a security boundary

Completing the Matrix hack flips an Unlock flag that removes a CSS blur, mounts
the custom cursor, and reveals a nav item — but every byte of the "gated"
content is already in the DOM and readable in devtools. This is deliberate: the
site is a public portfolio, so the unlock is a themed reveal, and keeping it
client-only preserves plain static hosting, full crawlability, and a single
Vite build with no server-rendered auth path.

## Consequences

The word "authentication" is wrong for this feature and is retired from the
codebase (see the **Unlock** entry in [CONTEXT.md](../../CONTEXT.md)). The
earlier `AuthContext` / `SECURITY.SESSION` naming implied a boundary that never
existed and led readers to assume the blur protected something.

Anyone reviewing this code will correctly observe that the blur can be removed
from devtools. That is not a vulnerability to fix — it is the design. If content
ever genuinely needs protecting, the fix is server-side gating, not hardening
the overlay.

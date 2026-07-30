# Proof Companion

Proof is the site companion on unlocked routes. Source is vendored from
`@aarons-sprites/proof-react` into [`src/vendor/proof/`](../src/vendor/proof/) —
private, not an npm install.

## Mount gates

`App` lazy-loads [`SiteProof`](../src/components/effects/Proof/SiteProof.tsx)
only when all of these are true:

1. The visitor is unlocked (`AuthContext`)
2. The initial loader has finished exiting
3. The Matrix overlay is closed

Locked visitors never download the atlas or the `SiteProof` chunk. While Matrix
is open, Proof stays unmounted even if the session is already unlocked.

Use `canMountSiteProof` from `siteProofMount.ts` for the shared predicate.

## Site configuration

| Setting | Value |
| --- | --- |
| Desktop size | `208` px |
| Mobile size | `160` px |
| Placement | `bottom-right` |
| Inset | `72` px |
| Storage key | `woods-engineer-proof-position` |
| Label | `Proof, site companion` |
| Stacking | `--z-index-proof` (`35`), below nav, Matrix, loaders, modals, and the custom cursor |

`SiteProof` owns those knobs. Do not edit files under `src/vendor/proof/`;
re-vendor from `aarons-sprites` instead.

## Vendor sync

From an `aarons-sprites` checkout (after building Proof):

```bash
npm run proof:vendor -- \
  --target /absolute/path/to/personal-website/src/vendor/proof
```

Check without writing:

```bash
npm run proof:vendor -- \
  --target /absolute/path/to/personal-website/src/vendor/proof \
  --check
```

The export writes typed source, the atlas, and `.proof-vendor.json` with
per-file SHA-256 digests. Later syncs refuse consumer edits, missing files, or
unexpected files. Keep site wrappers (like `SiteProof`) outside that directory.

## Verification

```bash
pnpm run verify:proof          # read-only manifest check
pnpm run test:proof-vendor     # fixture tests for clean / missing / edited / stale / extra
```

Code Quality CI runs both. Biome ignores `src/vendor/**` so formatting cannot
invalidate the hashes.

## Related

- Matrix unlock flow: [MATRIX_COMPONENT.md](MATRIX_COMPONENT.md)
- Vendored package version: see `src/vendor/proof/.proof-vendor.json`

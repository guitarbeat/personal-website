import { useMobileDetection } from "@/hooks/useMobileDetection";
import { ProofCompanion } from "@/vendor/proof";

const PROOF_STORAGE_KEY = "woods-engineer-proof-position";
const PROOF_INSET = 72;
const PROOF_DESKTOP_SIZE = 208;
const PROOF_MOBILE_SIZE = 160;

/**
 * Site-owned Proof wrapper. Mount only after `canMountSiteProof` is true so
 * locked visitors never download the atlas.
 */
export function SiteProof() {
  const { isMobile } = useMobileDetection();

  return (
    <ProofCompanion
      size={isMobile ? PROOF_MOBILE_SIZE : PROOF_DESKTOP_SIZE}
      placement="bottom-right"
      inset={PROOF_INSET}
      persistPosition
      storageKey={PROOF_STORAGE_KEY}
      aria-label="Proof, site companion"
      style={{ zIndex: "var(--z-index-proof)" }}
    />
  );
}

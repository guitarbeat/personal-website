export type SiteProofMountState = {
  isUnlocked: boolean;
  isInitialLoaderVisible: boolean;
  showMatrix: boolean;
};

/** Shared App gate: unlock + loader exited + Matrix closed. */
export function canMountSiteProof({
  isUnlocked,
  isInitialLoaderVisible,
  showMatrix,
}: SiteProofMountState): boolean {
  return isUnlocked && !isInitialLoaderVisible && !showMatrix;
}

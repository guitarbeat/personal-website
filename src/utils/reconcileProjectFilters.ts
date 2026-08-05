export function reconcileProjectFilters(
  prevFilters: Set<string>,
  allKeywords: string[],
): Set<string> {
  if (prevFilters.size === 0) {
    return new Set(allKeywords);
  }

  const allKeywordsSet = new Set(allKeywords);
  const filtered = new Set<string>();

  for (const filter of prevFilters) {
    if (allKeywordsSet.has(filter)) {
      filtered.add(filter);
    }
  }

  if (filtered.size === 0) {
    return new Set(allKeywords);
  }

  return filtered;
}

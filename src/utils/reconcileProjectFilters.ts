export function reconcileProjectFilters(
  prevFilters: string[],
  allKeywords: string[],
): string[] {
  if (prevFilters.length === 0) {
    return allKeywords;
  }

  const allKeywordsSet = new Set(allKeywords);
  const filtered = prevFilters.filter((filter) =>
    allKeywordsSet.has(filter),
  );

  if (filtered.length === 0) {
    return allKeywords;
  }

  return filtered;
}

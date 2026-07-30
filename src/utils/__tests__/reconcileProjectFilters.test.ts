import { reconcileProjectFilters } from "../reconcileProjectFilters";

describe("reconcileProjectFilters", () => {
  const allKeywords = ["React", "Node", "Data"];

  it("returns all keywords when previous filters are empty", () => {
    expect(reconcileProjectFilters([], allKeywords)).toEqual(allKeywords);
  });

  it("keeps still-valid previous filters", () => {
    expect(reconcileProjectFilters(["React", "Node"], allKeywords)).toEqual([
      "React",
      "Node",
    ]);
  });

  it("falls back to all keywords when no previous filters remain valid", () => {
    expect(reconcileProjectFilters(["Legacy"], allKeywords)).toEqual(allKeywords);
  });
});

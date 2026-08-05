import { reconcileProjectFilters } from "../reconcileProjectFilters";

describe("reconcileProjectFilters", () => {
  const allKeywords = ["React", "Node", "Data"];

  it("returns all keywords when previous filters are empty", () => {
    expect(reconcileProjectFilters(new Set(), allKeywords)).toEqual(new Set(allKeywords));
  });

  it("keeps still-valid previous filters", () => {
    expect(reconcileProjectFilters(new Set(["React", "Node"]), allKeywords)).toEqual(
      new Set(["React", "Node"]),
    );
  });

  it("falls back to all keywords when no previous filters remain valid", () => {
    expect(reconcileProjectFilters(new Set(["Legacy"]), allKeywords)).toEqual(
      new Set(allKeywords),
    );
  });
});

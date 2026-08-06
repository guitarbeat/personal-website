import { shouldShowMatrixFromSearch } from "../useMatrixActivation";

describe("shouldShowMatrixFromSearch", () => {
  it("returns false when no matrix parameter is present", () => {
    expect(shouldShowMatrixFromSearch("")).toBe(false);
    expect(shouldShowMatrixFromSearch("?other=1")).toBe(false);
  });

  it("returns false when matrix parameter has no value", () => {
    expect(shouldShowMatrixFromSearch("?matrix=")).toBe(false);
  });

  it("returns true for enabled values", () => {
    expect(shouldShowMatrixFromSearch("?matrix=1")).toBe(true);
    expect(shouldShowMatrixFromSearch("?matrix=true")).toBe(true);
    expect(shouldShowMatrixFromSearch("?matrix=on")).toBe(true);
    expect(shouldShowMatrixFromSearch("?matrix=yes")).toBe(true);
  });

  it("returns false for disabled values", () => {
    expect(shouldShowMatrixFromSearch("?matrix=0")).toBe(false);
    expect(shouldShowMatrixFromSearch("?matrix=false")).toBe(false);
    expect(shouldShowMatrixFromSearch("?matrix=off")).toBe(false);
    expect(shouldShowMatrixFromSearch("?matrix=no")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(shouldShowMatrixFromSearch("?matrix=TRUE")).toBe(true);
    expect(shouldShowMatrixFromSearch("?matrix=Yes")).toBe(true);
    expect(shouldShowMatrixFromSearch("?matrix=OFF")).toBe(false);
  });

  it("trims whitespace from values", () => {
    expect(shouldShowMatrixFromSearch("?matrix= true ")).toBe(true);
    expect(shouldShowMatrixFromSearch("?matrix=  1  ")).toBe(true);
    expect(shouldShowMatrixFromSearch("?matrix= off ")).toBe(false);
  });

  it("returns false for unrecognized values", () => {
    expect(shouldShowMatrixFromSearch("?matrix=2")).toBe(false);
    expect(shouldShowMatrixFromSearch("?matrix=blah")).toBe(false);
    expect(shouldShowMatrixFromSearch("?matrix=maybe")).toBe(false);
  });

  it("handles URLSearchParams objects", () => {
    const params = new URLSearchParams("?matrix=yes");
    expect(shouldShowMatrixFromSearch(params)).toBe(true);

    const params2 = new URLSearchParams("?matrix=false");
    expect(shouldShowMatrixFromSearch(params2)).toBe(false);

    const emptyParams = new URLSearchParams();
    expect(shouldShowMatrixFromSearch(emptyParams)).toBe(false);
  });

  it("handles invalid input gracefully", () => {
    // @ts-expect-error Testing invalid input type
    expect(shouldShowMatrixFromSearch(null)).toBe(false);
    // @ts-expect-error Testing invalid input type
    expect(shouldShowMatrixFromSearch(undefined)).toBe(false);
    // @ts-expect-error Testing invalid input type
    expect(shouldShowMatrixFromSearch(123)).toBe(false);
    // @ts-expect-error Testing invalid input type
    expect(shouldShowMatrixFromSearch({})).toBe(false);
  });
});

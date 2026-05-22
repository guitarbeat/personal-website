import { isOriginAllowed } from "../apiCors.js";

describe("apiCors", () => {
  it("should isolate caches per environment", () => {
    const env1 = { ALLOWED_ORIGINS: "https://example1.com" };
    const env2 = { ALLOWED_ORIGINS: "https://example2.com" };

    // Initially call with env1
    expect(isOriginAllowed("https://example1.com", env1)).toBe(true);
    expect(isOriginAllowed("https://example2.com", env1)).toBe(false);

    // Call with env2 - should not use cached config from env1
    expect(isOriginAllowed("https://example1.com", env2)).toBe(false);
    expect(isOriginAllowed("https://example2.com", env2)).toBe(true);
  });

  it("should fallback to production whitelist if no ALLOWED_ORIGINS", () => {
    const env = {};
    expect(isOriginAllowed("https://aaronwoods.info", env)).toBe(true);
    expect(isOriginAllowed("https://example.com", env)).toBe(false);
  });

  it("should allow all if ALLOWED_ORIGINS is *", () => {
    const env = { ALLOWED_ORIGINS: "*" };
    expect(isOriginAllowed("https://aaronwoods.info", env)).toBe(true);
    expect(isOriginAllowed("https://example.com", env)).toBe(true);
    expect(isOriginAllowed("http://localhost:3000", env)).toBe(true);
  });

  it("should support regex matching", () => {
    const env = { ALLOWED_ORIGINS: "https://*.example.com" };
    expect(isOriginAllowed("https://api.example.com", env)).toBe(true);
    expect(isOriginAllowed("https://www.example.com", env)).toBe(true);
    expect(isOriginAllowed("https://example.com", env)).toBe(false);
  });
});

import { isOriginAllowed } from "./apiCors.js";

describe("apiCors", () => {
  it("should block empty origins", () => {
    expect(isOriginAllowed("", { ALLOWED_ORIGINS: "https://example.com" })).toBe(false);
    expect(isOriginAllowed(null, { ALLOWED_ORIGINS: "https://example.com" })).toBe(false);
    expect(isOriginAllowed(undefined, { ALLOWED_ORIGINS: "https://example.com" })).toBe(false);
  });

  it("should evaluate global allow wildcard correctly", () => {
    expect(isOriginAllowed("https://anything.com", { ALLOWED_ORIGINS: "*" })).toBe(true);
    expect(isOriginAllowed("http://localhost:3000", { ALLOWED_ORIGINS: "*" })).toBe(true);
  });

  it("should match exact origins", () => {
    const env = { ALLOWED_ORIGINS: "https://example.com,https://test.com" };
    expect(isOriginAllowed("https://example.com", env)).toBe(true);
    expect(isOriginAllowed("https://test.com", env)).toBe(true);
    expect(isOriginAllowed("https://other.com", env)).toBe(false);
  });

  it("should match wildcard domain origins securely", () => {
    const env = { ALLOWED_ORIGINS: "https://*.example.com" };
    expect(isOriginAllowed("https://app.example.com", env)).toBe(true);
    expect(isOriginAllowed("https://test.example.com", env)).toBe(true);
    // Should NOT match evil domain extensions or paths
    expect(isOriginAllowed("https://example.com.evil.com", env)).toBe(false);
    expect(isOriginAllowed("https://evil.example.com.evil.com", env)).toBe(false);
  });

  it("should block invalid wildcard placements to prevent permissive matching", () => {
    // Should NOT allow partial subdomains like *-domain.com
    const envPrefix = { ALLOWED_ORIGINS: "https://*-domain.com" };
    expect(isOriginAllowed("https://attacker-domain.com", envPrefix)).toBe(false);

    const envSuffix = { ALLOWED_ORIGINS: "https://domain-*.com" };
    expect(isOriginAllowed("https://domain-attacker.com", envSuffix)).toBe(false);
  });

  it("should correctly cache per environment string rather than globally", () => {
    const env1 = { ALLOWED_ORIGINS: "https://env1.com" };
    const env2 = { ALLOWED_ORIGINS: "https://env2.com" };

    // Initially call env1
    expect(isOriginAllowed("https://env1.com", env1)).toBe(true);
    expect(isOriginAllowed("https://env2.com", env1)).toBe(false);

    // Now call env2 - it should not be polluted by env1's cache
    expect(isOriginAllowed("https://env2.com", env2)).toBe(true);
    expect(isOriginAllowed("https://env1.com", env2)).toBe(false);
  });
});

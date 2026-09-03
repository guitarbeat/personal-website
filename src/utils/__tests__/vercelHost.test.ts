import { isVercelHostedBuild, SITE_ORIGIN } from "../vercelHost";

describe("vercelHost", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("isVercelHostedBuild", () => {
    it("returns true when process.env.VERCEL is '1'", () => {
      process.env.VERCEL = "1";
      expect(isVercelHostedBuild()).toBe(true);
    });

    it("returns false when process.env.VERCEL is not '1'", () => {
      process.env.VERCEL = "0";
      expect(isVercelHostedBuild()).toBe(false);

      process.env.VERCEL = "true";
      expect(isVercelHostedBuild()).toBe(false);
    });

    it("returns false when process.env.VERCEL is undefined", () => {
      delete process.env.VERCEL;
      expect(isVercelHostedBuild()).toBe(false);
    });
  });

  describe("SITE_ORIGIN", () => {
    it("exports the correct site origin", () => {
      expect(SITE_ORIGIN).toBe("https://woods.engineer");
    });
  });
});

import { isVercelHostedBuild, SITE_ORIGIN } from "../vercelHost";

describe("vercelHost", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("isVercelHostedBuild", () => {
    it('should return true when process.env.VERCEL is "1"', () => {
      process.env.VERCEL = "1";
      expect(isVercelHostedBuild()).toBe(true);
    });

    it('should return false when process.env.VERCEL is "0"', () => {
      process.env.VERCEL = "0";
      expect(isVercelHostedBuild()).toBe(false);
    });

    it("should return false when process.env.VERCEL is undefined", () => {
      delete process.env.VERCEL;
      expect(isVercelHostedBuild()).toBe(false);
    });
  });

  describe("SITE_ORIGIN", () => {
    it("should export the correct canonical production origin", () => {
      expect(SITE_ORIGIN).toBe("https://woods.engineer");
    });
  });
});

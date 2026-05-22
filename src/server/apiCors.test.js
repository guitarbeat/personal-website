
describe('apiCors', () => {
  let originalEnv;

  beforeEach(() => {
    // Save original env
    originalEnv = process.env;
    // Reset module registry to clear corsConfigCache
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('isOriginAllowed', () => {
    it('returns false when no origin is provided', async () => {
      const { isOriginAllowed } = await import('./apiCors');
      expect(isOriginAllowed(undefined)).toBe(false);
      expect(isOriginAllowed('')).toBe(false);
      expect(isOriginAllowed(null)).toBe(false);
    });

    it('uses PRODUCTION_WHITELIST when ALLOWED_ORIGINS is not set', async () => {
      const { isOriginAllowed } = await import('./apiCors');
      const mockEnv = {};

      expect(isOriginAllowed('https://aaronwoods.info', mockEnv)).toBe(true);
      expect(isOriginAllowed('https://www.aaronwoods.info', mockEnv)).toBe(true);
      expect(isOriginAllowed('https://pixel-pal-follow.lovable.app', mockEnv)).toBe(true);

      // Blocked origins
      expect(isOriginAllowed('http://localhost:3000', mockEnv)).toBe(false);
      expect(isOriginAllowed('https://malicious.com', mockEnv)).toBe(false);
    });

    it('allows any origin when ALLOWED_ORIGINS is "*"', async () => {
      const { isOriginAllowed } = await import('./apiCors');
      const mockEnv = { ALLOWED_ORIGINS: '*' };

      expect(isOriginAllowed('https://example.com', mockEnv)).toBe(true);
      expect(isOriginAllowed('http://localhost:3000', mockEnv)).toBe(true);
      expect(isOriginAllowed('https://any-domain.org', mockEnv)).toBe(true);
    });

    it('allows specific comma-separated origins', async () => {
      const { isOriginAllowed } = await import('./apiCors');
      const mockEnv = { ALLOWED_ORIGINS: 'https://example.com,http://localhost:3000, https://test.org' };

      expect(isOriginAllowed('https://example.com', mockEnv)).toBe(true);
      expect(isOriginAllowed('http://localhost:3000', mockEnv)).toBe(true);
      expect(isOriginAllowed('https://test.org', mockEnv)).toBe(true); // check trimming

      // Blocked origin
      expect(isOriginAllowed('https://not-allowed.com', mockEnv)).toBe(false);
    });

    it('allows origins matching wildcard patterns', async () => {
      const { isOriginAllowed } = await import('./apiCors');
      const mockEnv = { ALLOWED_ORIGINS: 'https://*.example.com,http://localhost:*' };

      expect(isOriginAllowed('https://api.example.com', mockEnv)).toBe(true);
      expect(isOriginAllowed('https://sub.test.example.com', mockEnv)).toBe(true);
      expect(isOriginAllowed('http://localhost:3000', mockEnv)).toBe(true);
      expect(isOriginAllowed('http://localhost:8080', mockEnv)).toBe(true);

      // Blocked origins
      expect(isOriginAllowed('https://example.com', mockEnv)).toBe(false); // Does not match *.example.com because of the dot
      expect(isOriginAllowed('https://malicious-example.com', mockEnv)).toBe(false);
      expect(isOriginAllowed('https://api.example.org', mockEnv)).toBe(false);
    });
  });

  describe('applyCors', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
      mockReq = {
        headers: {}
      };
      mockRes = {
        setHeader: jest.fn()
      };
    });

    it('sets Access-Control-Allow-Origin header if origin is allowed', async () => {
      const { applyCors } = await import('./apiCors');
      const mockEnv = { ALLOWED_ORIGINS: 'https://example.com' };
      mockReq.headers.origin = 'https://example.com';

      applyCors(mockReq, mockRes, { env: mockEnv });

      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'https://example.com');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type');
    });

    it('does not set Access-Control-Allow-Origin header if origin is blocked', async () => {
      const { applyCors } = await import('./apiCors');
      const mockEnv = { ALLOWED_ORIGINS: 'https://example.com' };
      mockReq.headers.origin = 'https://blocked.com';

      applyCors(mockReq, mockRes, { env: mockEnv });

      expect(mockRes.setHeader).not.toHaveBeenCalledWith('Access-Control-Allow-Origin', expect.any(String));
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type');
    });

    it('sets custom Methods and Headers if provided', async () => {
      const { applyCors } = await import('./apiCors');
      const mockEnv = { ALLOWED_ORIGINS: '*' };
      mockReq.headers.origin = 'https://example.com';

      applyCors(mockReq, mockRes, {
        methods: 'GET, POST, OPTIONS',
        headers: 'Content-Type, Authorization',
        env: mockEnv
      });

      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'https://example.com');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    });
  });
});

import audioManager from "../audioUtils";

describe("audioUtils error paths", () => {
  // biome-ignore lint/suspicious/noExplicitAny: Mocking global Audio
  let originalAudio: any;
  // biome-ignore lint/suspicious/noExplicitAny: Mocking console.warn
  let originalConsoleWarn: any;
  // biome-ignore lint/suspicious/noExplicitAny: Mocking console.error
  let originalConsoleError: any;

  beforeEach(() => {
    originalAudio = global.Audio;
    originalConsoleWarn = console.warn;
    originalConsoleError = console.error;

    // Reset state before tests
    audioManager.cleanup();
  });

  afterEach(() => {
    global.Audio = originalAudio;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  });

  describe("playKnightRiderThemeFromFile", () => {
    it("gracefully handles play() rejection, tries next source, and throws if all fail", async () => {
      console.warn = jest.fn();
      console.error = jest.fn();

      const mockPlay = jest
        .fn()
        .mockRejectedValue(new Error("Mock play error"));

      // Mock the Audio constructor correctly with addEventListener
      class MockAudio {
        play = mockPlay;
        pause = jest.fn();
        volume = 0;
        loop = false;
        addEventListener = jest.fn();
        removeEventListener = jest.fn();
      }
      // biome-ignore lint/suspicious/noExplicitAny: Mocking global Audio
      global.Audio = MockAudio as any;

      // Restrict URLs to exactly 2 to test the loop
      const originalGetUrls = audioManager.getKnightRiderAudioUrls;
      audioManager.getKnightRiderAudioUrls = jest
        .fn()
        .mockReturnValue([
          "http://example.com/audio1.mp3",
          "http://example.com/audio2.mp3",
        ]);

      await expect(audioManager.playKnightRiderThemeFromFile()).rejects.toThrow(
        "All audio sources failed",
      );

      expect(mockPlay).toHaveBeenCalledTimes(2);

      expect(console.warn).toHaveBeenCalledWith(
        "Failed to play Knight Rider theme from http://example.com/audio1.mp3:",
        expect.any(Error),
      );

      expect(console.warn).toHaveBeenCalledWith(
        "Failed to play Knight Rider theme from http://example.com/audio2.mp3:",
        expect.any(Error),
      );

      expect(console.error).toHaveBeenCalledWith(
        "Error playing Knight Rider theme from file:",
        expect.any(Error),
      );

      audioManager.getKnightRiderAudioUrls = originalGetUrls;
    });

    it("returns true if the first source succeeds", async () => {
      console.warn = jest.fn();
      console.error = jest.fn();

      const mockPlay = jest.fn().mockResolvedValue(undefined);
      class MockAudio {
        play = mockPlay;
        pause = jest.fn();
        volume = 0;
        loop = false;
        addEventListener = jest.fn();
        removeEventListener = jest.fn();
      }
      // biome-ignore lint/suspicious/noExplicitAny: Mocking global Audio
      global.Audio = MockAudio as any;

      const originalGetUrls = audioManager.getKnightRiderAudioUrls;
      audioManager.getKnightRiderAudioUrls = jest
        .fn()
        .mockReturnValue([
          "http://example.com/audio1.mp3",
          "http://example.com/audio2.mp3",
        ]);

      // Mock requestAnimationFrame for fadeIn
      jest.spyOn(window, "requestAnimationFrame").mockImplementation((_cb) => {
        return 1;
      });

      const result = await audioManager.playKnightRiderThemeFromFile();
      expect(result).toBe(true);
      expect(mockPlay).toHaveBeenCalledTimes(1);
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();

      audioManager.getKnightRiderAudioUrls = originalGetUrls;
      (window.requestAnimationFrame as jest.Mock).mockRestore();
    });

    it("returns true if the second source succeeds after the first fails", async () => {
      console.warn = jest.fn();
      console.error = jest.fn();

      const mockPlay = jest
        .fn()
        .mockRejectedValueOnce(new Error("First source failed"))
        .mockResolvedValueOnce(undefined);

      class MockAudio {
        play = mockPlay;
        pause = jest.fn();
        volume = 0;
        loop = false;
        addEventListener = jest.fn();
        removeEventListener = jest.fn();
      }
      // biome-ignore lint/suspicious/noExplicitAny: Mocking global Audio
      global.Audio = MockAudio as any;

      const originalGetUrls = audioManager.getKnightRiderAudioUrls;
      audioManager.getKnightRiderAudioUrls = jest
        .fn()
        .mockReturnValue([
          "http://example.com/audio1.mp3",
          "http://example.com/audio2.mp3",
        ]);

      // Mock requestAnimationFrame for fadeIn
      jest.spyOn(window, "requestAnimationFrame").mockImplementation((_cb) => {
        return 1;
      });

      const result = await audioManager.playKnightRiderThemeFromFile();
      expect(result).toBe(true);
      expect(mockPlay).toHaveBeenCalledTimes(2);
      expect(console.warn).toHaveBeenCalledWith(
        "Failed to play Knight Rider theme from http://example.com/audio1.mp3:",
        expect.any(Error),
      );
      expect(console.error).not.toHaveBeenCalled();

      audioManager.getKnightRiderAudioUrls = originalGetUrls;
      (window.requestAnimationFrame as jest.Mock).mockRestore();
    });
  });
});

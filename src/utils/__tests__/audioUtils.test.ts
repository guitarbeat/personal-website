import audioManager from "../audioUtils";

describe("AudioManager", () => {
  beforeEach(() => {
    // Reset any state before each test
    audioManager.cleanup();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("playKnightRiderThemeFromFile", () => {
    it("should throw an error when all audio sources fail", async () => {
      // Mock console methods to suppress expected output and to verify they were called
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const consoleWarnSpy = jest
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      // Mock the global Audio constructor to simulate playback failure
      const mockAudioElement = {
        play: jest.fn().mockRejectedValue(new Error("Playback failed")),
        addEventListener: jest.fn(),
        pause: jest.fn(),
      };

      // We need to cast it since mockAudioElement doesn't implement the full HTMLAudioElement interface
      const mockAudioConstructor = jest
        .fn()
        .mockImplementation(() => mockAudioElement);
      global.Audio = mockAudioConstructor as unknown as typeof Audio;
      // Removed old override

      // Ensure that getKnightRiderAudioUrls returns some URLs so the loop executes
      const urls = audioManager.getKnightRiderAudioUrls();
      expect(urls.length).toBeGreaterThan(0);

      // Execute the method and expect it to reject with the expected error message
      await expect(audioManager.playKnightRiderThemeFromFile()).rejects.toThrow(
        "All audio sources failed",
      );

      // Verify that console.warn was called for each failed source
      expect(consoleWarnSpy).toHaveBeenCalledTimes(urls.length);
      urls.forEach((url, index) => {
        expect(consoleWarnSpy).toHaveBeenNthCalledWith(
          index + 1,
          `Failed to play Knight Rider theme from ${url}:`,
          expect.any(Error),
        );
      });

      // Verify that console.error was called in the catch block
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error playing Knight Rider theme from file:",
        expect.any(Error),
      );
    });
  });
});

import audioManager from "../audioUtils";

describe("audioUtils", () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.restoreAllMocks();

    // Mock window AudioContext just in case
    (window as any).AudioContext = jest.fn().mockImplementation(() => ({
      state: "running",
      resume: jest.fn().mockResolvedValue(undefined),
      createBuffer: jest.fn(),
      createBufferSource: jest.fn(),
      createGain: jest.fn(),
    }));

    (window as any).webkitAudioContext = (window as any).AudioContext;

    // Also suppress console.warn which might be called by handleAudioError
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  describe("playSyntheticKnightRiderTheme", () => {
    it("should return false and handle error when createSyntheticKnightRiderTheme returns null", async () => {
      // Mock createSyntheticKnightRiderTheme to return null
      jest
        .spyOn(audioManager, "createSyntheticKnightRiderTheme")
        .mockResolvedValue(null);

      // Mock handleAudioError to track if it is called
      const handleAudioErrorSpy = jest.spyOn(audioManager, "handleAudioError");

      // Mock console.error to avoid spamming test output and to assert it was called
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      // Call the method under test
      const result = await audioManager.playSyntheticKnightRiderTheme();

      // Assertions
      expect(result).toBe(false);
      expect(handleAudioErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error playing synthetic Knight Rider theme:",
        expect.any(Error)
      );
    });

    it("should return false and handle error when createSyntheticKnightRiderTheme throws an error", async () => {
      // Mock createSyntheticKnightRiderTheme to throw an error
      const mockError = new Error("Test synthetic audio failure");
      jest
        .spyOn(audioManager, "createSyntheticKnightRiderTheme")
        .mockRejectedValue(mockError);

      // Mock handleAudioError to track if it is called
      const handleAudioErrorSpy = jest.spyOn(audioManager, "handleAudioError");

      // Mock console.error to avoid spamming test output and to assert it was called
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      // Call the method under test
      const result = await audioManager.playSyntheticKnightRiderTheme();

      // Assertions
      expect(result).toBe(false);
      expect(handleAudioErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error playing synthetic Knight Rider theme:",
        mockError
      );
    });
  });
});

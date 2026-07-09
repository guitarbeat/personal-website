import audioManager from "../audioUtils";

describe("AudioManager", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    audioManager.cleanup();
  });

  describe("playKnightRiderTheme", () => {
    it("handles errors gracefully and returns false", async () => {
      // Force an error to trigger the catch block
      jest
        .spyOn(audioManager, "initAudioContext")
        .mockRejectedValue(new Error("Forced test error"));

      const handleAudioErrorSpy = jest.spyOn(audioManager, "handleAudioError");

      const result = await audioManager.playKnightRiderTheme();

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        "Error playing Knight Rider theme:",
        expect.any(Error),
      );
      expect(handleAudioErrorSpy).toHaveBeenCalled();
    });
  });
});

import audioManager, { playKnightRiderTheme, stopKnightRiderTheme, setAudioVolume, isAudioPlaying, cleanupAudio } from "../audioUtils";

describe("AudioManager", () => {
  let MockAudioContext: jest.Mock;

  beforeEach(() => {
    // Reset singleton state
    audioManager.cleanup();
    jest.restoreAllMocks();

    // Mock AudioContext
    MockAudioContext = jest.fn().mockImplementation(() => ({
      sampleRate: 44100,
      createBuffer: jest.fn().mockReturnValue({
        getChannelData: jest.fn().mockReturnValue(new Float32Array(44100 * 8)),
        length: 44100 * 8
      }),
      createBufferSource: jest.fn().mockReturnValue({
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
      }),
      createGain: jest.fn().mockReturnValue({
        gain: {
          setValueAtTime: jest.fn(),
          linearRampToValueAtTime: jest.fn(),
        },
        connect: jest.fn(),
        disconnect: jest.fn(),
      }),
      state: "running",
      resume: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      currentTime: 0,
      destination: {},
    }));

    (window as unknown as Record<string, unknown>).AudioContext = MockAudioContext;
  });

  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).AudioContext;
    delete (window as unknown as Record<string, unknown>).webkitAudioContext;
  });

  describe("createSyntheticKnightRiderTheme error handling", () => {
    it("should return null and log error when initAudioContext throws", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      // Override initAudioContext to throw an error directly
      jest.spyOn(audioManager, "initAudioContext").mockRejectedValue(new Error("Audio context not initialized"));

      const result = await audioManager.createSyntheticKnightRiderTheme();

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error creating synthetic Knight Rider theme:",
        expect.any(Error)
      );
      expect(consoleErrorSpy.mock.calls[0][1].message).toBe("Audio context not initialized");
    });

    it("should return null and log error when createBuffer throws", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const mockAudioContextInstance = new MockAudioContext();
      mockAudioContextInstance.createBuffer = jest.fn().mockImplementation(() => {
        throw new Error("Failed to create buffer");
      });
      MockAudioContext.mockImplementation(() => mockAudioContextInstance);

      await audioManager.initAudioContext();
      const result = await audioManager.createSyntheticKnightRiderTheme();

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error creating synthetic Knight Rider theme:",
        expect.any(Error)
      );
      expect(consoleErrorSpy.mock.calls[0][1].message).toBe("Failed to create buffer");
    });
  });

  describe("playSyntheticKnightRiderTheme error handling", () => {
    it("should log error and handle playback failure gracefully when audio buffer creation fails", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {}); // Suppress handleAudioError warning
      const handleAudioErrorSpy = jest.spyOn(audioManager, "handleAudioError");

      jest.spyOn(audioManager, "createSyntheticKnightRiderTheme").mockResolvedValue(null);

      const result = await audioManager.playSyntheticKnightRiderTheme();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error playing synthetic Knight Rider theme:",
        expect.any(Error)
      );
      expect(consoleErrorSpy.mock.calls[0][1].message).toBe("Failed to create synthetic audio");
      expect(handleAudioErrorSpy).toHaveBeenCalled();
    });
  });

  describe("playKnightRiderTheme error handling", () => {
    it("should fallback to file-based audio when synthetic playback fails", async () => {
      jest.spyOn(audioManager, "playSyntheticKnightRiderTheme").mockResolvedValue(false);
      const playFromFileSpy = jest.spyOn(audioManager, "playKnightRiderThemeFromFile").mockResolvedValue(true);

      const result = await audioManager.playKnightRiderTheme();

      expect(result).toBe(true);
      expect(playFromFileSpy).toHaveBeenCalled();
    });

    it("should log error and handle playback failure when both synthetic and file playback fail", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {}); // Suppress handleAudioError warning
      const handleAudioErrorSpy = jest.spyOn(audioManager, "handleAudioError");

      jest.spyOn(audioManager, "playSyntheticKnightRiderTheme").mockResolvedValue(false);
      jest.spyOn(audioManager, "playKnightRiderThemeFromFile").mockRejectedValue(new Error("File playback failed"));

      const result = await audioManager.playKnightRiderTheme();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error playing Knight Rider theme:",
        expect.any(Error)
      );
      expect(consoleErrorSpy.mock.calls[0][1].message).toBe("File playback failed");
      expect(handleAudioErrorSpy).toHaveBeenCalled();
    });
  });
});

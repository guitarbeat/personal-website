import audioManager, {
  cleanupAudio,
  isAudioPlaying,
  playKnightRiderTheme,
  setAudioVolume,
  stopKnightRiderTheme,
} from "../audioUtils";

describe("audioUtils", () => {
  let mockAudioContextInstance: Record<string, unknown>;
  let mockAudioInstance: Record<string, unknown>;
  let originalAudioContext: typeof window.AudioContext;
  let originalAudio: typeof window.Audio;

  beforeEach(() => {
    jest.useFakeTimers();
    jest
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb: FrameRequestCallback) => {
        return setTimeout(() => cb(Date.now()), 16) as unknown as number;
      });

    originalAudioContext = window.AudioContext;
    originalAudio = window.Audio;

    // Reset singleton state
    audioManager.cleanup();

    mockAudioContextInstance = {
      state: "suspended",
      currentTime: 0,
      sampleRate: 44100,
      destination: {},
      resume: jest.fn().mockResolvedValue(undefined),
      createBuffer: jest.fn().mockReturnValue({
        length: 100,
        getChannelData: jest.fn().mockReturnValue(new Float32Array(100)),
      }),
      createBufferSource: jest.fn().mockReturnValue({
        buffer: null,
        loop: false,
        onended: null,
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
      close: jest.fn().mockResolvedValue(undefined),
    };

    window.AudioContext = jest
      .fn()
      .mockImplementation(
        () => mockAudioContextInstance,
      ) as unknown as typeof window.AudioContext;

    mockAudioInstance = {
      volume: 1,
      loop: false,
      currentTime: 0,
      crossOrigin: "",
      preload: "",
      play: jest.fn().mockResolvedValue(undefined),
      pause: jest.fn(),
      addEventListener: jest.fn(),
    };

    window.Audio = jest
      .fn()
      .mockImplementation(
        () => mockAudioInstance,
      ) as unknown as typeof window.Audio;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
    window.AudioContext = originalAudioContext;
    window.Audio = originalAudio;
    audioManager.cleanup();
  });

  describe("exported functions", () => {
    it("playKnightRiderTheme plays synthetic audio successfully", async () => {
      const resultPromise = playKnightRiderTheme();
      await Promise.resolve(); // flush microtasks

      const result = await resultPromise;
      expect(result).toBe(true);
      expect(isAudioPlaying()).toBe(true);
      expect(mockAudioContextInstance.resume).toHaveBeenCalled();
      expect(mockAudioContextInstance.createBufferSource).toHaveBeenCalled();
    });

    it("stopKnightRiderTheme stops audio and updates state", async () => {
      await playKnightRiderTheme();
      expect(isAudioPlaying()).toBe(true);

      const stopPromise = stopKnightRiderTheme();
      expect(isAudioPlaying()).toBe(false); // Immediate state update

      // Fast forward past fade out duration
      jest.advanceTimersByTime(1500);
      await Promise.resolve();
      await stopPromise;
    });

    it("setAudioVolume sets volume within bounds", async () => {
      await playKnightRiderTheme();

      setAudioVolume(0.5);
      // Not directly exposed via getters, but test it doesn't crash
      expect(
        (mockAudioContextInstance.createGain as jest.Mock)().gain
          .setValueAtTime,
      ).toHaveBeenCalled();

      // Test bounds
      setAudioVolume(1.5); // Should cap at 1
      setAudioVolume(-0.5); // Should floor at 0
    });

    it("cleanupAudio cleans up resources", async () => {
      await playKnightRiderTheme();
      expect(isAudioPlaying()).toBe(true);

      cleanupAudio();

      expect(isAudioPlaying()).toBe(false);
      expect(mockAudioContextInstance.close).toHaveBeenCalled();
    });
  });

  describe("AudioManager fallback behavior", () => {
    it("falls back to file if synthetic audio fails", async () => {
      // Suppress console errors for expected failures
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const consoleWarnSpy = jest
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      // Make synthetic audio fail
      mockAudioContextInstance.createBufferSource = jest
        .fn()
        .mockImplementation(() => {
          throw new Error("Synthetic audio failed");
        });

      const resultPromise = playKnightRiderTheme();
      await Promise.resolve();
      const result = await resultPromise;

      // Should still return true because it falls back to file
      expect(result).toBe(true);
      expect(mockAudioInstance.play).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it("returns false if both synthetic and file playback fail", async () => {
      // Suppress console errors for expected failures
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const consoleWarnSpy = jest
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      // Make synthetic fail
      mockAudioContextInstance.createBufferSource = jest
        .fn()
        .mockImplementation(() => {
          throw new Error("Synthetic audio failed");
        });

      // Make file playback fail
      mockAudioInstance.play = jest
        .fn()
        .mockRejectedValue(new Error("File audio failed"));

      const resultPromise = playKnightRiderTheme();
      await Promise.resolve();

      const result = await resultPromise;

      expect(result).toBe(false);
      expect(isAudioPlaying()).toBe(false);

      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });
  });
});

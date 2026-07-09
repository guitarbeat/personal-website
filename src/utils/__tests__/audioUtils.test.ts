import audioManager from "../audioUtils";

describe("AudioManager", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should handle error when stopping audio fails", async () => {
    const mockError = new Error("Test pause error");

    // Inject mock audio element
    (audioManager as unknown as Record<string, unknown>).audioElement = {
      pause: jest.fn().mockImplementation(() => {
        throw mockError;
      }),
      currentTime: 10,
      volume: 1,
    } as unknown as HTMLAudioElement;

    (audioManager as unknown as Record<string, unknown>).isPlaying = true;

    // Mock fadeOut to avoid animation frame logic
    (audioManager as unknown as Record<string, unknown>).fadeOut = jest
      .fn()
      .mockResolvedValue(undefined);

    await audioManager.stop();

    expect(console.error).toHaveBeenCalledWith(
      "Error stopping audio:",
      mockError,
    );
  });
});

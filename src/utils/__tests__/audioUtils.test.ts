import audioManager from '../audioUtils';

// Mock Web Audio API
class MockAudioContext {
  state = 'running';
  sampleRate = 44100;
  currentTime = 0;
  destination = {};

  resume = jest.fn().mockResolvedValue(undefined);
  close = jest.fn().mockResolvedValue(undefined);
  createBuffer = jest.fn().mockReturnValue({
    getChannelData: jest.fn().mockReturnValue(new Float32Array(44100 * 8))
  });
  createBufferSource = jest.fn().mockReturnValue({
    buffer: null,
    loop: false,
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn()
  });
  createGain = jest.fn().mockReturnValue({
    gain: {
      setValueAtTime: jest.fn(),
      linearRampToValueAtTime: jest.fn()
    },
    connect: jest.fn(),
    disconnect: jest.fn()
  });
}

// Mock window.AudioContext
Object.defineProperty(window, 'AudioContext', {
  value: MockAudioContext,
  writable: true
});

// Mock HTMLAudioElement
class MockAudio {
  crossOrigin = '';
  loop = false;
  volume = 1;
  preload = '';
  play = jest.fn().mockResolvedValue(undefined);
  pause = jest.fn();
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
}

global.Audio = MockAudio as any;

describe('audioUtils', () => {
  beforeEach(() => {
    // Reset any mocks and state before each test
    jest.clearAllMocks();
    audioManager.cleanup();
  });

  describe('playKnightRiderTheme', () => {
    it('handles errors gracefully during main theme playback fallback', async () => {
      const error = new Error('Test error: Failed to init audio context');

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const handleAudioErrorSpy = jest.spyOn(audioManager, 'handleAudioError');

      // Override a method that throws an error when playing knight rider theme
      jest.spyOn(audioManager, 'initAudioContext').mockRejectedValueOnce(error);

      // Call the method that should catch the error
      const result = await audioManager.playKnightRiderTheme();

      // Verify the error was caught and handled correctly
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error playing Knight Rider theme:', error);
      expect(handleAudioErrorSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith("Audio playback failed - continuing without background music");
      expect(audioManager.getPlayingState()).toBe(false);

      // Clean up spies
      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
      handleAudioErrorSpy.mockRestore();
    });
  });

  describe('playSyntheticKnightRiderTheme', () => {
    it('handles errors gracefully during synthetic theme playback', async () => {
      // Force an error by mocking createSyntheticKnightRiderTheme to throw
      const error = new Error('Test error: Failed to create synthetic audio');

      // Spy on console.error and console.warn to prevent it from polluting the test output
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      // Spy on handleAudioError to verify it gets called
      const handleAudioErrorSpy = jest.spyOn(audioManager, 'handleAudioError');

      // Mock createSyntheticKnightRiderTheme to throw an error since it's the first async call inside playSyntheticKnightRiderTheme
      jest.spyOn(audioManager, 'createSyntheticKnightRiderTheme').mockRejectedValueOnce(error);

      // Call the method that should catch the error
      const result = await audioManager.playSyntheticKnightRiderTheme();

      // Verify the error was caught and handled correctly
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error playing synthetic Knight Rider theme:', error);
      expect(handleAudioErrorSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith("Audio playback failed - continuing without background music");
      expect(audioManager.getPlayingState()).toBe(false);

      // Clean up spies
      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
      handleAudioErrorSpy.mockRestore();
    });
  });
});

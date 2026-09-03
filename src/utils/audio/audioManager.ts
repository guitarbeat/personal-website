import {
  getKnightRiderAudioUrls,
  performFadeIn,
  performFadeOut,
} from "./fileAudio";
import { generateSyntheticKnightRiderBuffer } from "./syntheticAudio";
import "./types";

// Audio utility for managing background music and sound effects
export class AudioManager {
  private audioContext: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private bufferSource: AudioBufferSourceNode | null = null; // For synthetic audio
  private gainNode: GainNode | null = null; // For volume control of synthetic audio
  private isPlaying = false;
  private volume = 0.3; // Default volume (30%)
  private fadeInDuration = 2000; // 2 seconds fade in
  private fadeOutDuration = 1500; // 1.5 seconds fade out
  private cachedBuffer: AudioBuffer | null = null; // Cache for synthetic audio buffer

  // Initialize audio context (required for modern browsers)
  async initAudioContext(): Promise<AudioContext | null> {
    if (!this.audioContext) {
      this.audioContext = new (
        window.AudioContext || window.webkitAudioContext
      )();

      // Resume audio context if it's suspended (required for user interaction)
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }
    }
    return this.audioContext;
  }

  // Create and configure audio element
  createAudioElement(url: string): HTMLAudioElement {
    if (this.audioElement) {
      this.stop();
    }

    this.audioElement = new Audio(url);
    this.audioElement.crossOrigin = "anonymous";
    this.audioElement.loop = true;
    this.audioElement.volume = 0; // Start at 0 for fade in
    this.audioElement.preload = "auto";

    // Add error handling
    this.audioElement.addEventListener("error", (e) => {
      console.warn("Audio loading error:", e);
      this.handleAudioError();
    });
    return this.audioElement;
  }

  // Create synthetic Knight Rider theme using Web Audio API
  async createSyntheticKnightRiderTheme(): Promise<AudioBuffer | null> {
    try {
      await this.initAudioContext();

      if (!this.audioContext) {
        throw new Error("AudioContext not available");
      }

      const { buffer, cachedBuffer } = await generateSyntheticKnightRiderBuffer(
        this.audioContext,
        this.cachedBuffer,
      );

      this.cachedBuffer = cachedBuffer;
      return buffer;
    } catch (error) {
      console.error("Error creating synthetic Knight Rider theme:", error);
      return null;
    }
  }

  // Play synthetic Knight Rider theme
  async playSyntheticKnightRiderTheme(): Promise<boolean> {
    try {
      const audioBuffer = await this.createSyntheticKnightRiderTheme();

      if (!audioBuffer || !this.audioContext) {
        throw new Error("Failed to create synthetic audio");
      }

      // Stop any existing audio
      if (this.audioElement || this.bufferSource) {
        this.stop();
      }

      // Create buffer source
      this.bufferSource = this.audioContext.createBufferSource();
      this.bufferSource.buffer = audioBuffer;
      this.bufferSource.loop = true;

      // Create gain node for volume control and fading
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);

      // Connect the audio graph
      this.bufferSource.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      // Start playing
      this.bufferSource.start();
      this.isPlaying = true;

      // Fade in
      this.gainNode.gain.linearRampToValueAtTime(
        this.volume,
        this.audioContext.currentTime + this.fadeInDuration / 1000,
      );

      // Handle ended event
      this.bufferSource.onended = () => {
        if (this.isPlaying) {
          this.isPlaying = false;
        }
      };

      return true;
    } catch (error) {
      console.error("Error playing synthetic Knight Rider theme:", error);
      this.handleAudioError();
      return false;
    }
  }

  // Play Knight Rider theme with fallback to synthetic version
  async playKnightRiderTheme(): Promise<boolean> {
    try {
      // Initialize audio context
      await this.initAudioContext();

      // First, try to use a synthetic version (more reliable)
      const syntheticSuccess = await this.playSyntheticKnightRiderTheme();
      if (syntheticSuccess) {
        return true;
      }

      // If synthetic fails, try file-based approach as fallback
      return await this.playKnightRiderThemeFromFile();
    } catch (error) {
      console.error("Error playing Knight Rider theme:", error);
      this.handleAudioError();
      return false;
    }
  }

  // Fallback method to try loading from file
  async playKnightRiderThemeFromFile(): Promise<boolean> {
    try {
      // Get the Knight Rider audio URLs
      const knightRiderUrls = this.getKnightRiderAudioUrls();

      for (const url of knightRiderUrls) {
        try {
          this.createAudioElement(url);

          if (!this.audioElement) {
            continue;
          }

          // Start playing
          await this.audioElement.play();
          this.isPlaying = true;

          // Fade in effect
          this.fadeIn();

          return true;
        } catch (error) {
          console.warn(`Failed to play Knight Rider theme from ${url}:`, error);
          // Continue to next source
        }
      }

      // If all sources fail
      throw new Error("All audio sources failed");
    } catch (error) {
      console.error("Error playing Knight Rider theme from file:", error);
      throw error;
    }
  }

  // Get Knight Rider audio URLs - using multiple fallback sources
  getKnightRiderAudioUrls(): string[] {
    return getKnightRiderAudioUrls();
  }

  // Stop audio with fade out
  async stop(): Promise<void> {
    if (!this.isPlaying) {
      return;
    }

    try {
      this.isPlaying = false;

      // Handle buffer source (synthetic audio)
      if (this.bufferSource && this.gainNode && this.audioContext) {
        // Fade out
        this.gainNode.gain.linearRampToValueAtTime(
          0,
          this.audioContext.currentTime + this.fadeOutDuration / 1000,
        );

        // Stop after fade out
        setTimeout(() => {
          if (this.bufferSource) {
            this.bufferSource.stop();
            this.bufferSource = null;
          }
          if (this.gainNode) {
            this.gainNode.disconnect();
            this.gainNode = null;
          }
        }, this.fadeOutDuration);
      }

      // Handle audio element (file-based audio)
      if (this.audioElement) {
        // Fade out effect
        await this.fadeOut();
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        this.audioElement = null;
      }
    } catch (error) {
      console.error("Error stopping audio:", error);
    }
  }

  // Fade in effect
  fadeIn(): void {
    performFadeIn(this.audioElement, this.volume, this.fadeInDuration);
  }

  // Fade out effect
  fadeOut(): Promise<void> {
    return performFadeOut(() => this.audioElement, this.fadeOutDuration);
  }

  // Set volume (0.0 to 1.0)
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));

    // Update audio element volume if it exists
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }

    // Update gain node volume if it exists
    if (this.gainNode && this.audioContext) {
      this.gainNode.gain.setValueAtTime(
        this.volume,
        this.audioContext.currentTime,
      );
    }
  }

  // Handle audio errors gracefully
  handleAudioError(): void {
    console.warn("Audio playback failed - continuing without background music");
    this.isPlaying = false;
    if (this.audioElement) {
      this.audioElement = null;
    }
  }

  // Check if audio is currently playing
  getPlayingState(): boolean {
    return this.isPlaying;
  }

  // Cleanup resources
  cleanup(): void {
    this.stop();

    if (this.audioElement) {
      this.audioElement = null;
    }

    if (this.bufferSource) {
      this.bufferSource = null;
    }

    if (this.gainNode) {
      this.gainNode = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

const audioManager = new AudioManager();
export default audioManager;

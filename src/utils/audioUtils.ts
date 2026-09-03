import audioManager, { AudioManager } from "./audio/audioManager";

export { AudioManager };

export const playKnightRiderTheme = () => audioManager.playKnightRiderTheme();
export const stopKnightRiderTheme = () => audioManager.stop();
export const setAudioVolume = (volume: number) =>
  audioManager.setVolume(volume);
export const isAudioPlaying = () => audioManager.getPlayingState();
export const cleanupAudio = () => audioManager.cleanup();

export default audioManager;

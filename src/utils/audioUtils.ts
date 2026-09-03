import audioManager, { AudioManager } from "./audio/audioManager";

export { AudioManager };

export const playKnightRiderTheme = () => audioManager.playKnightRiderTheme();
export const cleanupAudio = () => audioManager.cleanup();

export default audioManager;

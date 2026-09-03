/**
 * Audio sources for Knight Rider theme with fallback options.
 */
export function getKnightRiderAudioUrls(): string[] {
  return [
    "/assets/audio/knight-rider-theme.mp3",
    "https://archive.org/download/KnightRiderTheme/KnightRiderTheme.mp3",
    "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
  ];
}

/**
 * Perform smooth volume fade-in on HTMLAudioElement.
 */
export function performFadeIn(
  audioElement: HTMLAudioElement | null,
  targetVolume: number,
  duration: number,
): void {
  if (!audioElement) return;

  const startTime = Date.now();
  const startVolume = 0;

  const fade = () => {
    if (!audioElement) return;
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const easedProgress = 1 - (1 - progress) ** 3;
    const currentVolume =
      startVolume + (targetVolume - startVolume) * easedProgress;

    audioElement.volume = currentVolume;

    if (progress < 1) {
      requestAnimationFrame(fade);
    }
  };

  requestAnimationFrame(fade);
}

/**
 * Perform smooth volume fade-out on HTMLAudioElement.
 */
export function performFadeOut(
  audioElementGetter: () => HTMLAudioElement | null,
  duration: number,
): Promise<void> {
  return new Promise((resolve) => {
    const audioElement = audioElementGetter();
    if (!audioElement) {
      resolve();
      return;
    }

    const startTime = Date.now();
    const startVolume = audioElement.volume;

    const fade = () => {
      const currentElement = audioElementGetter();
      if (!currentElement) {
        resolve();
        return;
      }
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easedProgress = 1 - (1 - progress) ** 3;
      const currentVolume = startVolume + (0 - startVolume) * easedProgress;

      currentElement.volume = currentVolume;

      if (progress < 1) {
        requestAnimationFrame(fade);
      } else {
        resolve();
      }
    };

    requestAnimationFrame(fade);
  });
}

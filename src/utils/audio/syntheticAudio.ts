/**
 * Creates synthetic Knight Rider theme using Web Audio API.
 */
export async function generateSyntheticKnightRiderBuffer(
  audioContext: AudioContext,
  cachedBuffer: AudioBuffer | null,
): Promise<{ buffer: AudioBuffer | null; cachedBuffer: AudioBuffer | null }> {
  // Return cached buffer if available and sample rate matches
  if (cachedBuffer && cachedBuffer.sampleRate === audioContext.sampleRate) {
    return { buffer: cachedBuffer, cachedBuffer };
  }

  // Create a buffer for the synthetic theme (8 seconds loop)
  const sampleRate = audioContext.sampleRate;
  const duration = 8; // 8 seconds
  const buffer = audioContext.createBuffer(
    1,
    sampleRate * duration,
    sampleRate,
  );
  const channelData = buffer.getChannelData(0);

  // Generate the Knight Rider-style sweep effect
  for (let i = 0; i < buffer.length; i++) {
    const time = i / sampleRate;

    // Main sweep frequency oscillation (like the scanner light)
    const sweepFreq = 0.5; // Hz - speed of the sweep
    const sweepPhase = Math.sin(2 * Math.PI * sweepFreq * time);

    // Base frequency (around 200Hz - 800Hz range)
    const baseFreq = 400 + sweepPhase * 300;

    // Generate the main tone
    let sample = Math.sin(2 * Math.PI * baseFreq * time) * 0.3;

    // Add harmonic for richness
    sample += Math.sin(2 * Math.PI * baseFreq * 2 * time) * 0.1;
    sample += Math.sin(2 * Math.PI * baseFreq * 0.5 * time) * 0.2;

    // Add some filtering effect to make it sound more electronic
    const filterMod = Math.sin(2 * Math.PI * 2 * time) * 0.5 + 0.5;
    sample *= filterMod;

    // Apply envelope to create pulsing effect
    const pulseFreq = 4; // Hz
    const envelope = Math.sin(2 * Math.PI * pulseFreq * time) * 0.3 + 0.7;
    sample *= envelope;

    // Add some subtle noise for texture
    sample += (Math.random() - 0.5) * 0.02;

    channelData[i] = sample * 0.6; // Overall volume control
  }

  return { buffer, cachedBuffer: buffer };
}

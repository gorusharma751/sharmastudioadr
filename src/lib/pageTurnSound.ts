// Generate a page-turn sound effect using Web Audio API
let audioCtx: AudioContext | null = null;

export const playPageTurnSound = () => {
  try {
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }

    const ctx = audioCtx;
    const duration = 0.35;
    const sampleRate = ctx.sampleRate;
    const bufferSize = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    // Create a "swoosh" page-flip sound
    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 12) * (1 - Math.exp(-t * 200));
      // Mix of filtered noise + subtle frequency sweep
      const noise = (Math.random() * 2 - 1) * 0.6;
      const sweep = Math.sin(2 * Math.PI * (200 + t * 800) * t) * 0.15;
      const crinkle = Math.sin(2 * Math.PI * (1200 + Math.random() * 400) * t) * 0.08 * Math.exp(-t * 20);
      data[i] = (noise + sweep + crinkle) * envelope;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    
    // Low-pass filter for more realistic paper sound
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 3000;
    filter.Q.value = 0.7;

    const gain = ctx.createGain();
    gain.gain.value = 0.3;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  } catch (e) {
    // Silently fail if audio context is not available
  }
};

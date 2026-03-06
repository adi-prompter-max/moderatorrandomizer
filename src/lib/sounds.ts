let audioContext: AudioContext | null = null;
let drumrollSource: { stop: () => void } | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

/**
 * Synthesized drumroll using rapid noise bursts.
 * Returns a stop function to end the drumroll.
 */
export function startDrumroll(): void {
  const ctx = getAudioContext();

  // Create noise buffer for snare-like hits
  const bufferSize = ctx.sampleRate * 0.03; // 30ms per hit
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
  }

  // Master gain for the drumroll
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.15;
  masterGain.connect(ctx.destination);

  // Low-pass filter for a warmer drum sound
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 3000;
  filter.connect(masterGain);

  let isPlaying = true;
  let timeoutId: ReturnType<typeof setTimeout>;

  // Schedule rapid hits with increasing speed
  function scheduleHits() {
    if (!isPlaying) return;

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.connect(filter);
    source.start();

    // Hits every 50-80ms for a drumroll feel
    const interval = 40 + Math.random() * 40;
    timeoutId = setTimeout(scheduleHits, interval);
  }

  scheduleHits();

  drumrollSource = {
    stop: () => {
      isPlaying = false;
      clearTimeout(timeoutId);
      // Fade out
      masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      setTimeout(() => {
        masterGain.disconnect();
        filter.disconnect();
      }, 400);
    },
  };
}

export function stopDrumroll(): void {
  if (drumrollSource) {
    drumrollSource.stop();
    drumrollSource = null;
  }
}

/**
 * Play the victory sound (existing mp3 file).
 */
export function playVictorySound(): void {
  const audio = new Audio('/wwtbam_1000_win.mp3');
  audio.volume = 0.4;
  audio.play().catch(() => {
    // Ignore autoplay errors
  });
}

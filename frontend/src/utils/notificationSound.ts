let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function playNotificationPing(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Two-tone ping: high note drops to a lower note
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1046, ctx.currentTime);       // C6
    oscillator.frequency.exponentialRampToValueAtTime(698, ctx.currentTime + 0.12); // F5

    gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.45);
  } catch {
    // Silently ignore — audio is non-critical
  }
}

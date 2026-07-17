// Web Audio pitch pipe: a single triangle voice through a gentle low-pass with a
// short attack/release envelope. One shared AudioContext, resumed on gesture
// (iOS unlock and interruption recovery).
let ctx: AudioContext | null = null;
let voice: { osc: OscillatorNode; gain: GainNode } | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

export function resumeCtx(): void {
  const c = getCtx();
  if (c && c.state === "suspended") void c.resume();
}

export function midiToFreq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function startNote(midi: number): void {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  stopNote();
  const osc = c.createOscillator();
  osc.type = "triangle";
  osc.frequency.value = midiToFreq(midi);
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1800;
  filter.Q.value = 0.7;
  const gain = c.createGain();
  const now = c.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.4, now + 0.015);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  osc.start();
  voice = { osc, gain };
}

export function stopNote(): void {
  const c = getCtx();
  if (!c || !voice) return;
  const { osc, gain } = voice;
  voice = null;
  const now = c.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.setTargetAtTime(0, now, 0.08);
  try {
    osc.stop(now + 0.4);
  } catch {
    /* already stopped */
  }
}

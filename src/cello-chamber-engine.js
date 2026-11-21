/**
• src/cello-chamber-engine.js — Phrased, Breath-Paced Chamber Cello Synthesis (<= 780 Hz)
• Eliminates metronomic beats: uses expressive rubato phrasing, 5 Hz vibrato,
• natural breath rests, and a brick-wall DynamicsCompressorNode limiter.
*/
// Phrased motif notes with durations (ms) and breath rests (freq: 0)
const SUITE_1_PHRASE = Array.of(
{ freq: 196.00, ms: 1100, harp: 293.66 }, // G3
{ freq: 246.94, ms: 950,  harp: 392.00 }, // B3
{ freq: 293.66, ms: 1400, harp: 493.88 }, // D4
{ freq: 246.94, ms: 900,  harp: 392.00 }, // B3
{ freq: 220.00, ms: 1500, harp: 329.63 }, // A3
{ freq: 0,      ms: 850,  harp: 0      }, // Natural breath rest
{ freq: 196.00, ms: 1100, harp: 293.66 }, // G3
{ freq: 164.81, ms: 1650, harp: 246.94 }, // E3
{ freq: 0,      ms: 1100, harp: 0      }  // Cadence rest
);
const SUITE_2_PHRASE = Array.of(
{ freq: 146.83, ms: 1150, harp: 220.00 }, // D3
{ freq: 185.00, ms: 950,  harp: 293.66 }, // F#3
{ freq: 220.00, ms: 1450, harp: 369.99 }, // A3
{ freq: 293.66, ms: 1200, harp: 440.00 }, // D4
{ freq: 246.94, ms: 1400, harp: 369.99 }, // B3
{ freq: 0,      ms: 900,  harp: 0      }, // Natural breath rest
{ freq: 220.00, ms: 1100, harp: 293.66 }, // A3
{ freq: 185.00, ms: 950,  harp: 220.00 }, // F#3
{ freq: 146.83, ms: 1800, harp: 293.66 }, // D3
{ freq: 0,      ms: 1200, harp: 0      }  // Cadence rest
);
export function createCelloChamberEngine() {
let ctx = null;
let lpf = null;
let limiter = null;
let muted = true;
let stepTimer = null;
let phraseIdx = 0;
let storyIndex = 0;
let completedSteps = 0;
const ensure = () => {
if (!ctx && typeof window !== "undefined") {
const Ctor = window.AudioContext || window.webkitAudioContext;
if (!Ctor) return null;
ctx = new Ctor();
lpf = ctx.createBiquadFilter();
lpf.type = "lowpass";
lpf.frequency.setValueAtTime(760, ctx.currentTime);
limiter = ctx.createDynamicsCompressor();
limiter.threshold.setValueAtTime(-20, ctx.currentTime);
limiter.knee.setValueAtTime(0, ctx.currentTime);
limiter.ratio.setValueAtTime(20, ctx.currentTime);
limiter.attack.setValueAtTime(0.004, ctx.currentTime);
limiter.release.setValueAtTime(0.25, ctx.currentTime);
lpf.connect(limiter);
limiter.connect(ctx.destination);
}
if (ctx && ctx.state === "suspended") ctx.resume();
return ctx;
};
// Warm lyrical cello voice with gentle 5 Hz vibrato & soft attack (no harsh sawtooth buzz)
const playCelloNote = (freq, durationSec) => {
if (muted || !freq) return;
const c = ensure();
if (!c) return;
const now = c.currentTime;
const oscFund = c.createOscillator();
const oscOver = c.createOscillator();
const vibrato = c.createOscillator();
const vibGain = c.createGain();
const env = c.createGain();
oscFund.type = "triangle";
oscFund.frequency.setValueAtTime(freq, now);
oscOver.type = "sine";
oscOver.frequency.setValueAtTime(freq * 2, now);
vibrato.type = "sine";
vibrato.frequency.setValueAtTime(4.8, now);
vibGain.gain.setValueAtTime(2.2, now);
vibrato.connect(vibGain);
vibGain.connect(oscFund.frequency);
vibGain.connect(oscOver.frequency);
const overGain = c.createGain();
overGain.gain.setValueAtTime(0.28, now);
env.gain.setValueAtTime(0.0001, now);
env.gain.linearRampToValueAtTime(0.065, now + 0.24);
env.gain.setValueAtTime(0.058, now + Math.max(0.3, durationSec - 0.35));
env.gain.exponentialRampToValueAtTime(0.0001, now + durationSec + 0.25);
oscFund.connect(env);
oscOver.connect(overGain);
overGain.connect(env);
env.connect(lpf);
oscFund.start(now);
oscOver.start(now);
vibrato.start(now);
const stopAt = now + durationSec + 0.3;
oscFund.stop(stopAt);
oscOver.stop(stopAt);
vibrato.stop(stopAt);
};
const playHarpPluck = (freq) => {
if (muted || !freq) return;
const c = ensure();
if (!c) return;
const now = c.currentTime;
const osc = c.createOscillator();
const env = c.createGain();
osc.type = "sine";
osc.frequency.setValueAtTime(freq, now);
env.gain.setValueAtTime(0.0001, now);
env.gain.linearRampToValueAtTime(0.032, now + 0.04);
env.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);
osc.connect(env);
env.connect(lpf);
osc.start(now);
osc.stop(now + 1.4);
};
const scheduleNextPhraseNote = () => {
if (muted || typeof window === "undefined") return;
const phrase = storyIndex === 1 ? SUITE_2_PHRASE : SUITE_1_PHRASE;
const item = phrase.at(phraseIdx % phrase.length);
phraseIdx += 1;
if (item.freq > 0) {
playCelloNote(item.freq, item.ms / 1000);
if (completedSteps >= 3 && item.harp > 0) {
window.setTimeout(() => playHarpPluck(item.harp), 260);
}
if (completedSteps >= 6) {
playHarpPluck(item.freq * 0.5); // Warm octave bass pedal
}
}
stepTimer = window.setTimeout(scheduleNextPhraseNote, item.ms);
};
return {
isMuted: () => muted,
toggleMute: () => {
muted = !muted;
if (!muted) {
ensure();
if (!stepTimer) scheduleNextPhraseNote();
} else if (stepTimer && typeof window !== "undefined") {
window.clearTimeout(stepTimer);
stepTimer = null;
}
return muted;
},
syncState: (state) => {
const changedStory = storyIndex !== state.storyIndex;
storyIndex = state.storyIndex;
completedSteps = state.completedSteps;
if (changedStory) phraseIdx = 0;
},
playBowFoley: (speed = 1) => {
if (muted) return;
const freq = Math.min(392, Math.max(146.83, 174.61 + speed * 8));
playHarpPluck(freq);
},
playBrushBloom: () => {
if (muted) return;
const root = storyIndex === 1 ? 146.83 : 196.00;
playHarpPluck(root);
setTimeout(() => playHarpPluck(root * 1.5), 180);
}
};
}

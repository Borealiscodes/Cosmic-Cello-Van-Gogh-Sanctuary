/**
• src/cello-chamber-engine.js — <= 780 Hz Brick-Wall Limited Chamber Cello & Ensemble Engine
• Suite I: Nocturne in G Major (Starry Night)
• Suite II: Pastoral Aria in D Major (Sunflowers)
*/
// G Major Nocturne melody & accompaniment (warm baritone cello register <= 440 Hz)
const SUITE_1_CELLO = Array.of(196.00, 246.94, 293.66, 246.94, 220.00, 196.00, 164.81, 196.00);
const SUITE_1_HARP  = Array.of(146.83, 196.00, 246.94, 293.66, 130.81, 164.81, 196.00, 246.94);
// D Major Pastoral Aria melody & accompaniment (lyric baritone register <= 440 Hz)
const SUITE_2_CELLO = Array.of(146.83, 185.00, 220.00, 293.66, 246.94, 220.00, 185.00, 146.83);
const SUITE_2_BASS  = Array.of(73.42, 110.00, 98.00, 110.00, 82.41, 123.47, 110.00, 73.42);
export function createCelloChamberEngine() {
let ctx = null;
let lpf = null;
let limiter = null;
let muted = true;
let timer = null;
let beat = 0;
let chapterIndex = 0;
let layers = 0;
const ensure = () => {
if (!ctx && typeof window !== "undefined") {
const Ctor = window.AudioContext || window.webkitAudioContext;
if (!Ctor) return null;
ctx = new Ctor();
lpf = ctx.createBiquadFilter();
lpf.type = "lowpass";
lpf.frequency.setValueAtTime(780, ctx.currentTime);
limiter = ctx.createDynamicsCompressor();
limiter.threshold.setValueAtTime(-18, ctx.currentTime);
limiter.knee.setValueAtTime(0, ctx.currentTime);
limiter.ratio.setValueAtTime(20, ctx.currentTime);
limiter.attack.setValueAtTime(0.002, ctx.currentTime);
limiter.release.setValueAtTime(0.15, ctx.currentTime);
lpf.connect(limiter);
limiter.connect(ctx.destination);
}
if (ctx && ctx.state === "suspended") ctx.resume();
return ctx;
};
const voice = (freq, type, peak, attack, release, pan = 0) => {
if (muted) return;
const c = ensure();
if (!c) return;
const now = c.currentTime;
const osc = c.createOscillator();
const g = c.createGain();
osc.type = type;
osc.frequency.setValueAtTime(freq, now);
g.gain.setValueAtTime(0.0001, now);
g.gain.linearRampToValueAtTime(peak, now + attack);
g.gain.exponentialRampToValueAtTime(0.0001, now + attack + release);
if (typeof c.createStereoPanner === "function") {
const p = c.createStereoPanner();
p.pan.setValueAtTime(pan, now);
osc.connect(g);
g.connect(p);
p.connect(lpf);
} else {
osc.connect(g);
g.connect(lpf);
}
osc.start(now);
osc.stop(now + attack + release + 0.05);
};
const startLoop = () => {
if (timer || typeof window === "undefined") return;
timer = window.setInterval(() => {
if (muted || !ctx || layers <= 0) return;
const isSuite2 = chapterIndex === 1;
const celloSeq = isSuite2 ? SUITE_2_CELLO : SUITE_1_CELLO;
const compSeq = isSuite2 ? SUITE_2_BASS : SUITE_1_HARP;
const idx = beat % celloSeq.length;
// Layer 1: Solo Baritone Cello (warm sawtooth filtered <= 780 Hz)
if (layers >= 1) {
voice((idx), "sawtooth", 0.065, 0.14, 0.85, -0.15);
}
// Layer 2: Fingerpicked Harp Arpeggio (Suite I) or Pizzicato Bass (Suite II)
if (layers >= 2) {
voice((idx), "triangle", 0.055, 0.03, 0.55, 0.25);
}
// Layer 3: Warm Chamber String Pad
if (layers >= 3 && beat % 2 === 0) {
const padFreq = isSuite2 ? 146.83 : 196.00;
voice(padFreq, "sine", 0.05, 0.25, 1.5, 0);
}
// Layer 4: Celesta / Pastoral Harmonic Chimes
if (layers >= 4 && beat % 2 === 1) {
voice((idx) * 2, "sine", 0.035, 0.04, 0.9, 0.35);
}
beat += 1;
}, 680);
};
return {
isMuted: () => muted,
toggleMute: () => {
muted = !muted;
if (!muted) {
ensure();
startLoop();
} else if (timer && typeof window !== "undefined") {
window.clearInterval(timer);
timer = null;
}
return muted;
},
syncState: (state) => {
chapterIndex = state.chapterIndex;
layers = state.orchestraLayers;
},
playBowFoley: (speed = 1) => {
const freq = Math.min(392, Math.max(146.83, 160 + speed * 12));
voice(freq, "sawtooth", 0.03, 0.03, 0.18, 0);
},
playChime: () => {
const notes = chapterIndex === 1 ? Array.of(146.83, 220.00, 293.66) : Array.of(196.00, 293.66, 392.00);
notes.forEach((f, i) => {
setTimeout(() => voice(f, "sine", 0.055, 0.05, 1.1, 0), i * 160);
});
}
};
}

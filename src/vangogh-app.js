import { classifyBrushStrokes } from "./brush-classifier.js";
import {
PAINTING_CHAPTERS,
createPaintingState,
applyPaintingStroke,
paintingProgressBraille
} from "./painting-kernel.js";
import { createDeterministicSinLUT, renderVanGoghFrame } from "./vangogh-renderer.js";
import { createCelloChamberEngine } from "./cello-chamber-engine.js";
export function initVanGoghSanctuary() {
const canvas = document.getElementById("vangogh-canvas");
const ctx = canvas.getContext("2d", { alpha: false });
const imgData = ctx.createImageData(320, 240);
const buf32 = new Uint32Array(imgData.data.buffer);
const sinLUT = createDeterministicSinLUT();
const engine = createCelloChamberEngine();
const hudEl = document.getElementById("hud-status");
const brailleEl = document.getElementById("braille-meter");
const narrativeEl = document.getElementById("narrative-voice");
const deckEl = document.getElementById("gesture-deck");
const muteBtn = document.getElementById("btn-mute");
const motionBtn = document.getElementById("btn-motion");
const resetBtn = document.getElementById("btn-reset");
let state = createPaintingState();
let motionOn = !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
let tick = 0;
let strokes = Array.of();
let currentStroke = Array.of();
let isDrawing = false;
let evalTimer = null;
const updateUI = () => {
const ch = PAINTING_CHAPTERS.at(state.chapterIndex);
if (hudEl) {
hudEl.textContent =
ch.title + " • " + ch.suiteName + " • Orchestra Layers: " + state.orchestraLayers + "/4";
}
if (brailleEl) brailleEl.textContent = paintingProgressBraille(state);
if (narrativeEl) narrativeEl.textContent = state.narration;
if (deckEl) {
deckEl.innerHTML = "";
const buttons = Array.of(
{ shape: "WAVE", label: "〰 Wave (~)" },
{ shape: "CIRCLE", label: "〇 Circle (O)" },
{ shape: "SLASH", label: "／ Slash (/)" },
{ shape: "CROSS", label: "✦ Cross (+)" }
);
for (const b of buttons) {
const btn = document.createElement("button");
btn.type = "button";
btn.textContent = b.label;
btn.addEventListener("click", () => submitGesture(b.shape));
deckEl.appendChild(btn);
}
}
};
const submitGesture = (shape) => {
const prevLayer = state.orchestraLayers;
const prevChapter = state.chapterIndex;
state = applyPaintingStroke(state, shape);
engine.syncState(state);
if (state.orchestraLayers !== prevLayer || state.chapterIndex !== prevChapter) {
engine.playChime();
}
strokes = Array.of();
currentStroke = Array.of();
updateUI();
};
const getCanvasPos = (ev) => {
const rect = canvas.getBoundingClientRect();
return {
x: ((ev.clientX - rect.left) * 320) / (rect.width || 1),
y: ((ev.clientY - rect.top) * 240) / (rect.height || 1)
};
};
canvas.addEventListener("pointerdown", (ev) => {
ev.preventDefault();
if (evalTimer) clearTimeout(evalTimer);
isDrawing = true;
currentStroke = Array.of(getCanvasPos(ev));
});
canvas.addEventListener("pointermove", (ev) => {
if (!isDrawing) return;
ev.preventDefault();
const pt = getCanvasPos(ev);
const prev = (-1);
const speed = prev ? Math.hypot(pt.x - prev.x, pt.y - prev.y) : 1;
currentStroke.push(pt);
engine.playBowFoley(speed);
});
const endStroke = () => {
if (!isDrawing) return;
isDrawing = false;
if (currentStroke.length >= 3) {
strokes.push(currentStroke);
if (strokes.length > 2) strokes = strokes.slice(-2);
}
currentStroke = Array.of();
evalTimer = setTimeout(() => {
const detected = classifyBrushStrokes(strokes);
submitGesture(detected);
strokes = Array.of();
}, 550);
};
canvas.addEventListener("pointerup", endStroke);
canvas.addEventListener("pointercancel", endStroke);
muteBtn.addEventListener("click", () => {
const isMuted = engine.toggleMute();
engine.syncState(state);
muteBtn.textContent = isMuted ? "🔇 Unmute Chamber Cello (M)" : "🔊 Mute Chamber Cello (M)";
muteBtn.classList.toggle("active", !isMuted);
});
motionBtn.addEventListener("click", () => {
motionOn = !motionOn;
motionBtn.textContent = motionOn ? "Motion: Playing (Space)" : "Motion: Paused (Space)";
motionBtn.classList.toggle("active", motionOn);
});
resetBtn.addEventListener("click", () => {
state = createPaintingState();
engine.syncState(state);
strokes = Array.of();
currentStroke = Array.of();
updateUI();
});
window.addEventListener("keydown", (ev) => {
if (ev.key === "m" || ev.key === "M") ();
else if (ev.key === " ") { ev.preventDefault(); (); }
else if (ev.key === "~" || ev.key === "`") submitGesture("WAVE");
else if (ev.key === "o" || ev.key === "O") submitGesture("CIRCLE");
else if (ev.key === "/") { ev.preventDefault(); submitGesture("SLASH"); }
else if (ev.key === "+" || ev.key === "=") submitGesture("CROSS");
});
function loop() {
const activeStrokes = isDrawing ? strokes.concat(Array.of(currentStroke)) : strokes;
renderVanGoghFrame(buf32, 320, 240, state, tick, sinLUT, activeStrokes);
ctx.putImageData(imgData, 0, 0);
if (motionOn) tick += 1;
requestAnimationFrame(loop);
}
updateUI();
requestAnimationFrame(loop);
}
if (typeof document !== "undefined") {
if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", initVanGoghSanctuary);
} else {
initVanGoghSanctuary();
}
}

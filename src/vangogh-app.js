import { classifyBrushStrokes } from "./brush-classifier.js";
import {
PAINTING_STORIES,
createStoryState,
applyStoryGesture,
storyProgressBraille
} from "./painting-kernel.js";
import {
createDeterministicSinLUT,
bakeStrokeIntoPigment,
renderVanGoghFrame
} from "./vangogh-renderer.js";
import { createCelloChamberEngine } from "./cello-chamber-engine.js";
export function initVanGoghSanctuary() {
const canvas = document.getElementById("vangogh-canvas");
const ctx = canvas.getContext("2d", { alpha: false });
const imgData = ctx.createImageData(320, 240);
const buf32 = new Uint32Array(imgData.data.buffer);
const pigmentBuf = new Uint32Array(320 * 240);
const sinLUT = createDeterministicSinLUT();
const engine = createCelloChamberEngine();
const hudEl = document.getElementById("hud-status");
const brailleEl = document.getElementById("braille-meter");
const narrativeEl = document.getElementById("narrative-voice");
const deckEl = document.getElementById("gesture-deck");
const story1Btn = document.getElementById("btn-story-1");
const story2Btn = document.getElementById("btn-story-2");
const muteBtn = document.getElementById("btn-mute");
const motionBtn = document.getElementById("btn-motion");
const clearPigmentBtn = document.getElementById("btn-clear-pigment");
const resetBtn = document.getElementById("btn-reset");
let state = createStoryState(0);
let motionOn = !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
let tick = 0;
let strokes = Array.of();
let currentStroke = Array.of();
let isDrawing = false;
let evalTimer = null;
const getCurrentPaletteColor = () => {
const story = PAINTING_STORIES.at(state.storyIndex);
const step = story.steps.at(Math.min(state.stepIndex, story.steps.length - 1));
return step.color;
};
const updateUI = () => {
const story = PAINTING_STORIES.at(state.storyIndex);
if (hudEl) {
hudEl.textContent =
story.title + " • " + story.suiteName + " • Layers: " + state.completedSteps + "/8";
}
if (brailleEl) brailleEl.textContent = storyProgressBraille(state);
if (narrativeEl) narrativeEl.textContent = state.narration;
story1Btn?.classList.toggle("active", state.storyIndex === 0);
story2Btn?.classList.toggle("active", state.storyIndex === 1);
if (deckEl) {
deckEl.innerHTML = "";
const buttons = Array.of(
{ shape: "WAVE", label: "Wave (~)" },
{ shape: "CIRCLE", label: "Circle (O)" },
{ shape: "SLASH", label: "Slash (/)" },
{ shape: "CROSS", label: "Cross (+)" }
);
for (const b of buttons) {
const btn = document.createElement("button");
btn.type = "button";
btn.textContent = b.label;
btn.addEventListener("click", () => submitGesture(b.shape, true));
deckEl.appendChild(btn);
}
}
};
// Synthesize a visible representative brushstroke when using keyboard/buttons so pigment always accumulates
const bakeSyntheticGesture = (shape) => {
const color = getCurrentPaletteColor();
const ox = 60 + ((state.completedSteps * 27) % 180);
const oy = 45 + ((state.completedSteps * 19) % 110);
if (shape === "WAVE") {
const pts = Array.of();
for (let i = 0; i <= 16; i += 1) {
pts.push({ x: ox + i * 5, y: oy + Math.sin((i / 16) * Math.PI * 2) * 14 });
}
bakeStrokeIntoPigment(pigmentBuf, 320, 240, pts, color);
} else if (shape === "CIRCLE") {
const pts = Array.of();
for (let i = 0; i <= 20; i += 1) {
const a = (i / 20) * Math.PI * 2;
pts.push({ x: ox + 20 + Math.cos(a) * 18, y: oy + 20 + Math.sin(a) * 18 });
}
bakeStrokeIntoPigment(pigmentBuf, 320, 240, pts, color);
} else if (shape === "SLASH") {
bakeStrokeIntoPigment(pigmentBuf, 320, 240, Array.of({ x: ox, y: oy + 42 }, { x: ox + 16, y: oy }), color);
} else if (shape === "CROSS") {
bakeStrokeIntoPigment(pigmentBuf, 320, 240, Array.of({ x: ox - 14, y: oy }, { x: ox + 14, y: oy }), color);
bakeStrokeIntoPigment(pigmentBuf, 320, 240, Array.of({ x: ox, y: oy - 14 }, { x: ox, y: oy + 14 }), color);
}
};
const submitGesture = (shape, fromButtonOrKey = false) => {
if (fromButtonOrKey) bakeSyntheticGesture(shape);
const prevSteps = state.completedSteps;
state = applyStoryGesture(state, shape);
engine.syncState(state);
if (state.completedSteps > prevSteps) {
engine.playBrushBloom();
}
strokes = Array.of();
currentStroke = Array.of();
updateUI();
};
const selectStory = (idx) => {
pigmentBuf.fill(0);
strokes = Array.of();
currentStroke = Array.of();
state = createStoryState(idx);
engine.syncState(state);
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
const prev = currentStroke.at(-1);
const speed = prev ? Math.hypot(pt.x - prev.x, pt.y - prev.y) : 1;
currentStroke.push(pt);
if (speed > 3) engine.playBowFoley(speed);
});
const endStroke = () => {
if (!isDrawing) return;
isDrawing = false;
if (currentStroke.length >= 2) {
// Permanently bake every freehand stroke onto the impasto pigment layer!
bakeStrokeIntoPigment(pigmentBuf, 320, 240, currentStroke, getCurrentPaletteColor());
strokes.push(currentStroke);
if (strokes.length > 2) strokes = strokes.slice(-2);
}
currentStroke = Array.of();
evalTimer = setTimeout(() => {
const detected = classifyBrushStrokes(strokes);
submitGesture(detected, false);
strokes = Array.of();
}, 550);
};
canvas.addEventListener("pointerup", endStroke);
canvas.addEventListener("pointercancel", endStroke);
story1Btn?.addEventListener("click", () => selectStory(0));
story2Btn?.addEventListener("click", () => selectStory(1));
muteBtn.addEventListener("click", () => {
const isMuted = engine.toggleMute();
engine.syncState(state);
muteBtn.textContent = isMuted ? "Unmute Chamber Cello (M)" : "Mute Chamber Cello (M)";
muteBtn.classList.toggle("active", !isMuted);
});
motionBtn.addEventListener("click", () => {
motionOn = !motionOn;
motionBtn.textContent = motionOn ? "Motion: Playing (Space)" : "Motion: Paused (Space)";
motionBtn.classList.toggle("active", motionOn);
});
clearPigmentBtn?.addEventListener("click", () => {
pigmentBuf.fill(0);
});
resetBtn.addEventListener("click", () => selectStory(state.storyIndex));
window.addEventListener("keydown", (ev) => {
if (ev.key === "m" || ev.key === "M") muteBtn.click();
else if (ev.key === " ") { ev.preventDefault(); motionBtn.click(); }
else if (ev.key === "1") selectStory(0);
else if (ev.key === "2") selectStory(1);
else if (ev.key === "~" || ev.key === "`") submitGesture("WAVE", true);
else if (ev.key === "o" || ev.key === "O") submitGesture("CIRCLE", true);
else if (ev.key === "/") { ev.preventDefault(); submitGesture("SLASH", true); }
else if (ev.key === "+" || ev.key === "=") submitGesture("CROSS", true);
});
function loop() {
renderVanGoghFrame(
buf32, 320, 240, state, tick, sinLUT, pigmentBuf,
isDrawing ? currentStroke : null,
getCurrentPaletteColor()
);
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

import test from "node:test";
import assert from "node:assert/strict";
import { classifyBrushStrokes } from "../src/brush-classifier.js";
import { PAINTING_STORIES, createStoryState, applyStoryGesture, storyProgressBraille } from "../src/painting-kernel.js";
import { createDeterministicSinLUT, bakeStrokeIntoPigment, renderVanGoghFrame } from "../src/vangogh-renderer.js";
test("1. Brush classifier recognizes WAVE, CIRCLE, SLASH, and CROSS", () => {
const wave = Array.of();
for (let i = 0; i <= 20; i += 1) wave.push({ x: 20 + i * 10, y: 100 + Math.sin((i / 20) * Math.PI * 2) * 35 });
assert.equal(classifyBrushStrokes(Array.of(wave)), "WAVE");
const circle = Array.of();
for (let i = 0; i <= 24; i += 1) {
const a = (i / 24) * Math.PI * 2;
circle.push({ x: 100 + Math.cos(a) * 50, y: 100 + Math.sin(a) * 50 });
}
assert.equal(classifyBrushStrokes(Array.of(circle)), "CIRCLE");
assert.equal(classifyBrushStrokes(Array.of(Array.of({ x: 20, y: 20 }, { x: 80, y: 80 }, { x: 140, y: 140 }))), "SLASH");
assert.equal(classifyBrushStrokes(Array.of(Array.of({ x: 50, y: 100 }, { x: 150, y: 100 }), Array.of({ x: 100, y: 50 }, { x: 100, y: 150 }))), "CROSS");
});
test("2. Separate selectable stories progress through 8 additive stages without forced eviction", () => {
let s1 = createStoryState(0);
for (const step of PAINTING_STORIES.at(0).steps) {
s1 = applyStoryGesture(s1, step.shape);
}
assert.equal(s1.storyIndex, 0);
assert.equal(s1.isComplete, true);
assert.equal(storyProgressBraille(s1).length, 5);
let s2 = createStoryState(1);
for (const step of PAINTING_STORIES.at(1).steps) {
s2 = applyStoryGesture(s2, step.shape);
}
assert.equal(s2.storyIndex, 1);
assert.equal(s2.isComplete, true);
});
test("3. Persistent user pigment strokes bake into the Q16.16 impasto framebuffer", () => {
const buf = new Uint32Array(320 * 240);
const pigment = new Uint32Array(320 * 240);
const lut = createDeterministicSinLUT();
bakeStrokeIntoPigment(pigment, 320, 240, Array.of({ x: 10, y: 10 }, { x: 40, y: 40 }), Array.of(255, 220, 90));
renderVanGoghFrame(buf, 320, 240, createStoryState(1), 5, lut, pigment, null, null);
assert.equal(buf[10 * 320 + 10], pigment[10 * 320 + 10]);
});

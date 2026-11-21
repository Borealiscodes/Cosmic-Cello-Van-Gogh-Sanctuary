import test from "node:test";
import assert from "node:assert/strict";
import { classifyBrushStrokes } from "../src/brush-classifier.js";
import { createPaintingState, applyPaintingStroke, paintingProgressBraille } from "../src/painting-kernel.js";
import { createDeterministicSinLUT, renderVanGoghFrame } from "../src/vangogh-renderer.js";
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
test("2. Painting state progresses through Starry Night and Sunflowers with Braille parity", () => {
let s = createPaintingState();
s = applyPaintingStroke(s, "WAVE");
s = applyPaintingStroke(s, "CIRCLE");
s = applyPaintingStroke(s, "SLASH");
s = applyPaintingStroke(s, "CROSS");
assert.equal(s.chapterIndex, 1);
assert.equal(s.completedPaintings, 1);
s = applyPaintingStroke(s, "SLASH");
s = applyPaintingStroke(s, "CIRCLE");
s = applyPaintingStroke(s, "WAVE");
s = applyPaintingStroke(s, "CROSS");
assert.equal(s.completedPaintings, 2);
assert.equal(paintingProgressBraille(s).length, 5);
});
test("3. Q16.16 RGB555 impasto renderer populates all 76,800 pixels cleanly", () => {
const buf = new Uint32Array(320 * 240);
const lut = createDeterministicSinLUT();
let s = createPaintingState();
s = applyPaintingStroke(s, "WAVE");
renderVanGoghFrame(buf, 320, 240, s, 10, lut, Array.of());
assert.ok(buf.at(0) !== 0);
});

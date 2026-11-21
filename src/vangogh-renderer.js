/**
 * src/vangogh-renderer.js — Zero-Float Q16.16 RGB555 Impasto Renderer for Starry Night & Sunflowers
 */

const BAYER_4X4 = Int8Array.of(
  -4, 0, -3, 1,
  2, -2, 3, -1,
  -3, 1, -4, 0,
  3, -1, 2, -2
);

function packRGB555(r, g, b, x = 0, y = 0) {
  const d = BAYER_4X4[((y & 3) << 2) + (x & 3)];
  const r5 = Math.max(0, Math.min(255, r + d)) & 0xF8;
  const g5 = Math.max(0, Math.min(255, g + d)) & 0xF8;
  const b5 = Math.max(0, Math.min(255, b + d)) & 0xF8;
  return (255 << 24) | (b5 << 16) | (g5 << 8) | r5;
}

export function createDeterministicSinLUT() {
  const lut = new Int32Array(1024);
  for (let i = 0; i <= 256; i += 1) {
    const x = BigInt(i * 9000) / 256n;
    const term = x * (18000n - x);
    const val = Number((4n * term * 65536n) / (405000000n - term)) | 0;
    lut[i] = val;
    lut[512 - i] = val;

lut[512 + i] = -val;
lut[(1024 - i) & 1023] = -val;
}
return lut;
}
export function renderVanGoghFrame(buf32, w, h, state, tick, sinLUT, userStrokes) {
const isSunflowers = state.chapterIndex === 1;
const completedInChapter = state.completedPaintings >= 2 ? 4 : state.stepIndex;
if (!isSunflowers) {
// CHAPTER I: STARRY NIGHT
for (let y = 0; y < h; y += 1) {
const row = y * w;
for (let x = 0; x < w; x += 1) {
if (y > 188) {
// Sleeping village silhouettes & warm cottage windows
const house = ((x + 17) % 38) < 18 && y > 196;
const steeple = x > 148 && x < 156 && y > 152;
const win = house && ((x % 19) === 6) && (y === 206 || y === 207);
if (win) buf32[row + x] = packRGB555(248, 208, 96, x, y);
else if (steeple || house) buf32[row + x] = packRGB555(18, 26, 48, x, y);
else buf32[row + x] = packRGB555(24, 38, 72, x, y);
} else {
// Deep indigo night sky + optional Layer 1 swirling wind currents
let r = 16, g = 34, b = 88;
if (completedInChapter >= 1) {
const phase = ((x * 5) + (sinLUT[((y * 7 + tick * 3) & 1023)] >> 10)) & 1023;
const swirl = sinLUT[phase] >> 11; // -32..+32
const band = Math.abs(swirl);
r += band >> 1;
g += band + 14;
b += (band << 1) + 28;
}
buf32[row + x] = packRGB555(r, g, b, x, y);
}
}
}
// Layer 2: Glowing golden stars & crescent moon
if (completedInChapter >= 2) {
const stars = Array.of(
{ cx: 56, cy: 44, rad: 14 },
{ cx: 124, cy: 32, rad: 11 },
{ cx: 196, cy: 52, rad: 15 },
{ cx: 268, cy: 42, rad: 19 }
);
for (const st of stars) {
for (let dy = -st.rad; dy <= st.rad; dy += 1) {
const py =  + dy;
if (py < 0 || py >= h) continue;
for (let dx = -st.rad; dx <= st.rad; dx += 1) {
const px = st.cx + dx;
if (px < 0 || px >= w) continue;
const d2 = dx * dx + dy * dy;
if (d2 <= st.rad * st.rad) {
const core = d2 <= (st.rad * st.rad) >> 2;
buf32[py * w + px] = core
? packRGB555(255, 240, 150, px, py)
: packRGB555(220, 185, 72, px, py);
}
}
}
}
}
// Layer 3: Towering dark cypress tree on left foreground
if (completedInChapter >= 3) {
for (let y = 24; y < h; y += 1) {
const halfWidth = Math.min(22, ((y - 20) >> 3) + 2);
const sway = sinLUT[((y * 9 + tick * 2) & 1023)] >> 14;
const cx = 42 + sway;
for (let dx = -halfWidth; dx <= halfWidth; dx += 1) {
const px = cx + dx;
if (px >= 0 && px < w) {
const edge = Math.abs(dx) > halfWidth - 3;
buf32[y * w + px] = edge
? packRGB555(24, 56, 42, px, y)
: packRGB555(12, 28, 24, px, y);
}
}
}
}
// Layer 4: Radiant starlight cross bursts
if (completedInChapter >= 4) {
const bursts = Array.of({ cx: 56, cy: 44 }, { cx: 196, cy: 52 }, { cx: 268, cy: 42 });
for (const b of bursts) {
for (let k = -24; k <= 24; k += 1) {
if ( + k >= 0 &&  + k < w) buf32[ * w + (b.cx + k)] = packRGB555(255, 248, 190, b.cx + k, );
if (b.cy + k >= 0 && b.cy + k < h) buf32[(b.cy + k) * w + b.cx] = packRGB555(255, 248, 190, b.cx, b.cy + k);
}
}
}
} else {
// CHAPTER II: SUNFLOWERS (ARLES GOLDEN STILL LIFE)
for (let y = 0; y < h; y += 1) {
const row = y * w;
const heatShimmer = completedInChapter >= 3 ? (sinLUT[((y * 10 + tick * 3) & 1023)] >> 14) : 0;
for (let x = 0; x < w; x += 1) {
if (y > 176) {
buf32[row + x] = packRGB555(214, 168, 64, x, y); // Warm ochre table
} else {
buf32[row + x] = packRGB555(244, 224, 148 + heatShimmer, x, y); // Luminous yellow wall
}
}
}
// Layer 1: Earthenware vase & olive stems
if (completedInChapter >= 1) {
for (let y = 136; y < 214; y += 1) {
const dy = y - 175;
const hw = Math.max(16, 36 - ((dy * dy) >> 6));
for (let dx = -hw; dx <= hw; dx += 1) {
const px = 160 + dx;
buf32[y * w + px] = y < 175
? packRGB555(232, 184, 72, px, y)
: packRGB555(184, 112, 48, px, y);
}
}
const stems = Array.of(128, 148, 162, 178, 194);
for (const sx of stems) {
for (let y = 66; y < 138; y += 1) {
buf32[y * w + sx] = packRGB555(72, 108, 44, sx, y);
buf32[y * w + sx + 1] = packRGB555(88, 128, 52, sx + 1, y);
}
}
}
const blooms = Array.of(
{ cx: 126, cy: 76, rad: 18 },
{ cx: 158, cy: 56, rad: 21 },
{ cx: 194, cy: 74, rad: 18 },
{ cx: 142, cy: 102, rad: 17 },
{ cx: 178, cy: 100, rad: 17 }
);
// Layer 3: Curling cadmium-yellow petals (drawn behind crowns)
if (completedInChapter >= 3) {
for (const bl of blooms) {
const pr = bl.rad + 10;
for (let dy = -pr; dy <= pr; dy += 1) {
const py =  + dy;
if (py < 0 || py >= h) continue;
for (let dx = -pr; dx <= pr; dx += 1) {
const px = bl.cx + dx;
if (px < 0 || px >= w) continue;
const d2 = dx * dx + dy * dy;
if (d2 <= pr * pr && d2 > (bl.rad - 2) * (bl.rad - 2)) {
buf32[py * w + px] = packRGB555(250, 204, 36, px, py);
}
}
}
}
}
// Layer 2: Rich sienna & umber seed crowns
if (completedInChapter >= 2) {
for (const bl of blooms) {
for (let dy = -bl.rad; dy <= bl.rad; dy += 1) {
const py =  + dy;
if (py < 0 || py >= h) continue;
for (let dx = -bl.rad; dx <= bl.rad; dx += 1) {
const px =  + dx;
if (px < 0 || px >= w) continue;
if (dx * dx + dy * dy <= bl.rad * bl.rad) {
const inner = dx * dx + dy * dy <= (bl.rad * bl.rad) >> 1;
buf32[py * w + px] = inner
? packRGB555(96, 56, 24, px, py)
: packRGB555(168, 98, 32, px, py);
}
}
}
}
}
// Layer 4: Afternoon golden sunbeams
if (completedInChapter >= 4) {
for (let y = 0; y < 140; y += 1) {
const bx = 250 - (y >> 1);
for (let k = -4; k <= 4; k += 1) {
const px = bx + k;
if (px >= 0 && px < w) {
buf32[y * w + px] = packRGB555(255, 244, 184, px, y);
}
}
}
}
}
// Overlay active user brush stroke in warm gold impasto
if (Array.isArray(userStrokes)) {
for (const stroke of userStrokes) {
for (let i = 1; i < stroke.length; i += 1) {
const a = stroke.at(i - 1);
const b = (i);
const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y)));
for (let s = 0; s <= steps; s += 1) {
const px = Math.round(a.x + ((b.x - a.x) * s) / steps);
const py = Math.round(a.y + ((b.y - a.y) * s) / steps);
for (let oy = -2; oy <= 2; oy += 1) {
for (let ox = -2; ox <= 2; ox += 1) {
const tx = px + ox, ty = py + oy;
if (tx >= 0 && tx < w && ty >= 0 && ty < h) {
buf32[ty * w + tx] = packRGB555(252, 224, 118, tx, ty);
}
}
}
}
}
}
}
}

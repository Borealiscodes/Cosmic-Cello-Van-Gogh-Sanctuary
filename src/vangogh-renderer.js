/**
 * src/vangogh-renderer.js — Rich Q16.16 RGB555 Impasto Renderer + Persistent User Pigment Buffer
 */

const BAYER_4X4 = Int8Array.of(
  -4, 0, -3, 1,
  2, -2, 3, -1,
  -3, 1, -4, 0,
  3, -1, 2, -2
);

export function packRGB555(r, g, b, x = 0, y = 0) {
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

export function bakeStrokeIntoPigment(pigmentBuf, w, h, stroke, rgb) {
  if (!Array.isArray(stroke) || stroke.length < 2) return;
  const [cr, cg, cb] = rgb;
  for (let i = 1; i < stroke.length; i += 1) {
    const a = stroke.at(i - 1);
    const b = stroke.at(i);
    const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y)));
    for (let s = 0; s <= steps; s += 1) {
      const px = Math.round(a.x + ((b.x - a.x) * s) / steps);
      const py = Math.round(a.y + ((b.y - a.y) * s) / steps);
      for (let oy = -2; oy <= 2; oy += 1) {
        for (let ox = -2; ox <= 2; ox += 1) {
          if (ox * ox + oy * oy > 5) continue;
          const tx = px + ox, ty = py + oy;
          if (tx >= 0 && tx < w && ty >= 0 && ty < h) {
            const ridge = ((tx + ty) & 3) === 0 ? 18 : 0;
            pigmentBuf[ty * w + tx] = packRGB555(cr + ridge, cg + ridge, cb + ridge, tx, ty);
          }
        }
      }
    }
  }
}

export function renderVanGoghFrame(buf32, w, h, state, tick, sinLUT, pigmentBuf, activeStroke, activeRgb) {
  const layers = state.completedSteps;

  if (state.storyIndex === 0) {
    // ========================================================================
    // STORY I: STARRY NIGHT (8 ADDITIVE IMPASTO STAGES)
    // ========================================================================
    for (let y = 0; y < h; y += 1) {
      const row = y * w;
      for (let x = 0; x < w; x += 1) {
        // Base raw linen canvas texture before underpainting
        let r = 28, g = 34, b = 52;

        // Stage 1: Deep cobalt & ultramarine impasto underpainting
        if (layers >= 1) {
          const dash = ((x >> 2) + (y >> 1)) & 3;
          r = 16 + dash * 3;
          g = 36 + dash * 5;
          b = 96 + dash * 8;
        }

        // Stage 2: Twin spiral wind vortices across the sky
        if (layers >= 2 && y < 185) {
          const dx1 = x - 145, dy1 = y - 88;
          const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) | 0;
          const ang1 = (Math.atan2(dy1, dx1) * 162.97) | 0;
          const spiral = sinLUT[(ang1 + dist1 * 18 - tick * 2) & 1023] >> 11; // -32..+32
          const streak = ((x + (spiral >> 2)) & 7) < 5 ? 16 : 0;
          if (spiral > 0) {
            r += (spiral >> 1) + streak;
            g += spiral + streak + 12;
            b += (spiral << 1) + 28;
          }
        }

        // Stage 5: Rolling Alpilles mountain ridges along horizon
        if (layers >= 5 && y >= 158) {
          const ridgeY = 168 + (sinLUT[(x * 4) & 1023] >> 13) + (sinLUT[(x * 11 + 200) & 1023] >> 14);
          if (y >= ridgeY) {
            const contour = ((y - ridgeY) & 3) === 0 ? 12 : 0;
            r = 14 + contour;
            g = 28 + contour;
            b = 64 + contour;
          }
        }

        // Stage 7: Sleeping Saint-Remy village & warm cottage windows
        if (layers >= 7 && y >= 184) {
          const block = (x + 12) % 34;
          const roof = block < 18 && y >= 192;
          const spire = x >= 158 && x <= 165 && y >= 138;
          const litWin = roof && (block === 5 || block === 11) && (y === 202 || y === 203 || y === 212);
          if (litWin) {
            r = 250; g = 204; b = 78;
          } else if (spire || roof) {
            r = 18; g = 24; b = 46;
          }
        }

        buf32[row + x] = packRGB555(r, g, b, x, y);
      }
    }

    // Stage 3: Luminous crescent moon on upper right
    if (layers >= 3) {
      const mcx = 272, mcy = 44;
      for (let dy = -24; dy <= 24; dy += 1) {
        for (let dx = -24; dx <= 24; dx += 1) {
          const d2 = dx * dx + dy * dy;
          const cut2 = (dx + 8) * (dx + 8) + (dy + 4) * (dy + 4);
          if (d2 <= 576) {
            const px = mcx + dx, py = mcy + dy;
            if (px >= 0 && px < w && py >= 0 && py < h) {
              if (d2 <= 256 && cut2 > 169) {
                buf32[py * w + px] = packRGB555(255, 232, 96, px, py);
              } else if (((dx + dy + tick) & 3) === 0) {

buf32[py * w + px] = packRGB555(120, 148, 170, px, py);
}
}
}
}
}
}
// Stage 4: Glowing star halos scattered across the sky
if (layers >= 4) {
const stars = Array.of(
{ cx: 68, cy: 42, rad: 15 },
{ cx: 126, cy: 28, rad: 12 },
{ cx: 194, cy: 48, rad: 16 },
{ cx: 96, cy: 96, rad: 11 },
{ cx: 224, cy: 92, rad: 13 }
);
for (const st of stars) {
for (let dy = -st.rad; dy <= st.rad; dy += 1) {
for (let dx = -st.rad; dx <= st.rad; dx += 1) {
const d2 = dx * dx + dy * dy;
if (d2 <= st.rad * st.rad) {
const px = st.cx + dx, py = st.cy + dy;
if (px >= 0 && px < w && py >= 0 && py < h) {
const core = d2 <= (st.rad * st.rad) >> 2;
if (core) buf32[py * w + px] = packRGB555(255, 244, 156, px, py);
else if (((dx * dy) & 3) !== 0) buf32[py * w + px] = packRGB555(214, 184, 78, px, py);
}
}
}
}
}
}
// Stage 6: Towering flame-like emerald cypress tree
if (layers >= 6) {
for (let y = 18; y < h; y += 1) {
const progress = y - 18;
const hw = Math.min(24, (progress >> 3) + 2);
const flame = sinLUT[(y * 16 + tick * 2) & 1023] >> 13;
const cx = 44 + flame;
for (let dx = -hw; dx <= hw; dx += 1) {
const px = cx + dx;
if (px >= 0 && px < w) {
const bark = ((y + dx) & 3) === 0 ? 14 : 0;
buf32[y * w + px] = packRGB555(14 + bark, 38 + bark * 2, 28 + bark, px, y);
}
}
}
}
// Stage 8: Shimmering starlight cross bursts
if (layers >= 8) {
const bursts = Array.of({ cx: 68, cy: 42 }, { cx: 194, cy: 48 }, { cx: 272, cy: 44 });
for (const b of bursts) {
for (let k = -22; k <= 22; k += 1) {
if (b.cx + k >= 0 && b.cx + k < w) buf32[b.cy * w + (b.cx + k)] = packRGB555(255, 250, 200, b.cx + k, b.cy);
if (b.cy + k >= 0 && b.cy + k < h) buf32[(b.cy + k) * w + b.cx] = packRGB555(255, 250, 200, b.cx, b.cy + k);
}
}
}
} else {
// ========================================================================
// STORY II: SUNFLOWERS (8 ADDITIVE IMPASTO STAGES — CENTERED BOUQUET)
// ========================================================================
for (let y = 0; y < h; y += 1) {
const row = y * w;
const shimmer = layers >= 6 ? (sinLUT[(y * 12 + tick * 2) & 1023] >> 14) : 0;
for (let x = 0; x < w; x += 1) {
if (layers === 0) {
buf32[row + x] = packRGB555(218, 206, 178, x, y); // Raw woven linen
} else if (y >= 178) {
const grain = ((x >> 2) + y) & 3;
buf32[row + x] = packRGB555(206 + grain * 4, 154 + grain * 3, 52 + grain * 2, x, y); // Ochre table
} else {
const weave = ((x >> 1) ^ (y >> 2)) & 3;
buf32[row + x] = packRGB555(242 + weave * 2, 222 + weave * 2, 138 + shimmer, x, y); // Warm Arles wall
}
}
}
// Stage 2: Two-toned earthenware vase resting squarely on the table (y = 146..216)
if (layers >= 2) {
for (let y = 146; y <= 216; y += 1) {
const dy = y - 181;
const hw = Math.max(18, 38 - ((dy * dy) >> 5));
for (let dx = -hw; dx <= hw; dx += 1) {
const px = 160 + dx;
const shade = dx > 12 ? -18 : dx < -12 ? 12 : 0;
if (y < 180) {
buf32[y * w + px] = packRGB555(234 + shade, 186 + shade, 68, px, y);
} else {
buf32[y * w + px] = packRGB555(182 + shade, 106 + shade, 44, px, y);
}
}
}
}
// Centered bouquet coordinates: stems run cleanly from flower centers (cy) into vase mouth (y = 148)
const blooms = Array.of(
{ cx: 118, cy: 86, rad: 16 },
{ cx: 160, cy: 66, rad: 19 },
{ cx: 202, cy: 84, rad: 16 },
{ cx: 136, cy: 114, rad: 16 },
{ cx: 184, cy: 112, rad: 16 }
);
// Stage 3: Sturdy olive-green stems connecting every flower center into the vase
if (layers >= 3) {
for (const bl of blooms) {
const startX = bl.cx, startY = bl.cy;
const endX = 160 + ((bl.cx - 160) >> 2), endY = 148;
const steps = endY - startY;
for (let s = 0; s <= steps; s += 1) {
const sx = Math.round(startX + ((endX - startX) * s) / steps);
const sy = startY + s;
for (let ox = -1; ox <= 2; ox += 1) {
buf32[sy * w + (sx + ox)] = packRGB555(68 + ox * 10, 114 + ox * 12, 42, sx + ox, sy);
}
}
}
}
// Stage 5 & 6: Inner cadmium-yellow petals (Stage 5) & outer lemon-gold petals (Stage 6)
if (layers >= 5) {
for (const bl of blooms) {
const outerR = layers >= 6 ? bl.rad + 12 : bl.rad + 7;
for (let dy = -outerR; dy <= outerR; dy += 1) {
for (let dx = -outerR; dx <= outerR; dx += 1) {
const d2 = dx * dx + dy * dy;
if (d2 <= outerR * outerR && d2 >= (bl.rad - 2) * (bl.rad - 2)) {
// Petal ray modulation so petals look ruffled, not a flat ring
const ang = (Math.atan2(dy, dx) * 162.97) | 0;
const ray = sinLUT[(ang * 12) & 1023] >> 13; // -8..+8
if (d2 <= (outerR + ray) * (outerR + ray)) {
const px = bl.cx + dx, py = bl.cy + dy;
if (px >= 0 && px < w && py >= 0 && py < h) {
const isOuter = d2 > (bl.rad + 5) * (bl.rad + 5);
buf32[py * w + px] = isOuter
? packRGB555(255, 224, 58, px, py)
: packRGB555(244, 186, 28, px, py);
}
}
}
}
}
}
}
// Stage 4 & 7: Burnt-sienna seed crowns (Stage 4) & dark umber seed spirals (Stage 7)
if (layers >= 4) {
for (const bl of blooms) {
for (let dy = -bl.rad; dy <= bl.rad; dy += 1) {
for (let dx = -bl.rad; dx <= bl.rad; dx += 1) {
const d2 = dx * dx + dy * dy;
if (d2 <= bl.rad * bl.rad) {
const px = bl.cx + dx, py = bl.cy + dy;
if (px >= 0 && px < w && py >= 0 && py < h) {
const stipple = layers >= 7 && (((dx * 3 + dy * 5) & 7) < 3);
if (stipple) {
buf32[py * w + px] = packRGB555(82, 46, 18, px, py);
} else {
buf32[py * w + px] = packRGB555(172, 98, 30, px, py);
}
}
}
}
}
}
}
// Stage 8: Warm afternoon sunbeams across the upper right
if (layers >= 8) {
for (let y = 0; y < 146; y += 1) {
const bx = 278 - (y >> 1);
for (let k = -5; k <= 5; k += 1) {
const px = bx + k;
if (px >= 0 && px < w) {
buf32[y * w + px] = packRGB555(255, 244, 184, px, y);
}
}
}
}
}
// Composite persistent user pigment brushstrokes on top of the canvas
if (pigmentBuf) {
for (let i = 0; i < buf32.length; i += 1) {
if (pigmentBuf[i] !== 0) buf32[i] = pigmentBuf[i];
}
}
// Draw live in-progress brush stroke
if (Array.isArray(activeStroke) && activeStroke.length >= 2) {
const temp = new Uint32Array(0);
// Render active stroke directly onto buf32
bakeStrokeIntoPigment(buf32, w, h, activeStroke, activeRgb || Array.of(255, 232, 128));
}
}

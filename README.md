# 🎨 Cosmic Cello & Celestial Brush Sanctuary (`Starry Night` & `Sunflowers`)

**A zero-dependency, neurodivergent-friendly painting adventure uniting deterministic `Q16.16` `RGB555` Bayer-dithered impasto rendering, Celestial Brush stroke recognition (`WAVE`, `CIRCLE`, `SLASH`, `CROSS`), persistent additive user pigment layers, 5-cell Unicode Braille progress parity, and two phrased, `<= 760 Hz` brick-wall limited chamber cello suites.**

[![License: MIT](https://shields.io)](LICENSE)
[![Tests: 3/3 Passing](https://shields.io)](test/vangogh-sanctuary.test.mjs)
[![Sensory Limiter: <= 760 Hz + Brick-Wall](https://shields.io)](src/cello-chamber-engine.js)

---

## 📖 Companion Research Preprint & Plain-Language Explainer Tile

* **Preprint #6 (Emergent "Courage the Cowardly Dog" Aesthetics, Material Constraints & Comparative Game Design):** [`docs/emergent-retro-aesthetics-and-procedural-impasto-preprint.md`](docs/emergent-retro-aesthetics-and-procedural-impasto-preprint.md)
* **Plain-Language Explainer Tile (`Altitude A7`):** [`tiles/bill-nye-bayer-dithering-and-vibrato-cello-explainer.md`](tiles/bill-nye-bayer-dithering-and-vibrato-cello-explainer.md)

---

## 🌌 Emergent Aesthetic Note: Where Folk Ballad Meets 16-Bit Dithering

Originally envisioned as a solemn folk-ballad cello accompaniment inspired by Don McLean's *"Vincent"* and Harry Chapin's *"Mr. Tanner,"* synthesizing the entire experience through a **`320×240` `RGB555` Bayer-dithered framebuffer** and a **`760 Hz` low-pass filtered `4.8 Hz` vibrato triangle-oscillator engine** produced something far more authentic to its medium: an eerie, cozy, late-night ***Courage the Cowardly Dog* meets 1996 PlayStation** atmosphere. Rather than masking this with pre-recorded audio files, `v1.0.0` embraces its handmade, zero-asset character.

---

## 🖼️ Two Separate, Selectable 8-Stage Painting Stories

Switch freely between both self-contained canvases via the top story tabs or keys **`1`** and **`2`**, painting additively at your own pace without forced transitions:

| Story | Canvas & Atmosphere | 8 Additive Impasto Layers | Phrased Chamber Suite (`<= 760 Hz`) |
| :--- | :--- | :--- | :--- |
| **Story I** (`Key 1`) | ***Starry Night*** *(Saint-Rémy Nocturne)* | `1.` Cobalt underpainting (`~`) → `2.` Twin spiral wind vortices (`~`) → `3.` Crescent moon (`O`) → `4.` Star halos (`O`) → `5.` Alpilles mountains (`~`) → `6.` Flame cypress (`/`) → `7.` Village & church spire (`/`) → `8.` Starlight bursts (`+`) | **Suite I: *Nocturne in G Major*** — Breath-paced `4.8 Hz` vibrato baritone cello, sine-wave harp plucks (`Layers 3+`), and octave bass pedal (`Layers 6+`) with natural cadential rests. |
| **Story II** (`Key 2`) | ***Sunflowers*** *(Arles Golden Still Life)* | `1.` Ochre studio wall & table (`~`) → `2.` Two-toned terracotta vase (`/`) → `3.` Olive stems (`/`) → `4.` Sienna seed crowns (`O`) → `5.` Inner cadmium petals (`~`) → `6.` Outer lemon-gold petals (`~`) → `7.` Umber seed spirals (`O`) → `8.` Afternoon sunbeams (`+`) | **Suite II: *Pastoral Aria in D Major*** — Lyric baritone cello phrasing in `D` Major with warm acoustic harp/bass accompaniment and brick-wall dynamic limiting. |

---

## 🛡️ Sensory & Input Guardrails (Honest Baseline Scope)

* **Keyboard, Button & Pointer Brush Parity:** Draw directly on the `320×240` canvas with touch, stylus, or mouse—or use high-contrast buttons and single-key shortcuts (**`~` Wave**, **`O` Circle**, **`/` Slash**, **`+` Cross**) which stamp matching impasto strokes onto the persistent pigment buffer (`pigmentBuf`). *(Note: Because this is a visual impasto painting canvas without spatial perimeter sonification, it is scoped for sighted, low-vision, and neurodivergent players rather than claiming full non-visual/blind screen-reader parity.)*
* **Sensory-Safe Audio (`M` to Unmute):** Boots strictly muted, avoids rigid metronomic beats in favor of breath-paced phrases, filters all harmonics below **`760 Hz`**, and terminates with a **`DynamicsCompressorNode` brick-wall limiter** (`-20 dB` threshold, `20:1` ratio).
* **Reduced-Motion & Braille Progress Display:** Automatically honors `prefers-reduced-motion` on boot, toggles animation via **`Space`**, and updates both a **5-cell Unicode Braille progress meter (`U+2800–U+28FF`)** and `aria-live="polite"` poetic status captions.

---

## 🚀 Quickstart & Verification

```bash
# 1. Run deterministic classifier, 8-stage story & pigment buffer tests (3/3 passing)
node --test test/vangogh-sanctuary.test.mjs

# 2. Launch locally over IPv4 in Chrome / Firefox
python3 -m http.server 8095 --bind 127.0.0.1
```

Open **`http://127.0.0.1:8095`** in your browser to paint ***Starry Night*** and ***Sunflowers***.

---

## 🤝 Research Lineage & Provenance

Part of the open contemplative and accessible game-systems series by **Borealis Serenity Hedling** ([`Borealiscodes`](https://github.com) • `NDH-RESEARCH-PILOT` • Dublin 8, Ireland • ORCID: [`0009-0004-7968-5707`](https://orcid.org)):
* **Zenodo Preprints & Datasets:** [`10.5281/zenodo.24240994`](https://doi.org) • [`10.5281/zenodo.24393275`](https://doi.org) • [`10.5281/zenodo.24399123`](https://doi.org)
* **Ecosystem Toolkits:** [`ndh-game-dev-kit`](https://github.com/ndh-game-dev-kit) • [`ndh-retro-hw-pipeline`](https://github.com/ndh-retro-hw-pipeline) • [`Zen-Shodo-Koan-Brush-Sanctuary`](https://github.com/Zen-Shodo-Koan-Brush-Sanctuary)

**License:** MIT License • `Signed-off-by: Borealis Serenity Hedling <chguard-sentinel@vaked.dev>`

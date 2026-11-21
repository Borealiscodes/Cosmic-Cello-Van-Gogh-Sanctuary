/**
 * src/painting-kernel.js — State Machine for Starry Night & Sunflowers Painting Adventure
 */

export const PAINTING_CHAPTERS = Array.of(
  {
    id: "starry-night",
    title: "Chapter I: Starry Night (Saint-Rémy Nocturne)",
    suiteName: "Suite I: Nocturne in G Major (Inspired by Vincent)",
    steps: Array.of(
      {
        shape: "WAVE",
        key: "~",
        label: "Sweep Swirling Wind Currents (~ Wave)",
        prompt: "Draw a flowing wave (~) across the night sky to awaken the cobalt wind currents and solo baritone cello.",
        completedText: "Cobalt and ultramarine wind currents swirl across the sky; the solo baritone cello enters in G Major."
      },
      {
        shape: "CIRCLE",
        key: "O",
        label: "Paint Crescent Moon & Stars (O Circle)",
        prompt: "Draw a closed circle (O) to ignite the glowing golden stars and crescent moon with fingerpicked harp arpeggios.",
        completedText: "Golden stars and crescent moon ignite in additive light; fingerpicked harp arpeggios weave beneath the cello."
      },
      {
        shape: "SLASH",
        key: "/",
        label: "Raise the Cypress Tree (/ Slash)",
        prompt: "Draw a tall upward slash (/) to raise the dark cypress tree and summon the warm string quartet pad.",
        completedText: "The deep emerald cypress rises toward the stars; warm chamber strings and pizzicato bass join the nocturne."
      },
      {
        shape: "CROSS",
        key: "+",
        label: "Kindle Village Starlight (+ Cross)",
        prompt: "Draw two intersecting strokes (+) to kindle radiant starlight bursts and complete Suite I.",
        completedText: "Starlight bursts shimmer above the sleeping village; soft celesta chimes complete the Starry Night nocturne."
      }
    )
  },
  {
    id: "sunflowers",
    title: "Chapter II: Sunflowers (Arles Golden Still Life)",
    suiteName: "Suite II: Pastoral Aria in D Major (Inspired by Mr. Tanner)",
    steps: Array.of(
      {
        shape: "SLASH",
        key: "/",
        label: "Shape Vase & Stems (/ Slash)",
        prompt: "Draw a steady slash (/) to shape the earthenware vase and ochre stems as the lyric baritone cello begins.",
        completedText: "Terracotta vase and olive-ochre stems emerge on warm washi parchment; the lyric baritone cello opens Suite II."
      },
      {
        shape: "CIRCLE",
        key: "O",
        label: "Crown the Seed Heads (O Circle)",
        prompt: "Draw a closed circle (O) to form the rich sienna seed crowns with pizzicato upright bass accompaniment.",
        completedText: "Burnt-sienna seed crowns bloom across the bouquet; pizzicato bass and acoustic chords establish a gentle pulse."
      },
      {
        shape: "WAVE",
        key: "~",
        label: "Curl Cadmium Petals (~ Wave)",
        prompt: "Draw a curling wave (~) to unfurl golden cadmium petals and bring in muted chamber strings.",
        completedText: "Golden cadmium petals unfurl in warm impasto; muted chamber strings and woodwind pads swell behind the cello."
      },
      {
        shape: "CROSS",
        key: "+",
        label: "Bathe in Afternoon Sun (+ Cross)",
        prompt: "Draw two intersecting strokes (+) to bathe the canvas in afternoon sunlight and complete the gallery.",
        completedText: "Warm afternoon sunlight bathes the Sunflowers still life; the full pastoral chamber ensemble resolves in D Major."
      }
    )
  }
);

export function createPaintingState() {
  const ch = PAINTING_CHAPTERS.at(0);
  const st = ch.steps.at(0);
  return {
    chapterIndex: 0,
    stepIndex: 0,
    orchestraLayers: 0,
    completedPaintings: 0,
    strokeHistory: Array.of(),
    narration: ch.title + " — " + st.prompt
  };
}

export function applyPaintingStroke(state, detectedShape) {
  const ch = PAINTING_CHAPTERS.at(state.chapterIndex);
  const st = ch.steps.at(state.stepIndex);

  if (!detectedShape || detectedShape === "NONE") {
    return {
      ...state,
      narration: "Brush touches the parchment softly. " + st.prompt
    };
  }

  if (detectedShape !== st.shape) {
    return {
      ...state,
      narration: "Gentle hint: you drew a " + detectedShape + ". " + st.prompt
    };
  }

  const nextLayer = state.stepIndex + 1;
  const nextHistory = state.strokeHistory.concat(detectedShape);

  if (state.stepIndex < ch.steps.length - 1) {
    const nextStep = ch.steps.at(state.stepIndex + 1);
    return {
      ...state,
      stepIndex: state.stepIndex + 1,
      orchestraLayers: nextLayer,
      strokeHistory: nextHistory,
      narration: st.completedText + " Next: " + nextStep.prompt
    };
  }

  if (state.chapterIndex < PAINTING_CHAPTERS.length - 1) {
    const nextCh = PAINTING_CHAPTERS.at(state.chapterIndex + 1);
    const nextSt = nextCh.steps.at(0);
    return {
      ...state,
      chapterIndex: state.chapterIndex + 1,
      stepIndex: 0,
      orchestraLayers: 1,
      completedPaintings: state.completedPaintings + 1,
      strokeHistory: nextHistory,
      narration: st.completedText + " Now entering " + nextCh.title + ". " + nextSt.prompt
    };
  }

  return {
    ...state,
    orchestraLayers: 4,
    completedPaintings: 2,
    strokeHistory: nextHistory,
    narration: st.completedText + " Both Starry Night and Sunflowers are complete in full chamber cello harmony."
  };
}

export function paintingProgressBraille(state) {
  const totalSteps = 8;
  const done = state.chapterIndex * 4 + (state.completedPaintings >= 2 ? 4 : state.stepIndex);
  const levels = Array.of(0x2800, 0x2840, 0x2844, 0x2846, 0x2847, 0x28c7, 0x28e7, 0x28f7, 0x28ff);
  const idx = Math.max(0, Math.min(8, Math.round((done / totalSteps) * 8)));
  return String.fromCodePoint(levels.at(idx)).repeat(5);
}

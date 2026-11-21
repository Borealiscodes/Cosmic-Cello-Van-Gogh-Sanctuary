/**
 * src/painting-kernel.js — Separate Selectable 8-Stage Additive Painting Stories
 */

export const PAINTING_STORIES = Array.of(
  {
    id: "starry-night",
    tabLabel: "Story I: Starry Night",
    title: "Story I: Starry Night (Saint-Rémy Nocturne)",
    suiteName: "Suite I: Nocturne in G Major (Lyric Baritone Cello & Harp)",
    steps: Array.of(
      { shape: "WAVE", key: "~", color: Array.of(48, 108, 224), prompt: "1/8 — Sweep a cobalt wave (~) across the sky to lay the deep ultramarine underpainting." },
      { shape: "WAVE", key: "~", color: Array.of(82, 168, 248), prompt: "2/8 — Sweep a second wave (~) to carve twin spiral wind vortices across the heavens." },
      { shape: "CIRCLE", key: "O", color: Array.of(255, 226, 92), prompt: "3/8 — Paint a golden circle (O) to ignite the luminous crescent moon on the upper right." },
      { shape: "CIRCLE", key: "O", color: Array.of(255, 242, 148), prompt: "4/8 — Paint another circle (O) to scatter glowing star halos across the night sky." },
      { shape: "WAVE", key: "~", color: Array.of(32, 64, 132), prompt: "5/8 — Draw a rolling wave (~) along the horizon to shape the distant Alpilles mountains." },
      { shape: "SLASH", key: "/", color: Array.of(28, 76, 54), prompt: "6/8 — Draw an upward slash (/) to raise the flame-like emerald cypress tree in the foreground." },
      { shape: "SLASH", key: "/", color: Array.of(248, 198, 72), prompt: "7/8 — Draw a gentle slash (/) to light the warm cottage windows and church spire below." },
      { shape: "CROSS", key: "+", color: Array.of(255, 248, 196), prompt: "8/8 — Draw a starlight cross (+) to crown the night with shimmering impasto radiance." }
    )
  },
  {
    id: "sunflowers",
    tabLabel: "Story II: Sunflowers",
    title: "Story II: Sunflowers (Arles Golden Still Life)",
    suiteName: "Suite II: Pastoral Aria in D Major (Lyric Cello & Acoustic Strings)",
    steps: Array.of(
      { shape: "WAVE", key: "~", color: Array.of(232, 192, 84), prompt: "1/8 — Sweep a warm ochre wave (~) to texture the sunlit Arles studio wall and table." },
      { shape: "SLASH", key: "/", color: Array.of(196, 118, 48), prompt: "2/8 — Draw a steady slash (/) to shape the two-toned terracotta earthenware vase." },
      { shape: "SLASH", key: "/", color: Array.of(78, 132, 48), prompt: "3/8 — Draw upward slashes (/) to grow sturdy olive-green stems rising from the vase." },
      { shape: "CIRCLE", key: "O", color: Array.of(168, 92, 28), prompt: "4/8 — Paint a circle (O) to form the rich burnt-sienna seed crowns at the center of each bloom." },
      { shape: "WAVE", key: "~", color: Array.of(246, 194, 34), prompt: "5/8 — Sweep a curling wave (~) to unfurl the inner ring of cadmium-yellow petals." },
      { shape: "WAVE", key: "~", color: Array.of(255, 228, 64), prompt: "6/8 — Sweep another wave (~) to layer bright lemon-gold outer impasto petals." },
      { shape: "CIRCLE", key: "O", color: Array.of(98, 54, 22), prompt: "7/8 — Paint a small circle (O) to stipple dark umber seed spirals and leafy accents." },
      { shape: "CROSS", key: "+", color: Array.of(255, 244, 184), prompt: "8/8 — Draw a sunlit cross (+) to bathe the finished Sunflowers bouquet in afternoon warmth." }
    )
  }
);

export function createStoryState(storyIndex = 0) {
  const idx = storyIndex === 1 ? 1 : 0;
  const story = PAINTING_STORIES.at(idx);
  return {
    storyIndex: idx,
    stepIndex: 0,
    completedSteps: 0,
    isComplete: false,
    narration: story.title + " — " + story.steps.at(0).prompt
  };
}

export function applyStoryGesture(state, detectedShape) {
  const story = PAINTING_STORIES.at(state.storyIndex);
  if (state.isComplete) {
    return {
      ...state,
      narration: story.title + " is complete. Continue adding freehand impasto brushstrokes or switch stories anytime."
    };
  }

  const step = story.steps.at(state.stepIndex);
  if (!detectedShape || detectedShape === "NONE") {
    return {
      ...state,
      narration: "Gentle brush touch on canvas. " + step.prompt
    };
  }

  if (detectedShape !== step.shape) {
    return {
      ...state,
      narration: "You painted a " + detectedShape + " stroke. For the next layer: " + step.prompt
    };
  }

  const nextCompleted = state.completedSteps + 1;
  if (state.stepIndex < story.steps.length - 1) {
    const nextStep = story.steps.at(state.stepIndex + 1);
    return {
      ...state,
      stepIndex: state.stepIndex + 1,
      completedSteps: nextCompleted,
      narration: "Layer " + nextCompleted + "/8 painted. " + nextStep.prompt
    };
  }

  return {
    ...state,
    completedSteps: 8,
    isComplete: true,
    narration: story.title + " complete (8/8 layers). Rest in the full chamber cello arrangement or keep painting freely."
  };
}

export function storyProgressBraille(state) {
  const levels = Array.of(0x2800, 0x2840, 0x2844, 0x2846, 0x2847, 0x28c7, 0x28e7, 0x28f7, 0x28ff);
  const idx = Math.max(0, Math.min(8, state.completedSteps));
  return String.fromCodePoint(levels.at(idx)).repeat(5);
}

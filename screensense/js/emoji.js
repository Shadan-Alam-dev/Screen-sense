// emoji.js — the reacting face, built from Fluent 3D emoji images
// (Microsoft Fluent Emoji, MIT licence — shipped in assets/emoji)
//
// A "mood" is a small stack of two <img> layers. When the stage
// changes, the old image shrinks away and the new one pops in.
// Continuous cues (size, track colour, lean while dragging) are
// handled by sliders.js through CSS variables.

const EMOJI_DIR = "assets/emoji/";

// low → high risk.  Each stage: image file + an idle motion.
const STAGES = [
  { file: "00-smiling_face_with_smiling_eyes.png", idle: "breathe" },
  { file: "01-slightly_smiling_face.png",          idle: "breathe" },
  { file: "02-neutral_face.png",                   idle: "none" },
  { file: "03-confused_face.png",                  idle: "none" },
  { file: "04-slightly_frowning_face.png",         idle: "none" },
  { file: "05-worried_face.png",                   idle: "none" },
  { file: "06-grimacing_face.png",                 idle: "tense" },
  { file: "07-persevering_face.png",               idle: "tense" },
  { file: "08-tired_face.png",                     idle: "shiver" },
  { file: "09-weary_face.png",                     idle: "shiver" },
  { file: "10-face_with_spiral_eyes.png",          idle: "dizzy" },
  { file: "11-face_exhaling.png",                  idle: "drained" },
];

// track / value colour: yellow → amber → coral → red
const RISK_COLORS = [
  [0.00, "#ffd24a"],
  [0.40, "#ffb03b"],
  [0.72, "#ff7a59"],
  [1.00, "#f2544e"],
];

// ---------- helpers ----------

function clamp01(t) {
  return Math.min(1, Math.max(0, t));
}

function lerp(a, b, k) {
  return a + (b - a) * k;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function riskColor(t) {
  t = clamp01(t);
  for (let i = 1; i < RISK_COLORS.length; i++) {
    const [t0, c0] = RISK_COLORS[i - 1];
    const [t1, c1] = RISK_COLORS[i];
    if (t <= t1) {
      const k = (t - t0) / (t1 - t0);
      const a = hexToRgb(c0);
      const b = hexToRgb(c1);
      const rgb = a.map((v, j) => Math.round(lerp(v, b[j], k)));
      return `rgb(${rgb.join(",")})`;
    }
  }
  return RISK_COLORS[RISK_COLORS.length - 1][1];
}

// where each stage ends (so calm moods get a bit more room)
const STAGE_ENDS = [
  0.10, 0.22, 0.34, 0.45, 0.55, 0.64,
  0.72, 0.80, 0.87, 0.93, 0.97, 1.00,
];

function stageIndex(t) {
  t = clamp01(t);
  for (let i = 0; i < STAGE_ENDS.length; i++) {
    if (t < STAGE_ENDS[i]) return i;
  }
  return STAGES.length - 1;
}

// warm the browser cache so the first swap never flickers
function preloadAll() {
  STAGES.forEach((s) => {
    const img = new Image();
    img.src = EMOJI_DIR + s.file;
  });
}

// ---------- the mood element ----------

function createMood() {
  const root = document.createElement("div");
  root.className = "mood";

  const back = document.createElement("img");
  const front = document.createElement("img");
  for (const img of [back, front]) {
    img.className = "mood-img";
    img.alt = "";
    img.draggable = false;
    img.decoding = "async";
    root.append(img);
  }

  const mood = { root, front, back, stage: -1 };
  return mood;
}

// show the stage for t; animate only when the stage really changes
function setMood(mood, t) {
  const i = stageIndex(t);
  if (i === mood.stage) return STAGES[i];
  const first = mood.stage === -1;
  mood.stage = i;

  const stage = STAGES[i];

  // the current front becomes the back (and fades out),
  // the fresh image pops in on top
  const outgoing = mood.front;
  const incoming = mood.back;
  mood.front = incoming;
  mood.back = outgoing;

  incoming.src = EMOJI_DIR + stage.file;
  incoming.className = "mood-img is-in";
  outgoing.className = "mood-img is-out";

  if (first) incoming.classList.add("no-anim");

  mood.root.dataset.idle = stage.idle;
  return stage;
}

preloadAll();

window.ScreenSenseMood = { createMood, setMood, riskColor, stageIndex };

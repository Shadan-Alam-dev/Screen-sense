// face.js — an SVG face that morphs from calm to overwhelmed
//
// Everything on the face is one shape whose points move, so any
// value of t (0..1) is a clean in-between — never two faces at once.
//
//   eyes  : closed path = top arc + bottom arc
//           (open oval, happy crescent, tight squint are all the
//            same path with different arc heights)
//   mouth : same idea, so a thin smile, a frown and an open mouth
//           are one path too
//   brows : fade in and tilt
//
// Reference moods:  😊 ☺️ 😐 😕 🙁 ☹️ 😣 😫 😵

const FACE_COLORS = [
  [0.00, "#ffd24a"],
  [0.40, "#ffb03b"],
  [0.72, "#ff7a59"],
  [1.00, "#f2544e"],
];

// Each stage is a full set of numbers; setFace blends neighbours.
const STAGES = [
  { t: 0.00, // 😊 — crescent eyes, big smile, cheeks
    eyeR: 7,   eyeTop: 9,   eyeBot: -3,
    browA: 0,  browIn: 0,
    mW: 34,    mTop: 13,    mBot: 16,  mY: 64,
    cheek: 0.5, sweat: 0, shake: 0 },

  { t: 0.18, // ☺️ — soft smile
    eyeR: 5.5, eyeTop: 7,   eyeBot: 7,
    browA: 0,  browIn: 0,
    mW: 30,    mTop: 9,     mBot: 12,  mY: 65,
    cheek: 0.3, sweat: 0, shake: 0 },

  { t: 0.34, // 😐 — flat
    eyeR: 5,   eyeTop: 7,   eyeBot: 7,
    browA: 0,  browIn: 0,
    mW: 26,    mTop: 0,     mBot: 3,   mY: 66,
    cheek: 0,  sweat: 0, shake: 0 },

  { t: 0.50, // 😕 — unsure, brows start to show
    eyeR: 5,   eyeTop: 6.5, eyeBot: 6.5,
    browA: 0.8, browIn: 4,
    mW: 28,    mTop: -7,    mBot: -4,  mY: 67,
    cheek: 0,  sweat: 0, shake: 0 },

  { t: 0.65, // ☹️ — clear frown
    eyeR: 5,   eyeTop: 6,   eyeBot: 6,
    browA: 1,  browIn: 6,
    mW: 30,    mTop: -12,   mBot: -9,  mY: 68,
    cheek: 0,  sweat: 0, shake: 0 },

  { t: 0.80, // 😣 — eyes squeezed, brows pulled in
    eyeR: 6.5, eyeTop: 1.6, eyeBot: 1.6,
    browA: 1,  browIn: -4,
    mW: 26,    mTop: -12,   mBot: -9,  mY: 68,
    cheek: 0,  sweat: 0.6, shake: 0 },

  { t: 0.90, // 😫 — open frown
    eyeR: 6.5, eyeTop: 1.4, eyeBot: 1.4,
    browA: 1,  browIn: -2,
    mW: 24,    mTop: -16,   mBot: -1,  mY: 69,
    cheek: 0,  sweat: 1, shake: 0.5 },

  { t: 1.00, // 😵 — small "o" mouth, overwhelmed
    eyeR: 6.5, eyeTop: 1.2, eyeBot: 1.2,
    browA: 1,  browIn: 6,
    mW: 16,    mTop: -8,    mBot: 6,   mY: 68,
    cheek: 0,  sweat: 1, shake: 1 },
];

// ---------- helpers ----------

function lerp(a, b, k) {
  return a + (b - a) * k;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function faceColor(t) {
  t = Math.min(1, Math.max(0, t));
  for (let i = 1; i < FACE_COLORS.length; i++) {
    const [t0, c0] = FACE_COLORS[i - 1];
    const [t1, c1] = FACE_COLORS[i];
    if (t <= t1) {
      const k = (t - t0) / (t1 - t0);
      const a = hexToRgb(c0);
      const b = hexToRgb(c1);
      const rgb = a.map((v, j) => Math.round(lerp(v, b[j], k)));
      return `rgb(${rgb.join(",")})`;
    }
  }
  return FACE_COLORS[FACE_COLORS.length - 1][1];
}

function expressionAt(t) {
  t = Math.min(1, Math.max(0, t));
  let i = 1;
  while (i < STAGES.length - 1 && STAGES[i].t < t) i++;
  const a = STAGES[i - 1];
  const b = STAGES[i];
  const k = (t - a.t) / (b.t - a.t);
  const out = {};
  for (const key of Object.keys(a)) out[key] = lerp(a[key], b[key], k);
  return out;
}

// closed "lens" shape: left → top arc → right → bottom arc → back
// top / bottom are how far the arcs bulge (negative = bulge up)
function lens(cx, cy, r, top, bottom) {
  const x1 = (cx - r).toFixed(2);
  const x2 = (cx + r).toFixed(2);
  const yTop = (cy - top).toFixed(2);
  const yBot = (cy + bottom).toFixed(2);
  return `M${x1} ${cy} Q${cx} ${yTop} ${x2} ${cy} ` +
         `Q${cx} ${yBot} ${x1} ${cy} Z`;
}

// ---------- building ----------

const SVG_NS = "http://www.w3.org/2000/svg";
let faceCount = 0;

function el(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

function createFace() {
  const id = `face${faceCount++}`;
  const svg = el("svg", { viewBox: "0 0 100 100", class: "face" });

  // soft light from top-left, soft shade bottom-right
  const defs = el("defs");
  const light = el("radialGradient", {
    id: `${id}-light`, cx: "35%", cy: "28%", r: "70%",
  });
  light.append(
    el("stop", { offset: "0", "stop-color": "#fff", "stop-opacity": 0.35 }),
    el("stop", { offset: "1", "stop-color": "#fff", "stop-opacity": 0 })
  );
  const shade = el("radialGradient", {
    id: `${id}-shade`, cx: "60%", cy: "75%", r: "70%",
  });
  shade.append(
    el("stop", { offset: "0.55", "stop-color": "#000", "stop-opacity": 0 }),
    el("stop", { offset: "1", "stop-color": "#000", "stop-opacity": 0.16 })
  );
  defs.append(light, shade);

  const skin = el("circle", { cx: 50, cy: 50, r: 48, class: "skin" });
  const skinLight = el("circle", {
    cx: 50, cy: 50, r: 48, fill: `url(#${id}-light)`,
  });
  const skinShade = el("circle", {
    cx: 50, cy: 50, r: 48, fill: `url(#${id}-shade)`,
  });

  const cheekL = el("circle", { cx: 28, cy: 57, r: 6.5, class: "cheek" });
  const cheekR = el("circle", { cx: 72, cy: 57, r: 6.5, class: "cheek" });

  const eyeL = el("path", { class: "feature" });
  const eyeR = el("path", { class: "feature" });
  const browL = el("path", { class: "line" });
  const browR = el("path", { class: "line" });
  const mouth = el("path", { class: "feature" });

  const sweat = el("path", {
    class: "sweat",
    d: "M82 22 c-4 7 -6 10.5 -6 14 a6 6 0 0 0 12 0 c0 -3.5 -2 -7 -6 -14z",
  });

  svg.append(
    defs, skin, skinLight, skinShade,
    cheekL, cheekR, eyeL, eyeR, browL, browR, mouth, sweat
  );

  return {
    svg,
    parts: { cheekL, cheekR, eyeL, eyeR, browL, browR, mouth, sweat },
  };
}

// ---------- updating ----------

function num(v) {
  return v.toFixed(2);
}

function setFace(face, t) {
  const e = expressionAt(t);
  const p = face.parts;

  face.svg.style.setProperty("--face", faceColor(t));

  // eyes
  p.eyeL.setAttribute("d", lens(35, 42, e.eyeR, e.eyeTop, e.eyeBot));
  p.eyeR.setAttribute("d", lens(65, 42, e.eyeR, e.eyeTop, e.eyeBot));

  // brows: browIn > 0 → inner ends lift (worried)
  //        browIn < 0 → inner ends drop (strained)
  const inner = 30 - e.browIn;
  const outer = 30 + e.browIn * 0.35;
  const mid = (inner + outer) / 2 - 1.2;   // gentle curve, no hump
  p.browL.setAttribute(
    "d", `M27 ${num(outer)} Q35 ${num(mid)} 42 ${num(inner)}`
  );
  p.browR.setAttribute(
    "d", `M73 ${num(outer)} Q65 ${num(mid)} 58 ${num(inner)}`
  );
  p.browL.setAttribute("opacity", e.browA.toFixed(3));
  p.browR.setAttribute("opacity", e.browA.toFixed(3));

  // mouth
  p.mouth.setAttribute("d", lens(50, e.mY, e.mW / 2, -e.mTop, e.mBot));

  // cheeks & sweat
  p.cheekL.setAttribute("opacity", e.cheek.toFixed(3));
  p.cheekR.setAttribute("opacity", e.cheek.toFixed(3));
  p.sweat.setAttribute("opacity", e.sweat.toFixed(3));

  return e;
}

window.ScreenSenseFace = { createFace, setFace, faceColor };

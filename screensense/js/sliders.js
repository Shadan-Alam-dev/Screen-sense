// sliders.js — builds every question row and wires it to a face
//
// Each question:
//   min / max / step  → the slider range
//   calm / worst      → where the face is fully relaxed (t = 0)
//                       and fully stressed (t = 1). This keeps the
//                       face honest: 10 h of screen time is already
//                       "worst", even if the slider goes to 16.
//   moods             → five short words, low → high risk

const QUESTIONS = [
  {
    id: "screenTime",
    label: "Screen time per day",
    min: 0, max: 16, step: 0.5, start: 4,
    calm: 1, worst: 10,
    unit: (v) => `${v} hrs`,
    moods: ["Light", "Typical", "Heavy", "Very heavy", "Nonstop"],
  },
  {
    id: "unlocks",
    label: "Times you unlock your phone",
    min: 0, max: 200, step: 5, start: 60,
    calm: 20, worst: 150,
    unit: (v) => `${v} a day`,
    moods: ["Rarely", "Now and then", "Often", "Constantly", "Reflex"],
  },
  {
    id: "notifications",
    label: "Notifications you get",
    min: 0, max: 300, step: 10, start: 80,
    calm: 20, worst: 220,
    unit: (v) => `${v} a day`,
    moods: ["Quiet", "Manageable", "Busy", "Noisy", "Buzzing"],
  },
  {
    id: "addiction",
    label: "How hooked do you feel?",
    min: 1, max: 10, step: 1, start: 5,
    calm: 1, worst: 10,
    unit: (v) => `${v} / 10`,
    moods: ["Free", "A little", "Fairly", "Very", "Can't stop"],
  },
  {
    id: "headaches",
    label: "Headaches in a week",
    min: 0, max: 7, step: 1, start: 1,
    calm: 0, worst: 6,
    unit: (v) => (v === 1 ? "1 day" : `${v} days`),
    moods: ["None", "Rare", "Some", "Most days", "Daily"],
  },
  {
    id: "productivity",
    label: "How productive are your days?",
    min: 1, max: 10, step: 1, start: 6,
    calm: 9, worst: 2, // flipped: low productivity = stressed face
    unit: (v) => `${v} / 10`,
    moods: ["Flowing", "Decent", "Meh", "Struggling", "Stuck"],
  },
];

const Face = window.ScreenSenseFace;
const desktop = window.matchMedia("(min-width: 720px)");

// ---------- helpers ----------

// 0..1 along the slider (used for the fill bar & face position)
function sliderPct(q, value) {
  return (value - q.min) / (q.max - q.min);
}

// 0..1 of "how worried the face should be"
function riskT(q, value) {
  const t = (value - q.calm) / (q.worst - q.calm);
  return Math.min(1, Math.max(0, t));
}

// round the raw slider value to the question's real step
function snap(q, raw) {
  const steps = Math.round((raw - q.min) / q.step);
  const v = q.min + steps * q.step;
  return Number(v.toFixed(2));
}

function moodWord(q, t) {
  const i = Math.min(4, Math.floor(t * 5));
  return q.moods[i];
}

function faceSizePx(rowEl) {
  const raw = getComputedStyle(rowEl).getPropertyValue("--face-size");
  return parseFloat(raw) || 56;
}

// ---------- build one row ----------

function buildQuestion(q) {
  const row = document.createElement("div");
  row.className = "q";

  // header: label + value
  const head = document.createElement("div");
  head.className = "q-head";

  const label = document.createElement("label");
  label.className = "q-label";
  label.htmlFor = q.id;
  label.textContent = q.label;

  const value = document.createElement("div");
  value.className = "q-value";
  head.append(label, value);

  // face
  const faceWrap = document.createElement("div");
  faceWrap.className = "q-face";
  const face = Face.createFace();
  faceWrap.append(face.svg);

  // slider
  const slider = document.createElement("div");
  slider.className = "q-slider";

  const track = document.createElement("div");
  track.className = "q-track";
  const fill = document.createElement("div");
  fill.className = "q-fill";
  track.append(fill);

  const range = document.createElement("input");
  range.type = "range";
  range.className = "q-range";
  range.id = q.id;
  range.name = q.id;
  range.min = q.min;
  range.max = q.max;
  // a very fine step so the face glides; the shown value is
  // rounded to the question's real step in render()
  range.step = (q.max - q.min) / 1000;
  range.value = q.start;

  // phone: face sits left of the track
  // desktop: face floats over the track as the handle
  const trackWrap = document.createElement("div");
  trackWrap.className = "q-track-wrap";
  trackWrap.append(track, range);

  slider.append(faceWrap, trackWrap);
  row.append(head, slider);

  // --- keep everything in sync with the slider value ---
  function render() {
    const raw = Number(range.value);
    const v = snap(q, raw);
    const pct = sliderPct(q, raw);
    const t = riskT(q, raw);

    const expr = Face.setFace(face, t);
    row.style.setProperty("--face", Face.faceColor(t));
    fill.style.width = `${pct * 100}%`;

    value.innerHTML =
      `<strong>${q.unit(v)}</strong> · ${moodWord(q, t)}`;
    range.setAttribute("aria-valuetext", `${q.unit(v)}, ${moodWord(q, t)}`);

    faceWrap.classList.toggle("is-stressed", expr.shake > 0.5);

    // the face grows with the value so high numbers catch the eye
    const maxGrow = desktop.matches ? 0.45 : 0.25;
    row.style.setProperty("--face-scale", (1 + maxGrow * t).toFixed(3));

    // desktop: the face rides on the slider as the handle
    if (desktop.matches) {
      const width = range.getBoundingClientRect().width;
      const size = faceSizePx(row);
      faceWrap.style.left = `${pct * (width - size)}px`;
    } else {
      faceWrap.style.left = "";
    }
  }

  range.addEventListener("input", render);

  // grab → grow (desktop only, via CSS)
  range.addEventListener("pointerdown", () => row.classList.add("is-dragging"));
  const release = () => row.classList.remove("is-dragging");
  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);

  render();
  return { row, render };
}

// ---------- mount ----------

const form = document.getElementById("questions");
const rows = QUESTIONS.map(buildQuestion);
rows.forEach((r) => form.append(r.row));

// re-place faces when the layout changes
function renderAll() {
  rows.forEach((r) => r.render());
}
window.addEventListener("resize", renderAll);
desktop.addEventListener("change", renderAll);

// fonts can shift widths slightly once loaded
if (document.fonts) document.fonts.ready.then(renderAll);

// sliders.js — builds emoji slider rows and wires each to a face
//
// The question lists live in questions.js. This file only knows
// how to turn one question into a slider row.
//
// Use:  const group = ScreenSenseSliders.mount(container, list);
//       group.values()   → { "Screen Time (hrs)": 4, ... }
//       group.renderAll() → re-place faces (after a step appears)

const Mood = window.ScreenSenseMood;
const desktop = window.matchMedia("(min-width: 720px)");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

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
  const mood = Mood.createMood();
  faceWrap.append(mood.root);

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

    Mood.setMood(mood, t);
    row.style.setProperty("--face", Mood.riskColor(t));
    fill.style.width = `${pct * 100}%`;

    value.innerHTML =
      `<strong>${q.unit(v)}</strong> · ${moodWord(q, t)}`;
    range.setAttribute("aria-valuetext", `${q.unit(v)}, ${moodWord(q, t)}`);

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

  // --- drag feel: grow while held, lean into the drag direction ---
  let dragging = false;
  let lastX = 0;
  let lean = 0;        // current tilt in degrees
  let leanTarget = 0;  // where the tilt wants to go
  let ticking = false;

  function animateLean() {
    // ease toward the target, and let the target settle back to 0
    lean += (leanTarget - lean) * 0.18;
    leanTarget *= 0.85;
    faceWrap.style.setProperty("--lean", `${lean.toFixed(2)}deg`);
    if (Math.abs(lean) > 0.05 || Math.abs(leanTarget) > 0.05) {
      requestAnimationFrame(animateLean);
    } else {
      faceWrap.style.setProperty("--lean", "0deg");
      ticking = false;
    }
  }

  function nudge(dx) {
    if (reduceMotion.matches) return;
    leanTarget = Math.max(-16, Math.min(16, leanTarget + dx * 0.9));
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(animateLean);
    }
  }

  range.addEventListener("pointerdown", (e) => {
    dragging = true;
    lastX = e.clientX;
    row.classList.add("is-dragging");
  });

  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    nudge(e.clientX - lastX);
    lastX = e.clientX;
  });

  const release = () => {
    if (!dragging) return;
    dragging = false;
    row.classList.remove("is-dragging");
  };
  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);

  render();
  return {
    row,
    render,
    key: q.key,
    value: () => snap(q, Number(range.value)),
  };
}

// ---------- mount ----------

const allRows = []; // every slider on the page, for resize

function mount(container, questions) {
  const rows = questions.map(buildQuestion);
  rows.forEach((r) => container.append(r.row));
  allRows.push(...rows);

  return {
    renderAll: () => rows.forEach((r) => r.render()),
    values: () => {
      const out = {};
      rows.forEach((r) => (out[r.key] = r.value()));
      return out;
    },
  };
}

// re-place faces when the layout changes
function renderEverySlider() {
  allRows.forEach((r) => r.render());
}
window.addEventListener("resize", renderEverySlider);
desktop.addEventListener("change", renderEverySlider);

// fonts can shift widths slightly once loaded
if (document.fonts) document.fonts.ready.then(renderEverySlider);

window.ScreenSenseSliders = { mount };

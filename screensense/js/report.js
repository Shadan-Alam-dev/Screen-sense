// report.js — shows the result on report.html
//
// 1. read the answers saved by steps.js
// 2. score them with risk.js
// 3. fill the gauge, the top factors and the tips

(function () {
  const Risk = window.ScreenSenseRisk;
  const Mood = window.ScreenSenseMood;

  const SUMMARY = {
    low: "Your phone habits look balanced. Keep doing what you're doing.",
    moderate: "Some habits are starting to add up. A few small changes would help.",
    high: "Your phone use is likely affecting how you feel. Start with the biggest factor below.",
  };

  const reduceMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- 1. read answers ----------

  function savedAnswers() {
    try {
      const raw = sessionStorage.getItem("screensense-answers");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  const answers = savedAnswers();
  if (!answers) {
    document.getElementById("emptyState").hidden = false;
    return;
  }

  // ---------- 2. score ----------

  const result = Risk.assess(answers);
  const level = result.level;
  const fraction = result.score / result.max;

  document.body.dataset.level = level.id; // colours come from CSS
  document.getElementById("result").hidden = false;
  document.getElementById("levelName").textContent = level.name;
  document.getElementById("levelSummary").textContent = SUMMARY[level.id];
  document.getElementById("scoreMax").textContent = result.max;

  // ---------- 3a. gauge ----------

  // white gaps on the arc where Low ends and High begins
  function pointOnArc(f, r) {
    const angle = Math.PI * (1 - f);
    return [110 + r * Math.cos(angle), 110 - r * Math.sin(angle)];
  }

  const gaps = document.getElementById("gaugeGaps");
  result.levels.slice(0, -1).forEach((l) => {
    const f = l.upTo / result.max;
    const [x1, y1] = pointOnArc(f, 78);
    const [x2, y2] = pointOnArc(f, 102);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1); line.setAttribute("y1", y1);
    line.setAttribute("x2", x2); line.setAttribute("y2", y2);
    line.setAttribute("class", "gauge-gap");
    gaps.append(line);
  });

  // the face matches the result
  const face = Mood.createMood();
  document.getElementById("gaugeFace").append(face.root);
  Mood.setMood(face, Math.min(1, fraction * 1.15));

  // fill the arc and count the number up together
  const fill = document.getElementById("gaugeFill");
  const scoreNumber = document.getElementById("scoreNumber");

  function countUp(to, duration) {
    const start = performance.now();
    function tick(now) {
      const k = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - k, 3); // ease-out
      scoreNumber.textContent = Math.round(to * eased);
      if (k < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if (reduceMotion) {
    fill.style.strokeDashoffset = 100 - fraction * 100;
    scoreNumber.textContent = result.score;
  } else {
    requestAnimationFrame(() => {
      fill.style.strokeDashoffset = 100 - fraction * 100;
      countUp(result.score, 1200);
    });
  }

  // ---------- 3b. top factors ----------

  const top = result.factors.slice(0, 3);
  const factorList = document.getElementById("factorList");

  if (top.length === 0) {
    factorList.innerHTML =
      '<p class="lede">Nothing stands out. None of your answers added to the score.</p>';
  }

  top.forEach((f, i) => {
    const row = document.createElement("div");
    row.className = i === 0 ? "factor is-top" : "factor";
    row.innerHTML =
      (i === 0 ? '<p class="factor-tag">Biggest factor</p>' : "") +
      `<div class="factor-head">` +
      `  <span class="factor-name">${f.name}</span>` +
      `  <span class="factor-points">+${f.points} pts</span>` +
      `</div>` +
      `<div class="factor-bar"><span style="--share:${f.weight}"></span></div>`;
    factorList.append(row);
  });

  // ---------- 3c. tips (one per top factor) ----------

  const tipList = document.getElementById("tipList");
  const tips = top.length
    ? top
    : [{ name: "Keep it up", tip: "Check again in a month to see if anything has changed." }];

  tips.forEach((f) => {
    const tip = document.createElement("div");
    tip.className = "tip";
    tip.innerHTML =
      `<p class="tip-for">${f.name}</p>` +
      `<p class="tip-text">${f.tip}</p>`;
    tipList.append(tip);
  });
})();

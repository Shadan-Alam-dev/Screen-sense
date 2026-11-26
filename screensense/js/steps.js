// steps.js — the 3-step flow
//
//   Step 1  usage   → emoji sliders
//   Step 2  habits  → chips + one Yes / No card
//   Step 3  health  → Yes / No cards + one summary face
//
// "Next" checks the current step, then slides to the next one.
// On the last step, all answers are saved and we open report.html.

(function () {
  const Sliders = window.ScreenSenseSliders;
  const Choices = window.ScreenSenseChoices;
  const Mood = window.ScreenSenseMood;

  // ---------- build every step ----------

  const usage = Sliders.mount(
    document.getElementById("usageSliders"), USAGE_SLIDERS
  );

  const habitChoices = Choices.mountChips(
    document.getElementById("habitChoices"), HABIT_CHOICES
  );
  const habitYesNo = Choices.mountYesNo(
    document.getElementById("habitYesNo"), HABIT_YES_NO
  );

  // step 3: one face that reacts to how many "Yes" answers
  const healthMood = Mood.createMood();
  document.getElementById("healthMood").append(healthMood.root);
  Mood.setMood(healthMood, 0);

  const health = Choices.mountYesNo(
    document.getElementById("healthYesNo"),
    HEALTH_YES_NO,
    updateHealthMood
  );

  function updateHealthMood(answers) {
    const yesCount = Object.values(answers).filter((v) => v === 1).length;
    const t = [0.05, 0.5, 0.7, 0.86, 1][yesCount];
    Mood.setMood(healthMood, t);
  }

  // what each step must check before moving on
  const STEPS = [
    {
      next: "Next: your habits",
      sliders: [usage],
      required: [],
    },
    {
      next: "Next: how you feel",
      sliders: [],
      required: [habitChoices, habitYesNo],
    },
    {
      next: "See my result",
      sliders: [],
      required: [health],
    },
  ];

  // ---------- navigation ----------

  const sections = [...document.querySelectorAll(".step")];
  const bars = [...document.querySelectorAll(".progress span")];
  const nextBtn = document.getElementById("nextBtn");
  const backBtn = document.getElementById("backBtn");
  const errorBox = document.getElementById("formError");

  let current = 0;

  function showStep(index, direction) {
    sections[current].hidden = true;
    current = index;

    const section = sections[current];
    section.hidden = false;
    section.classList.remove("enter-forward", "enter-back");
    void section.offsetWidth; // restart the animation
    section.classList.add(
      direction === "back" ? "enter-back" : "enter-forward"
    );

    // sliders measure their width, so place faces once visible
    STEPS[current].sliders.forEach((g) => g.renderAll());

    bars.forEach((bar, i) => {
      bar.classList.toggle("is-done", i < current);
      bar.classList.toggle("is-current", i === current);
    });

    nextBtn.textContent = STEPS[current].next;
    backBtn.hidden = current === 0;
    hideError();

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function missingFields() {
    return STEPS[current].required.flatMap((g) => g.missing());
  }

  function showError(missing) {
    missing.forEach((f) => f.classList.add("is-missing"));
    const count = missing.length;
    errorBox.textContent =
      count === 1
        ? "Answer the highlighted question to continue."
        : `Answer the ${count} highlighted questions to continue.`;
    errorBox.hidden = false;
    missing[0].scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function hideError() {
    errorBox.hidden = true;
  }

  // hide the message as soon as everything is answered
  document.addEventListener("change", () => {
    if (!errorBox.hidden && missingFields().length === 0) hideError();
  });

  nextBtn.addEventListener("click", () => {
    const missing = missingFields();
    if (missing.length) {
      showError(missing);
      return;
    }
    if (current < sections.length - 1) {
      showStep(current + 1, "forward");
    } else {
      finish();
    }
  });

  backBtn.addEventListener("click", () => {
    if (current > 0) showStep(current - 1, "back");
  });

  // ---------- finish ----------

  function allAnswers() {
    const usageAnswers = usage.values();
    return {
      ...usageAnswers,
      // the survey never asked this separately; our notebook copies
      // screen time into it, so the website does the same
      "Avg Daily Use (hrs)": usageAnswers["Screen Time (hrs)"],
      ...habitChoices.values(),
      ...habitYesNo.values(),
      ...health.values(),
    };
  }

  function finish() {
    const answers = allAnswers();
    try {
      sessionStorage.setItem("screensense-answers", JSON.stringify(answers));
    } catch {
      // storage blocked: the report page will ask to start again
    }
    console.log("ScreenSense answers", answers);
    window.location.href = "report.html";
  }

  showStep(0, "forward");
})();

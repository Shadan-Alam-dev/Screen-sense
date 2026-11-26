// landing.js — the live slider in the hero
//
// Reuses the same slider as the assessment, so what people try
// here is exactly what they'll use in the check.

(function () {
  const DEMO = [
    {
      id: "demoScreenTime",
      key: "demo",
      label: "Your screen time on a normal day",
      min: 0, max: 14, step: 0.5, start: 3,
      calm: 1, worst: 10,
      unit: (v) => `${v} hrs`,
      moods: ["Light", "Typical", "Heavy", "Very heavy", "Nonstop"],
    },
  ];

  window.ScreenSenseSliders.mount(
    document.getElementById("demoSlider"), DEMO
  );
})();

// risk.js — turns the saved answers into a risk result
//
// These are the same 13 rules as the scoring cell in our final
// notebook (decTree_Svm_survey.ipynb). For now the website scores in the browser; later the
// FastAPI model will return the level and this file will only
// explain the result (top factors + tips).
//
// Use:  const result = ScreenSenseRisk.assess(answers);
//       result.score, result.max, result.level, result.factors

(function () {
  // pick points from a list of [minimum, points], highest first
  function band(value, bands) {
    for (const [min, points] of bands) {
      if (value >= min) return points;
    }
    return 0;
  }

  // low productivity is the risky side, so this one counts down
  function bandBelow(value, bands) {
    for (const [max, points] of bands) {
      if (value <= max) return points;
    }
    return 0;
  }

  const SCROLL_LEVEL = {
    "Rarely": 0, "Sometimes": 1, "Often": 2, "Very Often": 3,
  };

  // each rule: what it's called, its max points, how to score it,
  // and one tip to show when it's a big part of the score
  const RULES = [
    {
      key: "Screen Time (hrs)", name: "Daily screen time", max: 25,
      points: (v) => band(v, [[8, 25], [6, 18], [4, 10], [2, 4]]),
      tip: "Set a daily app limit about an hour below where you are now, then lower it each week.",
    },
    {
      key: "Addiction (1-10)", name: "Feeling hooked", max: 20,
      points: (v) => band(v, [[9, 20], [7, 14], [5, 8], [3, 3]]),
      tip: "Move your most-opened apps off the home screen so opening them takes a decision.",
    },
    {
      key: "Unlocks", name: "Frequent unlocks", max: 15,
      points: (v) => band(v, [[100, 15], [60, 10], [30, 5]]),
      tip: "Keep the phone in another room for one focused hour a day.",
    },
    {
      key: "Avg Daily Use (hrs)", name: "Average daily use", max: 10,
      points: (v) => band(v, [[6, 10], [4, 6], [2, 2]]),
      tip: "Plan one phone-free block each day, like meals or the first hour after waking.",
    },
    {
      key: "Notifications", name: "Notifications", max: 5,
      points: (v) => band(v, [[150, 5], [80, 3], [30, 1]]),
      tip: "Turn off notifications for everything except calls and people you talk to daily.",
    },
    {
      key: "Dark/Bedtime Use", name: "Phone use in bed", max: 8,
      points: (v) => v * 8,
      tip: "Charge your phone away from the bed and stop scrolling an hour before sleep.",
    },
    {
      key: "Scrolling Habit", name: "Scrolling without a reason", max: 6,
      points: (v) => (SCROLL_LEVEL[v] ?? 0) * 2,
      tip: "Before you open an app, name what you came for. Close it once that's done.",
    },
    {
      key: "Sleep Difficulty", name: "Trouble sleeping", max: 12,
      points: (v) => v * 12,
      tip: "Switch on night mode after sunset and keep a fixed time to put the phone down.",
    },
    {
      key: "Anxious/Stressed", name: "Feeling anxious or stressed", max: 10,
      points: (v) => v * 10,
      tip: "Mute news and social feeds for a weekend and notice how you feel.",
    },
    {
      key: "Headaches/Week", name: "Headaches", max: 7,
      points: (v) => band(v, [[5, 7], [3, 4], [1, 1]]),
      tip: "Lower screen brightness, hold the phone further away, and take short breaks.",
    },
    {
      key: "Dry/Watery Eyes", name: "Eye strain", max: 5,
      points: (v) => v * 5,
      tip: "Use the 20-20-20 rule: every 20 minutes, look 20 feet away for 20 seconds.",
    },
    {
      key: "Cardiovascular", name: "Racing heart or chest discomfort", max: 6,
      points: (v) => v * 6,
      tip: "Mention this to a doctor, especially if it happens often or while resting.",
    },
    {
      key: "Productivity (1-10)", name: "Low productivity", max: 5,
      points: (v) => bandBelow(v, [[3, 5], [5, 3], [7, 1]]),
      tip: "Put your phone on Do Not Disturb during your most important task of the day.",
    },
  ];

  const MAX_SCORE = RULES.reduce((sum, r) => sum + r.max, 0); // 134
  const BIGGEST_RULE = Math.max(...RULES.map((r) => r.max));  // 25

  // Level cut-offs on the 0–134 score, taken from the survey data:
  //   Low      = up to the 40th percentile (57)
  //   High     = above the 75th percentile (74.5)
  // TODO: replace with the model's prediction once the API is ready.
  const LEVELS = [
    { id: "low",      name: "Low risk",      upTo: 57 },
    { id: "moderate", name: "Moderate risk", upTo: 74.5 },
    { id: "high",     name: "High risk",     upTo: MAX_SCORE },
  ];

  function assess(answers) {
    const factors = RULES.map((rule) => {
      const points = rule.points(answers[rule.key] ?? 0);
      return {
        ...rule,
        points,
        share: points / rule.max,       // how maxed-out this habit is
        weight: points / BIGGEST_RULE,  // for bars: same points, same bar
      };
    });

    const score = factors.reduce((sum, f) => sum + f.points, 0);
    const level = LEVELS.find((l) => score <= l.upTo);

    // biggest contributors first; on a tie, the one closest to its
    // own maximum wins. Skip the ones that added nothing.
    const ranked = factors
      .filter((f) => f.points > 0)
      .sort((a, b) => b.points - a.points || b.share - a.share);

    return { score, max: MAX_SCORE, level, levels: LEVELS, factors: ranked };
  }

  window.ScreenSenseRisk = { assess, MAX_SCORE, LEVELS };
})();

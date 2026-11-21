// questions.js — every question in the assessment (data only)
//
// `key` is the column name in our dataset, so the answers can be
// sent to the model later without renaming anything.

// ---------- Step 1: phone usage (emoji sliders) ----------
//   min / max / step → the slider range
//   calm / worst     → where the face is fully relaxed (t = 0)
//                      and fully stressed (t = 1)
//   moods            → five short words, low → high risk

const USAGE_SLIDERS = [
  {
    id: "screenTime",
    key: "Screen Time (hrs)",
    label: "Screen time per day",
    min: 0, max: 16, step: 0.5, start: 4,
    calm: 1, worst: 10,
    unit: (v) => `${v} hrs`,
    moods: ["Light", "Typical", "Heavy", "Very heavy", "Nonstop"],
  },
  {
    id: "unlocks",
    key: "Unlocks",
    label: "Times you unlock your phone",
    min: 0, max: 200, step: 5, start: 60,
    calm: 20, worst: 150,
    unit: (v) => `${v} a day`,
    moods: ["Rarely", "Now and then", "Often", "Constantly", "Reflex"],
  },
  {
    id: "notifications",
    key: "Notifications",
    label: "Notifications you get",
    min: 0, max: 300, step: 10, start: 80,
    calm: 20, worst: 220,
    unit: (v) => `${v} a day`,
    moods: ["Quiet", "Manageable", "Busy", "Noisy", "Buzzing"],
  },
  {
    id: "addiction",
    key: "Addiction (1-10)",
    label: "How hooked do you feel?",
    min: 1, max: 10, step: 1, start: 5,
    calm: 1, worst: 10,
    unit: (v) => `${v} / 10`,
    moods: ["Free", "A little", "Fairly", "Very", "Can't stop"],
  },
  {
    id: "headaches",
    key: "Headaches/Week",
    label: "Headaches in a week",
    min: 0, max: 7, step: 1, start: 1,
    calm: 0, worst: 6,
    unit: (v) => (v === 1 ? "1 day" : `${v} days`),
    moods: ["None", "Rare", "Some", "Most days", "Daily"],
  },
  {
    id: "productivity",
    key: "Productivity (1-10)",
    label: "How productive are your days?",
    min: 1, max: 10, step: 1, start: 6,
    calm: 9, worst: 2, // flipped: low productivity = stressed face
    unit: (v) => `${v} / 10`,
    moods: ["Flowing", "Decent", "Meh", "Struggling", "Stuck"],
  },
];

// ---------- Step 2: habits ----------

const HABIT_SLIDERS = [
  {
    id: "avgDailyUse",
    key: "Avg Daily Use (hrs)",
    label: "Average use over the last week",
    min: 0, max: 16, step: 0.5, start: 4,
    calm: 1, worst: 10,
    unit: (v) => `${v} hrs a day`,
    moods: ["Light", "Typical", "Heavy", "Very heavy", "Nonstop"],
  },
];

// single-choice chips
//   value → exactly what the dataset stores
const HABIT_CHOICES = [
  {
    id: "scrollingHabit",
    key: "Scrolling Habit",
    label: "How often do you scroll without a reason?",
    options: [
      { value: "Rarely", text: "Rarely" },
      { value: "Sometimes", text: "Sometimes" },
      { value: "Often", text: "Often" },
      { value: "Very Often", text: "Very often" },
    ],
  },
  {
    id: "ageGroup",
    key: "Age Group",
    label: "Your age group",
    options: [
      { value: "below 13", text: "Under 13" },
      { value: "13-18", text: "13–18" },
      { value: "19-25", text: "19–25" },
      { value: "26-40", text: "26–40" },
      { value: "41-60", text: "41–60" },
    ],
  },
];

// ---------- Yes / No questions ----------
//   icon → a name from ICONS in choices.js

const HABIT_YES_NO = [
  {
    id: "darkBedtimeUse",
    key: "Dark/Bedtime Use",
    icon: "moon",
    label: "Do you use your phone in bed, with the lights off?",
  },
];

// ---------- Step 3: how you feel ----------

const HEALTH_YES_NO = [
  {
    id: "sleepDifficulty",
    key: "Sleep Difficulty",
    icon: "sleep",
    label: "Do you find it hard to fall asleep?",
  },
  {
    id: "dryEyes",
    key: "Dry/Watery Eyes",
    icon: "eye",
    label: "Do your eyes feel dry or watery?",
  },
  {
    id: "anxious",
    key: "Anxious/Stressed",
    icon: "wave",
    label: "Do you often feel anxious or stressed?",
  },
  {
    id: "cardiovascular",
    key: "Cardiovascular",
    icon: "heart",
    label: "Do you notice a racing heart or chest discomfort?",
  },
];

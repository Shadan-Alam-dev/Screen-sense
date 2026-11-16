// theme.js — light / dark switch
// The chosen theme is remembered in localStorage.

const root = document.documentElement;
const themeToggle = document.getElementById("themeToggle");

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  const next = theme === "dark" ? "light" : "dark";
  themeToggle.setAttribute("aria-label", `Switch to ${next} theme`);
}

function savedTheme() {
  try {
    return localStorage.getItem("screensense-theme");
  } catch {
    return null;
  }
}

function rememberTheme(theme) {
  try {
    localStorage.setItem("screensense-theme", theme);
  } catch {
    // private mode etc. — ignore
  }
}

// start: saved choice, else follow the device setting
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
applyTheme(savedTheme() || (prefersDark.matches ? "dark" : "light"));

themeToggle.addEventListener("click", () => {
  const current = root.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  rememberTheme(next);
});

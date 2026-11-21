// choices.js — single-choice chips and Yes / No cards
//
// Both are plain radio buttons underneath, so they work with a
// keyboard and screen readers. CSS (choices.css) makes them look
// like chips and cards.
//
// Use:  const group = ScreenSenseChoices.mountChips(container, list);
//       const group = ScreenSenseChoices.mountYesNo(container, list, onChange);
//       group.values()  → { "Age Group": "19-25", ... }  (null if empty)
//       group.missing() → the rows that still need an answer

(function () {
  // simple line icons (24 × 24, drawn with strokes)
  const ICONS = {
    moon:
      '<path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z"/>',
    sleep:
      '<path d="M3 18v-6.5A2.5 2.5 0 0 1 5.5 9h13A2.5 2.5 0 0 1 21 11.5V18"/>' +
      '<path d="M3 15h18M6.5 9V7.5A1.5 1.5 0 0 1 8 6h2.5A1.5 1.5 0 0 1 12 7.5V9"/>' +
      '<path d="M15 3.5h3l-3 3h3"/>',
    eye:
      '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/>' +
      '<circle cx="12" cy="12" r="3"/>',
    wave:
      '<path d="M3 12h3l2-5 3.5 10 2.5-7 1.5 2H21"/>',
    heart:
      '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10C19.5 15.4 12 20 12 20z"/>',
  };

  function icon(name) {
    return (
      '<svg class="choice-icon" viewBox="0 0 24 24" aria-hidden="true">' +
      (ICONS[name] || "") +
      "</svg>"
    );
  }

  function checkedValue(fieldset) {
    const picked = fieldset.querySelector("input:checked");
    return picked ? picked.value : null;
  }

  // ---------- chips ----------

  function buildChips(q) {
    const field = document.createElement("fieldset");
    field.className = "chips-field";
    field.dataset.key = q.key;

    const legend = document.createElement("legend");
    legend.className = "q-label";
    legend.textContent = q.label;

    const list = document.createElement("div");
    list.className = "chips";

    q.options.forEach((opt) => {
      const chip = document.createElement("label");
      chip.className = "chip";
      chip.innerHTML =
        `<input type="radio" name="${q.id}" value="${opt.value}">` +
        `<span>${opt.text}</span>`;
      list.append(chip);
    });

    field.append(legend, list);
    field.addEventListener("change", () =>
      field.classList.remove("is-missing")
    );
    return field;
  }

  function mountChips(container, questions) {
    const fields = questions.map(buildChips);
    fields.forEach((f) => container.append(f));
    return groupApi(fields);
  }

  // ---------- Yes / No cards ----------

  function buildYesNo(q) {
    const card = document.createElement("div");
    card.className = "yn-card";
    card.dataset.key = q.key;
    card.setAttribute("role", "group");
    card.setAttribute("aria-labelledby", `${q.id}-label`);

    card.innerHTML =
      `<div class="yn-icon">${icon(q.icon)}</div>` +
      `<p class="yn-label" id="${q.id}-label">${q.label}</p>` +
      `<div class="yn-switch">` +
      `  <label class="yn-option">` +
      `    <input type="radio" name="${q.id}" value="0">` +
      `    <span>No</span>` +
      `  </label>` +
      `  <label class="yn-option">` +
      `    <input type="radio" name="${q.id}" value="1">` +
      `    <span>Yes</span>` +
      `  </label>` +
      `</div>`;

    card.addEventListener("change", () => {
      const v = checkedValue(card);
      card.classList.remove("is-missing");
      card.classList.toggle("is-yes", v === "1");
      card.classList.toggle("is-no", v === "0");
    });
    return card;
  }

  function mountYesNo(container, questions, onChange) {
    const cards = questions.map(buildYesNo);
    cards.forEach((c) => container.append(c));
    const api = groupApi(cards, (v) => (v === null ? null : Number(v)));

    if (onChange) {
      cards.forEach((c) =>
        c.addEventListener("change", () => onChange(api.values()))
      );
    }
    return api;
  }

  // ---------- shared ----------

  function groupApi(fields, convert = (v) => v) {
    return {
      values: () => {
        const out = {};
        fields.forEach((f) => {
          out[f.dataset.key] = convert(checkedValue(f));
        });
        return out;
      },
      missing: () => fields.filter((f) => checkedValue(f) === null),
    };
  }

  window.ScreenSenseChoices = { mountChips, mountYesNo };
})();

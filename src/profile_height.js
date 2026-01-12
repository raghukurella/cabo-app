// profile_height.js
import { qs } from "./profile_helpers.js";
export function profile_populateHeightOptionsFor(selectEl) {
  if (!selectEl) return;

  selectEl.innerHTML = `<option value="">Height…</option>`;

  for (let feet = 4; feet <= 7; feet++) {
    for (let inches = 0; inches <= 11; inches++) {
      const option = document.createElement("option");
      option.value = `${feet}'${inches}"`;
      option.textContent = `${feet}'${inches}"`;
      selectEl.appendChild(option);
    }
  }
}

window.profile_populateHeightOptionsFor = profile_populateHeightOptionsFor;

// ❌ Do NOT auto-call here — profile_init() handles timing now
//  setTimeout(profile_populateHeightOptions, 0);
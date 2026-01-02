// profile_height.js
import { qs } from "./profile_helpers.js";

export function profile_populateHeightOptions() {
  const heightSelect = qs("height");
  if (!heightSelect) return;

  // Clear existing options
  heightSelect.innerHTML = `<option value="">Height…</option>`;

  for (let feet = 4; feet <= 7; feet++) {
    for (let inches = 0; inches <= 11; inches++) {
      const option = document.createElement("option");
      option.value = `${feet}'${inches}"`;
      option.textContent = `${feet}'${inches}"`;
      heightSelect.appendChild(option);
    }
  }
}
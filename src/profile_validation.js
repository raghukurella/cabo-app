// profile_validation.js
import { profile_toggleAccordion } from "./profile_accordion.js";

export function profile_validateForm() {
  let valid = true;
  const requiredFields = document.querySelectorAll("#profileForm input[required], #profileForm select[required]");
  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      valid = false;
      field.classList.add("border-red-500");
      if (!field.nextElementSibling || !field.nextElementSibling.classList.contains("error-msg")) {
        const helper = document.createElement("p");
        helper.className = "error-msg text-xs text-red-600 mt-1";
        helper.textContent = "This field is required.";
        field.insertAdjacentElement("afterend", helper);
      }
      const section = field.closest("[id^='section']");
      if (section) profile_toggleAccordion(section.id);
    } else {
      field.classList.remove("border-red-500");
      const helper = field.nextElementSibling;
      if (helper && helper.classList.contains("error-msg")) helper.remove();
    }
  });
  return valid;
}
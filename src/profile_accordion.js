// profile_accordion.js
export function profile_toggleAccordion(id) {
  document.querySelectorAll("[id^='section']").forEach(el => el.classList.add("hidden"));
  document.querySelectorAll("[id^='icon-section']").forEach(el => el.textContent = "+");
  const section = document.getElementById(id);
  const icon = document.getElementById("icon-" + id);
  if (section && icon) {
    section.classList.remove("hidden");
    icon.textContent = "−";
    const firstInput = section.querySelector("input, select, textarea");
    if (firstInput) firstInput.focus();
  }
}
window.toggleAccordion = profile_toggleAccordion; // for inline onclick
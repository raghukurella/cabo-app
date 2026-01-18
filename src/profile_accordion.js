// profile_accordion.js
export function profile_toggleAccordion(id) {
  const section = document.getElementById(id);
  const icon = document.getElementById("icon-" + id);
  if (!section || !icon) return;

  // 1. Check if currently open
  const wasOpen = !section.classList.contains("hidden");

  // 2. Close ALL
  document.querySelectorAll("[id^='section']").forEach(el => el.classList.add("hidden"));
  document.querySelectorAll("[id^='icon-section']").forEach(el => el.textContent = "+");

  // 3. If it WAS NOT open, open it now (otherwise leave it closed)
  if (!wasOpen) {
    section.classList.remove("hidden");
    icon.textContent = "−";
    const firstInput = section.querySelector("input, select, textarea");
    if (firstInput) firstInput.focus();
  }
}
window.toggleAccordion = profile_toggleAccordion; // for inline onclick
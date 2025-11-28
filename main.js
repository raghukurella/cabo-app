import { disableFieldsUntilGenderChosen, initGenderToggle } from './demographics.js';
import { populateEducationLevels, populateCitizenshipDropdowns } from './education.js';
import { loadQuestions } from './questions.js';
import { validateStep } from './validation.js';
import { submitForm } from './submit.js';

import { populateDob, populateTob } from './demographics.js';

document.addEventListener('DOMContentLoaded', () => {
  populateDob();
  populateTob();
  // other init calls...
});

// Countries list for citizenship dropdowns
const countries = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia","Austria","Azerbaijan",
  "Bahamas","Bahrain","Bangladesh","Belgium","Bhutan","Bolivia","Brazil","Bulgaria","Cambodia","Canada",
  "Chile","China","Colombia","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic","Denmark","Dominican Republic",
  "Ecuador","Egypt","Estonia","Finland","France","Germany","Greece","Hungary","Iceland","India","Indonesia","Iran","Iraq",
  "Ireland","Israel","Italy","Japan","Jordan","Kenya","Kuwait","Latvia","Lebanon","Lithuania","Luxembourg","Malaysia",
  "Mexico","Monaco","Mongolia","Morocco","Nepal","Netherlands","New Zealand","Nigeria","Norway","Pakistan","Panama",
  "Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Saudi Arabia","Serbia","Singapore","Slovakia",
  "Slovenia","South Africa","South Korea","Spain","Sri Lanka","Sweden","Switzerland","Syria","Taiwan","Thailand",
  "Turkey","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Venezuela","Vietnam","Yemen","Zimbabwe"
];

let steps = [];
let currentStep = 0;

function renderStep() {
  steps.forEach((el, index) => {
    el.classList.toggle('hidden', index !== currentStep);
  });
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  if (prevBtn) prevBtn.disabled = currentStep === 0;
  if (nextBtn) nextBtn.textContent = currentStep === steps.length - 1 ? 'Submit' : 'Next';
  const progress = document.getElementById('progressIndicator');
  if (progress) progress.textContent = `Step ${currentStep + 1} of ${steps.length}`;
}

document.addEventListener('DOMContentLoaded', async () => {
  const step0 = document.getElementById('step0');
  const stepEducation = document.getElementById('stepEducation');
  steps = [];
  if (step0) steps.push(step0);
  if (stepEducation) steps.push(stepEducation);

  // Lock until gender chosen
  disableFieldsUntilGenderChosen();
  initGenderToggle();

  // Populate dropdowns
  await populateEducationLevels();
  populateCitizenshipDropdowns(countries);

  // Load questions (adds cards of 7 to steps)
  await loadQuestions(steps);

  // Show first step
  renderStep();

  // Navigation
  const nextBtn = document.getElementById('nextBtn');
  const prevBtn = document.getElementById('prevBtn');

  nextBtn?.addEventListener('click', async () => {
    const currentStepEl = steps[currentStep];
    const valid = validateStep(currentStepEl);
    if (!valid) {
      // focus the first invalid input/select/textarea inside current step
      const firstInvalid = currentStepEl.querySelector('.invalid');
      if (firstInvalid) {
        try {
          // if container has form control children, focus the first one
          if (firstInvalid.matches('.form-field')) {
            const ctrl = firstInvalid.querySelector('input, select, textarea, button');
            if (ctrl && typeof ctrl.focus === 'function') ctrl.focus();
          } else if (typeof firstInvalid.focus === 'function') {
            firstInvalid.focus();
          }
        } catch (e) {
          // ignore focus errors
        }
      }
      return;
    }

    if (currentStep === steps.length - 1) {
      const ok = await submitForm();
      if (ok) {
        const form = document.getElementById('matchForm');
        form.reset();
        currentStep = 0;
        disableFieldsUntilGenderChosen();
        renderStep();
      }
      return;
    }
    currentStep++;
    renderStep();
  });

  prevBtn?.addEventListener('click', () => {
    if (currentStep > 0) {
      currentStep--;
      renderStep();
    }
  });
});
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


document.addEventListener('DOMContentLoaded', () => {
  const feetContainer = document.getElementById('feetOptions');
  const inchContainer = document.getElementById('inchOptions');

  // Feet: 4–7
  for (let ft = 4; ft <= 7; ft++) {
    const label = document.createElement('label');
    label.className = 'radio-btn';

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'heightFeet';
    radio.value = ft;

    const span = document.createElement('span');
    span.textContent = ft; // just the number

    label.appendChild(radio);
    label.appendChild(span);
    feetContainer.appendChild(label);
  }

  // Inches: 0–12
  for (let inch = 0; inch <= 12; inch++) {
    const label = document.createElement('label');
    label.className = 'radio-btn';

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'heightInches';
    radio.value = inch;

    const span = document.createElement('span');
    span.textContent = inch; // just the number

    label.appendChild(radio);
    label.appendChild(span);
    inchContainer.appendChild(label);
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  const dropdown = document.getElementById('citizenship_at_birth');
  if (!dropdown) return;

  // 1. Fetch distinct citizenship values from demographics
  const { data: dbCountries, error } = await window.supabaseClient
    .from('demographics')
    .select('citizenship_at_birth')
    .not('citizenship_at_birth', 'is', null);

  if (error) {
    console.error('Error fetching citizenships:', error.message);
    return;
  }

  // Normalize values (trim + proper case)
  const dbSet = new Set(
    (dbCountries || [])
      .map(r => (r.citizenship_at_birth || '').trim())
      .filter(Boolean)
  );

  // 2. Full master list of countries
  const allCountries = [
    "Afghanistan","Albania","Algeria","Argentina","Australia","Austria",
    "Bangladesh","Belgium","Brazil","Canada","China","Denmark","Egypt",
    "France","Germany","India","Italy","Japan","Mexico","Netherlands",
    "Norway","Pakistan","Portugal","Russia","South Africa","Spain",
    "Sweden","Switzerland","United Kingdom","United States"
    // … add full ISO list here
  ];

  // 3. Split into two arrays
  const dbList = allCountries.filter(c =>
    dbSet.has(c) || dbSet.has(c.toLowerCase()) || dbSet.has(c.toUpperCase())
  );
  const otherList = allCountries.filter(c => !dbList.includes(c))
    .sort((a, b) => a.localeCompare(b));

  // 4. Populate dropdown
  dropdown.innerHTML = '';

  if (dbList.length) {
    const optGroupDb = document.createElement('optgroup');
    optGroupDb.label = 'Countries in Database';
    dbList.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      optGroupDb.appendChild(opt);
    });
    dropdown.appendChild(optGroupDb);
  }

  const optGroupOther = document.createElement('optgroup');
  optGroupOther.label = 'All Other Countries';
  otherList.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    optGroupOther.appendChild(opt);
  });
  dropdown.appendChild(optGroupOther);
});


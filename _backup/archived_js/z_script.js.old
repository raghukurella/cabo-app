const { createClient } = supabase;

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


let steps = [];
let currentStep = 0;

/* -----------------------
   Validation
----------------------- */
function validateInput(input) {
  if (input.disabled) {
    input.classList.remove('invalid');
    return true;
  }
  const value = input.value.trim();
  if (input.required && !value) {
    input.classList.add('invalid');
    return false;
  }
  input.classList.remove('invalid');
  return true;
}

/* -----------------------
   Step rendering
----------------------- */
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

/* -----------------------
   Lock demographics until gender chosen
----------------------- */
function disableFieldsUntilGenderChosen() {
  const allFields = document.querySelectorAll('#step0 input, #step0 select');
  allFields.forEach(field => {
    if (field.id !== 'gender') {
      field.disabled = true;
      field.classList.remove('invalid');
    }
  });
}
function enableFieldsAfterGender() {
  const allFields = document.querySelectorAll('#step0 input, #step0 select');
  allFields.forEach(field => {
    if (field.id !== 'gender') {
      field.disabled = false;
    }
  });
}

/* -----------------------
   Education dropdowns
----------------------- */
async function populateEducationLevels() {
  const { data: eduLevels, error } = await supabaseClient
    .from('education_levels')
    .select('value');
  if (error) {
    console.error('Education levels load error:', error);
    return;
  }
  const highestSelect = document.getElementById('highest_education_level');
  const secondarySelect = document.getElementById('secondary_education_level');
  [highestSelect, secondarySelect].forEach(select => {
    if (select) {
      select.innerHTML = '<option value="">Select Education</option>';
      eduLevels.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.value;
        opt.textContent = d.value;
        select.appendChild(opt);
      });
    }
  });
}

/* -----------------------
   Citizenship dropdowns
----------------------- */
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
function populateCitizenshipDropdowns() {
  const birthSelect = document.getElementById('citizenship_at_birth');
  const currentSelect = document.getElementById('current_citizenship');
  [birthSelect, currentSelect].forEach(select => {
    if (select) {
      select.innerHTML = '<option value="">Select Country</option>';
      countries.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        select.appendChild(opt);
      });
    }
  });
}

/* -----------------------
   Questions
----------------------- */
async function loadQuestions() {
  const { data: questions, error } = await supabaseClient
    .from('questions')
    .select('id, question_text, input_type, options, display_order, is_visible, is_required')
    .order('display_order', { ascending: true });
  if (error) {
    console.error('Questions load error:', error);
    return;
  }
  const visibleQuestions = questions.filter(q => q.is_visible);
  renderQuestionCards(visibleQuestions);
}
function renderQuestion(q, container) {
  const div = document.createElement('div');
  div.className = 'form-field';
  const label = document.createElement('label');
  label.textContent = q.question_text;
  if (q.input_type === 'dropdown' && q.options) {
    const select = document.createElement('select');
    select.name = `question_${q.id}`;
    select.id = `question_${q.id}`;
    if (q.is_required) select.required = true;
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = 'Select an option';
    select.appendChild(defaultOpt);
    q.options.forEach(optVal => {
      const opt = document.createElement('option');
      opt.value = optVal;
      opt.textContent = optVal;
      select.appendChild(opt);
    });
    div.appendChild(label);
    div.appendChild(select);
  } else {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = `question_${q.id}`;
    input.id = `question_${q.id}`;
    if (q.is_required) input.required = true;
    div.appendChild(label);
    div.appendChild(input);
  }
  container.appendChild(div);
}
function renderQuestionCards(questions) {
  const container = document.getElementById('questionStep');
  const chunkSize = 7;
  for (let i = 0; i < questions.length; i += chunkSize) {
    const card = document.createElement('div');
    card.className = 'step hidden';
    const slice = questions.slice(i, i + chunkSize);
    slice.forEach(q => renderQuestion(q, card));
    container.appendChild(card);
    steps.push(card);
  }
}

/* -----------------------
   Submission
----------------------- */
async function submitForm() {
    const form = document.getElementById('matchForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
  
    // Demographics insert
    const { data: demoData, error: demoError } = await supabaseClient
      .from('demographics')
      .insert([{
        full_name: data.full_name,
        place_of_birth: data.place_of_birth,
        email: data.email,
        phone_number: data.phone_number,
        date_of_birth: data.date_of_birth,
        time_of_birth: data.time_of_birth,
        gender: data.gender,
        zip: data.zip,
        citizenship_at_birth: data.citizenship_at_birth,
        current_citizenship: data.current_citizenship,
        highest_education_level: data.highest_education_level,
        highest_education_school: data.highest_education_school,
        secondary_education_level: data.secondary_education_level,
        secondary_education_school: data.secondary_education_school,
        education_notes: data.education_notes
      }])
      .select();
  
    if (demoError) {
      console.error('Demographic insert error:', demoError);
      alert('Failed to submit demographic info.');
      return;
    }
  
    const demographic_id = demoData[0].id;
  
    // Collect responses: normalize checkboxes "on" -> "true"
    const responses = [];
    for (let [key, val] of formData.entries()) {
      if (key.startsWith('question_')) {
        responses.push({
          demographic_id,
          question_id: parseInt(key.split('_')[1], 10),
          answer: val === 'on' ? 'true' : val
        });
      }
    }
  
    if (responses.length > 0) {
      const { error: responseError } = await supabaseClient
        .from('responses')
        .insert(responses);
  
      if (responseError) {
        console.error('Response insert error:', responseError);
        alert('Failed to submit responses.');
        return;
      }
    }
  
    alert('Form submitted successfully!');
    form.reset();
    currentStep = 0;
    disableFieldsUntilGenderChosen();
    renderStep();
  }
  
  /* -----------------------
     Init
  ----------------------- */
  document.addEventListener('DOMContentLoaded', async () => {
    const step0 = document.getElementById('step0');
    const stepEducation = document.getElementById('stepEducation');
  
    // Initialize steps with static sections first
    steps = [];
    if (step0) steps.push(step0);
    if (stepEducation) steps.push(stepEducation);
  
    // Lock Demographics until gender chosen
    disableFieldsUntilGenderChosen();
  
    // Gender toggle
    (function initGenderToggle() {
      const genderHidden = document.getElementById('gender');
      const toggleWrap = document.getElementById('genderToggle');
      if (!genderHidden || !toggleWrap) return;
  
      toggleWrap.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
          const val = btn.dataset.value;
          genderHidden.value = val;
          toggleWrap.querySelectorAll('button').forEach(b => {
            b.classList.toggle('active', b === btn);
          });
          enableFieldsAfterGender();
        });
      });
    })();
  
    // Populate DOB and bind hidden field
    populateDob();
  
    // Populate TOB and bind hidden field
    populateTob();
  
    // Education levels
    await populateEducationLevels();
  
    // Citizenship dropdowns
    populateCitizenshipDropdowns();
  
    // Load questions (this will append question cards to steps)
    await loadQuestions();
  
    // Render initial step
    renderStep();
  
    // Navigation buttons
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
  
    nextBtn?.addEventListener('click', () => {
      const currentStepEl = steps[currentStep];
      if (!currentStepEl) return;
  
      const ok = validateStep(currentStepEl);
      if (!ok) return;
  
      if (currentStep === steps.length - 1) {
        submitForm();
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
  
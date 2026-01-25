import { supabase } from "./supabase.js";
import noUiSlider from 'https://esm.sh/nouislider@15.7.1';

let questions = [];
let currentIndex = 0;
let answers = {};

export async function init() {
  console.log("🚀 Onboarding init started (Wizard Mode)");
  const container = document.getElementById("onboardingContainer");
  const staticBtn = document.getElementById("finishOnboardingBtn");

  // Hide the static button from HTML since we will manage navigation dynamically
  if (staticBtn) staticBtn.style.display = "none";

  if (!container) {
    console.error("Onboarding container not found");
    return;
  }

  // Inject noUiSlider CSS if not present
  if (!document.getElementById("nouislider-css")) {
    const link = document.createElement("link");
    link.id = "nouislider-css";
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/nouislider@15.7.1/dist/nouislider.min.css";
    document.head.appendChild(link);
  }

  container.innerHTML = "<div class='text-center text-gray-500'>Loading questions...</div>";

  try {
    // 1. Fetch active questions from DB
    const { data, error } = await supabase
      .schema("cabo")
      .from("mj_question_bank")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      throw new Error("Database error: " + error.message);
    }

    questions = data || [];

    if (questions.length === 0) {
      container.innerHTML = "<p class='text-gray-500 text-center'>No active questions found in database.</p>";
      return;
    }

    // Initialize state
    currentIndex = 0;
    answers = {};

    // Load saved progress if available
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: progress } = await supabase
        .schema("cabo")
        .from("mj_prospect")
        .select("current_step, answers")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (progress) {
        if (progress.answers) answers = progress.answers;
        if (typeof progress.current_step === "number") {
          currentIndex = Math.min(Math.max(0, progress.current_step), questions.length - 1);
        }
      }
    } else {
      // Guest mode: Load from localStorage
      const localData = localStorage.getItem("mm_onboarding_progress");
      if (localData) {
        try {
          const progress = JSON.parse(localData);
          if (progress.answers) answers = progress.answers;
          if (typeof progress.current_step === "number") {
            currentIndex = Math.min(Math.max(0, progress.current_step), questions.length - 1);
          }
        } catch (err) {
          console.warn("Invalid local progress", err);
        }
      }
    }

    renderStep();

  } catch (e) {
    console.error("Critical error in onboarding init:", e);
    container.innerHTML = `<div class="text-red-600 p-4">
      Error loading onboarding: ${e.message}
    </div>`;
  }
}

function renderStep() {
  const container = document.getElementById("onboardingContainer");
  if (!container) return;
  container.innerHTML = "";

  const q = questions[currentIndex];
  const total = questions.length;
  const progress = ((currentIndex + 1) / total) * 100;

  // 1. Progress Bar
  const progressContainer = document.createElement("div");
  progressContainer.className = "w-full bg-gray-200 rounded-full h-2 mb-8";
  progressContainer.innerHTML = `<div class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: ${progress}%"></div>`;
  container.appendChild(progressContainer);

  // 2. Question
  const title = document.createElement("h2");
  title.className = "text-2xl font-bold text-gray-800 mb-6 text-center";

  // Interpolate placeholders like {{first_name}}
  let displayText = q.question_text || "";
  displayText = displayText.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const sourceQ = questions.find(item => item.field_key === key);
    if (sourceQ && answers[sourceQ.id]) {
      return answers[sourceQ.id];
    }
    return match;
  });
  title.textContent = displayText;

  if (q.is_required) {
    const span = document.createElement("span");
    span.className = "text-red-500 ml-1";
    span.textContent = "*";
    title.appendChild(span);
  }
  container.appendChild(title);

  // 2b. Message (Subscript)
  if (q.message) {
    const msg = document.createElement("p");
    msg.className = "text-sm text-gray-500 text-center mb-6 -mt-4";
    msg.textContent = q.message;
    container.appendChild(msg);
  }

  // 3. Input Area
  const inputWrapper = document.createElement("div");
  inputWrapper.className = "max-w-md mx-auto mb-8";
  
  let inputEl;
  const type = (q.control_type || "input").toLowerCase();
  const savedValue = answers[q.id] || "";

  if (type === "dropdown") {
    inputEl = document.createElement("select");
    inputEl.className = "w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow";
    inputEl.innerHTML = `<option value="">Select an option...</option>`;
    
    if (q.options && Array.isArray(q.options)) {
      q.options.forEach(opt => {
        const val = typeof opt === "object" ? (opt.key || opt.value || opt.label) : opt;
        const lbl = typeof opt === "object" ? (opt.label || opt.value || opt.key) : opt;
        const option = document.createElement("option");
        option.value = val;
        option.textContent = lbl;
        if (val === savedValue) option.selected = true;
        inputEl.appendChild(option);
      });
    }
  } else if (type === "radio") {
    inputEl = document.createElement("div");
    inputEl.className = "flex flex-col gap-3";
    
    const radioOptions = (q.options && Array.isArray(q.options) && q.options.length > 0) 
      ? q.options 
      : ["Yes", "No"];

    radioOptions.forEach(opt => {
      const val = typeof opt === "object" ? (opt.key || opt.value || opt.label) : opt;
      const lbl = typeof opt === "object" ? (opt.label || opt.value || opt.key) : opt;

      const label = document.createElement("label");
      label.className = `flex items-center p-4 border rounded-xl cursor-pointer transition-all select-none`;
      
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = `q_${q.id}`;
      radio.value = val;
      radio.className = "hidden";
      if (savedValue === val) radio.checked = true;
      
      // Initial styling
      if (savedValue === val) {
          label.classList.add('border-blue-500', 'bg-blue-50', 'ring-1', 'ring-blue-500');
      } else {
          label.classList.add('border-gray-200', 'hover:bg-gray-50');
      }

      // Visual update on change
      radio.addEventListener('change', () => {
         const allLabels = inputEl.querySelectorAll('label');
         allLabels.forEach(l => {
             l.classList.remove('border-blue-500', 'bg-blue-50', 'ring-1', 'ring-blue-500');
             l.classList.add('border-gray-200', 'hover:bg-gray-50');
         });
         label.classList.remove('border-gray-200', 'hover:bg-gray-50');
         label.classList.add('border-blue-500', 'bg-blue-50', 'ring-1', 'ring-blue-500');
      });

      label.appendChild(radio);
      
      const span = document.createElement("span");
      span.className = "font-medium text-gray-700 w-full text-center";
      span.textContent = lbl;
      label.appendChild(span);

      inputEl.appendChild(label);
    });
  } else if (type === "checkbox") {
    inputEl = document.createElement("div");
    inputEl.className = "flex flex-col gap-3";

    const checkboxOptions = (q.options && Array.isArray(q.options) && q.options.length > 0)
      ? q.options
      : ["Option 1", "Option 2"];

    // savedValue might be "A,B" or JSON string
    const savedArray = savedValue ? savedValue.split(",") : [];

    checkboxOptions.forEach(opt => {
      const val = typeof opt === "object" ? (opt.key || opt.value || opt.label) : opt;
      const lbl = typeof opt === "object" ? (opt.label || opt.value || opt.key) : opt;

      const label = document.createElement("label");
      label.className = `flex items-center p-4 border rounded-xl cursor-pointer transition-all select-none`;
      
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.name = `q_${q.id}`;
      checkbox.value = val;
      checkbox.className = "hidden";
      
      const updateStyle = () => {
        if (checkbox.checked) {
          label.classList.add('border-blue-500', 'bg-blue-50', 'ring-1', 'ring-blue-500');
          label.classList.remove('border-gray-200', 'hover:bg-gray-50');
        } else {
          label.classList.remove('border-blue-500', 'bg-blue-50', 'ring-1', 'ring-blue-500');
          label.classList.add('border-gray-200', 'hover:bg-gray-50');
        }
      };

      if (savedArray.includes(val)) {
        checkbox.checked = true;
      }
      updateStyle();

      checkbox.addEventListener('change', updateStyle);

      label.appendChild(checkbox);
      
      const span = document.createElement("span");
      span.className = "font-medium text-gray-700 w-full text-center";
      span.textContent = lbl;
      label.appendChild(span);
      
      inputEl.appendChild(label);
    });
  } else if (type === "range_dual") {
    inputEl = document.createElement("div");
    inputEl.className = "px-2 py-8"; // Padding for handles/tooltips

    const sliderDiv = document.createElement("div");
    inputEl.appendChild(sliderDiv);

    // Parse options for min/max (Default: 18-99)
    let min = 18, max = 99;
    if (q.options && Array.isArray(q.options) && q.options.length >= 2) {
       min = Number(q.options[0]);
       max = Number(q.options[1]);
    }

    // Parse saved value "25-30" or default to middle range
    let start = [Math.floor(min + (max-min)*0.2), Math.floor(max - (max-min)*0.2)];
    if (savedValue) {
       const parts = savedValue.split("-").map(Number);
       if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
         start = parts;
       }
    }

    noUiSlider.create(sliderDiv, {
      start: start,
      connect: true,
      range: { 'min': min, 'max': max },
      step: 1,
      tooltips: true,
      format: {
        to: (v) => Math.round(v),
        from: (v) => Number(v)
      }
    });

    // Store reference to slider on the wrapper for saving
    inputEl.slider = sliderDiv.noUiSlider;
  } else if (type === "datetime") {
      inputEl = document.createElement("input");
      inputEl.type = "datetime-local";
      inputEl.className = "w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow";
      inputEl.value = savedValue;
  } else if (type === "textarea") {
      inputEl = document.createElement("textarea");
      inputEl.className = "w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow";
      inputEl.rows = 4;
      inputEl.value = savedValue;
  } else {
      inputEl = document.createElement("input");
      inputEl.type = "text";
      inputEl.className = "w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow";
      inputEl.value = savedValue;
  }

  inputEl.id = "currentInput"; // Marker for saving
  inputWrapper.appendChild(inputEl);
  container.appendChild(inputWrapper);

  // 4. Navigation
  const navContainer = document.createElement("div");
  navContainer.className = "flex justify-between items-center mt-auto pt-4 border-t border-gray-100";

  // Back Button
  const backBtn = document.createElement("button");
  backBtn.className = `px-6 py-2 rounded-lg font-medium transition-colors ${currentIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`;
  backBtn.textContent = "Back";
  backBtn.disabled = currentIndex === 0;
  backBtn.onclick = handleBack;
  navContainer.appendChild(backBtn);

  // Next/Finish Button
  const nextBtn = document.createElement("button");
  nextBtn.className = "bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all transform hover:-translate-y-0.5";
  nextBtn.textContent = currentIndex === total - 1 ? "Complete" : "Continue";
  nextBtn.onclick = handleNext;
  navContainer.appendChild(nextBtn);

  container.appendChild(navContainer);
}

function saveCurrentAnswer() {
    const q = questions[currentIndex];
    const type = (q.control_type || "input").toLowerCase();
    let val = null;

    if (type === "radio") {
        const checked = document.querySelector(`input[name="q_${q.id}"]:checked`);
        if (checked) val = checked.value;
    } else if (type === "checkbox") {
        const checkedBoxes = document.querySelectorAll(`input[name="q_${q.id}"]:checked`);
        if (checkedBoxes.length > 0) {
            // Join multiple values with comma
            val = Array.from(checkedBoxes).map(cb => cb.value).join(",");
        }
    } else if (type === "range_dual") {
        const el = document.getElementById("currentInput");
        // noUiSlider.get() returns array of strings ["20", "30"]
        if (el && el.slider) val = el.slider.get().join("-");
    } else {
        const el = document.getElementById("currentInput");
        if (el) val = el.value.trim();
    }
    
    if (val) {
        answers[q.id] = val;
    } else {
        delete answers[q.id];
    }
}

async function handleNext() {
    saveCurrentAnswer();

    const q = questions[currentIndex];
    const existingErr = document.getElementById("onboardingError");
    if (existingErr) existingErr.remove();

    if (q.is_required && !answers[q.id]) {
        const container = document.getElementById("onboardingContainer");
        const inputWrapper = container.querySelector(".max-w-md");
        const err = document.createElement("div");
        err.id = "onboardingError";
        err.className = "text-red-500 text-sm text-center mt-2";
        err.textContent = "This field is required.";
        if (inputWrapper) inputWrapper.appendChild(err);
        return;
    }

    // Save state to DB
    await saveProgress(currentIndex + 1);

    if (currentIndex < questions.length - 1) {
        currentIndex++;
        renderStep();
    } else {
        await finishOnboarding();
    }
}

function handleBack() {
    saveCurrentAnswer();
    if (currentIndex > 0) {
        currentIndex--;
        renderStep();
    }
}

async function saveProgress(stepIndex) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    // Guest mode: Save to localStorage
    localStorage.setItem("mm_onboarding_progress", JSON.stringify({
      current_step: stepIndex,
      answers: answers,
      updated_at: new Date().toISOString()
    }));
    return;
  }

  const { error } = await supabase
    .schema("cabo")
    .from("mj_prospect")
    .upsert({
      auth_id: user.id,
      current_step: stepIndex,
      answers: answers,
      updated_at: new Date().toISOString()
    }, { onConflict: "auth_id" });

  if (error) console.error("Error saving progress:", error);
}

async function finishOnboarding() {
    console.log("Collected Answers:", answers);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      if (confirm("You've completed the questions! Create an account to save your profile?")) {
        window.location.hash = "#/signup";
      }
      return;
    }

    // Redirect to profiles (saving logic can be added here later)
    window.location.hash = "#/my-profiles";
}
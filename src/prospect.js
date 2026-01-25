import { supabase } from "./supabase.js";
import { profile_populateHeightOptionsFor } from "./profile_height.js";

let allQuestions = [];

export async function init() {
  const form = document.getElementById("prospectForm");
  const btnCancel = document.getElementById("btnCancelProspect");
  const btnSuccess = document.getElementById("btnSuccessOk");

  if (form) form.addEventListener("submit", handleSave);
  if (btnCancel) btnCancel.addEventListener("click", () => window.location.hash = "#/my-profiles");
  if (btnSuccess) btnSuccess.addEventListener("click", () => window.location.hash = "#/my-profiles");

  // Populate Height Dropdown
  const heightSelect = document.getElementById("p_height");
  if (heightSelect) {
    profile_populateHeightOptionsFor(heightSelect);
  }

  // Immigration Logic
  const cit = document.getElementById("p_citizenship");
  const res = document.getElementById("p_residence_country");
  if (cit && res) {
    cit.addEventListener("change", checkImmigrationVisibility);
    res.addEventListener("change", checkImmigrationVisibility);
    checkImmigrationVisibility();
  }

  await loadQuestions();
}

function checkImmigrationVisibility() {
  const cit = document.getElementById("p_citizenship").value;
  const res = document.getElementById("p_residence_country").value;
  const divStatus = document.getElementById("div_immigration_status");
  const divDetail = document.getElementById("div_immigration_detail");

  // Show only if both are selected and they are different
  const show = cit && res && (cit !== res);

  if (divStatus) {
    if (show) divStatus.classList.remove("hidden");
    else {
      divStatus.classList.add("hidden");
      document.getElementById("p_immigration_status").value = "";
    }
  }
  if (divDetail) {
    if (show) divDetail.classList.remove("hidden");
    else {
      divDetail.classList.add("hidden");
      document.getElementById("p_immigration_status_detail").value = "";
    }
  }
}

async function loadQuestions() {
  const qContainer = document.getElementById("prospectQuestions");
  const pContainer = document.getElementById("prospectPreferences");
  
  if (!qContainer) return;

  const { data, error } = await supabase
    .schema("cabo")
    .from("mm_questions")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error(error);
    qContainer.innerHTML = "Error loading questions.";
    return;
  }

  allQuestions = data || [];
  
  // Clear containers
  qContainer.innerHTML = "";
  if (pContainer) pContainer.innerHTML = "";

  allQuestions.forEach(q => {
    const isPref = q.category === "preferences";
    const target = isPref ? pContainer : qContainer;
    if (target) renderQuestionField(q, target);
  });
}

function renderQuestionField(q, container) {
  const wrapper = document.createElement("div");
  
  const label = document.createElement("label");
  label.className = "block text-sm font-medium text-gray-700 mb-1";
  label.textContent = q.question_text;
  
  let input;

  if (q.control_type === "dropdown") {
    input = document.createElement("select");
    input.className = "w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm dynamic-q";
    input.dataset.qid = q.id;
    
    input.innerHTML = `<option value="">Select...</option>`;
    
    // Handle dynamic options
    if (q.dropdown_options && Array.isArray(q.dropdown_options)) {
      q.dropdown_options.forEach(opt => {
        const option = document.createElement("option");
        if (typeof opt === "object") {
          option.value = opt.key || opt.value || opt.label;
          option.textContent = opt.label || opt.value || opt.key;
        } else {
          option.value = opt;
          option.textContent = opt;
        }
        input.appendChild(option);
      });
    } 
    // Handle special hardcoded lists (reuse logic if needed, simplified here)
    else if (q.field_key === "raasi") {
       ["Mesha", "Vrishabha", "Mithuna", "Karkataka", "Simha", "Kanya", "Tula", "Vrischika", "Dhanu", "Makara", "Kumbha", "Meena"]
       .forEach(r => input.add(new Option(r, r)));
    }
  } 
  else if (q.control_type === "radio") {
    input = document.createElement("div");
    input.className = "flex gap-4 mt-2 dynamic-radio-group";
    input.dataset.qid = q.id;
    
    ["Yes", "No"].forEach(val => {
      const labelRadio = document.createElement("label");
      labelRadio.className = "inline-flex items-center";
      
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = `q_${q.id}`;
      radio.value = val;
      radio.className = "form-radio h-4 w-4 text-blue-600";
      
      const span = document.createElement("span");
      span.className = "ml-2 text-sm text-gray-700";
      span.textContent = val;
      
      labelRadio.appendChild(radio);
      labelRadio.appendChild(span);
      input.appendChild(labelRadio);
    });
  }
  else {
    input = document.createElement("input");
    input.type = "text";
    input.className = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm dynamic-q";
    input.dataset.qid = q.id;
  }

  wrapper.appendChild(label);
  wrapper.appendChild(input);
  container.appendChild(wrapper);
}

async function handleSave(e) {
  e.preventDefault();
  
  const btn = document.getElementById("btnSaveProspect");
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Saving...";

  try {
    // 1. Collect Basic Info
    const profileData = {
      first_name: document.getElementById("p_first_name").value.trim(),
      last_name: document.getElementById("p_last_name").value.trim(),
      email: document.getElementById("p_email").value.trim() || null,
      phone_number: document.getElementById("p_phone").value.trim() || null,
      gender: document.getElementById("p_gender").value || null,
      datetime_of_birth: document.getElementById("p_dob").value || null,
      height: document.getElementById("p_height").value || null,
      citizenship: document.getElementById("p_citizenship").value.trim() || null,
      residence_country: document.getElementById("p_residence_country").value.trim() || null,
      immigration_status: document.getElementById("p_immigration_status").value.trim() || null,
      immigration_status_detail: document.getElementById("p_immigration_status_detail").value.trim() || null,
      place_of_birth: document.getElementById("p_pob").value.trim() || null,
      current_location: document.getElementById("p_location").value.trim() || null,
      willing_to_relocate: document.getElementById("p_relocate").checked,
      bio: document.getElementById("p_bio").value.trim() || null,
      // Optional: Assign to current user if RLS requires it
      // auth_id: (await supabase.auth.getUser()).data.user?.id 
    };

    // 2. Insert into mm_people
    const { data: personData, error: personError } = await supabase
      .schema("cabo")
      .from("mm_people")
      .insert([profileData])
      .select()
      .single();

    if (personError) throw new Error("Failed to create person: " + personError.message);
    
    const personId = personData.id;

    // 3. Collect Answers
    const answersPayload = [];
    
    // Text/Dropdown inputs
    document.querySelectorAll(".dynamic-q").forEach(el => {
      const val = el.value.trim();
      if (val) {
        answersPayload.push({
          person_id: personId,
          question_id: el.dataset.qid,
          answer_text: val
        });
      }
    });

    // Radio inputs
    document.querySelectorAll(".dynamic-radio-group").forEach(group => {
      const qid = group.dataset.qid;
      const checked = group.querySelector(`input[name="q_${qid}"]:checked`);
      if (checked) {
        answersPayload.push({
          person_id: personId,
          question_id: qid,
          answer_text: checked.value
        });
      }
    });

    // 4. Insert into mm_answers
    if (answersPayload.length > 0) {
      const { error: answersError } = await supabase
        .schema("cabo")
        .from("mm_answers")
        .insert(answersPayload);

      if (answersError) {
        console.error("Answers save error", answersError);
        // We don't throw here to avoid failing the whole flow if just answers fail
        alert("Prospect saved, but some additional details failed to save.");
      }
    }

    // Success
    document.getElementById("successModal").classList.remove("hidden");
    document.getElementById("prospectForm").reset();

  } catch (err) {
    console.error(err);
    alert("Error: " + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}
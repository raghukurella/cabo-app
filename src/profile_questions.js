// profile_questions.js
import { qs, showStatus } from "./profile_helpers.js";

export let questions = [];          // universal profile questions
export let preferences = [];        // universal preference questions
export let existingAnswers = {};    // loaded in edit mode

export function setExistingAnswers(map) {
  existingAnswers = map || {};
}

/**
 * Load active questions from mm_questions and render them.
 * Questions are universal — they do NOT depend on personId.
 * Preferences DO depend on personId because they load answers.
 *
 * IMPORTANT:
 * This function MUST be called ONLY from profile_init(personId)
 * AFTER personId is known.
 */
export async function profile_loadQuestions(personId) {
  const wrapper = qs("questionsWrapper");
  if (!wrapper) return;
  wrapper.innerHTML = "Loading questions…";

  const { data: qData, error } = await window.supabase
    .schema("cabo")
    .from("mm_questions")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error(error);
    wrapper.innerHTML = "Failed to load questions.";
    return;
  }

  if (!qData || qData.length === 0) {
    wrapper.innerHTML = "No questions configured.";
    return;
  }

  // Split into categories
  questions = qData.filter(q => q.category === "profile");
  preferences = qData.filter(q => q.category?.trim().toLowerCase() === "preferences");

  // Render universal profile questions
  profile_renderQuestions();

  // Render preferences ONLY if personId is valid
  if (personId) {
    await profile_renderPreferences(personId);
  }
}

/**
 * Render PROFILE questions.
 * These are universal — they do NOT depend on personId.
 */
export function profile_renderQuestions() {
  console.log("Rendering profile questions");

  const wrapper = qs("questionsWrapper");
  if (!wrapper) return;
  wrapper.innerHTML = "";

  questions.forEach(q => {
    const row = document.createElement("div");
    row.className = "space-y-1";

    const label = document.createElement("label");
    label.textContent = q.question_text;
    label.className = "block text-gray-700 text-sm";

    let fieldEl;

    // Dropdowns
    if (q.control_type === "dropdown") {
      fieldEl = document.createElement("select");
      fieldEl.id = q.field_key;
      fieldEl.name = q.field_key;
      fieldEl.className = "w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm";

      fieldEl.innerHTML = `<option value="">Select…</option>`;

      // Known lists
      if (q.field_key === "raasi") {
        const list = ["Mesha","Vrishabha","Mithuna","Karkataka","Simha","Kanya","Tula","Vrischika","Dhanu","Makara","Kumbha","Meena"];
        fieldEl.innerHTML = `<option value="">Select Raasi…</option>` + list.map(x => `<option>${x}</option>`).join("");
      }
      else if (q.field_key === "lagnam") {
        const list = [
          { key: "Mesha", label: "Mesha (Aries)" },{ key: "Vrishabha", label: "Vrishabha (Taurus)" },
          { key: "Mithuna", label: "Mithuna (Gemini)" },{ key: "Karka", label: "Karka (Cancer)" },
          { key: "Simha", label: "Simha (Leo)" },{ key: "Kanya", label: "Kanya (Virgo)" },
          { key: "Tula", label: "Tula (Libra)" },{ key: "Vrischika", label: "Vrischika (Scorpio)" },
          { key: "Dhanu", label: "Dhanu (Sagittarius)" },{ key: "Makara", label: "Makara (Capricorn)" },
          { key: "Kumbha", label: "Kumbha (Aquarius)" },{ key: "Meena", label: "Meena (Pisces)" }
        ];
        fieldEl.innerHTML = `<option value="">Select Lagnam…</option>` + list.map(l => `<option value="${l.key}">${l.label}</option>`).join("");
      }
      else if (q.field_key === "religion") {
        const list = ["Hinduism","Islam","Christianity","Sikhism","Buddhism","Jainism","Judaism","Zoroastrianism","Baháʼí","Other"];
        fieldEl.innerHTML = `<option value="">Select Religion…</option>` + list.map(x => `<option>${x}</option>`).join("");
      }
      else if (q.field_key === "nakshatram") {
        const list = [
          "Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu","Pushya","Ashlesha","Magha",
          "Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha",
          "Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta","Shatabhisha","Purva Bhadrapada",
          "Uttara Bhadrapada","Revati"
        ];
        fieldEl.innerHTML = `<option value="">Select Nakshatram…</option>` + list.map(x => `<option>${x}</option>`).join("");
      }
    }

    // Radio
    else if (q.control_type === "radio") {
      fieldEl = document.createElement("div");
      ["Male","Female","Non-binary"].forEach(opt => {
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = q.field_key;
        radio.value = opt;

        const lbl = document.createElement("label");
        lbl.textContent = opt;
        lbl.className = "ml-2 mr-4";

        fieldEl.appendChild(radio);
        fieldEl.appendChild(lbl);
      });
    }

    // Text input
    else {
      fieldEl = document.createElement("input");
      fieldEl.type = "text";
      fieldEl.id = q.field_key;
      fieldEl.name = q.field_key;
      fieldEl.className = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm";
    }

    // Prefill existing answers (edit mode)
    const val = existingAnswers[q.id];
    if (val) {
      if (q.control_type === "radio") {
        [...fieldEl.querySelectorAll("input")].forEach(r => {
          if (r.value === val) r.checked = true;
        });
      } else {
        fieldEl.value = val;
      }
    }

    row.appendChild(label);
    row.appendChild(fieldEl);
    wrapper.appendChild(row);
  });
}

/**
 * Render PREFERENCES — these DO depend on personId.
 */
export async function profile_renderPreferences(personId) {
  if (!personId) {
    console.warn("No personId provided — preferences cannot load yet.");
    return;
  }

  const container = document.getElementById("preferencesContainer");
  console.log("preferencesContainer:", container);
  if (!container) return;

  container.innerHTML = "";

  // Load answers for this person
  const { data: answers } = await window.supabase
    .schema("cabo")
    .from("mm_answers")
    .select("*")
    .eq("person_id", personId);

  const answerMap = {};
  answers?.forEach(a => answerMap[a.question_id] = a.answer_text);

preferences.forEach(pref => {
  const row = document.createElement("div");
  row.className = "form-group";

  const label = document.createElement("label");
  label.textContent = pref.question_text;
  label.className = "block text-gray-700 text-sm";

  let fieldEl;

  if (pref.control_type === "dropdown") {
    fieldEl = document.createElement("select");
    fieldEl.className = "pref-input w-full border border-gray-300 rounded-lg px-3 py-2 text-sm";
    fieldEl.setAttribute("data-pref-id", pref.id);

    // ⭐ #1 — Detect height preference dynamically
    if (pref.field_key === "minimum_height") {
      fieldEl.classList.add("height-dropdown");
    }

    fieldEl.innerHTML = `<option value="">Select…</option>`;
  }

  else {
    fieldEl = document.createElement("input");
    fieldEl.type = "text";
    fieldEl.className = "pref-input w-full border border-gray-300 rounded-lg px-3 py-2 text-sm";
    fieldEl.setAttribute("data-pref-id", pref.id);
  }

  //fieldEl.value = answerMap[pref.id] || "";
  // Save the value for later
  const savedValue = answerMap[pref.id] || "";

  row.appendChild(label);
  row.appendChild(fieldEl);
  container.appendChild(row);
});

  document.querySelectorAll(".height-dropdown").forEach(el => {
    window.profile_populateHeightOptionsFor(el);

      // ⭐ Now set the value AFTER options exist
  const prefId = el.dataset.prefId;
  const saved = answerMap[prefId];
  if (saved) el.value = saved;

  });

}

/**
 * Save answers for ALL questions (profile + preferences).
 */
export async function profile_saveQuestions(editingProfileId) {
  if (!editingProfileId) return;

  const payload = [];

  // Profile questions
  questions.forEach(q => {
    let value = null;

    if (q.control_type === "radio") {
      const checked = document.querySelector(`input[name="${q.field_key}"]:checked`);
      value = checked ? checked.value : null;
    } else {
      const el = qs(q.field_key);
      value = el?.value?.trim() || null;
    }

    payload.push({
      person_id: editingProfileId,
      question_id: q.id,
      answer_text: value
    });
  });

  // Preferences
  document.querySelectorAll(".pref-input").forEach(input => {
    payload.push({
      person_id: editingProfileId,
      question_id: input.dataset.prefId,
      answer_text: input.value.trim() || null
    });
  });

  const { error } = await window.supabase
    .schema("cabo")
    .from("mm_answers")
    .upsert(payload, { onConflict: "person_id,question_id" });

  if (error) {
    console.error(error);
    showStatus("Error saving answers.");
  }
}
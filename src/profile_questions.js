// profile_questions.js
import { qs, showStatus } from "./profile_helpers.js";

export let questions = [];
export let existingAnswers = {};

/**
 * Load active questions from mm_questions and render them.
 * Always renders, even if profile id is not yet set.
 */
export async function profile_loadQuestions() {
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

  questions = qData;
  profile_renderQuestions();
}



async function profile_loadPreferences(personId) {
  const { data: prefs, error } = await supabase
    .schema("cabo")
    .from("mm_questions")
    .select(`
      id,
      question_text,
      is_active,
      mm_answers (
        id,
        answer_text
      )
    `)
    .eq("category", "preferences")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error loading preferences:", error);
    return;
  }

  const container = document.getElementById("preferencesContainer");
  container.innerHTML = "";

  prefs.forEach(pref => {
    const wrapper = document.createElement("div");
    wrapper.className = "form-group";

    wrapper.innerHTML = `
      <label>${pref.question_text}</label>
      <input 
        type="text" 
        class="pref-input" 
        data-pref-id="${pref.id}"
        value="${pref.mm_answers?.[0]?.answer_text || ''}"
      />
    `;

    container.appendChild(wrapper);
  });
}

/**
 * Render questions into the accordion.
 */
export function profile_renderQuestions() {
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
      } else if (q.field_key === "lagnam") {
        const list = [
          { key: "Mesha", label: "Mesha (Aries)" },{ key: "Vrishabha", label: "Vrishabha (Taurus)" },
          { key: "Mithuna", label: "Mithuna (Gemini)" },{ key: "Karka", label: "Karka (Cancer)" },
          { key: "Simha", label: "Simha (Leo)" },{ key: "Kanya", label: "Kanya (Virgo)" },
          { key: "Tula", label: "Tula (Libra)" },{ key: "Vrischika", label: "Vrischika (Scorpio)" },
          { key: "Dhanu", label: "Dhanu (Sagittarius)" },{ key: "Makara", label: "Makara (Capricorn)" },
          { key: "Kumbha", label: "Kumbha (Aquarius)" },{ key: "Meena", label: "Meena (Pisces)" }
        ];
        fieldEl.innerHTML = `<option value="">Select Lagnam…</option>` + list.map(l => `<option value="${l.key}">${l.label}</option>`).join("");
      } else if (q.field_key === "religion") {
        const list = ["Hinduism","Islam","Christianity","Sikhism","Buddhism","Jainism","Judaism","Zoroastrianism","Baháʼí","Other"];
        fieldEl.innerHTML = `<option value="">Select Religion…</option>` + list.map(x => `<option>${x}</option>`).join("");
      } else if (q.field_key === "nakshatram") {
        const list = [
          "Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu","Pushya","Ashlesha","Magha",
          "Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha",
          "Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta","Shatabhisha","Purva Bhadrapada",
          "Uttara Bhadrapada","Revati"
        ];
        fieldEl.innerHTML = `<option value="">Select Nakshatram…</option>` + list.map(x => `<option>${x}</option>`).join("");
      }

    } else if (q.control_type === "radio") {
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

    } else {
      fieldEl = document.createElement("input");
      fieldEl.type = "text";
      fieldEl.id = q.field_key;
      fieldEl.name = q.field_key;
      fieldEl.className = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm";
    }

    // Prefill if existingAnswers has value
    const val = existingAnswers[q.id];
    if (val) {
      if (q.control_type === "radio") {
        [...fieldEl.querySelectorAll("input")].forEach(r => { if (r.value === val) r.checked = true; });
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
 * Save answers for all questions, using the given profile id.
 */
export async function profile_saveQuestions(editingProfileId) {
  if (!questions.length || !editingProfileId) return;

  const payload = questions.map(q => {
    let value = null;
    if (q.control_type === "radio") {
      const checked = document.querySelector(`input[name="${q.field_key}"]:checked`);
      value = checked ? checked.value : null;
    } else {
      const el = qs(q.field_key);
      value = el?.value?.trim() || null;
    }
    return {
      person_id: editingProfileId,
      question_id: q.id,
      answer_text: value
    };
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

  import { supabase } from "./supabase.js";

  const statusEl = document.getElementById("status");
  const formEl = document.getElementById("moreForm");
  const saveBtn = document.getElementById("saveMoreBtn");
  const logoutBtn = document.getElementById("logoutBtn");
console.log(">>> PROFILE-MORE.JS EXECUTED");
  let questions = [];
  let existingAnswers = {};

function getProfileId() {
  const parts = window.location.hash.split("/");
  return parts[parts.length - 1] || null;
}

const editingProfileId = getProfileId();


  loadQuestions();

  async function loadQuestions() {
    statusEl.textContent = "Loading questions…";

    // ✅ Get session
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    // 

    if (!user) {
      statusEl.textContent = "You are not logged in.";
      window.location.hash = "#/login";
      return;
    }

    // ✅ Fetch active questions
    const { data: qData, error: qError } = await supabase
      .schema("cabo")
      .from("mm_questions")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
console.log(qError);
    if (qError) {
      console.error(qError);
      statusEl.textContent = "Failed to load questions.";
      return;
    }

    questions = qData;

console.log ("user_id:", user.id);

    // ✅ Fetch existing answers for this user
    const { data: aData, error: aError } = await supabase
      .schema("cabo")
      .from("mm_answers")
      .select("*")
      //.eq("person_id", user.id)
      .eq("person_id", editingProfileId);
      //user.id needs to be editing profile.id -RK

    if (aError) {
      console.error(aError);
      statusEl.textContent = "Failed to load answers.";
      return;
    }

    // Convert answers into a lookup object: { question_id: answer_text }
    existingAnswers = {};
    aData.forEach(a => {
      existingAnswers[a.question_id] = a.answer_text;
    });

    // ✅ Render questions with pre-filled answers
    renderQuestions();

    statusEl.classList.add("hidden");
    formEl.classList.remove("hidden");
    saveBtn.classList.remove("hidden");
  }

function renderQuestions() {
  questions.forEach(q => {
    const wrapper = document.createElement("div");
    wrapper.className = "space-y-1";

    const label = document.createElement("label");
    label.textContent = q.question_text;
    label.className = "block text-gray-700 text-sm";

    let fieldEl;

    switch (q.control_type) {
      case "dropdown":
        fieldEl = document.createElement("select");
        fieldEl.id = q.field_key;
        fieldEl.name = q.field_key;
        fieldEl.className =
          "w-full border border-gray-300 rounded-lg px-4 py-3 bg-white text-base";

        if (q.field_key === "raasi") {
          const raasis = [
            "Mesha","Vrishabha","Mithuna","Karkataka","Simha","Kanya",
            "Tula","Vrischika","Dhanu","Makara","Kumbha","Meena"
          ];
          fieldEl.innerHTML =
            `<option value="">Select Raasi…</option>` +
            raasis.map(r => `<option value="${r}">${r}</option>`).join("");
        }

        if (q.field_key === "lagnam") {
          const lagnams = [
            { key: "Mesha", label: "Mesha (Aries)" },
            { key: "Vrishabha", label: "Vrishabha (Taurus)" },
            { key: "Mithuna", label: "Mithuna (Gemini)" },
            { key: "Karka", label: "Karka (Cancer)" },
            { key: "Simha", label: "Simha (Leo)" },
            { key: "Kanya", label: "Kanya (Virgo)" },
            { key: "Tula", label: "Tula (Libra)" },
            { key: "Vrischika", label: "Vrischika (Scorpio)" },
            { key: "Dhanu", label: "Dhanu (Sagittarius)" },
            { key: "Makara", label: "Makara (Capricorn)" },
            { key: "Kumbha", label: "Kumbha (Aquarius)" },
            { key: "Meena", label: "Meena (Pisces)" }
          ];
          fieldEl.innerHTML =
            `<option value="">Select Lagnam…</option>` +
            lagnams.map(l => `<option value="${l.key}">${l.label}</option>`).join("");
        }

        if (q.field_key === "religion") {
          const religions = [
            "Hinduism","Islam","Christianity","Sikhism",
            "Buddhism","Jainism","Judaism","Zoroastrianism",
            "Baháʼí","Other"
          ];
          fieldEl.innerHTML =
            `<option value="">Select Religion…</option>` +
            religions.map(r => `<option value="${r}">${r}</option>`).join("");
        }

        if (q.field_key === "nakshatram") {
          const nakshatrams = [
            "Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra",
            "Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni",
            "Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha",
            "Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta","Shatabhisha",
            "Purva Bhadrapada","Uttara Bhadrapada","Revati"
          ];
          fieldEl.innerHTML =
            `<option value="">Select Nakshatram…</option>` +
            nakshatrams.map(n => `<option value="${n}">${n}</option>`).join("");
        }

        break;

      case "radio":
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
        break;

      default: // "input"
        fieldEl = document.createElement("input");
        fieldEl.type = "text";
        fieldEl.id = q.field_key;
        fieldEl.name = q.field_key;
        fieldEl.className =
          "w-full border border-gray-300 rounded-lg px-4 py-3 text-base";
    }

    // ✅ Pre-fill if answer exists
    if (existingAnswers[q.id]) {
      if (q.control_type === "radio") {
        [...fieldEl.querySelectorAll("input")].forEach(radio => {
          if (radio.value === existingAnswers[q.id]) radio.checked = true;
        });
      } else {
        fieldEl.value = existingAnswers[q.id];
      }
    }

    wrapper.appendChild(label);
    wrapper.appendChild(fieldEl);
    formEl.appendChild(wrapper);
  });
}

  // ✅ Save answers (insert new OR update existing)
  saveBtn.addEventListener("click", async () => {
    statusEl.textContent = "Saving…";
    statusEl.classList.remove("hidden");

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (!user) {
      alert("You are not logged in.");
      window.location.hash = "#/login";
      return;
    }

    // Build payload for each question
    const payload = questions.map(q => {
      const input = document.getElementById(q.field_key);
      return {
        person_id: editingProfileId, //user.id,
        question_id: q.id,
        answer_text: input?.value?.trim() || null
      };
    });

    // ✅ Upsert answers (insert or update)
    const { error } = await supabase
      .schema("cabo")
      .from("mm_answers")
      .upsert(payload, {
        onConflict: "person_id,question_id"
      });

    if (error) {
      console.error(error);
      alert("There was a problem saving your answers.");
      statusEl.textContent = "";
      return;
    }

    statusEl.textContent = "Saved!";
    setTimeout(() => {
      window.location.hash = "#/my-profiles";
    }, 500);
  });

  // ✅ Logout
  logoutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.hash = "#/login";
  });

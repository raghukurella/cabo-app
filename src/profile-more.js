
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

      const input = document.createElement("input");
      input.type = "text";
      input.id = q.field_key;
      input.name = q.field_key;
      input.className =
        "w-full border border-gray-300 rounded-lg px-4 py-3 text-base";

      // ✅ Pre-fill if answer exists
      if (existingAnswers[q.id]) {
        input.value = existingAnswers[q.id];
      }

      wrapper.appendChild(label);
      wrapper.appendChild(input);
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

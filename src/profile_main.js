// profile_main.js
import { profile_loadQuestions, profile_saveQuestions } from "./profile_questions.js";
import { qs, showStatus } from "./profile_helpers.js";

let editingProfileId = null;

/**
 * Load profile data (if editing) and then load questions + preferences.
 */
export async function profile_init() {
  const params = window.location.hash.split("/");
  editingProfileId = params[2] || null;

  // If editing an existing profile, load its answers first
  if (editingProfileId) {
    await loadExistingAnswers(editingProfileId);
  }

  // Load questions + preferences (pass personId!)
  await profile_loadQuestions(editingProfileId);

  // Wire save button
  const saveBtn = qs("saveProfileBtn");
  if (saveBtn) {
    saveBtn.onclick = () => saveProfile();
  }

  // Wire cancel button
  const cancelBtn = qs("cancelProfileBtn");
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      if (editingProfileId) {
        window.location.hash = `#/profilevw/${editingProfileId}`;
      } else {
        window.location.hash = "#/my-profiles";
      }
    };
  }
}

/**
 * Load existing answers for this profile.
 */
async function loadExistingAnswers(personId) {
  const { data, error } = await window.supabase
    .schema("cabo")
    .from("mm_answers")
    .select("*")
    .eq("person_id", personId);

  if (error) {
    console.error("Error loading existing answers:", error);
    return;
  }

  // Build answer map for profile_questions.js
  const map = {};
  data.forEach(a => {
    map[a.question_id] = a.answer_text;
  });

    // Export into profile_questions.js
  const mod = await import("./profile_questions.js");
  mod.setExistingAnswers(map);}

/**
 * Save profile + questions + preferences.
 */
async function saveProfile() {
  if (!editingProfileId) {
    // Creating a new profile first
    const newId = await createNewProfile();
    if (!newId) return;
    editingProfileId = newId;
  }

  // Save questions + preferences
  await profile_saveQuestions(editingProfileId);

  showStatus("Saved!");
  window.location.hash = `#/profilevw/${editingProfileId}`;
}

/**
 * Create a new profile row in mm_people.
 */
async function createNewProfile() {
  const { data, error } = await window.supabase
    .schema("cabo")
    .from("mm_people")
    .insert([{ }])
    .select()
    .single();

  if (error) {
    console.error("Error creating profile:", error);
    showStatus("Error creating profile.");
    return null;
  }

  return data.id;
}

// Auto‑run when router loads this page
window.addEventListener("hashchange", () => {
  if (window.location.hash.startsWith("#/profile")) {
    setTimeout(profile_init, 0);
  }
});

if (window.location.hash.startsWith("#/profile")) {
  setTimeout(profile_init, 0);
}
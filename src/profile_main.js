// profile_main.js
import { profile_buildUpdatePayload } from "./profile_payloads.js";
import { profile_loadQuestions, profile_saveQuestions } from "./profile_questions.js";
import { qs, showStatus } from "./profile_helpers.js";
import { setPhotoUrls, getEditingProfileId, setEditingProfileId } from "./profile_state.js";
import { profile_renderPhotoSlots, profile_attachPhotoUpload } from "./profile_photos.js";
import { profile_populateHeightOptions } from "./profile_height.js";

// --------------------------------------------------
// Load photos
// --------------------------------------------------
async function loadPhotos(profileId) {
  const { data, error } = await window.supabase
    .schema("cabo")
    .from("mm_people")
    .select("photos")
    .eq("id", profileId)
    .single();

  if (error) {
    console.error("Error loading photos:", error);
    return;
  }

  let photos = data.photos;

  if (!Array.isArray(photos)) {
    try { photos = JSON.parse(photos); }
    catch { photos = []; }
  }

  while (photos.length < 6) photos.push(null);

  setPhotoUrls(photos);
  profile_renderPhotoSlots();
}

// --------------------------------------------------
// MAIN INIT
// --------------------------------------------------
export async function profile_init(personId = null) {
  // Store ID in global state
  setEditingProfileId(personId);

  // Always use the getter — never the stale local variable
  const id = getEditingProfileId();

  await profile_populateHeightOptions();

  if (id) {
    await loadProfileRow(id);
    await loadExistingAnswers(id);
    await loadPhotos(id);
  } else {
    profile_renderPhotoSlots();
  }

  // Attach upload handler AFTER grid exists
  profile_attachPhotoUpload();

  // Load questions + preferences
  await profile_loadQuestions(id);

  // Reveal form
  const form = document.getElementById("profileForm");
  if (form) form.classList.remove("hidden");

  const status = document.getElementById("profileStatus");
  if (status) status.classList.add("hidden");
}

// ❌ REMOVE THIS — it causes double listeners
// profile_attachPhotoUpload();

// --------------------------------------------------
// Load existing answers
// --------------------------------------------------
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

  const map = {};
  data.forEach(a => { map[a.question_id] = a.answer_text; });

  const mod = await import("./profile_questions.js");
  mod.setExistingAnswers(map);
}

// --------------------------------------------------
// Save profile
// --------------------------------------------------
async function saveProfile() {
  let id = getEditingProfileId();

  if (!id) {
    id = await createNewProfile();
    if (!id) return;
    setEditingProfileId(id);
  }

  const payload = profile_buildUpdatePayload();
  console.log("mm_people payload:", payload);

  const { error: peopleErr } = await supabase
    .schema("cabo")
    .from("mm_people")
    .update(payload)
    .eq("id", id);

  if (peopleErr) {
    console.error("Error updating mm_people:", peopleErr);
  }

  await profile_saveQuestions(id);

  showStatus("Saved!");
  window.location.hash = `#/profilevw/${id}`;
}

// --------------------------------------------------
// Create new profile
// --------------------------------------------------
async function createNewProfile() {
  const { data, error } = await window.supabase
    .schema("cabo")
    .from("mm_people")
    .insert([{}])
    .select()
    .single();

  if (error) {
    console.error("Error creating profile:", error);
    showStatus("Error creating profile.");
    return null;
  }

  return data.id;
}

// --------------------------------------------------
// Load profile row
// --------------------------------------------------
async function loadProfileRow(profileId) {
  const { data, error } = await window.supabase
    .schema("cabo")
    .from("mm_people")
    .select("*")
    .eq("id", profileId)
    .single();

  if (error) {
    console.error("Error loading profile row:", error);
    return;
  }

  qs("first_name").value = data.first_name ?? "";
  qs("last_name").value = data.last_name ?? "";
  qs("email").value = data.email ?? "";
  qs("phone_number").value = data.phone_number ?? "";
  qs("gender").value = data.gender ?? "";
  qs("datetime_of_birth").value = data.datetime_of_birth
    ? data.datetime_of_birth.slice(0, 16)
    : "";
  qs("place_of_birth").value = data.place_of_birth ?? "";
  qs("current_location").value = data.current_location ?? "";
  qs("citizenship").value = data.citizenship ?? "";
  qs("height").value = data.height ?? "";
  qs("bio").value = data.bio ?? "";
  qs("willing_to_relocate").checked = !!data.willing_to_relocate;
}
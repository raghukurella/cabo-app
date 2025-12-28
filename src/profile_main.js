// profile_main.js
import { showStatus, getProfileIdFromHash } from "./profile_helpers.js";
import { profile_validateForm } from "./profile_validation.js";

// ❗ Only import the photo UI functions from profile_photos.js
import { profile_renderPhotoSlots, profile_attachPhotoUpload } from "./profile_photos.js";

// ✅ Import shared state from profile_state.js
import { photoUrls, editingProfileId, setEditingProfileId, setPhotoUrls } from "./profile_state.js";

import { profile_loadQuestions, profile_saveQuestions } from "./profile_questions.js";
import { profile_buildCreatePayload, profile_buildUpdatePayload } from "./profile_payloads.js";
import { profile_populateHeightOptions } from "./profile_height.js";




//let editingProfileId = null;
let loadedProfile = null;

async function profile_loadProfile() {
  showStatus("Loading profile…");
  const { data: sessionData } = await window.supabase.auth.getSession();
  const user = sessionData?.session?.user;
  if (!user) {
    showStatus("You are not logged in.");
    return;
  }

  setEditingProfileId(getProfileIdFromHash());

  // --- Create mode (no id yet) ---
  if (!editingProfileId) {
    showStatus("Create a new profile.");
    document.getElementById("profileForm").classList.remove("hidden");

    // Always render UI elements
    profile_populateHeightOptions();
    profile_renderPhotoSlots();
    profile_attachPhotoUpload();
    await profile_loadQuestions();

    return;
  }

  // --- Edit mode (id exists) ---
  let { data: profile } = await window.supabase
    .schema("cabo")
    .from("mm_people")
    .select("*")
    .eq("id", editingProfileId)
    .maybeSingle();

  if (!profile) {
    showStatus("Profile not found.");
    return;
  }

  loadedProfile = profile;

  // Populate fields
  document.getElementById("profileForm").classList.remove("hidden");
  document.getElementById("first_name").value = profile.first_name || "";
  document.getElementById("last_name").value = profile.last_name || "";
  document.getElementById("email").value = profile.email || user.email || "";
  document.getElementById("phone_number").value = profile.phone_number || "";
  document.getElementById("place_of_birth").value = profile.place_of_birth || "";
  document.getElementById("current_location").value = profile.current_location || "";
  document.getElementById("citizenship").value = profile.citizenship || "";
  document.getElementById("gender").value = profile.gender || "";
  document.getElementById("willing_to_relocate").checked = profile.willing_to_relocate === true;


const cancelBtn = document.getElementById("cancelProfileBtn");
if (cancelBtn) {
  cancelBtn.addEventListener("click", () => {
    if (editingProfileId) {
      window.location.hash = `#/profilevw/${editingProfileId}`;
    } else {
      // If no profile exists yet, just go back to the list
      window.location.hash = "#/profilevw";
    }
  });
}

  if (profile.datetime_of_birth) {
    const d = new Date(profile.datetime_of_birth);
    document.getElementById("datetime_of_birth").value = !isNaN(d) ? d.toISOString().slice(0, 16) : "";
  }
  document.getElementById("bio").value = profile.bio || "";

  setPhotoUrls(profile.photos || []);

  // Always render UI elements
  profile_populateHeightOptions();
  if (profile.height) {
    document.getElementById("height").value = profile.height;
  }
  profile_renderPhotoSlots();
  profile_attachPhotoUpload();
  await profile_loadQuestions();
}

async function profile_saveAll() {
  if (!profile_validateForm()) return;
  showStatus("Saving…");

  const { data: sessionData } = await window.supabase.auth.getSession();
  const user = sessionData?.session?.user;
  if (!user) {
    alert("You are not logged in.");
    window.location.hash = "#/login";
    return;
  }

  let dbError;
  if (editingProfileId) {
    const payload = profile_buildUpdatePayload();
    const { error } = await window.supabase
      .schema("cabo")
      .from("mm_people")
      .update(payload)
      .eq("id", editingProfileId);
    dbError = error;
  } else {
    const payload = profile_buildCreatePayload(user);
    const { data, error } = await window.supabase
      .schema("cabo")
      .from("mm_people")
      .insert(payload)
      .select()
      .single();
    dbError = error;
    if (!error && data) {
      editingProfileId = data.id;
      loadedProfile = data;
    }
  }

  if (dbError) {
    showStatus("Error saving profile.");
    return;
  }

  await profile_saveQuestions(editingProfileId);  
  window.location.hash = "#/my-profiles";
}

export function initProfile() {
  profile_loadProfile();
  const saveBtn = document.getElementById("saveProfileBtn");
  if (saveBtn) saveBtn.addEventListener("click", profile_saveAll);
}

//document.getElementById("cancelProfileBtn").addEventListener("click", () => {
//  window.location.hash = "#profilevw";
//});



setTimeout(initProfile, 0);
// profile_main.js
import { profile_buildUpdatePayload } from "./profile_payloads.js";
import { profile_loadQuestions, profile_saveQuestions } from "./profile_questions.js";
import { qs, showStatus } from "./profile_helpers.js";
import { setPhotoUrls, getEditingProfileId, setEditingProfileId } from "./profile_state.js";
import { profile_renderPhotoSlots, profile_attachPhotoUpload } from "./profile_photos.js";
import { profile_populateHeightOptionsFor } from "./profile_height.js";
import { profile_attachShareButton } from "./profile_share.js";
// import { hasPermission } from "./security.js";



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

  // Normalize photos into an array
  if (!Array.isArray(photos)) {
    try {
      photos = typeof photos === "string" ? JSON.parse(photos) : photos;
    } catch {
      photos = [];
    }
  }

  // If it's still not an array (null, object, whatever), default to []
  if (!Array.isArray(photos)) {
    photos = [];
  }

  while (photos.length < 6) photos.push(null);

  setPhotoUrls(photos);
  profile_renderPhotoSlots();
}

// --------------------------------------------------
// MAIN INIT
// --------------------------------------------------
export async function profile_init(personId = null) {
  const hash = window.location.hash;

console.log("profile_init running");
  // ⭐ Strict route guard — only allow:
  //    #/profile
  //    #/profile/<uuid>
  if (!/^#\/profile(\/[0-9a-fA-F-]{36})?$/.test(hash)) {
    console.warn("profile_main.js: wrong route — skipping init");
    return;
  }

  // ⭐ DOM guard — ensures edit page HTML is present
  if (!document.getElementById("photoGrid")) {
    console.warn("profile_main.js loaded on a page without photoGrid — skipping init");
    return;
  }

  // ⭐ Lazy-load edit-page modules ONLY when needed
  const { profile_renderPhotoSlots, profile_attachPhotoUpload } =
    await import("./profile_photos.js");

  const { profile_populateHeightOptions } =
    await import("./profile_height.js");

  // ⭐ Now safe to run edit-page logic
  setEditingProfileId(personId);
  const id = getEditingProfileId();

  //await profile_populateHeightOptions();
  //await profile_populateHeightOptionsFor("#height");
  await profile_populateHeightOptionsFor(document.getElementById("height"));

  if (id) {

    await loadProfileRow(id);
    await loadExistingAnswers(id);
    await loadPhotos(id);

    // ⭐ Show "Edit Basic Info" button only for admins
    // if (await hasPermission("edit_basic_info")) {
    //   const btn = document.getElementById("editBasicInfoBtn");
    //   if (btn) btn.classList.remove("hidden");
    // }

    // Make certain fields readonly when editing
    qs("first_name").readOnly = true;
    qs("last_name").readOnly = true;
    qs("gender").disabled = true; // select elements use disabled
    qs("datetime_of_birth").readOnly = true;

    const lock = (el) => {
      if (!el) return;
      el.classList.add("bg-gray-100", "cursor-not-allowed");
    };

    lock(qs("first_name"));
    lock(qs("last_name"));
    lock(qs("gender"));
    lock(qs("datetime_of_birth"));

  } else {
    profile_renderPhotoSlots();
  }

  profile_attachPhotoUpload();
  await profile_loadQuestions(id);

  const form = document.getElementById("profileForm");
  if (form) form.classList.remove("hidden");

  //SAVE
  document
  .getElementById("saveProfileBtn")
  .addEventListener("click", saveProfile);

  //CANCEL
  document
  .getElementById("cancelProfileBtn")
  .addEventListener("click", cancelProfile);


  profile_attachShareButton();

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
//CANCEL  
function cancelProfile() {
  window.location.hash = "#/my-profiles";
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

  const header = document.getElementById("profileHeader");
  if (header) {
    const fullName = `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim();
    header.textContent = fullName || "My Profile";
  }
}

// if (await hasPermission("edit_basic_info")) {
//   document.getElementById("editBasicInfoBtn").classList.remove("hidden");
// }

window.saveProfile = saveProfile;
window.cancelProfile = cancelProfile;

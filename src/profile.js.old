// profile.js
import { supabase } from "./supabase.js";

// ---------- Global state ----------
let editingProfileId = null;
let loadedProfile = null;
let photoUrls = [];
let questions = [];
let existingAnswers = {};

// ---------- Accordion ----------
function toggleAccordion(id) {
  document.querySelectorAll("[id^='section']").forEach(el => el.classList.add("hidden"));
  document.querySelectorAll("[id^='icon-section']").forEach(el => el.textContent = "+");
  const section = document.getElementById(id);
  const icon = document.getElementById("icon-" + id);
  if (!section || !icon) return;
  section.classList.remove("hidden");
  icon.textContent = "−";
  const firstInput = section.querySelector("input, select, textarea");
  if (firstInput) firstInput.focus();
}
window.toggleAccordion = toggleAccordion; // for inline onclick

// ---------- Helpers ----------
function qs(id) { return document.getElementById(id); }
function showStatus(msg, autoHideMs = 0) {
  const el = qs("profileStatus");
  if (!el) return;
  el.textContent = msg || "";
  el.classList.remove("hidden");
  if (autoHideMs) setTimeout(() => el.classList.add("hidden"), autoHideMs);
}
function getProfileIdFromHash() {
  const match = window.location.hash.match(/^#\/profile\/([0-9a-fA-F-]{36})$/);
  return match ? match[1] : null;
}

// ---------- Validation ----------
function validateProfileForm() {
  let valid = true;
  const requiredFields = document.querySelectorAll("#profileForm input[required], #profileForm select[required]");
  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      valid = false;
      field.classList.add("border-red-500");
      if (!field.nextElementSibling || !field.nextElementSibling.classList.contains("error-msg")) {
        const helper = document.createElement("p");
        helper.className = "error-msg text-xs text-red-600 mt-1";
        helper.textContent = "This field is required.";
        field.insertAdjacentElement("afterend", helper);
      }
      const section = field.closest("[id^='section']");
      if (section) toggleAccordion(section.id);
    } else {
      field.classList.remove("border-red-500");
      const helper = field.nextElementSibling;
      if (helper && helper.classList.contains("error-msg")) helper.remove();
    }
  });
  return valid;
}

// ---------- Height options ----------
function populateHeightOptions() {
  const heightSelect = qs("height");
  if (!heightSelect) return;
  for (let feet = 4; feet <= 9; feet++) {
    for (let inches = 0; inches <= 11; inches++) {
      const option = document.createElement("option");
      option.value = `${feet}'${inches}`;
      option.textContent = `${feet}'${inches}"`;
      heightSelect.appendChild(option);
    }
  }
}

// ---------- Photos ----------
function renderPhotoSlots() {
  const photoGrid = qs("photoGrid");
  const photoInput = qs("photoInput");
  const photoModal = qs("photoModal");
  const modalImage = qs("modalImage");
  if (!photoGrid) return;

  photoGrid.innerHTML = "";
  for (let i = 0; i < 6; i++) {
    const slot = document.createElement("div");
    slot.className =
      "relative w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm cursor-pointer overflow-hidden";
    const value = photoUrls[i] || null;

    if (value && value !== "__uploading__") {
      slot.innerHTML = `
        <img src="${value}" class="w-full h-full object-cover" />
        <button class="absolute top-1 right-1 bg-black bg-opacity-60 text-white text-xs px-1 rounded delete-btn" data-index="${i}">✕</button>
      `;
    } else if (value === "__uploading__") {
      slot.innerHTML = `
        <div class="w-full h-full flex items-center justify-center bg-gray-200 text-gray-700 text-sm">Uploading...</div>
      `;
    } else {
      slot.textContent = "+";
    }

    slot.addEventListener("click", (e) => {
      if (e.target.classList.contains("delete-btn")) return;
      if (value && value !== "__uploading__") {
        if (photoModal && modalImage) {
          modalImage.src = value;
          photoModal.classList.remove("hidden");
        }
        return;
      }
      if (photoInput) {
        photoInput.dataset.slot = i;
        photoInput.click();
      }
    });

    photoGrid.appendChild(slot);
  }

  photoGrid.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const index = Number(e.target.dataset.index);
      photoUrls[index] = null;
      renderPhotoSlots();
      e.stopPropagation();
    });
  });

  if (photoModal) photoModal.addEventListener("click", () => photoModal.classList.add("hidden"));
}

function showUploadProgress(index, percent) {
  const photoGrid = qs("photoGrid");
  if (!photoGrid) return;
  const slot = photoGrid.children[index];
  if (!slot) return;
  slot.innerHTML = `
    <div class="w-full h-full flex items-center justify-center bg-gray-200 text-gray-700 text-sm">${percent}%</div>
  `;
}

// function attachPhotoUpload() {
//   const photoInput = qs("photoInput");
//   if (!photoInput) return;

//   photoInput.addEventListener("change", async (e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     const slotIndex = Number(photoInput.dataset.slot || 0);
//     photoUrls[slotIndex] = "__uploading__";
//     renderPhotoSlots();

//     const { data: sessionData } = await supabase.auth.getSession();
//     const user = sessionData?.session?.user;
//     if (!user) {
//       alert("Please log in to upload photos.");
//       photoUrls[slotIndex] = null;
//       renderPhotoSlots();
//       return;
//     }

//     const fileName = `${user.id}/${crypto.randomUUID()}.jpg`;
//     const { error: uploadError } = await supabase.storage
//       .from("profile_photos")
//       .upload(fileName, file, {
//         upsert: false,
//         onUploadProgress: (pe) => {
//           if (!pe?.total) return;
//           const pct = Math.round((pe.loaded / pe.total) * 100);
//           showUploadProgress(slotIndex, pct);
//         }
//       });

//     if (uploadError) {
//       console.error(uploadError);
//       alert("Upload failed");
//       photoUrls[slotIndex] = null;
//       renderPhotoSlots();
//       return;
//     }

//     const { data: urlData } = supabase.storage.from("profile_photos").getPublicUrl(fileName);
//     photoUrls[slotIndex] = urlData.publicUrl;
//     renderPhotoSlots();
//   });
// }

// ---------- Questions ----------
async function loadQuestions() {
  const wrapper = qs("questionsWrapper");
  if (!wrapper) return;
  wrapper.innerHTML = '<div class="text-sm text-gray-500">Loading questions…</div>';

  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;
  if (!user) {
    wrapper.innerHTML = '<div class="text-sm text-red-600">You are not logged in.</div>';
    return;
  }

  const { data: qData, error: qError } = await supabase
    .schema("cabo")
    .from("mm_questions")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (qError) {
    console.error(qError);
    wrapper.innerHTML = '<div class="text-sm text-red-600">Failed to load questions.</div>';
    return;
  }

  questions = qData || [];

  if (!editingProfileId) {
    wrapper.innerHTML = '<div class="text-sm text-gray-500">Save your profile to answer questions.</div>';
    return;
  }

  const { data: aData, error: aError } = await supabase
    .schema("cabo")
    .from("mm_answers")
    .select("*")
    .eq("person_id", editingProfileId);

  if (aError) {
    console.error(aError);
    wrapper.innerHTML = '<div class="text-sm text-red-600">Failed to load answers.</div>';
    return;
  }

  existingAnswers = {};
  (aData || []).forEach(a => { existingAnswers[a.question_id] = a.answer_text; });
  renderQuestions();
}

function renderQuestions() {
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

      const val = existingAnswers[q.id] || "";
      if (val) fieldEl.value = val;

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
      const val = existingAnswers[q.id] || "";
      if (val) {
        [...fieldEl.querySelectorAll("input")].forEach(r => { if (r.value === val) r.checked = true; });
      }

    } else {
      fieldEl = document.createElement("input");
      fieldEl.type = "text";
      fieldEl.id = q.field_key;
      fieldEl.name = q.field_key;
      fieldEl.className = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm";
      fieldEl.value = existingAnswers[q.id] || "";
    }

    row.appendChild(label);
    row.appendChild(fieldEl);
    wrapper.appendChild(row);
  });
}

async function saveQuestions() {
  if (!editingProfileId || !questions.length) return;

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

  const { error } = await supabase
    .schema("cabo")
    .from("mm_answers")
    .upsert(payload, { onConflict: "person_id,question_id" });

  if (error) {
    console.error(error);
    showStatus("Error saving answers.");
  }
}

// ---------- Profile load/save ----------
function buildCreatePayload(user) {
  const firstName = qs("first_name"), lastName = qs("last_name"), email = qs("email"),
        phone = qs("phone_number"), dob = qs("datetime_of_birth"), pob = qs("place_of_birth"),
        height = qs("height"), gender = qs("gender"), location = qs("current_location"),
        relocate = qs("willing_to_relocate"), bio = qs("bio"), citizenship = qs("citizenship");

  return {
    id: crypto.randomUUID(),
    auth_id: user.id,
    first_name: firstName.value.trim(),
    last_name: lastName.value.trim(),
    email: email.value.trim() || user.email,
    phone_number: phone.value.trim() || null,
    place_of_birth: pob.value.trim() || null,
    current_location: location.value.trim() || null,
    bio: bio?.value?.trim() || null,
    gender: gender.value || null,
    willing_to_relocate: relocate.checked,
    height: height.value || null,
    datetime_of_birth: dob.value || null,
    citizenship: citizenship?.value?.trim() || null,
    photos: photoUrls
  };
}

function buildUpdatePayload() {
  const firstName = qs("first_name"), lastName = qs("last_name"), email = qs("email"),
        phone = qs("phone_number"), dob = qs("datetime_of_birth"), pob = qs("place_of_birth"),
        height = qs("height"), gender = qs("gender"), location = qs("current_location"),
        relocate = qs("willing_to_relocate"), bio = qs("bio"), citizenship = qs("citizenship");

  return {
    first_name: firstName.value.trim(),
    last_name: lastName.value.trim(),
    email: email.value.trim(),
    phone_number: phone.value.trim() || null,
    place_of_birth: pob.value.trim() || null,
    current_location: location.value.trim() || null,
    bio: bio?.value?.trim() || null,
    gender: gender.value || null,
    willing_to_relocate: relocate.checked,
    height: height.value || null,
    datetime_of_birth: dob.value || null,
    citizenship: citizenship?.value?.trim() || null,
    photos: photoUrls
  };
}

async function loadProfile() {
  const formEl = qs("profileForm");
  showStatus("Loading profile…");

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData?.session?.user) {
    showStatus("You are not logged in. Redirecting…");
    setTimeout(() => (window.location.hash = "#/login"), 1200);
    return;
  }
  const user = sessionData.session.user;
  editingProfileId = getProfileIdFromHash();

  if (!editingProfileId) {
    showStatus("Create a new profile.");
    formEl.classList.remove("hidden");
    populateHeightOptions();
    renderPhotoSlots();
    // attachPhotoUpload();
    toggleAccordion("section1");
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .schema("cabo")
    .from("mm_people")
    .select("*")
    .eq("id", editingProfileId)
    .maybeSingle();

  if (profileError) {
    console.error(profileError);
    showStatus("Error loading profile.");
    return;
  }
  if (!profile) {
    showStatus("Profile not found.");
    return;
  }

  loadedProfile = profile;

  // Populate fields
  qs("first_name").value = profile.first_name || "";
  qs("last_name").value = profile.last_name || "";
  qs("email").value = profile.email || user.email || "";
  qs("phone_number").value = profile.phone_number || "";
  qs("place_of_birth").value = profile.place_of_birth || "";
  qs("current_location").value = profile.current_location || "";
  if (qs("citizenship")) qs("citizenship").value = profile.citizenship || "";
  qs("gender").value = profile.gender || "";
  qs("willing_to_relocate").checked = profile.willing_to_relocate === true;
  if (profile.datetime_of_birth) {
    const d = new Date(profile.datetime_of_birth);
    qs("datetime_of_birth").value = !isNaN(d) ? d.toISOString().slice(0, 16) : "";
  }
  if (qs("bio")) qs("bio").value = profile.bio || "";

  photoUrls = Array.isArray(profile.photos) ? profile.photos : [];

  formEl.classList.remove("hidden");
  populateHeightOptions();
  renderPhotoSlots();
  // attachPhotoUpload();
  showStatus("");

  // Load questions
  await loadQuestions();
}

// ---------- Save orchestrator ----------
async function saveAll() {
  if (!validateProfileForm()) return;

  showStatus("Saving…");

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData?.session?.user) {
    alert("You are not logged in.");
    window.location.hash = "#/login";
    return;
  }
  const user = sessionData.session.user;

  let dbError;
  if (editingProfileId) {
    const payload = buildUpdatePayload();
    const { error } = await supabase
      .schema("cabo")
      .from("mm_people")
      .update(payload)
      .eq("id", editingProfileId);
    dbError = error;
  } else {
    const payload = buildCreatePayload(user);
    const { error } = await supabase
      .schema("cabo")
      .from("mm_people")
      .insert(payload);
    dbError = error;
    editingProfileId = payload.id;
    loadedProfile = payload;
  }

  if (dbError) {
    console.error(dbError);
    showStatus("Error saving profile.");
    return;
  }

  await saveQuestions();

  showStatus("Profile saved successfully.", 3000);
}

// ---------- Logout ----------
function attachLogout() {
  const logoutBtn = qs("logoutBtn");
  if (!logoutBtn) return;
  logoutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.hash = "#/login";
  });
}

// ---------- Init ----------
function initProfile() {
  attachLogout();
  populateHeightOptions();
  renderPhotoSlots();
  // attachPhotoUpload();
  loadProfile();

  const saveBtn = qs("saveProfileBtn");
  if (saveBtn) saveBtn.addEventListener("click", saveAll);
}

// Router inject delay
setTimeout(initProfile, 0);


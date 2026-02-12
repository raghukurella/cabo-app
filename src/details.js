import { supabase } from "./supabase.js";

let currentProfileId = null;
let originalData = null;
let currentPhotos = [];
let isEditing = false;

export async function init(id) {
  // Handle query params (e.g. ?edit=true)
  let profileId = id;
  let autoEdit = false;
  
  if (id && id.includes("?")) {
    const parts = id.split("?");
    profileId = parts[0];
    const params = new URLSearchParams(parts[1]);
    if (params.get("edit") === "true") autoEdit = true;
  }

  currentProfileId = profileId;
  console.log("Details page init for:", profileId);

  const btnEdit = document.getElementById("btnEdit");
  const btnSave = document.getElementById("btnSave");
  const btnCancel = document.getElementById("btnCancel");
  const btnDelete = document.getElementById("btnDelete");
  const btnUploadPhoto = document.getElementById("btnUploadPhoto");
  const photoInput = document.getElementById("photoInput");

  if (btnEdit) btnEdit.addEventListener("click", enableEditMode);
  if (btnSave) btnSave.addEventListener("click", saveChanges);
  if (btnCancel) btnCancel.addEventListener("click", cancelEdit);
  if (btnDelete) btnDelete.addEventListener("click", deleteProfile);
  if (btnUploadPhoto) btnUploadPhoto.addEventListener("click", () => photoInput.click());
  if (photoInput) photoInput.addEventListener("change", handlePhotoUpload);

  // Tag Modal Listeners
  const btnAddTag = document.getElementById("btnAddTag");
  const btnSaveTag = document.getElementById("btnSaveTag");
  const btnCancelTag = document.getElementById("btnCancelTag");
  
  if (btnAddTag) btnAddTag.addEventListener("click", () => document.getElementById("tagModal").classList.remove("hidden"));
  if (btnCancelTag) btnCancelTag.addEventListener("click", () => document.getElementById("tagModal").classList.add("hidden"));
  if (btnSaveTag) btnSaveTag.addEventListener("click", addNewTag);

  await loadOccupationTags();
  await loadProfile(profileId);

  // Auto-enable edit mode if requested and allowed
  if (autoEdit) {
    if (btnEdit && !btnEdit.classList.contains("hidden")) {
      enableEditMode();
    }
  }
}

async function loadProfile(id) {
  const loading = document.getElementById("loadingState");
  const form = document.getElementById("detailsForm");

  // Fetch from ma_biodata as per main page source
  const { data, error } = await supabase
    .schema("cabo")
    .from("ma_biodata")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error loading profile:", error);
    loading.textContent = "Error loading profile. It may not exist or you lack permissions.";
    return;
  }

  originalData = data;
  populateForm(data);
  await checkPermissions(data);

  loading.classList.add("hidden");
  form.classList.remove("hidden");
}

function populateForm(data) {
  const form = document.getElementById("detailsForm");
  
  // Map DB fields to inputs
  setVal(form, "first_name", data.first_name);
  setVal(form, "last_name", data.last_name);
  setVal(form, "gender", data.gender);
  setVal(form, "height", data.height);
  setVal(form, "current_location", data.current_location);
  setVal(form, "education", data.education);
  setVal(form, "occupation", data.occupation);
  setVal(form, "occupation_tag", data.occupation_tag);
  setVal(form, "company", data.company);
  setVal(form, "income", data.income);
  setVal(form, "bio", data.bio);
  setVal(form, "family_details", data.family_details);
  setVal(form, "partner_preferences", data.partner_preferences);

  // Citizenship Radios
  const citVal = data.citizenship || "";
  const citRadios = form.querySelectorAll('input[name="citizenship"]');
  citRadios.forEach(cb => {
    cb.checked = citVal.includes(cb.value);
  });

  // Date handling
  if (data.datetime_of_birth) {
    const isoDate = new Date(data.datetime_of_birth).toISOString().split('T')[0];
    setVal(form, "datetime_of_birth", isoDate);
  }

  // Photos handling
  currentPhotos = [];
  if (Array.isArray(data.photos)) {
    currentPhotos = [...data.photos];
  } else if (typeof data.photos === "string") {
    try { currentPhotos = JSON.parse(data.photos); } catch(e) {}
  }
  if (!Array.isArray(currentPhotos)) currentPhotos = [];

  renderPhotos();
}

function renderPhotos() {
  const photoContainer = document.getElementById("photoContainer");
  const headerPhoto = document.getElementById("headerProfilePhoto");

  if (headerPhoto) {
    if (currentPhotos.length > 0 && currentPhotos[0]) {
      headerPhoto.src = currentPhotos[0];
    } else {
      headerPhoto.src = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
    }
    headerPhoto.classList.remove("hidden");
  }

  if (!photoContainer) return;
  photoContainer.innerHTML = "";
  
  if (currentPhotos.length > 0) {
    currentPhotos.forEach((url, index) => {
      if (!url) return;
      const wrapper = document.createElement("div");
      wrapper.className = "relative group";

      const img = document.createElement("img");
      img.src = url;
      img.className = "w-full h-32 object-cover rounded-lg border border-gray-200";
      
      wrapper.appendChild(img);

      if (isEditing) {
        const delBtn = document.createElement("button");
        delBtn.className = "absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md hover:bg-red-700";
        delBtn.innerHTML = "&times;";
        delBtn.title = "Remove photo";
        delBtn.onclick = (e) => {
          e.preventDefault();
          currentPhotos.splice(index, 1);
          renderPhotos();
        };
        wrapper.appendChild(delBtn);
      }

      photoContainer.appendChild(wrapper);
    });
  } else {
    photoContainer.innerHTML = "<p class='text-gray-400 text-sm col-span-full'>No photos available.</p>";
  }
}

function setVal(form, name, val) {
  const el = form.querySelector(`[name="${name}"]`);
  if (el) el.value = val || "";
}

function enableEditMode() {
  isEditing = true;
  document.getElementById("btnEdit").classList.add("hidden");
  document.getElementById("btnSave").classList.remove("hidden");
  document.getElementById("btnCancel").classList.remove("hidden");
  document.getElementById("btnDelete").classList.remove("hidden");
  
  document.getElementById("btnUploadPhoto").classList.remove("hidden");
  document.getElementById("btnAddTag").classList.remove("hidden");
  renderPhotos(); // Re-render to show delete buttons

  const inputs = document.querySelectorAll("#detailsForm input, #detailsForm select, #detailsForm textarea");
  inputs.forEach(el => {
    el.disabled = false;
    if (el.type !== 'checkbox' && el.type !== 'radio') {
      el.classList.remove("bg-gray-50");
      el.classList.add("bg-white", "focus:ring-2", "focus:ring-blue-500", "focus:border-blue-500");
    }
  });
}

function cancelEdit() {
  isEditing = false;
  document.getElementById("btnEdit").classList.remove("hidden");
  document.getElementById("btnSave").classList.add("hidden");
  document.getElementById("btnCancel").classList.add("hidden");
  document.getElementById("btnDelete").classList.add("hidden");
  
  document.getElementById("btnUploadPhoto").classList.add("hidden");
  document.getElementById("btnAddTag").classList.add("hidden");
  // Revert photos will happen in populateForm below

  const inputs = document.querySelectorAll("#detailsForm input, #detailsForm select, #detailsForm textarea");
  inputs.forEach(el => {
    el.disabled = true;
    if (el.type !== 'checkbox' && el.type !== 'radio') {
      el.classList.add("bg-gray-50");
      el.classList.remove("bg-white", "focus:ring-2", "focus:ring-blue-500", "focus:border-blue-500");
    }
  });

  // Revert data
  if (originalData) populateForm(originalData);
}

async function saveChanges() {
  const btnSave = document.getElementById("btnSave");
  const originalText = btnSave.textContent;
  btnSave.textContent = "Saving...";
  btnSave.disabled = true;

  const form = document.getElementById("detailsForm");
  const formData = new FormData(form);
  const updates = {};
  
  // Handle standard fields
  for (const [key, value] of formData.entries()) {
    if (key === 'citizenship') continue; // Handle separately
    updates[key] = value.trim() || null;
  }

  // Handle Citizenship
  const citValues = formData.getAll("citizenship");
  updates.citizenship = citValues.length > 0 ? citValues.join(", ") : null;

  // Handle Date
  if (updates.datetime_of_birth) {
    updates.datetime_of_birth = new Date(updates.datetime_of_birth).toISOString();
  }

  // Include photos
  updates.photos = currentPhotos;

  const { error } = await supabase
    .schema("cabo")
    .from("ma_biodata")
    .update(updates)
    .eq("id", currentProfileId);

  btnSave.textContent = originalText;
  btnSave.disabled = false;

  if (error) {
    console.error("Save error:", error);
    if (error.code === "42501") {
      const { data: { session } } = await supabase.auth.getSession();
      const role = session ? "authenticated (logged in)" : "anon (guest)";
      alert(`Database Permission Error: You are currently "${role}". Updates are not allowed for this role. Please run the SQL GRANT commands for 'public'.`);
    } else if (error.code === "PGRST204") {
      alert("Database Schema Error: The 'photos' column is missing in 'ma_biodata'. Please run the SQL ALTER TABLE command.");
    } else {
      alert("Failed to save changes: " + error.message);
    }
  } else {
    alert("Profile updated successfully!");
    isEditing = false;
    // Refresh data
    await loadProfile(currentProfileId);
    // Exit edit mode
    document.getElementById("btnEdit").classList.remove("hidden");
    document.getElementById("btnSave").classList.add("hidden");
    document.getElementById("btnCancel").classList.add("hidden");
    document.getElementById("btnDelete").classList.add("hidden");
    document.getElementById("btnUploadPhoto").classList.add("hidden");
    document.getElementById("btnAddTag").classList.add("hidden");
    
    const inputs = document.querySelectorAll("#detailsForm input, #detailsForm select, #detailsForm textarea");
    inputs.forEach(el => {
      el.disabled = true;
      if (el.type !== 'checkbox' && el.type !== 'radio') {
        el.classList.add("bg-gray-50");
        el.classList.remove("bg-white", "focus:ring-2", "focus:ring-blue-500", "focus:border-blue-500");
      }
    });
  }
}

async function deleteProfile() {
  if (!confirm("Are you sure you want to delete this profile? This action cannot be undone.")) return;

  const btnDelete = document.getElementById("btnDelete");
  const originalText = btnDelete.textContent;
  btnDelete.textContent = "Deleting...";
  btnDelete.disabled = true;

  const { error } = await supabase
    .schema("cabo")
    .from("ma_biodata")
    .delete()
    .eq("id", currentProfileId);

  if (error) {
    console.error("Delete error:", error);
    if (error.code === "42501") {
      const { data: { session } } = await supabase.auth.getSession();
      const role = session ? "authenticated" : "anon";
      alert(`Database Permission Error: You are currently "${role}". Deletes are not allowed for this role.`);
    } else {
      alert("Failed to delete profile: " + error.message);
    }
    btnDelete.textContent = originalText;
    btnDelete.disabled = false;
  } else {
    alert("Profile deleted successfully.");
    window.location.hash = "#/";
  }
}

async function handlePhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const btn = document.getElementById("btnUploadPhoto");
  const originalText = btn.textContent;
  btn.textContent = "Uploading...";
  btn.disabled = true;

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${currentProfileId}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('profile_photos')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('profile_photos')
      .getPublicUrl(fileName);

    currentPhotos.push(publicUrl);
    renderPhotos();

  } catch (err) {
    console.error("Upload failed:", err);
    if (err.message && err.message.includes("row-level security")) {
      alert("Storage Permission Error: The 'profile_photos' bucket does not allow uploads. Please run the SQL policies in Supabase.");
    } else {
      alert("Failed to upload photo: " + err.message);
    }
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
    e.target.value = ""; // Reset input
  }
}

async function loadOccupationTags() {
  const select = document.querySelector('select[name="occupation_tag"]');
  if (!select) return;

  const { data, error } = await supabase
    .schema("cabo")
    .from("ma_biodata")
    .select("occupation_tag");
  
  if (error) {
    console.error("Error loading tags:", error);
    return;
  }

  const tags = new Set();
  data.forEach(r => { if(r.occupation_tag) tags.add(r.occupation_tag); });
  
  // Keep "Select..."
  select.innerHTML = '<option value="">Select...</option>';
  
  Array.from(tags).sort().forEach(tag => {
    const opt = document.createElement("option");
    opt.value = tag;
    opt.textContent = tag;
    select.appendChild(opt);
  });
}

function addNewTag() {
  const input = document.getElementById("newTagInput");
  const tag = input.value.trim();
  if (!tag) return;

  const select = document.querySelector('select[name="occupation_tag"]');
  
  // Check if exists
  let exists = false;
  for (let i = 0; i < select.options.length; i++) {
    if (select.options[i].value === tag) {
      exists = true;
      break;
    }
  }

  if (!exists) {
    const opt = document.createElement("option");
    opt.value = tag;
    opt.textContent = tag;
    select.appendChild(opt);
  }

  select.value = tag;
  document.getElementById("tagModal").classList.add("hidden");
  input.value = "";
}

async function checkPermissions(profileData) {
  const btnEdit = document.getElementById("btnEdit");
  const btnDelete = document.getElementById("btnDelete");
  
  // Default to hidden to prevent flash of unauthorized actions
  if (btnEdit) btnEdit.classList.add("hidden");
  if (btnDelete) btnDelete.classList.add("hidden");

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  const currentUserId = user?.id;

  // 1. Admin Override
  if (currentUserId) {
     const { data: admin } = await supabase.schema("cabo").from("mm_admin").select("id").eq("auth_user_id", currentUserId).maybeSingle();
     if (admin) {
         if (btnEdit) btnEdit.classList.remove("hidden");
         if (btnDelete) btnDelete.classList.remove("hidden");
         return;
     }
  }

  // 2. Owner Check (Check common ownership fields)
  const ownerId = profileData.created_by || profileData.user_id || profileData.auth_user_id;
  if (currentUserId && ownerId && currentUserId === ownerId) {
      if (btnEdit) btnEdit.classList.remove("hidden");
      if (btnDelete) btnDelete.classList.remove("hidden");
  }
}
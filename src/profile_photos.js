import { qs } from "./profile_helpers.js";
import {
  editingProfileId,
  photoUrls,
  setPhotoUrls
} from "./profile_state.js";


// DEBUG: intercept all uploads to profile_photos
const originalUpload = window.supabase.storage.from("profile_photos").upload;

window.supabase.storage.from("profile_photos").upload = function (...args) {
  return originalUpload.apply(this, args);
};



//export let photoUrls = [];

// Prevent duplicate uploads per slot
let activeUploads = {};

// Prevent attaching multiple listeners
let uploadListenerAttached = false;

/**
 * Always render 6 slots, even if profile doesn't exist yet.
 */
export function profile_renderPhotoSlots() {
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
      slot.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gray-200 text-gray-700 text-sm">Uploading...</div>`;
    } else {
      slot.textContent = "+";
    }
    slot.addEventListener("click", (e) => {
      if (e.target.classList.contains("delete-btn")) return;

if (value && value !== "__uploading__") {
  requestAnimationFrame(() => {
    modalImage.src = "";
    photoModal.classList.remove("hidden");

    modalImage.src = value;

    modalImage.onload = () => {
      console.log("Modal image loaded");
    };

    modalImage.onerror = () => {
      console.warn("Image failed to load:", value);
      alert("Image could not be loaded.");
    };
  });

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
      console.log("Deleting photo at index:", index);
      photoUrls[index] = null;
      profile_renderPhotoSlots();
      e.stopPropagation();
    });
  });

  if (photoModal) {
    photoModal.addEventListener("click", () => {
      photoModal.classList.add("hidden");
    });
  }
}

/**
 * Attach upload listener ONCE.
 */
export function profile_attachPhotoUpload() {
  const photoInput = qs("photoInput");
  if (!photoInput) return;

  if (uploadListenerAttached) {
    console.log("Upload listener already attached");
    return;
  }
  uploadListenerAttached = true;

photoInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const slotIndex = Number(photoInput.dataset.slot || 0);

  if (activeUploads[slotIndex]) return;
  activeUploads[slotIndex] = true;

  // Mark slot as uploading
  photoUrls[slotIndex] = "__uploading__";
  profile_renderPhotoSlots();

  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;
  if (!user) {
    alert("Please log in to upload photos.");
    photoUrls[slotIndex] = null;
    delete activeUploads[slotIndex];
    profile_renderPhotoSlots();
    return;
  }

  const ext = file.name.split(".").pop().toLowerCase();
  const fileName = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("profile_photos")
    .upload(fileName, file, { upsert: true });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    alert("Upload failed");
    photoUrls[slotIndex] = null;
    delete activeUploads[slotIndex];
    profile_renderPhotoSlots();
    return;
  }

  const { data: urlData } = supabase.storage
    .from("profile_photos")
    .getPublicUrl(fileName);

  const publicUrl = urlData.publicUrl;
  photoUrls[slotIndex] = publicUrl;

  // 🔥 Save to DB immediately
  if (editingProfileId) {
    const { error: dbError } = await supabase
      .schema("cabo")
      .from("mm_people")
      .update({ photos: photoUrls })
      .eq("id", editingProfileId);

    if (dbError) {
      console.error("DB save error:", dbError);
      alert("Photo uploaded but failed to save profile.");
    }
  }

  delete activeUploads[slotIndex];
  photoInput.value = "";
  profile_renderPhotoSlots();
});}

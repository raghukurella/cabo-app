// profile_state.js

// The profile currently being edited
export let editingProfileId = null;

// The photo URL array (shared between modules)
export let photoUrls = [];

// Allow modules to update these values
export function setEditingProfileId(id) {
  editingProfileId = id;
}

export function setPhotoUrls(arr) {
  photoUrls = arr;
}
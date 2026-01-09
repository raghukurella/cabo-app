// profile_state.js

// The profile currently being edited
export let editingProfileId = null;

// The photo URL array (shared between modules)
export let photoUrls = [];

// Allow modules to update these values
export function setEditingProfileId(id) {
  editingProfileId = id;
}







export function getEditingProfileId() {
  return editingProfileId;
}




export function getPhotoUrls() {
  return photoUrls;
}

export function setPhotoUrls(newArr) {
  photoUrls = newArr;
}

// DEBUG ONLY — remove later
window.__debug = {
  getPhotoUrls,
  setPhotoUrls,
  getEditingProfileId,
  setEditingProfileId
};
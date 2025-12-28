// profile_payloads.js
import { qs } from "./profile_helpers.js";
import { photoUrls } from "./profile_state.js";

export function profile_buildCreatePayload(user) {
  return {
    id: crypto.randomUUID(),
    auth_id: user.id,
    first_name: qs("first_name").value.trim(),
    last_name: qs("last_name").value.trim(),
    email: qs("email").value.trim() || user.email,
    phone_number: qs("phone_number").value.trim() || null,
    place_of_birth: qs("place_of_birth").value.trim() || null,
    current_location: qs("current_location").value.trim() || null,
    bio: qs("bio")?.value?.trim() || null,
    gender: qs("gender").value || null,
    willing_to_relocate: qs("willing_to_relocate").checked,
    height: qs("height").value || null,
    datetime_of_birth: qs("datetime_of_birth").value || null,
    citizenship: qs("citizenship")?.value?.trim() || null,
    photos: photoUrls
  };
}

export function profile_buildUpdatePayload() {
  return {
    first_name: qs("first_name").value.trim(),
    last_name: qs("last_name").value.trim(),
    email: qs("email").value.trim(),
    phone_number: qs("phone_number").value.trim() || null,
    place_of_birth: qs("place_of_birth").value.trim() || null,
    current_location: qs("current_location").value.trim() || null,
    bio: qs("bio")?.value?.trim() || null,
    gender: qs("gender").value || null,
    willing_to_relocate: qs("willing_to_relocate").checked,
    height: qs("height").value || null,
    datetime_of_birth: qs("datetime_of_birth").value
      ? new Date(qs("datetime_of_birth").value).toISOString()
      : null,
    citizenship: qs("citizenship")?.value?.trim() || null,
    photos: photoUrls
  };
}

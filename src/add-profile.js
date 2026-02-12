import { supabase } from "./supabase.js";

export function init() {
  const form = document.getElementById("addProfileForm");
  if (form) {
    form.addEventListener("submit", handleSave);
  }
}

async function handleSave(e) {
  e.preventDefault();
  const btn = e.submitter || document.querySelector("button[type='submit']");
  const originalText = btn ? btn.textContent : "Save";
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Saving...";
  }

  try {
    // 1. Capture the Data from the Form
    const formData = new FormData(e.target);
    const formFields = {};
    formData.forEach((value, key) => {
      formFields[key] = value.trim();
    });

    // Validation
    if (!formFields.name) throw new Error("Full Name is required.");
    if (!formFields.looking_for) throw new Error("'Looking for' is required to determine gender.");
    if (!formFields.dob) throw new Error("Date of Birth is required.");
    if (!formFields.height) throw new Error("Height is required.");
    if (!formFields.phone) throw new Error("Contact Number is required.");

    // 2. Prepare Payload for DB (Map fields to schema)
    const dbPayload = { ...formFields };

    // Map 'name' -> 'first_name', 'last_name'
    if (dbPayload.name) {
      const parts = dbPayload.name.trim().split(/\s+/);
      dbPayload.first_name = parts[0];
      dbPayload.last_name = parts.slice(1).join(" ") || "";
    }
    delete dbPayload.name;

    // Map 'dob' -> 'datetime_of_birth'
    if (dbPayload.dob) {
      dbPayload.datetime_of_birth = dbPayload.dob;
    }
    delete dbPayload.dob;

    // Map 'phone' -> 'phone_number'
    if (dbPayload.phone) {
      dbPayload.phone_number = dbPayload.phone;
    }
    delete dbPayload.phone;

    // Map 'looking_for' -> 'gender'
    if (dbPayload.looking_for) {
      if (dbPayload.looking_for === "Groom") dbPayload.gender = "Female"; // Looking for Groom = Bride (Female)
      if (dbPayload.looking_for === "Bride") dbPayload.gender = "Male";   // Looking for Bride = Groom (Male)
    }

    // Map location fields -> 'current_location'
    const locParts = [dbPayload.location_city, dbPayload.location_state, dbPayload.location_country].filter(Boolean);
    if (locParts.length > 0) {
      dbPayload.current_location = locParts.join(", ");
    }
    delete dbPayload.location_city;
    delete dbPayload.location_state;
    delete dbPayload.location_country;

    // Remove UI-only fields
    delete dbPayload.looking_for;

    // 3. Save to Main Profiles Table
    const { data: insertedProfile, error } = await supabase
      .schema("cabo")
      .from("ma_biodata")
      .insert([dbPayload])
      .select("id")
      .single();

    if (error) throw error;

    alert("Profile saved successfully!");
    if (insertedProfile?.id) {
      window.location.hash = `#/details/${insertedProfile.id}`;
    }

  } catch (err) {
    console.error("Save failed:", err);
    alert("Error saving profile: " + err.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = originalText; }
  }
}
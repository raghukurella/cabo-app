/**
 * save-final-profile.js
 * Backend module to save the final, human-edited biodata into the main database.
 * Handles validation, normalization, and database insertion.
 */

const crypto = require('crypto');

/**
 * Main function to save the final profile.
 * @param {Object} editedProfile - The object containing user-edited fields and metadata.
 * @returns {Promise<{success: boolean, profileId: string}>}
 */
async function saveFinalProfile(editedProfile) {
  try {
    if (!editedProfile || !editedProfile.fields) {
      throw new Error("Invalid profile data provided.");
    }

    const fields = editedProfile.fields;
    // Extract metadata references for audit
    const rawBiodataId = editedProfile.metadata?.rawBiodataId || null;
    const parsedJson = editedProfile.metadata?.parsedJson || null;

    // 1. Validate required fields
    validateFinalProfile(fields);

    // 2. Normalize values (dates, formats)
    const normalizedFields = normalizeFinalValues(fields);

    // 3. Save photos (if provided)
    const photoUrls = await savePhotos(fields.photos);

    // 4. Insert into database
    const profileId = await insertProfileIntoDB({
      ...normalizedFields,
      photos: photoUrls,
      raw_biodata_id: rawBiodataId,
      parsed_json: parsedJson
    });

    return {
      success: true,
      profileId: profileId
    };

  } catch (error) {
    console.error("Failed to save final profile:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ------------------------------------------------------------------
// Helper Functions
// ------------------------------------------------------------------

function validateFinalProfile(fields) {
  // 'gender' is often required for matchmaking logic, ensuring it's present
  const required = ['name', 'dob', 'gender', 'location_city'];
  const missing = required.filter(field => !fields[field] || (typeof fields[field] === 'string' && fields[field].trim() === ''));

  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
}

function normalizeFinalValues(fields) {
  // Clone to avoid mutation
  const normalized = { ...fields };

  // Example: Standardize Date of Birth to YYYY-MM-DD
  if (normalized.dob) {
    // Placeholder logic: assuming input might be various formats, standardizing to ISO date string
    // normalized.dob = new Date(normalized.dob).toISOString().split('T')[0];
  }

  // Example: Trim strings
  Object.keys(normalized).forEach(key => {
    if (typeof normalized[key] === 'string') {
      normalized[key] = normalized[key].trim();
    }
  });

  return normalized;
}

async function savePhotos(photos) {
  // Placeholder: Logic to upload photo files to storage bucket (S3/Supabase Storage)
  // Returns array of public URLs
  if (!photos || !Array.isArray(photos) || photos.length === 0) {
    return [];
  }

  console.log(`[Stub] Saving ${photos.length} photos...`);
  // Return mock URLs for now
  return photos.map((_, i) => `https://storage.example.com/profiles/photo_${i}.jpg`);
}

async function insertProfileIntoDB(data) {
  // Placeholder: Logic to insert record into 'mm_profiles' table
  
  const profileId = crypto.randomUUID();
  
  const record = {
    id: profileId,
    name: data.name,
    dob: data.dob,
    age: data.age,
    height: data.height,
    religion: data.religion,
    caste: data.caste,
    subcaste: data.subcaste,
    mother_tongue: data.mother_tongue,
    education: data.education,
    occupation: data.occupation,
    company: data.company,
    income: data.income,
    location_city: data.location_city,
    location_state: data.location_state,
    location_country: data.location_country,
    family_details: data.family_details,
    about: data.about,
    partner_preferences: data.partner_preferences,
    additional_notes: data.additional_notes,
    raw_biodata_id: data.raw_biodata_id,
    parsed_json: data.parsed_json, // Store original LLM output for audit
    photos: data.photos,
    status: "verified", // Mark as verified/active
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Example DB call:
  // await db('mm_profiles').insert(record);
  
  console.log("[System] Profile Saved to DB:", record.id);
  return profileId;
}

module.exports = {
  saveFinalProfile
};
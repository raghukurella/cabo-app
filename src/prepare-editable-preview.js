/**
 * prepare-editable-preview.js
 * Backend module to prepare parsed biodata for human review.
 * Identifies missing fields and structures the data for the UI.
 */

/**
 * Main function to prepare the editable preview object.
 * @param {Object} parsedData - The structured JSON object from the LLM parser.
 * @returns {Promise<{success: boolean, editableProfile: Object}>}
 */
async function prepareEditablePreview(parsedData) {
  try {
    if (!parsedData || typeof parsedData !== 'object') {
      throw new Error("Invalid parsed data provided.");
    }

    // 1. Identify missing fields
    const missingFields = findMissingFields(parsedData);

    // 2. Build metadata
    const metadata = buildMetadata();

    // 3. Construct the editable profile object
    const editableProfile = {
      fields: {
        name: parsedData.name || "",
        dob: parsedData.dob || "",
        age: parsedData.age || "",
        height: parsedData.height || "",
        religion: parsedData.religion || "",
        caste: parsedData.caste || "",
        subcaste: parsedData.subcaste || "",
        mother_tongue: parsedData.mother_tongue || "",
        education: parsedData.education || "",
        occupation: parsedData.occupation || "",
        company: parsedData.company || "",
        income: parsedData.income || "",
        location_city: parsedData.location_city || "",
        location_state: parsedData.location_state || "",
        location_country: parsedData.location_country || "",
        family_details: parsedData.family_details || "",
        about: parsedData.about || "",
        partner_preferences: parsedData.partner_preferences || "",
        additional_notes: parsedData.additional_notes || ""
      },
      missingFields: missingFields,
      lowConfidenceFields: [], // Placeholder for future confidence scoring logic
      metadata: metadata
    };

    return {
      success: true,
      editableProfile: editableProfile
    };

  } catch (error) {
    console.error("Failed to prepare editable preview:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ------------------------------------------------------------------
// Helper Functions
// ------------------------------------------------------------------

function findMissingFields(fields) {
  return Object.keys(fields).filter(key => {
    const value = fields[key];
    return value === null || value === undefined || (typeof value === 'string' && value.trim() === "");
  });
}

function buildMetadata() {
  return {
    timestamp: new Date().toISOString(),
    version: "draft",
    source: "llm_parsed"
  };
}

module.exports = {
  prepareEditablePreview
};
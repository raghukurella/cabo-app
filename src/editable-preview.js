/**
 * editable-preview.js
 * Frontend logic for the admin review screen.
 * Fetches parsed data, renders a form, and saves the final profile.
 */
import { supabase } from "./supabase.js";

const API_BASE = "/api"; // Adjust if your backend is hosted elsewhere

// Configuration for fields to ensure correct order and types
const FIELD_CONFIG = [
  { key: "name", label: "Full Name" },
  { key: "dob", label: "Date of Birth" },
  { key: "age", label: "Age" },
  { key: "height", label: "Height" },
  { key: "marital_status", label: "Marital Status", type: "select", options: ["Never Married", "Divorced", "Widowed", "Separated", "Annulled"] },
  { key: "religion", label: "Religion" },
  { key: "caste", label: "Caste" },
  { key: "subcaste", label: "Subcaste" },
  { key: "mother_tongue", label: "Mother Tongue" },
  { key: "education", label: "Education" },
  { key: "occupation", label: "Occupation" },
  { key: "company", label: "Company" },
  { key: "income", label: "Income" },
  { key: "location_city", label: "City" },
  { key: "location_state", label: "State" },
  { key: "location_country", label: "Country" },
  { key: "family_details", label: "Family Details", type: "textarea" },
  { key: "about", label: "About / Bio", type: "textarea" },
  { key: "partner_preferences", label: "Partner Preferences", type: "textarea" },
  { key: "additional_notes", label: "Additional Notes", type: "textarea" }
];

let currentIntakeId = null;
let originalData = null;

export async function init() {
  const params = new URLSearchParams(window.location.hash.split('?')[1]);
  currentIntakeId = params.get("intakeId");

  if (!currentIntakeId) {
    showError("Missing intakeId in URL.");
    return;
  }

  await loadEditablePreview(currentIntakeId);

  const form = document.getElementById("previewForm");
  if (form) {
    form.addEventListener("submit", handleSave);
  }
}

async function loadEditablePreview(intakeId) {
  const loadingEl = document.getElementById("loadingState");
  const formEl = document.getElementById("previewForm");

  try {
    // This now fetches the raw data and simulates the pipeline in the browser
    const data = await runClientSidePipeline(intakeId);
    if (!data) {
      throw new Error("Pipeline simulation failed.");
    }

    originalData = data;

    renderForm(data);

    loadingEl.classList.add("hidden");
    formEl.classList.remove("hidden");

  } catch (err) {
    console.error(err);
    showError(`Error: ${err.message}`);
    loadingEl.textContent = "Failed to load data.";
  }
}

function renderForm(profileData) {
  const container = document.getElementById("fieldsContainer");
  container.innerHTML = "";

  const fields = profileData.fields || {};
  const missing = profileData.missingFields || [];
  const lowConfidence = profileData.lowConfidenceFields || [];

  FIELD_CONFIG.forEach(config => {
    const value = fields[config.key] || "";
    const isMissing = missing.includes(config.key);
    const isLowConf = lowConfidence.includes(config.key);

    const wrapper = document.createElement("div");
    wrapper.className = config.type === "textarea" ? "col-span-1 md:col-span-2" : "col-span-1";

    // Label & Badges
    const labelRow = document.createElement("div");
    labelRow.className = "flex items-center gap-2 mb-1";
    
    const label = document.createElement("label");
    label.className = "block text-sm font-medium text-gray-700";
    label.textContent = config.label;
    labelRow.appendChild(label);

    if (isMissing) {
      const badge = document.createElement("span");
      badge.className = "px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800";
      badge.textContent = "Missing";
      labelRow.appendChild(badge);
    }
    if (isLowConf) {
      const badge = document.createElement("span");
      badge.className = "px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800";
      badge.textContent = "Check";
      labelRow.appendChild(badge);
    }
    wrapper.appendChild(labelRow);

    // Input Control
    let input;
    if (config.type === "textarea") {
      input = document.createElement("textarea");
      input.rows = 4;
      input.className = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none";
    } else if (config.type === "select") {
      input = document.createElement("select");
      input.className = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none";
      input.innerHTML = `<option value="">Select...</option>` + 
        config.options.map(opt => `<option value="${opt}">${opt}</option>`).join("");
    } else {
      input = document.createElement("input");
      input.type = "text";
      input.className = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none";
    }

    input.name = config.key;
    input.value = value;
    wrapper.appendChild(input);

    container.appendChild(wrapper);
  });
}

async function handleSave(e) {
  e.preventDefault();
  const btn = document.getElementById("saveFinalBtn");
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Saving...";

  const formData = new FormData(e.target);
  const fields = {};
  formData.forEach((value, key) => {
    fields[key] = value.trim();
  });

  // Preserve metadata from original load
  const payload = {
    intakeId: currentIntakeId,
    fields: fields,
    metadata: originalData?.metadata
  };

  try {
    // Placeholder POST
    console.log("Saving Final Profile:", payload);
    // await fetch(`${API_BASE}/final-profile/save`, { method: "POST", body: JSON.stringify(payload) ... });
    
    // Simulate success
    await new Promise(r => setTimeout(r, 800)); 
    alert("Profile saved successfully!");
    window.location.hash = "#/all-profiles"; // Redirect to list
  } catch (err) {
    console.error(err);
    alert("Failed to save profile.");
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

function showError(msg) {
  const el = document.getElementById("statusMessage");
  if (el) {
    el.textContent = msg;
    el.className = "text-sm font-medium text-red-600";
  }
}

/**
 * Simulates the backend pipeline (extract -> clean -> parse) using the real
 * raw data from the database. This is for testing without a live backend.
 */
async function runClientSidePipeline(intakeId) {
  // 1. Fetch the raw record from the database
  const { data: rawRecord, error } = await supabase
    .schema("cabo")
    .from("mj_raw_biodata")
    .select("raw_text, raw_file_url")
    .eq("id", intakeId)
    .single();

  if (error) throw new Error(`Failed to fetch raw data: ${error.message}`);

  // 2. Extract text (simple version)
  const extractedText = rawRecord.raw_text || ""; // File extraction not simulated here

  // 3. Clean text (simple version)
  const cleanedText = extractedText.replace(/\[.*?\]/g, "").replace(/Forwarded/gi, "").trim();

  // Location Parsing
  const rawLocation = (cleanedText.match(/(?:Location|Place|Residing at|Address):\s*(.*)/i) || [])[1] || "";
  let locCity = (cleanedText.match(/City:\s*(.*)/i) || [])[1] || "";

  if (!locCity && rawLocation) {
    locCity = rawLocation.split(',')[0].trim();
  }

  // 4. Parse text (simple regex simulation)
  const parsedData = {
    name: (cleanedText.match(/Name:\s*(.*)/i) || [])[1] || "",
    dob: (cleanedText.match(/(?:DOB|Date of Birth|Born):\s*(.*)/i) || [])[1] || "",
    age: (cleanedText.match(/Age:\s*(\d+)/i) || [])[1] || "",
    height: (cleanedText.match(/Height:\s*(.*)/i) || [])[1] || "",
    education: (cleanedText.match(/Education:\s*(.*)/i) || [])[1] || "",
    occupation: (cleanedText.match(/Job:\s*(.*)/i) || [])[1] || "",
    location_city: locCity,
    about: cleanedText, // For reference
  };

  // 5. Prepare the editable profile object
  const missingFields = Object.keys(parsedData).filter(key => !parsedData[key]);
  
  return {
    fields: parsedData,
    missingFields: missingFields,
    lowConfidenceFields: [],
    metadata: {
      source: "client-side-pipeline",
      intakeId: intakeId,
      timestamp: new Date().toISOString()
    }
  };
}
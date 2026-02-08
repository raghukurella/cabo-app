import { supabase } from "./supabase.js";

// Check localStorage for key to avoid hardcoding secrets during testing
const OPENAI_API_KEY = localStorage.getItem("OPENAI_API_KEY") || "";

// Configuration for fields to ensure correct order and types
const FIELD_CONFIG = [
  { key: "looking_for", label: "Looking for as suitable", type: "radio", options: ["Bride", "Groom"] },
  { key: "name", label: "Full Name" },
  { key: "dob", label: "Date of Birth", type: "date" },
  { key: "age", label: "Age", readonly: true },
  { key: "height", label: "Height" },
  { key: "marital_status", label: "Marital Status", type: "select", options: ["Never Married", "Divorced", "Widowed", "Separated", "Annulled"] },
  { key: "religion", label: "Religion" },
  { key: "caste", label: "Caste" },
  { key: "subcaste", label: "Subcaste" },
  { key: "mother_tongue", label: "Mother Tongue" },
  { key: "education", label: "Education", type: "textarea" },
  { key: "occupation", label: "Occupation" },
  { key: "company", label: "Company" },
  { key: "income", label: "Income" },
  { key: "location_city", label: "City" },
  { key: "location_state", label: "State" },
  { key: "location_country", label: "Country" },
  { key: "citizenship", label: "Immigration Status" },
  { key: "phone", label: "Contact Number" },
  { key: "family_details", label: "Family Details", type: "textarea" },
  { key: "bio", label: "About / Bio", type: "textarea" },
  { key: "partner_preferences", label: "Partner Preferences", type: "textarea" },
  { key: "additional_notes", label: "Additional Notes", type: "textarea" }
];

let currentIntakeId = null;
let originalData = null;

export function init() {
  console.log("process-biodata.js: init() called.");
  const parseBtn = document.getElementById("parseBtn");
  const reprocessBtn = document.getElementById("reprocessBtn");
  const clearBtn = document.getElementById("clearFormBtn");
  const form = document.getElementById("previewForm");

  if (parseBtn) {
    console.log("process-biodata.js: Found Parse button, attaching listener.");
    parseBtn.addEventListener("click", handleParse);
  } else {
    console.error("process-biodata.js: Could not find #parseBtn.");
  }

  if (reprocessBtn) {
    reprocessBtn.addEventListener("click", handleParse);
  }
  
  if (clearBtn) {
      clearBtn.addEventListener("click", () => {
          document.getElementById("fieldsContainer").innerHTML = '<div class="col-span-full text-center py-10 text-gray-500">Form cleared. Click "Parse Data" to try again.</div>';
          document.getElementById("previewForm").reset();
      });
  }

  if (form) form.addEventListener("submit", handleSave);
}

async function handleParse() {
  console.log("process-biodata.js: handleParse() started.");
  const btn = document.getElementById("parseBtn");
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Processing...";

  const rawText = document.getElementById("rawText").value.trim() || null;

  if (!rawText) {
    alert("Please provide text.");
    btn.disabled = false;
    btn.textContent = originalText;
    return;
  }

  try {
    // Step 1: Save raw data and get an ID
    console.log("process-biodata.js: Calling saveRawData...");
    const intakeId = await saveRawData({ rawText });
    currentIntakeId = intakeId;
    console.log("process-biodata.js: Got intakeId:", intakeId);

    // Step 2: Run client-side pipeline simulation
    console.log("process-biodata.js: Calling runClientSidePipeline...");
    const editableProfile = await runClientSidePipeline(intakeId);
    originalData = editableProfile;
    console.log("process-biodata.js: Pipeline returned profile:", editableProfile);

    // Step 3: Render the form and reveal it
    console.log("process-biodata.js: Rendering form...");
    renderForm(editableProfile);
    document.getElementById("reprocessBtn").classList.remove("hidden");
    document.getElementById("previewSection").classList.remove("hidden");
    console.log("process-biodata.js: Form rendered and revealed.");

  } catch (err) {
    console.error("Pipeline failed:", err);
    alert("Error processing biodata: " + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

async function saveRawData(data) {
  const { data: record, error: dbError } = await supabase
    .schema("cabo")
    .from("mj_raw_biodata")
    .insert({ raw_text: data.rawText, raw_file_url: null, source: "web_process", status: "pending" })
    .select()
    .single();

  if (dbError) throw dbError;
  console.log("Saved raw data to DB:", record);
  return record.id;
}

async function runClientSidePipeline(intakeId) {
  const { data: rawRecord, error } = await supabase
    .schema("cabo")
    .from("mj_raw_biodata")
    .select("raw_text, raw_file_url")
    .eq("id", intakeId)
    .single();

  if (error) throw new Error(`Failed to fetch raw data: ${error.message}`);

  // ---------------------------------------------------------
  // 🧠 LEARNING SIMULATION
  // Check if we have a training example for this exact text
  // ---------------------------------------------------------
  const { data: trainingMatch } = await supabase
    .schema("cabo")
    .from("mj_training_examples")
    .select("corrected_json")
    .eq("raw_text", rawRecord.raw_text) // In a real app, we'd use vector similarity
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (trainingMatch) {
    console.log("🧠 [Learning] Found training example! Using corrected data.");
    return preparePreviewObject(trainingMatch.corrected_json, intakeId, "training_example");
  }

  // Fallback to Regex if no training data found
  const extractedText = rawRecord.raw_text || "";
  
  let text = extractedText;

  // 1. Remove WhatsApp/Email headers & footers
  text = text.replace(/Forwarded message/gi, "");
  text = text.replace(/Forwarded/gi, "");
  text = text.replace(/^\[.*?\]\s*[\w\s]+:\s*/gm, ""); // [Time] Name: 
  text = text.replace(/\[.*?\]/g, ""); 
  text = text.replace(/Sent from my.*/gi, "");
  text = text.replace(/Get Outlook for.*/gi, "");

  // 2. Remove common intro/outro chatter
  const chatterLines = [
    /^(?:Hi|Hello|Hey|Dear)(?:\s+.*)?\s*[,!-]?\s*$/gim,
    /^Please find attached.*/gim,
    /^PFA.*/gim,
    /^Here is the (?:biodata|profile).*/gim,
    /^Sharing the (?:biodata|profile).*/gim,
    /^Let me know if.*/gim,
    /^Hope you are doing well.*/gim,
    /^Thanks,?/gim,
    /^Regards,?/gim,
    /^I would appreciate if you could.*/gim,
    /^Kindly check.*/gim,
    /^This is my (?:son|daughter|brother|sister|friend)'s profile.*/gim
  ];

  chatterLines.forEach(regex => {
    text = text.replace(regex, "");
  });

  const cleanedText = text.trim();

  // ---------------------------------------------------------
  // 🤖 LLM PARSING (OpenAI)
  // ---------------------------------------------------------
  try {
    // Try LLM parsing (Dev: Direct, Prod: Edge Function)
    const examples = await getFewShotExamples();
    const llmResult = await parseWithOpenAI(cleanedText, examples);
    
    if (llmResult) {
      return preparePreviewObject(llmResult, intakeId, "openai_llm");
    }
  } catch (err) {
    // If LLM fails or isn't configured, we silently fall back to Regex
    console.warn("LLM Parsing skipped/failed (falling back to Regex):", err.message);
    if (err.message.includes("CORS") || err.message.includes("Edge Function")) {
      alert("Warning: " + err.message + "\n\nFalling back to basic Regex parsing.");
    }
  }

  const rawDob = (cleanedText.match(/(?:DOB|Date of Birth|Born)\s*:\s*(.*)/i) || [])[1] || "";
  let formattedDob = rawDob;
  let calculatedAge = "";

  if (rawDob) {
    const cleanDob = rawDob.replace(/(\d+)(?:st|nd|rd|th)/ig, "$1");
    const d = new Date(cleanDob);
    if (!isNaN(d.getTime())) {
      formattedDob = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      const today = new Date();
      let age = today.getFullYear() - d.getFullYear();
      const m = today.getMonth() - d.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
        age--;
      }
      calculatedAge = age.toString();
    }
  }

  // Location Parsing
  const rawLocation = (cleanedText.match(/(?:Current\s*Location|Location|Place|Residing\s*at|Address|City)\s*:\s*(.*)/i) || [])[1] || "";
  let locCity = "";
  let locState = "";
  let locCountry = "";

  if (rawLocation) {
    const parts = rawLocation.split(',').map(s => s.trim());
    if (parts.length >= 3) {
      locCity = parts[0];
      locState = parts[1].replace(/\s+\d+.*$/, "").trim(); // Remove trailing zip
      locCountry = parts[2];
    } else if (parts.length === 2) {
      locCity = parts[0];
      locState = parts[1].replace(/\s+\d+.*$/, "").trim(); // Remove trailing zip
    } else {
      locCity = parts[0];
    }
  }

  // Looking For Parsing (Bride vs Groom)
  let lookingFor = "";
  // Signals that imply looking for a Groom
  if (/(?:looking\s+for|seeking|alliance\s+for|match\s+for).*(?:groom|boy|daughter|sister)/i.test(cleanedText)) {
    lookingFor = "Groom";
  }
  // Signals that imply looking for a Bride (overrides if specific keywords found)
  if (/(?:looking\s+for|seeking|alliance\s+for|match\s+for).*(?:bride|girl|son|brother)/i.test(cleanedText)) {
    lookingFor = "Bride";
  }

  // Family Details Parsing
  const familyDetailsArr = [];
  const addFamilyField = (label, regex) => {
    const match = cleanedText.match(regex);
    if (match && match[1]) {
      let val = match[1].trim();
      // Cleanup artifacts if generic regex caught a key
      val = val.replace(/^(Name|Occupation|Job)\s*:\s*/i, "");
      if (val) {
        familyDetailsArr.push(`${label}: ${val}`);
        return true;
      }
    }
    return false;
  };

  addFamilyField("Family Details", /(?:Family Details|Family Background)\s*:\s*(.*)/i);
  
  if (!addFamilyField("Father Name", /(?:Father Name|Father's Name)\s*:\s*(.*)/i)) {
    addFamilyField("Father Name", /Father\s*:\s*(.*)/i);
  }
  addFamilyField("Father Occupation", /(?:Father Occupation|Father's Occupation|Father Job)\s*:\s*(.*)/i);

  // Implicit Father Occupation (e.g. "Father retired banker")
  if (!familyDetailsArr.some(s => s.startsWith("Father Occupation"))) {
    const implicitFather = cleanedText.match(/Father(?:'s)?\s+(?!Name|:)(?:is\s+)?(?!Mr\.?|Sri\s)([^,;.\n]+)/i);
    if (implicitFather && !implicitFather[1].match(/\d+/)) {
       familyDetailsArr.push(`Father Occupation: ${implicitFather[1].trim()}`);
    }
  }

  if (!addFamilyField("Mother Name", /(?:Mother Name|Mother's Name)\s*:\s*(.*)/i)) {
    addFamilyField("Mother Name", /Mother\s*:\s*(.*)/i);
  }
  addFamilyField("Mother Occupation", /(?:Mother Occupation|Mother's Occupation|Mother Job)\s*:\s*(.*)/i);

  // Implicit Mother Occupation (e.g. "Mother homemaker")
  if (!familyDetailsArr.some(s => s.startsWith("Mother Occupation"))) {
    const implicitMother = cleanedText.match(/Mother(?:'s)?\s+(?!Name|:)(?:is\s+)?(?!Mrs\.?|Smt\.?|Ms\.?\s)([^,;.\n]+)/i);
    if (implicitMother && !implicitMother[1].match(/\d+/)) {
       familyDetailsArr.push(`Mother Occupation: ${implicitMother[1].trim()}`);
    }
  }

  if (!addFamilyField("Brother Name", /(?:Brother Name|Brother's Name)\s*:\s*(.*)/i)) {
    addFamilyField("Brother Name", /Brother\s*:\s*(.*)/i);
  }
  addFamilyField("Brother Occupation", /(?:Brother Occupation|Brother's Occupation|Brother Job)\s*:\s*(.*)/i);

  if (!addFamilyField("Sister Name", /(?:Sister Name|Sister's Name)\s*:\s*(.*)/i)) {
    addFamilyField("Sister Name", /Sister\s*:\s*(.*)/i);
  }
  addFamilyField("Sister Occupation", /(?:Sister Occupation|Sister's Occupation|Sister Job)\s*:\s*(.*)/i);

  addFamilyField("Family Location", /(?:Family residing in|Family residing at)\s*[:\-]?\s*(.*)/i);

  const familyDetailsStr = familyDetailsArr.join("\n");

  // Preferences Parsing
  const preferencesArr = [];
  const addPreference = (regex) => {
      const match = cleanedText.match(regex);
      if (match && match[1]) {
          preferencesArr.push(match[1].trim());
      }
  };
  addPreference(/(?:Looking\s+for)\s*[:\-]?\s*(.*)/i);
  addPreference(/(?:Dietary\s+preference)\s*[:\-]?\s*(.*)/i);
  addPreference(/(?:Partner\s+Preferences?)\s*[:\-]?\s*(.*)/i);
  const partnerPreferencesStr = preferencesArr.join("\n");

  // Contact & Status
  const phone = (cleanedText.match(/(?:Contact|Mobile|Phone)(?:\s*number)?\s*[:\-]?\s*([\d\-\+\(\)\s]+)/i) || [])[1] || "";
  let citizenship = (cleanedText.match(/(?:Status|Immigration\s*Status|Citizenship)\s*[:\-]?\s*(.*)/i) || [])[1] || "";

  // Normalize Citizenship
  if (citizenship && /^(USA|US|United States)$/i.test(citizenship.trim())) {
    citizenship = "US Citizen";
  }
  let income = (cleanedText.match(/(?:Income|Salary|Package|Ctc|Earnings|Pay|Remuneration)\s*[:\-]?\s*(.*)/i) || [])[1] || "";

  // NEW: Heuristic detection for unlabeled income (e.g. "100K", "25LPA")
  if (!income) {
    const moneyRegex = /\b(\d{1,3}(?:,\d{3})*|\d+)(?:\.\d+)?\s*(?:K|LPA|Lakhs?|Per Annum)\b/i;
    const match = cleanedText.match(moneyRegex);
    if (match) {
      income = match[0]; 
    }
  }

  // Helper for multi-line fields (Education, Occupation)
  const extractMultiLine = (keyPattern, separator = "; ") => {
    const stopWords = [
      "Name", "DOB", "Date", "Born", "Age", "Height", "Religion", "Caste", 
      "Subcaste", "Sub-caste", "Education", "Occupation", "Job", "Profession", "Work", 
      "Current", "Location", "Place", "Residing", "Address", "City", 
      "Family", "Father", "Mother", "Brother", "Sister",
      "Status", "Immigration", "Citizenship", "Looking", "Dietary", "Contact", "Company", "Income", "Salary", "Package", "Ctc"
    ];
    const stopPattern = `(?:${stopWords.join("|")})`;
    // Match key, optional separator (: ; -), capture content until next keyword or end
    const regex = new RegExp(`${keyPattern}\\s*[:;\\-]?\\s*([\\s\\S]*?)(?=\\n\\s*${stopPattern}|$)`, "i");
    const match = cleanedText.match(regex);
    return match ? match[1].trim().replace(/\r?\n/g, separator) : "";
  };

  const occupationStr = extractMultiLine("(?:Occupation|Job|Profession|Work(?:ing\\s+as)?)");
  let company = (cleanedText.match(/Company\s*:\s*(.*)/i) || [])[1] || "";
  let finalOccupation = occupationStr;

  // Extract embedded income from occupation if not explicitly found
  if (!income && occupationStr) {
    const match = occupationStr.match(/(?:making|earning|drawing)\s+([^\.,;]*\d+[^\.,;]*)/i);
    if (match) {
      income = match[1].trim();
    }
  }

  // Intelligent parsing for Company and Title in Occupation string
  // e.g. "Business Analyst in Gilead Sciences, Foster city CA"
  if (occupationStr && !company) {
    const splitRegex = /^(.*?)\s+(?:at|in|@|with)\s+(.*)$/i;
    const match = occupationStr.match(splitRegex);
    
    if (match) {
        finalOccupation = match[1].trim();
        const rest = match[2].trim();
        
        // Split by comma to separate Company from potential Location
        const parts = rest.split(',').map(s => s.trim());
        company = parts[0]; 
        
        // If there are more parts, check for location
        if (parts.length > 1 && !locCity) {
            const potentialLoc = parts.slice(1).join(", ");
            const cleanLoc = potentialLoc.replace(/\s+\d{5,}.*$/, ""); // Remove zip
            
            // Check for "City State" (e.g. "Foster City CA")
            const stateMatch = cleanLoc.match(/\b([A-Z]{2})\b/);
            if (stateMatch) {
                locState = stateMatch[1];
                locCity = cleanLoc.replace(stateMatch[0], "").trim();
            } else {
                locCity = cleanLoc;
            }
        }
    }
  }

  // Fallback: If no city found yet, try to extract from full occupation string
  if (!locCity && occupationStr && !company) {
    const inMatch = occupationStr.match(/\b(?:in|at)\s+([^,;]+)$/i);
    const commaParts = occupationStr.split(',');

    if (inMatch && inMatch[1].length < 30) {
       locCity = inMatch[1].trim();
    } else if (commaParts.length > 1) {
       const lastPart = commaParts[commaParts.length - 1].trim();
       if (lastPart.length < 30 && !/limited|pvt|ltd|inc|corp|llc/i.test(lastPart)) {
          locCity = lastPart;
       }
    }

    if (locCity) {
        locCity = locCity.replace(/\s+\d+.*$/, "").trim(); // Remove zip
        // Check for "City State" (e.g. "Foster City CA")
        const stateMatch = locCity.match(/^(.*)\s+([A-Z]{2})$/);
        if (stateMatch) {
            locCity = stateMatch[1].trim();
            if (!locState) locState = stateMatch[2];
        }
    }
  }

  const parsedData = {
    looking_for: lookingFor,
    name: (cleanedText.match(/Name\s*:\s*(.*)/i) || [])[1] || "",
    dob: formattedDob,
    age: calculatedAge || (cleanedText.match(/Age\s*:\s*(\d+)/i) || [])[1] || "",
    height: (cleanedText.match(/Height\s*:\s*(.*)/i) || [])[1] || "",
    religion: (cleanedText.match(/Religion\s*:\s*(.*)/i) || [])[1] || "",
    caste: (cleanedText.match(/Caste\s*:\s*(.*)/i) || [])[1] || "",
    subcaste: (cleanedText.match(/(?:Subcaste|Sub-caste)\s*:\s*(.*)/i) || [])[1] || "",
    education: extractMultiLine("(?:Education|Qualification)", "\n"),
    occupation: finalOccupation,
    company: company,
    income: income.trim(),
    location_city: locCity,
    location_state: locState,
    location_country: locCountry,
    citizenship: citizenship.trim(),
    phone: phone.trim(),
    family_details: familyDetailsStr,
    partner_preferences: partnerPreferencesStr,
    bio: cleanedText,
  };

  return preparePreviewObject(parsedData, intakeId, "client-side-regex");
}

function preparePreviewObject(data, intakeId, source) {
  const missingFields = Object.keys(data).filter(key => !data[key]);
  
  return {
    fields: data,
    missingFields: missingFields,
    lowConfidenceFields: [],
    metadata: { source: source, intakeId: intakeId, timestamp: new Date().toISOString() }
  };
}

function renderForm(profileData) {
  const container = document.getElementById("fieldsContainer");
  container.innerHTML = "";

  const fields = profileData.fields || {};
  const missing = profileData.missingFields || [];

  FIELD_CONFIG.forEach(config => {
    const value = fields[config.key] || "";
    const isMissing = missing.includes(config.key);

    let borderClass = "border-gray-300";

    const wrapper = document.createElement("div");
    wrapper.className = config.type === "textarea" ? "col-span-1 md:col-span-2" : "col-span-1";

    const labelRow = document.createElement("div");
    labelRow.className = "flex items-center gap-2 mb-1";
    const label = document.createElement("label");
    label.className = "block text-sm font-medium text-gray-700";
    label.textContent = config.label;
    labelRow.appendChild(label);

    let badge = null;
    if (isMissing) {
      badge = document.createElement("span");
      badge.className = "px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800";
      badge.textContent = "Missing";
      labelRow.appendChild(badge);
    }

    wrapper.appendChild(labelRow);

    let input;
    if (config.type === "textarea") {
      input = document.createElement("textarea");
      input.rows = 4;
      input.className = `w-full border ${borderClass} rounded-lg px-3 py-2 text-sm`;
    } else if (config.type === "select") {
      input = document.createElement("select");
      input.className = `w-full border ${borderClass} rounded-lg px-3 py-2 text-sm bg-white`;
      input.innerHTML = `<option value="">Select...</option>` + 
        (config.options || []).map(opt => `<option value="${opt}">${opt}</option>`).join("");
    } else if (config.type === "radio") {
      input = document.createElement("div");
      input.className = "flex gap-4 mt-2";
      (config.options || []).forEach(opt => {
        const label = document.createElement("label");
        label.className = "inline-flex items-center cursor-pointer";
        
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = config.key;
        radio.value = opt;
        if (value === opt) radio.checked = true;
        radio.className = "form-radio h-4 w-4 text-blue-600";
        
        const span = document.createElement("span");
        span.className = "ml-2 text-sm text-gray-700";
        span.textContent = opt;
        
        label.appendChild(radio);
        label.appendChild(span);
        input.appendChild(label);
      });
    } else {
      input = document.createElement("input");
      input.type = config.type || "text";
      input.className = `w-full border ${borderClass} rounded-lg px-3 py-2 text-sm`;

      if (config.readonly) {
        input.readOnly = true;
        input.classList.add("bg-gray-100", "text-gray-500", "cursor-not-allowed");
      }
    }

    input.name = config.key;
    input.value = value;

    // Auto-calculate Age when DOB changes
    if (config.key === "dob") {
      input.addEventListener("change", (e) => {
        const val = e.target.value;
        const ageInput = container.querySelector('input[name="age"]');
        if (ageInput && val) {
          const d = new Date(val);
          if (!isNaN(d.getTime())) {
            const today = new Date();
            let age = today.getFullYear() - d.getFullYear();
            const m = today.getMonth() - d.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
              age--;
            }
            ageInput.value = age;
          }
        }
      });
    }

    // Remove "Missing" badge on interaction
    if (badge) {
      const removeBadge = () => {
        if (badge) {
          badge.remove();
          badge = null;
        }
      };
      
      if (config.type === "radio") {
        input.addEventListener("change", removeBadge);
      } else {
        input.addEventListener("input", removeBadge);
        input.addEventListener("change", removeBadge);
      }
    }

    wrapper.appendChild(input);

    container.appendChild(wrapper);
  });
}

async function handleSave(e) {
  e.preventDefault();
  const btn = e.submitter || document.querySelector("button[type='submit']");
  const originalText = btn ? btn.textContent : "Save";
  if (btn) { btn.disabled = true; btn.textContent = "Saving..."; }

  try {
    // 1. Capture the Corrected Data from the Form
    const formData = new FormData(e.target);
    const correctedFields = {};
    formData.forEach((value, key) => {
      correctedFields[key] = value.trim();
    });

    // Validation: Name and Gender (Looking for) are required
    if (!correctedFields.name) throw new Error("Full Name is required.");
    if (!correctedFields.looking_for) throw new Error("'Looking for' (Gender) is required.");

    // 2. Get the Original Raw Text
    const rawText = document.getElementById("rawText").value;

    // 3. Save to Training Table (The "Learning" Step)
    if (rawText) {
      const { error: trainingError } = await supabase
        .schema("cabo")
        .from("mj_training_examples")
        .insert({
          raw_text: rawText,
          corrected_json: correctedFields,
          source: "manual_correction"
        });
      if (trainingError) console.warn("Failed to save training data:", trainingError);
    }

    // 3b. Prepare Payload for DB (Map fields to schema)
    const dbPayload = { ...correctedFields };

    // Map 'name' -> 'first_name', 'last_name'
    if (dbPayload.name) {
      const parts = dbPayload.name.trim().split(/\s+/);
      dbPayload.first_name = parts[0];
      dbPayload.last_name = parts.slice(1).join(" ") || "";
      delete dbPayload.name;
    }

    // Map 'dob' -> 'datetime_of_birth'
    if (dbPayload.dob) {
      dbPayload.datetime_of_birth = dbPayload.dob;
      delete dbPayload.dob;
    }

    // Map 'phone' -> 'phone_number'
    if (dbPayload.phone) {
      dbPayload.phone_number = dbPayload.phone;
      delete dbPayload.phone;
    }

    // Map 'looking_for' -> 'gender'
    if (dbPayload.looking_for) {
      if (dbPayload.looking_for === "Groom") dbPayload.gender = "Female"; // Looking for Groom = Bride (Female)
      if (dbPayload.looking_for === "Bride") dbPayload.gender = "Male";   // Looking for Bride = Groom (Male)
    }

    // Map location fields -> 'current_location'
    const locParts = [dbPayload.location_city, dbPayload.location_state, dbPayload.location_country].filter(Boolean);
    if (locParts.length > 0 && !dbPayload.current_location) {
      dbPayload.current_location = locParts.join(", ");
    }
    delete dbPayload.location_city;
    delete dbPayload.location_state;
    delete dbPayload.location_country;

    // Remove UI-only fields
    delete dbPayload.age;
    delete dbPayload.looking_for;

    // 4. Save to Main Profiles Table (The "Production" Step)
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

// ---------------------------------------------------------
// 🧠 LLM Helper Functions
// ---------------------------------------------------------

async function getFewShotExamples() {
  // Fetch the 3 most recent human-corrected examples to use as context
  const { data } = await supabase
    .schema("cabo")
    .from("mj_training_examples")
    .select("raw_text, corrected_json")
    .order("created_at", { ascending: false })
    .limit(3);
  return data || [];
}

async function parseWithOpenAI(text, examples) {
  // 1. PROD MODE: If no local key, try Supabase Edge Function
  // This allows anonymous users to parse without exposing the key.
  if (!OPENAI_API_KEY) {
    console.log("🤖 Prod Mode: Calling Supabase Edge Function 'parse-biodata-py'...");
    const { data, error } = await supabase.functions.invoke('parse-biodata-py', {
      body: { text, examples }
    });

    if (error) {
      // Detect common CORS/Network failure
      if (error.message === "Failed to fetch") {
        throw new Error("Edge Function Network Error. This is likely a CORS issue. Ensure your Edge Function handles 'OPTIONS' requests.");
      }
      throw new Error(`Edge Function call failed: ${error.message}`);
    }
    return data;
  }

  // 2. DEV MODE: Direct Client-Side Call
  console.log("🤖 Dev Mode: Calling OpenAI directly with local key...");

  const systemPrompt = `You are an expert data extraction assistant for matrimonial biodata. 
  Extract the following fields from the text into a flat JSON object:
  - name
  - dob (Format: YYYY-MM-DD)
  - age (Calculate if DOB is present)
  - height
  - religion
  - caste
  - subcaste
  - mother_tongue
  - education
  - occupation
  - company
  - income
  - location_city
  - location_state
  - location_country
  - citizenship
  - phone
  - family_details (Summarize family info)
  - bio (The full text or a summary)
  - partner_preferences
  - marital_status
  - looking_for (Value must be "Bride" or "Groom" based on context)
  
  If a field is not found, use an empty string "". Return ONLY valid JSON.`;

  const messages = [{ role: "system", content: systemPrompt }];

  // Add few-shot examples
  examples.forEach(ex => {
    messages.push({ role: "user", content: ex.raw_text });
    messages.push({ role: "assistant", content: JSON.stringify(ex.corrected_json) });
  });

  // Add current input
  messages.push({ role: "user", content: text });

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo", 
      messages: messages,
      temperature: 0
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  
  let content = data.choices[0].message.content;
  // Clean up markdown if present
  content = content.replace(/```json/g, "").replace(/```/g, "").trim();
  
  return JSON.parse(content);
}
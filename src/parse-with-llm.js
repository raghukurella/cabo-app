/**
 * parse-with-llm.js
 * Backend module to parse cleaned biodata text into structured JSON using an LLM.
 * Does NOT perform cleaning, validation, or database storage.
 */

/**
 * Main function to parse cleaned text.
 * @param {string} cleanedText - The cleaned text from the previous step.
 * @param {Array} trainingExamples - Optional array of { raw_text, corrected_json } objects.
 * @returns {Promise<{success: boolean, parsedData: Object}>}
 */
async function parseCleanedText(cleanedText, trainingExamples = []) {
  try {
    if (!cleanedText || typeof cleanedText !== 'string' || cleanedText.trim().length === 0) {
      throw new Error("Input text is empty or invalid.");
    }

    // 1. Build the prompt
    const prompt = buildPrompt(cleanedText, trainingExamples);

    // 2. Call the LLM (Placeholder)
    const llmResponse = await callLLM(prompt);

    // 3. Parse the JSON response
    let parsedData;
    try {
      // Attempt to clean markdown code blocks if present (common LLM behavior)
      // e.g. ```json { ... } ```
      const jsonString = llmResponse.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedData = JSON.parse(jsonString);
    } catch (e) {
      throw new Error("LLM returned invalid JSON: " + llmResponse);
    }

    return {
      success: true,
      parsedData: parsedData
    };

  } catch (error) {
    console.error("LLM parsing failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ------------------------------------------------------------------
// Helper Functions
// ------------------------------------------------------------------

function buildPrompt(text, examples) {
  let examplesSection = "";
  if (examples && examples.length > 0) {
    examplesSection = "Here are examples of how to correctly extract data from similar text:\n\n";
    examples.forEach((ex, i) => {
      examplesSection += `EXAMPLE ${i+1}:\nInput:\n${ex.raw_text}\nOutput:\n${JSON.stringify(ex.corrected_json)}\n\n`;
    });
  }

  return `
You are a precise data extraction assistant for matrimonial biodata.
Your task is to extract structured information from the provided text into a strict JSON format.

RULES:
1. Extract ONLY information explicitly present in the text. Do not infer or hallucinate.
2. If a field is not found, set it to an empty string "".
3. Normalize values where possible (e.g., convert "5ft 4in" to "5'4"", standardize dates to YYYY-MM-DD if possible).
4. Return ONLY the raw JSON object. Do not include markdown formatting or explanation.

SCHEMA:
{
  "name": "",
  "dob": "",
  "age": "",
  "height": "",
  "religion": "",
  "caste": "",
  "subcaste": "",
  "mother_tongue": "",
  "education": "",
  "occupation": "",
  "company": "",
  "income": "",
  "marital_status": "",
  "location_city": "",
  "location_state": "",
  "location_country": "",
  "family_details": "",
  "about": "",
  "partner_preferences": "",
  "additional_notes": ""
}

${examplesSection}
INPUT TEXT:
"""
${text}
"""
`;
}

async function callLLM(prompt) {
  console.log(`[Stub] Calling LLM with prompt length: ${prompt.length}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Return mock JSON response for testing
  return JSON.stringify({
    name: "Jane Doe",
    dob: "1995-05-15",
    age: "28",
    height: "5'4\"",
    religion: "Hindu",
    caste: "Brahmin",
    subcaste: "",
    mother_tongue: "English",
    education: "Masters in Computer Science",
    occupation: "Software Engineer"
  }, null, 2);
}

module.exports = {
  parseCleanedText
};
/**
 * run-intake-pipeline.js
 * Backend module to orchestrate the biodata intake pipeline.
 * Chains: Extract -> Clean -> Parse -> Prepare Preview.
 */

const { extractTextFromRawInput } = require('./extract-text.js');
const { cleanExtractedText } = require('./clean-text.js');
const { parseCleanedText } = require('./parse-with-llm.js');
const { prepareEditablePreview } = require('./prepare-editable-preview.js');

/**
 * Main orchestrator function.
 * @param {string} intakeId - The ID of the raw intake record.
 * @returns {Promise<{success: boolean, intakeId: string, editableProfile: Object}>}
 */
async function runIntakePipeline(intakeId) {
  try {
    if (!intakeId) throw new Error("Missing intakeId.");

    // 1. Fetch Raw Record
    const rawRecord = await getRawRecord(intakeId);
    if (!rawRecord) throw new Error(`Intake record not found: ${intakeId}`);
    await savePipelineLog(intakeId, "FETCH_RAW", { found: true });

    // 2. Extract Text
    const extractionResult = await extractTextFromRawInput(rawRecord);
    if (!extractionResult.success) {
      throw new Error(`Extraction failed: ${extractionResult.error}`);
    }
    await savePipelineLog(intakeId, "EXTRACT", { textLength: extractionResult.extractedText.length });

    // 3. Clean Text
    const cleaningResult = await cleanExtractedText(extractionResult.extractedText);
    if (!cleaningResult.success) {
      throw new Error(`Cleaning failed: ${cleaningResult.error}`);
    }
    await savePipelineLog(intakeId, "CLEAN", { textLength: cleaningResult.cleanedText.length });

    // 3b. Fetch Training Examples (Few-Shot Learning)
    const trainingExamples = await getTrainingExamples();

    // 4. Parse with LLM
    const parsingResult = await parseCleanedText(cleaningResult.cleanedText, trainingExamples);
    if (!parsingResult.success) {
      throw new Error(`Parsing failed: ${parsingResult.error}`);
    }
    await savePipelineLog(intakeId, "PARSE", { fieldsFound: Object.keys(parsingResult.parsedData).length });

    // 5. Prepare Editable Preview
    const previewResult = await prepareEditablePreview(parsingResult.parsedData);
    if (!previewResult.success) {
      throw new Error(`Preview preparation failed: ${previewResult.error}`);
    }
    
    // Attach the rawBiodataId to metadata for traceability
    previewResult.editableProfile.metadata.rawBiodataId = intakeId;
    
    await savePipelineLog(intakeId, "PREPARE_PREVIEW", { success: true });

    return {
      success: true,
      intakeId: intakeId,
      editableProfile: previewResult.editableProfile
    };

  } catch (error) {
    console.error(`Pipeline failed for intake ${intakeId}:`, error.message);
    
    // Determine stage based on error message or context if possible, 
    // otherwise default to "ORCHESTRATION"
    let stage = "ORCHESTRATION";
    if (error.message.includes("Extraction")) stage = "EXTRACT";
    else if (error.message.includes("Cleaning")) stage = "CLEAN";
    else if (error.message.includes("Parsing")) stage = "PARSE";
    else if (error.message.includes("Preview")) stage = "PREPARE_PREVIEW";

    await savePipelineLog(intakeId, "ERROR", { error: error.message, stage });

    return {
      success: false,
      error: error.message,
      stage: stage
    };
  }
}

// ------------------------------------------------------------------
// Helper Functions (Placeholders)
// ------------------------------------------------------------------

async function getRawRecord(intakeId) {
  console.log(`[Stub] Fetching raw record for ID: ${intakeId}`);
  // Example return:
  return {
    id: intakeId,
    raw_text: "Sample raw text from DB placeholder.",
    raw_file_url: null
  };
}

async function getTrainingExamples() {
  console.log(`[Stub] Fetching recent training examples...`);
  // Example DB call:
  // return await db('mj_training_examples').select('raw_text', 'corrected_json').orderBy('created_at', 'desc').limit(3);
  return [];
}

async function savePipelineLog(intakeId, stage, data) {
  console.log(`[Pipeline Log] ID: ${intakeId} | Stage: ${stage}`, data);
  // Example DB call:
  // await db('pipeline_logs').insert({ intake_id: intakeId, stage, data, created_at: new Date() });
}

module.exports = {
  runIntakePipeline
};
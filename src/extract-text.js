/**
 * extract-text.js
 * Backend module to extract raw text from input records (text or files).
 * Does NOT perform cleaning or parsing.
 */

/**
 * Main dispatcher function to extract text.
 * @param {Object} rawRecord - Object containing { raw_text, raw_file_url }
 * @returns {Promise<{success: boolean, extractedText: string}>}
 */
async function extractTextFromRawInput(rawRecord) {
  try {
    // 1. Priority: Return raw text if it exists (e.g. pasted from WhatsApp)
    if (rawRecord.raw_text && typeof rawRecord.raw_text === 'string' && rawRecord.raw_text.trim().length > 0) {
      return {
        success: true,
        extractedText: rawRecord.raw_text
      };
    }

    // 2. Handle file input if text is missing
    if (rawRecord.raw_file_url) {
      const fileUrl = rawRecord.raw_file_url;
      const extension = getFileExtension(fileUrl).toLowerCase();
      let extractedText = "";

      if (extension === 'pdf') {
        extractedText = await extractTextFromPDF(fileUrl);
      } else if (['doc', 'docx'].includes(extension)) {
        extractedText = await extractTextFromDoc(fileUrl);
      } else if (['jpg', 'jpeg', 'png'].includes(extension)) {
        extractedText = await runOCR(fileUrl);
      } else {
        throw new Error(`Unsupported file type: .${extension}`);
      }

      return {
        success: true,
        extractedText: extractedText || ""
      };
    }

    throw new Error("No valid text or file found in record.");

  } catch (error) {
    console.error("Text extraction failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ------------------------------------------------------------------
// Helper Functions
// ------------------------------------------------------------------

function getFileExtension(urlOrPath) {
  // Simple extension extraction handling query params if present
  return urlOrPath.split('.').pop().split('?')[0]; 
}

// ------------------------------------------------------------------
// Extraction Stubs (Placeholders)
// ------------------------------------------------------------------

async function extractTextFromPDF(fileUrl) {
  console.log(`[Stub] Extracting text from PDF: ${fileUrl}`);
  return "Raw text extracted from PDF placeholder.";
}

async function extractTextFromDoc(fileUrl) {
  console.log(`[Stub] Extracting text from Word Doc: ${fileUrl}`);
  return "Raw text extracted from Word document placeholder.";
}

async function runOCR(fileUrl) {
  console.log(`[Stub] Running OCR on image: ${fileUrl}`);
  return "Raw text extracted via OCR placeholder.";
}

module.exports = {
  extractTextFromRawInput
};
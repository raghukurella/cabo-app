const express = require('express');
const multer = require('multer');
const crypto = require('crypto');

const router = express.Router();

// Configure multer to handle file uploads (using temporary storage)
const upload = multer({ dest: 'temp_uploads/' });

/**
 * POST /api/raw-biodata
 * Receives raw text or file input for biodata intake.
 */
router.post('/raw-biodata', upload.single('rawFile'), async (req, res) => {
  try {
    const rawText = req.body.rawText;
    const rawFile = req.file;

    // 1. Validate Input
    validateInput(rawText, rawFile);

    // 2. Save File (if provided)
    let rawFileUrl = null;
    if (rawFile) {
      rawFileUrl = await saveUploadedFile(rawFile);
    }

    // 3. Create Database Record
    const newRecord = await createIntakeRecord({
      rawText: rawText || null,
      rawFileUrl: rawFileUrl
    });

    // 4. Return Success Response
    res.status(201).json({
      success: true,
      intakeId: newRecord.id
    });

  } catch (err) {
    console.error("Error processing raw biodata:", err.message);
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

// ------------------------------------------------------------------
// Helper Functions
// ------------------------------------------------------------------

function validateInput(text, file) {
  const hasText = text && typeof text === 'string' && text.trim().length > 0;
  const hasFile = file && typeof file === 'object';

  if (!hasText && !hasFile) {
    throw new Error("Invalid input: You must provide either 'rawText' or 'rawFile'.");
  }
}

async function saveUploadedFile(file) {
  // Placeholder: Logic to upload file to S3, Supabase Storage, or local disk
  // Returns the permanent URL or path to the file
  
  const filename = `${Date.now()}_${file.originalname}`;
  const storagePath = `uploads/biodata/${filename}`;
  
  console.log(`[System] File uploaded to storage: ${storagePath}`);
  
  // Return mock URL
  return `https://storage.example.com/${storagePath}`;
}

async function createIntakeRecord({ rawText, rawFileUrl }) {
  // Placeholder: Logic to insert record into 'raw_biodata_intake' table
  
  const record = {
    id: crypto.randomUUID(),
    raw_text: rawText,
    raw_file_url: rawFileUrl,
    source: "whatsapp_manual_upload",
    created_at: new Date().toISOString()
  };

  // Example DB call:
  // await db('raw_biodata_intake').insert(record);
  
  console.log("[System] DB Record Created:", record);
  return record;
}

module.exports = router;
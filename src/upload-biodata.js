import { supabase } from "./supabase.js";

export function init() {
  const form = document.getElementById("biodataForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    
    const rawText = document.getElementById("rawText").value.trim() || null;
    const fileInput = document.getElementById("rawFile");
    const rawFile = fileInput.files.length > 0 ? fileInput.files[0] : null;

    if (!rawText && !rawFile) {
      alert("Please provide either text or a file.");
      return;
    }

    handleRawBiodataSubmit({
      rawText,
      rawFile
    });
  });
}

async function handleRawBiodataSubmit(data) {
  const btn = document.querySelector("#biodataForm button[type='submit']");
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Processing...";
  btn.textContent = "Saving...";

  try {
    console.log("Raw Biodata Submitted:", data);
    
    let rawFileUrl = null;

    // 1. Upload File (if present)
    if (data.rawFile) {
      const file = data.rawFile;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // Attempt upload to 'biodata_uploads' bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('biodata_uploads')
        .upload(fileName, file);

      if (uploadError) {
        console.warn("File upload failed (bucket 'biodata_uploads' might be missing):", uploadError);
      } else {
        const { data: urlData } = supabase.storage
          .from('biodata_uploads')
          .getPublicUrl(fileName);
        rawFileUrl = urlData.publicUrl;
      }
    }

    // 2. Insert into DB
    const { data: record, error: dbError } = await supabase
      .schema("cabo")
      .from("mj_raw_biodata")
      .insert({
        raw_text: data.rawText,
        raw_file_url: rawFileUrl,
        source: "web_upload",
        status: "pending"
      })
      .select()
      .single();

    if (dbError) throw dbError;

    console.log("Saved to DB:", record);

    // 3. Redirect
    window.location.hash = `#/editable-preview?intakeId=${record.id}`;

  } catch (err) {
    console.error(err);
    alert("Error processing biodata");
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

function extract(text, regex) {
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}
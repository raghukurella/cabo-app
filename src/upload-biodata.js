export function init() {
  const form = document.getElementById("biodataForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const textInput = document.getElementById("rawText");
      const fileInput = document.getElementById("rawFile");
      
      let text = textInput.value.trim();

      if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        if (file.type === "text/plain") {
          text = await file.text();
        } else {
          alert("For PDF or Word documents, please copy and paste the text into the box for best results.");
          return;
        }
      }

      sessionStorage.setItem("pendingBiodata", text);
      window.location.hash = "#/process-biodata";
    });
  }
}
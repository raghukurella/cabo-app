// js/profile-render.js

export function renderFullProfile(profile, questions, answers, containerId = "profileContainer") {
  const container = document.getElementById(containerId);
  if (!container) return;

  const answerMap = {};
  answers.forEach(a => {
    answerMap[a.question_id] = a.answer_text;
  });

  const age = computeAge(profile.datetime_of_birth);

  container.innerHTML = `
    <h1 class="text-2xl font-semibold mb-4" align="center">
      ${profile.first_name} ${profile.last_name}
      (${age !== null ? age + " yrs" : "Age N/A"})
    </h1>

    <table class="w-full border border-gray-300 rounded-lg shadow-sm">
      <tbody>
        <tr class="no-print"><td class="border px-4 py-2 font-medium">Email</td><td class="border px-4 py-2">${profile.email ?? "-"}</td></tr>
        <tr class="no-print"><td class="border px-4 py-2 font-medium">Phone</td><td class="border px-4 py-2">${profile.phone_number ?? "-"}</td></tr>
        <tr><td class="border px-4 py-2 font-medium">Date of Birth</td><td class="border px-4 py-2">${formatDateTime(profile.datetime_of_birth)}</td></tr>
        <tr><td class="border px-4 py-2 font-medium">Place of Birth</td><td class="border px-4 py-2">${profile.place_of_birth ?? "-"}</td></tr>
        <tr><td class="border px-4 py-2 font-medium">Location</td><td class="border px-4 py-2">${profile.current_location ?? "-"}</td></tr>
        <tr><td class="border px-4 py-2 font-medium">Country of Citizenship</td><td class="border px-4 py-2">${profile.citizenship ?? "-"}</td></tr>
        <tr><td class="border px-4 py-2 font-medium">Gender</td><td class="border px-4 py-2">${profile.gender ?? "-"}</td></tr>
        <tr><td class="border px-4 py-2 font-medium">Height</td><td class="border px-4 py-2">${profile.height ?? ""}</td></tr>
        <tr><td class="border px-4 py-2 font-medium">Willing to Relocate</td><td class="border px-4 py-2">${profile.willing_to_relocate ? "Yes" : "No"}</td></tr>
        <tr><td class="border px-4 py-2 font-medium">Bio</td><td class="border px-4 py-2">${profile.bio ?? "-"}</td></tr>
        ${questions.map(q => `<tr><td class="border px-4 py-2 font-medium w-1/3">${q.question_text}</td><td class="border px-4 py-2">${answerMap[q.id] ?? "<em>No answer provided</em>"}</td></tr>`).join("")}
      </tbody>
    </table>

    <!-- Photos Grid (Default hidden in print) -->
    <div id="profilePhotosPrint" class="mt-6 no-print">
      <h2 class="text-xl font-semibold text-gray-800 mb-4">Photos</h2>
      <div class="grid grid-cols-2 gap-4">
        ${renderPhotos(profile.photos)}
      </div>
    </div>

    <p>&nbsp;</p>
  `;

  container.classList.remove("hidden");
}

// --- helpers copied from profile-view.js ---
function formatDateTime(isoString) {
  if (!isoString) return "-";
  const date = new Date(isoString);

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${yyyy}-${mm}-${dd} ${hours}:${minutes} ${ampm}`;
}

function computeAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age + 1;
}

function renderPhotos(item) {
  if (!item) return "";
  let list = [];
  try {
    list = typeof item === "string" ? JSON.parse(item) : item;
  } catch (e) {
    return "";
  }
  if (!Array.isArray(list)) return "";

  // Filter out nulls/empties
  list = list.filter(url => url && typeof url === "string" && url.length > 5);

  if (list.length === 0) return "<p class='text-gray-500 italic'>No photos available.</p>";

  return list.map(url => `
    <div class="border rounded-lg overflow-hidden shadow-sm">
      <img src="${url}" class="w-full h-48 object-cover" alt="Profile Photo" />
    </div>
  `).join("");
}
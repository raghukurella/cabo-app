// profile-view.js

<<<<<<< HEAD
export function profile_init(profileId) {
=======
export function init(profileId) {
>>>>>>> 395a2b24282c41074751c7b4f784c86c889cefa7
  requestAnimationFrame(() => {
    initProfileView(profileId);
  });
}

function initProfileView(profileId) {
  const container = document.getElementById("profileContainer");
  const qaContainer = document.getElementById("qaContainer");
  const editBtn = document.getElementById("editBtn");
  const printBtn = document.getElementById("printBtn");

  if (!container) {
    console.error("profileContainer not found in DOM");
    return;
  }

  if (!profileId) {
    container.textContent = "Invalid profile.";
    container.classList.remove("hidden");
    return;
  }

  loadProfile(profileId);
  
  // ------------------------------------------------------------
  // LOAD PROFILE (read-only)
  // ------------------------------------------------------------
  async function loadProfile(profileId) {
    const { data: profile, error } = await window.supabase
      .schema("cabo")
      .from("mm_people")
      .select("*")
      .eq("id", profileId)
      .maybeSingle();

    if (error || !profile) {
      console.error("Supabase profile error:", error);
      container.textContent = "Profile not found.";
      container.classList.remove("hidden");
      return;
    }

    const age = computeAge(profile.datetime_of_birth);

    const { data: questions, error: qErr } = await window.supabase
      .schema("cabo")
      .from("mm_questions")
      .select("*")
      .order("sort_order", { ascending: true });

    if (qErr) {
      console.error("Supabase questions error:", qErr);
      qaContainer.textContent = "Error loading questions.";
      qaContainer.classList.remove("hidden");
      return;
    }

    const { data: answers, error: aErr } = await window.supabase
      .schema("cabo")
      .from("mm_answers")
      .select("*")
      .eq("person_id", profileId);

    if (aErr) {
      console.error("Supabase answers error:", aErr);
      qaContainer.textContent = "Error loading answers.";
      qaContainer.classList.remove("hidden");
      return;
    }

    const answerMap = {};
    answers.forEach(a => {
      answerMap[a.question_id] = a.answer_text;
    });

    container.innerHTML = `
      <h1 class="text-2xl font-semibold mb-4" align="center">
      ${profile.first_name} ${profile.last_name}
      (${age !== null ? age + " yrs" : "Age N/A"})
      </h1>
      <table class="w-full border border-gray-300 rounded-lg shadow-sm">
        <tbody>
          <tr><td class="border px-4 py-2 font-medium">Email</td><td class="border px-4 py-2">${profile.email ?? "-"}</td></tr>
          <tr><td class="border px-4 py-2 font-medium">Phone</td><td class="border px-4 py-2">${profile.phone_number ?? "-"}</td></tr>
          
<tr>
  <td class="border px-4 py-2 font-medium">Date of Birth</td>
  <td class="border px-4 py-2">${formatDateTime(profile.datetime_of_birth)}</td>
</tr>

          <tr><td class="border px-4 py-2 font-medium">Place of Birth</td><td class="border px-4 py-2">${profile.place_of_birth ?? "-"}</td></tr>
          <tr><td class="border px-4 py-2 font-medium">Location</td><td class="border px-4 py-2">${profile.current_location ?? "-"}</td></tr>
          <tr><td class="border px-4 py-2 font-medium">Gender</td><td class="border px-4 py-2">${profile.gender ?? "-"}</td></tr>
          <tr><td class="border px-4 py-2 font-medium">Height</td><td class="border px-4 py-2">${profile.height ?? ""}</td></tr>
          <tr><td class="border px-4 py-2 font-medium">Willing to Relocate</td><td class="border px-4 py-2">${profile.willing_to_relocate ? "Yes" : "No"}</td></tr>
          <tr><td class="border px-4 py-2 font-medium">Bio</td><td class="border px-4 py-2">${profile.bio ?? "-"}</td></tr>
          ${questions.map(q => `
            <tr>
              <td class="border px-4 py-2 font-medium w-1/3">${q.question_text}</td>
              <td class="border px-4 py-2">${answerMap[q.id] ?? "<em>No answer provided</em>"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <p>&nbsp;</p>
    `;
    container.classList.remove("hidden"); // <-- show it
  }


//------------------------------------------------------------
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
  hours = hours ? hours : 12; // convert 0 → 12

  return `${yyyy}-${mm}-${dd} ${hours}:${minutes} ${ampm}`;
}
//------------------------------------------------------------


function computeAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  // Report age in current year (your original behavior)
  return age + 1;
}

  // ------------------------------------------------------------
  // BUTTONS
  // ------------------------------------------------------------
  editBtn.addEventListener("click", () => {
    window.location.hash = `#/profile/${profileId}`;
  });

  printBtn.addEventListener("click", () => {
    window.print();
  });
}
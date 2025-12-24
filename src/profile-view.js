// profile-view.js

export function init(profileId) {
  console.log("INIT PROFILE VIEW WITH ID:", profileId);

  requestAnimationFrame(() => {
    initProfileView(profileId);
  });
}

function initProfileView(profileId) {
  const container = document.getElementById("profileContainer");
  const qaContainer = document.getElementById("qaContainer");
  const editBtn = document.getElementById("editBtn");
  const printBtn = document.getElementById("printBtn");

  console.log("profile-view.js loaded");
  console.log("Received profileId:", profileId);

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
  loadQuestionsAndAnswers(profileId);

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

    container.innerHTML = `
      <h1 class="text-2xl font-semibold mb-4">${profile.first_name} ${profile.last_name}</h1>
      <table class="w-full border border-gray-300 rounded-lg shadow-sm">
        <tbody>
          <tr><td class="border px-4 py-2 font-medium">Email</td><td class="border px-4 py-2">${profile.email ?? "-"}</td></tr>
          <tr><td class="border px-4 py-2 font-medium">Phone</td><td class="border px-4 py-2">${profile.phone_number ?? "-"}</td></tr>
          <tr><td class="border px-4 py-2 font-medium">Date of Birth</td><td class="border px-4 py-2">${profile.datetime_of_birth ?? "-"}</td></tr>
          <tr><td class="border px-4 py-2 font-medium">Place of Birth</td><td class="border px-4 py-2">${profile.place_of_birth ?? "-"}</td></tr>
          <tr><td class="border px-4 py-2 font-medium">Location</td><td class="border px-4 py-2">${profile.current_location ?? "-"}</td></tr>
          <tr><td class="border px-4 py-2 font-medium">Gender</td><td class="border px-4 py-2">${profile.gender ?? "-"}</td></tr>
          <tr><td class="border px-4 py-2 font-medium">Height</td><td class="border px-4 py-2">${profile.height_feet ?? ""} ft ${profile.height_inches ?? ""} in</td></tr>
          <tr><td class="border px-4 py-2 font-medium">Willing to Relocate</td><td class="border px-4 py-2">${profile.willing_to_relocate ? "Yes" : "No"}</td></tr>
          <tr><td class="border px-4 py-2 font-medium">Bio</td><td class="border px-4 py-2">${profile.bio ?? "-"}</td></tr>
        </tbody>
      </table>
    `;
    container.classList.remove("hidden"); // <-- show it
  }

  // ------------------------------------------------------------
  // LOAD QUESTIONS + ANSWERS
  // ------------------------------------------------------------
  async function loadQuestionsAndAnswers(profileId) {
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

    qaContainer.innerHTML = `
      <h2 class="text-xl font-semibold mb-4">Questions & Answers</h2>
      <table class="w-full border border-gray-300 rounded-lg shadow-sm">
        <tbody>
          ${questions.map(q => `
            <tr>
              <td class="border px-4 py-2 font-medium w-1/3">${q.question_text}</td>
              <td class="border px-4 py-2">${answerMap[q.id] ?? "<em>No answer provided</em>"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
    qaContainer.classList.remove("hidden"); // <-- show it
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
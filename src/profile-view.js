// REMOVE ALL REGEX EXTRACTION
// REMOVE setTimeout(() => initProfileView(), 0);

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
      container.textContent = "Profile not found.";
      return;
    }

    container.innerHTML = `
      <h1 class="text-2xl font-semibold">${profile.first_name} ${profile.last_name}</h1>

      <div class="space-y-2 text-gray-700">
        <p><strong>Email:</strong> ${profile.email}</p>
        <p><strong>Phone:</strong> ${profile.phone_number ?? ""}</p>
        <p><strong>Date of Birth:</strong> ${profile.datetime_of_birth ?? ""}</p>
        <p><strong>Place of Birth:</strong> ${profile.place_of_birth ?? ""}</p>
        <p><strong>Location:</strong> ${profile.current_location ?? ""}</p>
        <p><strong>Gender:</strong> ${profile.gender ?? ""}</p>
        <p><strong>Height:</strong> ${profile.height_feet ?? ""} ft ${profile.height_inches ?? ""} in</p>
        <p><strong>Willing to Relocate:</strong> ${profile.willing_to_relocate ? "Yes" : "No"}</p>
        <p><strong>Bio:</strong> ${profile.bio ?? ""}</p>
      </div>
    `;
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
      qaContainer.textContent = "Error loading questions.";
      return;
    }

    const { data: answers, error: aErr } = await window.supabase
      .schema("cabo")
      .from("mm_answers")
      .select("*")
      .eq("person_id", profileId);

    if (aErr) {
      qaContainer.textContent = "Error loading answers.";
      return;
    }

    const answerMap = {};
    answers.forEach(a => {
      answerMap[a.question_id] = a.answer_text;
    });

qaContainer.innerHTML = `
  <h2 class="text-xl font-semibold mb-4">Questions & Answers</h2>

  <div class="qa-grid">
    ${questions.map(q => `
      <div class="qa-item">
        <div class="qa-question">${q.question_text}</div>
        <div class="qa-answer">
          ${answerMap[q.id] ?? "<em>No answer provided</em>"}
        </div>
      </div>
    `).join("")}
  </div>
`;  }

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

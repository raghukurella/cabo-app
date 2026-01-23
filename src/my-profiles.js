import { supabase } from "./supabase.js";

async function loadProfiles() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.hash = "#/login";
    return;
  }
//console.log("User ID:", user.id);
console.log("profilesList:", document.getElementById("profilesList"));
console.log("User ID at loadProfiles:", user.id);
const { data: profiles, error } = await supabase
  .schema("cabo")
  .from("mm_people")
  .select(`
    *,
    mm_answers (
      id,
      answer_text,
      question_id,
      mm_questions (
        id,
        question_text
      )
    )
  `)
  .eq("auth_id", user.id)
  .order("created_at", { ascending: true });
  const container = document.getElementById("profilesList");
  if (!container) return;

  container.innerHTML = "";

  if (error) {
    container.innerHTML = `<p class="text-red-600">Error loading profiles</p>`;
    return;
  }

  if (!profiles || profiles.length === 0) {
    container.innerHTML = `<center><p class="text-gray-600">You haven't created any profiles yet.</p></center>`;
    return;
  }

profiles.forEach(profile => {
  const card = document.createElement("div");
  card.className = `
    bg-white border border-gray-200 rounded-xl p-4 
    hover:shadow-lg hover:-translate-y-0.5 transition-all
  `;

  const displayName = `${profile.last_name || ""}${profile.last_name && profile.first_name ? ", " : ""}${profile.first_name || ""}`.trim() || "Unnamed Profile";

  const age = calculateAge(profile.datetime_of_birth);
  const ageText = age ? ` (${age})` : "";

  card.innerHTML = `
    <p class="text-base font-semibold text-gray-800 leading-tight">
      ${displayName}${ageText}
    </p>
    <p class="text-sm text-gray-600 leading-tight">
      ${profile.current_location || ""}
    </p>
  `;

  card.addEventListener("click", () => {
    window.location.hash = `#/profilevw/${profile.id}`;
  });

  container.appendChild(card);
});
}

function calculateAge(dobString) {
  if (!dobString) return null;
  const dob = new Date(dobString);
  if (isNaN(dob)) return null;
  const diff = Date.now() - dob.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function initMyProfiles() {
  const btn = document.getElementById("createProfileBtn");
  if (btn) {
    btn.onclick = () => {
      console.log("Create button clicked");
      window.location.hash = "#/profile";
      console.log("New hash:", window.location.hash);
    };
  }

  loadProfiles();
}

// Run after router injects HTML
window.addEventListener("hashchange", () => {
  if (window.location.hash.startsWith("#/my-profiles")) {
    setTimeout(initMyProfiles, 0);
  }
});

// Also run on first load
if (window.location.hash.startsWith("#/my-profiles")) {
  setTimeout(initMyProfiles, 0);
}

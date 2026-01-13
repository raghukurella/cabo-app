// profile-view.js

import { renderFullProfile } from "./profile-render.js";

export function profile_init(profileId) {
  window.currentProfileId = profileId;
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

    //const age = computeAge(profile.datetime_of_birth);

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


    renderFullProfile(profile, questions, answers, "profileContainer");

    container.classList.remove("hidden"); // <-- show it
  }


  //------------------------------------------------------------
  // function formatDateTime(isoString) {
  //   if (!isoString) return "-";
  //   const date = new Date(isoString);

  //   const yyyy = date.getFullYear();
  //   const mm = String(date.getMonth() + 1).padStart(2, "0");
  //   const dd = String(date.getDate()).padStart(2, "0");

  //   let hours = date.getHours();
  //   const minutes = String(date.getMinutes()).padStart(2, "0");
  //   const ampm = hours >= 12 ? "PM" : "AM";
  //   hours = hours % 12;
  //   hours = hours ? hours : 12; // convert 0 → 12

  //   return `${yyyy}-${mm}-${dd} ${hours}:${minutes} ${ampm}`;
  // }
  // //------------------------------------------------------------


  // function computeAge(dob) {
  //   if (!dob) return null;
  //   const birth = new Date(dob);
  //   const today = new Date();
  //   let age = today.getFullYear() - birth.getFullYear();
  //   const m = today.getMonth() - birth.getMonth();
  //   if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
  //     age--;
  //   }
  //   // Report age in current year (your original behavior)
  //   return age + 1;
  // }

  // ------------------------------------------------------------
  // BUTTONS
  // ------------------------------------------------------------
  editBtn.addEventListener("click", () => {
    window.location.hash = `#/profile/${profileId}`;
  });

  printBtn.addEventListener("click", () => {
    window.print();
  });

    profile_attachShareButton();

}





import { createProfileShare } from "./profile_share.js";
import { qs } from "./profile_helpers.js";

export function profile_attachShareButton() {
  console.log("profile_attachShareButton is running");

  const btn = qs("shareProfileBtn");
  const modal = qs("shareModal");
  const cancelBtn = qs("shareCancelBtn");
  const submitBtn = qs("shareSubmitBtn");

  if (!btn || !modal) return;

  btn.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });

  cancelBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  submitBtn.addEventListener("click", async () => {
    const email = qs("shareEmail").value.trim();
    const maxViews = Number(qs("shareViews").value) || null;
    const daysValid = Number(qs("shareDays").value) || null;

    const profileId = window.currentProfileId;   // correct

    try {
      const token = await createProfileShare(profileId, email, maxViews, daysValid);
      const link = `${window.location.origin}/#/shared-profile/${token}`;

      alert("Share link created:\n" + link);
      console.log("Share link created:", link);

      window.location.href = `mailto:${email}?subject=Your Matchmaker Share Link&body=Here is your link:%0A${link}`;

      modal.classList.add("hidden");
    } catch (err) {
      alert("Failed to create share link.");
      console.error(err);
    }
  });
}


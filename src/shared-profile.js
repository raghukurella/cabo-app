// shared-profile.js
import { supabase } from "./supabase.js";
import { renderFullProfile } from "./profile-render.js";

export async function shared_profile_init(token) {
  const { data: share, error } = await supabase
    .from("mm_profile_shares")
    .select("profile_id")
    .eq("share_token", token)
    .single();

  if (!share || error) {
    document.getElementById("sharedProfileContent").innerHTML =
      "<p>Invalid or expired link.</p>";
    return;
  }

  const profileId = share.profile_id;

  // Load profile
  const { data: profile } = await supabase
    .from("mm_people")
    .select("*")
    .eq("id", profileId)
    .single();

  // Load questions
  const { data: questions } = await supabase
    .from("mm_questions")
    .select("*")
    .order("sort_order", { ascending: true });

  // Load answers
  const { data: answers } = await supabase
    .from("mm_answers")
    .select("*")
    .eq("person_id", profileId);

  // Render using the SAME renderer as profile-view
  renderFullProfile(profile, questions, answers, "sharedProfileContent");
}
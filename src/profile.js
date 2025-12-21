// Delay initialization until DOM is fully injected by the router
setTimeout(() => initProfile(), 0);

function initProfile() {
  // DOM elements
  const statusEl = document.getElementById("profileStatus");
  const formEl = document.getElementById("profileForm");
  const logoutBtn = document.getElementById("logoutBtn");
  const saveBtn = document.getElementById("saveProfileBtn");

  // Inputs
  const firstNameInput = document.getElementById("first_name");
  const lastNameInput = document.getElementById("last_name");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone_number");
  const dobInput = document.getElementById("datetime_of_birth");
  const pobInput = document.getElementById("place_of_birth");
  const heightFeetInput = document.getElementById("height_feet");
  const heightInchesInput = document.getElementById("height_inches");
  const genderSelect = document.getElementById("gender");
  const locationInput = document.getElementById("current_location");
  const relocateCheckbox = document.getElementById("willing_to_relocate");
  const bioInput = document.getElementById("bio");

  console.log(">>> PROFILE.JS EXECUTED");

  // Extract /profile/<uuid>
  function getProfileId() {
    const hash = window.location.hash;
    const match = hash.match(/^#\/profile\/([0-9a-fA-F-]{36})$/);
    return match ? match[1] : null;
  }

  let editingProfileId = getProfileId();
  let loadedProfile = null;

  loadProfile();

  // ------------------------------------------------------------
  // LOAD PROFILE
  // ------------------------------------------------------------
  async function loadProfile() {
    console.log(">>> loadProfile entered");
    statusEl.textContent = "Loading profile…";

    const { data: sessionData, error: sessionError } =
      await window.supabase.auth.getSession();

    if (sessionError || !sessionData?.session?.user) {
      statusEl.textContent = "You are not logged in. Redirecting…";
      setTimeout(() => (window.location.hash = "#/login"), 1500);
      return;
    }

    const user = sessionData.session.user;
    emailInput.value = user.email || "";

    // CREATE MODE
    if (!editingProfileId) {
      statusEl.textContent = "Create a new profile.";
      formEl.classList.remove("hidden");
      return;
    }

    // EDIT MODE — load existing profile
    const { data: profile, error: profileError } = await window.supabase
      .schema("cabo")
      .from("mm_people")
      .select("*")
      .eq("id", editingProfileId)
      .maybeSingle();

    if (profileError) {
      console.error("Error loading profile:", profileError);
      statusEl.textContent = "Error loading profile.";
      return;
    }

    if (!profile) {
      statusEl.textContent = "Profile not found.";
      return;
    }

    loadedProfile = profile;

    console.log("DB row id:", profile.id);
    console.log("URL editingProfileId:", editingProfileId);

    // Populate form
    firstNameInput.value = profile.first_name || "";
    lastNameInput.value = profile.last_name || "";
    emailInput.value = profile.email || user.email || "";
    phoneInput.value = profile.phone_number || "";
    bioInput.value = profile.bio || "";
    pobInput.value = profile.place_of_birth || "";
    locationInput.value = profile.current_location || "";
    heightFeetInput.value = profile.height_feet ?? "";
    heightInchesInput.value = profile.height_inches ?? "";
    genderSelect.value = profile.gender || "";
    relocateCheckbox.checked = profile.willing_to_relocate === true;

    if (profile.datetime_of_birth) {
      const d = new Date(profile.datetime_of_birth);
      dobInput.value = !isNaN(d) ? d.toISOString().slice(0, 16) : "";
    }

    statusEl.textContent = "";
    formEl.classList.remove("hidden");
  }

  // ------------------------------------------------------------
  // PAYLOAD BUILDERS
  // ------------------------------------------------------------
  function buildCreatePayload(user) {
    return {
      id: crypto.randomUUID(),
      auth_id: user.id, // only on CREATE
      first_name: firstNameInput.value.trim(),
      last_name: lastNameInput.value.trim(),
      email: emailInput.value.trim() || user.email,
      phone_number: phoneInput.value.trim() || null,
      place_of_birth: pobInput.value.trim() || null,
      current_location: locationInput.value.trim() || null,
      bio: bioInput.value.trim() || null,
      gender: genderSelect.value || null,
      willing_to_relocate: relocateCheckbox.checked,
      height_feet:
        heightFeetInput.value === "" ? null : Number(heightFeetInput.value),
      height_inches:
        heightInchesInput.value === "" ? null : Number(heightInchesInput.value),
      datetime_of_birth: dobInput.value || null,
    };
  }

  function buildUpdatePayload() {
    return {
      first_name: firstNameInput.value.trim(),
      last_name: lastNameInput.value.trim(),
      email: emailInput.value.trim(),
      phone_number: phoneInput.value.trim() || null,
      place_of_birth: pobInput.value.trim() || null,
      current_location: locationInput.value.trim() || null,
      bio: bioInput.value.trim() || null,
      gender: genderSelect.value || null,
      willing_to_relocate: relocateCheckbox.checked,
      height_feet:
        heightFeetInput.value === "" ? null : Number(heightFeetInput.value),
      height_inches:
        heightInchesInput.value === "" ? null : Number(heightInchesInput.value),
      datetime_of_birth: dobInput.value || null,
    };
  }

  // ------------------------------------------------------------
  // SAVE PROFILE
  // ------------------------------------------------------------
  saveBtn.addEventListener("click", async () => {
    statusEl.textContent = "Saving…";

    const { data: sessionData, error: sessionError } =
      await window.supabase.auth.getSession();

    if (sessionError || !sessionData?.session?.user) {
      alert("You are not logged in.");
      window.location.hash = "#/login";
      return;
    }

    const user = sessionData.session.user;

    console.log("User ID:", user.id);
    console.log("Profile auth_id:", loadedProfile?.auth_id);

    let dbError;

    if (editingProfileId) {
      // UPDATE
      const payload = buildUpdatePayload();
      const { data, error } = await window.supabase
        .schema("cabo")
        .from("mm_people")
        .update(payload)
        .eq("id", editingProfileId)
        .select();

      console.log("UPDATE RESULT:", { data, error });
      dbError = error;

    } else {
      // CREATE
      const payload = buildCreatePayload(user);

      const { error } = await window.supabase
        .schema("cabo")
        .from("mm_people")
        .insert(payload);

      dbError = error;
      editingProfileId = payload.id;
    }

    if (dbError) {
      console.error("Error saving profile:", dbError);
      alert("There was a problem saving your profile.");
      statusEl.textContent = "";
      return;
    }

    statusEl.textContent = "Profile saved.";

    setTimeout(() => {
      window.location.hash = `#/profile-more/${editingProfileId}`;
    }, 500);
  });




  myProfiles.addEventListener("click", async () => {
    window.location.hash = `#/my-profiles/`;
  });
  
  
  
  // ------------------------------------------------------------
  // LOGOUT
  // ------------------------------------------------------------
  logoutBtn.addEventListener("click", async () => {
    await window.supabase.auth.signOut();
    window.location.hash = "#/login";
  });

}
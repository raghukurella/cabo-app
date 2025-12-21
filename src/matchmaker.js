    import { supabase } from "./supabase.js";

async function requireMatchmaker() {
  const gate = document.getElementById("matchmakerGate");
  const content = document.getElementById("matchmakerContent");

  gate.classList.add("hidden");
  content.classList.add("hidden");
  gate.textContent = "";

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.user) {
    gate.textContent = "You must be signed in to access matchmaker tools.";
    gate.classList.remove("hidden");
    return null;
  }

  const userId = session.user.id;

  const { data: mmRow, error } = await supabase
    .schema("cabo")
    .from("mm_matchmakers")
    .select("*")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (error) {
    console.error(error);
    gate.textContent = "Error checking matchmaker access.";
    gate.classList.remove("hidden");
    return null;
  }

  if (!mmRow) {
    gate.textContent = "You are not registered as a matchmaker.";
    gate.classList.remove("hidden");
    return null;
  }

  content.classList.remove("hidden");
  return mmRow;
}

async function loadPeople() {
  const peopleList = document.getElementById("peopleList");
  peopleList.innerHTML = '<div class="text-sm text-gray-500">Loading...</div>';

  const { data, error } = await supabase
    .schema("cabo")
    .from("mm_people")
    .select("*")
    .order("last_name", { ascending: true });

  if (error) {
    console.error(error);
    peopleList.innerHTML = '<div class="text-sm text-red-600">Error loading people.</div>';
    return;
  }

  if (!data || data.length === 0) {
    peopleList.innerHTML = '<div class="text-sm text-gray-500">No profiles found.</div>';
    return;
  }

  peopleList.innerHTML = "";
  data.forEach(renderPersonRow);
}

function renderPersonRow(p) {
  const container = document.createElement("div");
  container.className =
    "border rounded px-4 py-3 bg-white shadow-sm cursor-pointer";

  const name = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim();

  // Compute age safely
  const age = computeAge(p.datetime_of_birth);

  // Format DOB safely
  const dob = p.datetime_of_birth
    ? new Date(p.datetime_of_birth).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      })
    : "No DOB";

  // Extract year from datetime_of_birth
  const year = p.datetime_of_birth
    ? new Date(p.datetime_of_birth).getFullYear()
    : null;

  container.innerHTML = `
    <div class="font-medium text-gray-900">
      ${name || "(No name)"} 
      - ${age || "age?"}
      , ${p.height_feet !== null && p.height_inches !== null ? `${p.height_feet}' ${p.height_inches}"` : "(No location)"}
    </div>
    <div class="font-medium text-gray-900"></div>
    <div class="text-sm text-gray-600">
      ${dob} 
    </div>
  `;


  container.addEventListener("click", () => {
    document.querySelectorAll(".person-selected")
      .forEach(el => el.classList.remove("person-selected"));

    container.classList.add("person-selected");

    sessionStorage.setItem("mm_scroll", window.scrollY.toString());

    window.location.hash = `#/profilevw/${p.id}`;
  });

  document.getElementById("peopleList").appendChild(container);
}

async function initMatchmaker() {
  const ok = await requireMatchmaker();

  // Show filter panel initially hidden
  const filterWrapper = document.getElementById("filterWrapper");
  const toggleBtn = document.getElementById("toggleFiltersBtn");

  toggleBtn.addEventListener("click", () => {
    const isHidden = filterWrapper.classList.contains("hidden");

    if (isHidden) {
      filterWrapper.classList.remove("hidden");
      toggleBtn.textContent = "Hide Filters";
    } else {
      filterWrapper.classList.add("hidden");
      toggleBtn.textContent = "Show Filters";
    }
  });


  if (!ok) return;

  // Attach filter button listener AFTER HTML is loaded
  document.getElementById("applyFilters")
    .addEventListener("click", loadPeopleWithFilters);

  // Load initial list (unfiltered or filtered)
  await loadPeopleWithFilters();

  // Optional: restore scroll position
  const savedScroll = sessionStorage.getItem("mm_scroll");
  if (savedScroll) {
    window.scrollTo(0, parseInt(savedScroll, 10));
    sessionStorage.removeItem("mm_scroll");
  }



  document.getElementById("logoutBtn").addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.hash = "#/login";
  });

}

function renderPeopleList(people) {
  const list = document.getElementById("peopleList");
  list.innerHTML = "";

  if (!people || people.length === 0) {
    list.innerHTML = `<div class="text-gray-500 text-sm">No results found.</div>`;
    return;
  }

  people.forEach(p => {
    renderPersonRow(p);   // you already have this function
  });
}

async function loadPeopleWithFilters() {
  const gender = document.getElementById("filter_gender").value.trim();
  const minAge = document.getElementById("filter_min_age").value.trim();
  const maxAge = document.getElementById("filter_max_age").value.trim();
  const education = document.getElementById("filter_education").value.trim();

  // Base query (no SQL functions)
  let query = supabase
    .schema("cabo")
    .from("mm_people")
    .select("*")
    .order("last_name", { ascending: true });

  // Case-insensitive text filters
  if (gender) query = query.ilike("gender", gender.toLowerCase());
  if (education) query = query.ilike("education", education.toLowerCase());

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return;
  }

  // Compute age for each person
  const enriched = data.map(p => ({
    ...p,
    age: computeAge(p.datetime_of_birth)
  }));

  // Apply age filters in JS
  let filtered = enriched;

  if (minAge) filtered = filtered.filter(p => p.age >= Number(minAge));
  if (maxAge) filtered = filtered.filter(p => p.age <= Number(maxAge));

  renderPeopleList(filtered);
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
  return age + 1; //Add 1 to report age in current year
}

initMatchmaker();
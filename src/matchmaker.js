import { supabase } from "./supabase.js";

async function requireMatchmaker() {
  const gate = document.getElementById("matchmakerGate");
  const content = document.getElementById("matchmakerContent");

  gate.classList.add("hidden");
  content.classList.add("hidden");
  gate.textContent = "";

  const { data: { session } } = await supabase.auth.getSession();

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

function renderPersonRow(p) {
  const container = document.createElement("div");
  container.className = "border rounded px-4 py-3 bg-white shadow-sm cursor-pointer";

  const name = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim();
  const age = computeAge(p.datetime_of_birth);
  const dob = p.datetime_of_birth
    ? new Date(p.datetime_of_birth).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      })
    : "No DOB";

  const heightText = p.height ?? "(No height)";

  container.innerHTML = `
    <div class="font-medium text-gray-900">
      ${name || "(No name)"} - ${age || "age?"}, ${heightText}
    </div>
    <div class="text-sm text-gray-600">${dob}</div>
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

function renderPeopleList(people) {
  const list = document.getElementById("peopleList");
  list.innerHTML = "";

  if (!people || people.length === 0) {
    list.innerHTML = `<div class="text-gray-500 text-sm">No results found.</div>`;
    return;
  }

  people.forEach(p => renderPersonRow(p));
}

async function loadPeopleWithFilters() {
  const gender = document.getElementById("filter_gender").value.trim();
  const minAge = document.getElementById("filter_min_age").value.trim();
  const maxAge = document.getElementById("filter_max_age").value.trim();
  const education = document.getElementById("filter_education").value.trim();

  let query = supabase
    .schema("cabo")
    .from("mm_people")
    .select("*")
    .order("last_name", { ascending: true });

  // Exact matches for these fields
  if (gender) query = query.eq("gender", gender);
  if (education) query = query.eq("education", education);

  const { data, error } = await query;

  if (error) {
    console.error(error);
    const list = document.getElementById("peopleList");
    list.innerHTML = `<div class="text-red-600 text-sm">Error loading people.</div>`;
    return;
  }

  // Compute age and apply age filters client-side
  const enriched = (data || []).map(p => ({
    ...p,
    age: computeAge(p.datetime_of_birth)
  }));

  let filtered = enriched;
  if (minAge) filtered = filtered.filter(p => (p.age ?? 0) >= Number(minAge));
  if (maxAge) filtered = filtered.filter(p => (p.age ?? 0) <= Number(maxAge));

  renderPeopleList(filtered);
}

  async function initMatchmaker() {
    // Toggle filters
    const filterWrapper = document.getElementById("filterWrapper");
    const toggleBtn = document.getElementById("toggleFiltersBtn");

    if (toggleBtn && filterWrapper) {
      toggleBtn.addEventListener("click", () => {
        const isHidden = filterWrapper.classList.contains("hidden");
        filterWrapper.classList.toggle("hidden");
        toggleBtn.textContent = isHidden ? "Hide Filters" : "Show Filters";
      });
    }

    const ok = await requireMatchmaker();
    if (!ok) return;

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // Wire apply filters
    const applyBtn = document.getElementById("applyFilters");
    if (applyBtn) {
      applyBtn.addEventListener("click", loadPeopleWithFilters);
    }

    // Tab switching logic
    const tabAll = document.getElementById("tabAllProfiles");
    const tabMine = document.getElementById("tabMyProfiles");

    if (tabAll && tabMine) {
      tabAll.addEventListener("click", async () => {
        tabAll.classList.add("text-blue-600", "border-b-2", "border-blue-600");
        tabMine.classList.remove("text-blue-600", "border-b-2", "border-blue-600");
        await loadPeopleWithFilters();
      });

      tabMine.addEventListener("click", async () => {
        tabMine.classList.add("text-blue-600", "border-b-2", "border-blue-600");
        tabAll.classList.remove("text-blue-600", "border-b-2", "border-blue-600");
        await loadMyProfiles(userId);
      });
    }

    // Initial load
    await loadPeopleWithFilters();

    // Restore scroll
    const savedScroll = sessionStorage.getItem("mm_scroll");
    if (savedScroll) {
      window.scrollTo(0, parseInt(savedScroll, 10));
      sessionStorage.removeItem("mm_scroll");
    }

    // Loader for "My Profiles Only"
    async function loadMyProfiles(userId) {
      const peopleList = document.getElementById("peopleList");
      peopleList.innerHTML = '<div class="text-sm text-gray-500">Loading...</div>';

      const { data, error } = await supabase
        .schema("cabo")
        .from("mm_people")
        .select("*")
        .eq("auth_id", userId)
        .order("last_name", { ascending: true });

      if (error) {
        console.error(error);
        peopleList.innerHTML = '<div class="text-sm text-red-600">Error loading profiles.</div>';
        return;
      }

      if (!data || data.length === 0) {
        peopleList.innerHTML = '<div class="text-sm text-gray-500">No profiles found.</div>';
        return;
      }

      peopleList.innerHTML = "";
      data.forEach(renderPersonRow);
    }
}
initMatchmaker();
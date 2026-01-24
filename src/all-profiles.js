import { supabase } from "./supabase.js";

export async function init() {
  const openBtn = document.getElementById("openSearchBtn");
  const closeBtn = document.getElementById("closeSearchBtn");
  const doSearchBtn = document.getElementById("doSearchBtn");
  const resetBtn = document.getElementById("resetSearchBtn");
  const modal = document.getElementById("searchModal");

  if (openBtn) openBtn.addEventListener("click", () => modal.classList.remove("hidden"));
  if (closeBtn) closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
  
  // Close on click outside
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.add("hidden");
    });
  }

  if (doSearchBtn) {
    doSearchBtn.addEventListener("click", () => {
      loadProfiles();
      modal.classList.add("hidden");
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      document.querySelectorAll("#searchModal input, #searchModal select").forEach(el => el.value = "");
      loadProfiles();
      modal.classList.add("hidden");
    });
  }

  // Initial load
  await loadProfiles();
}

async function loadProfiles() {
  const grid = document.getElementById("profilesGrid");
  if (!grid) return;
  
  grid.innerHTML = '<div class="col-span-full text-center text-gray-500 py-10">Loading...</div>';

  let query = supabase.schema("cabo").from("mm_people").select("*");

  // Apply filters
  const fName = document.getElementById("s_first_name")?.value.trim();
  const lName = document.getElementById("s_last_name")?.value.trim();
  const email = document.getElementById("s_email")?.value.trim();
  const location = document.getElementById("s_location")?.value.trim();
  const gender = document.getElementById("s_gender")?.value.trim();
  const relocate = document.getElementById("s_relocate")?.value.trim();

  if (fName) query = query.ilike("first_name", `%${fName}%`);
  if (lName) query = query.ilike("last_name", `%${lName}%`);
  if (email) query = query.ilike("email", `%${email}%`);
  if (location) query = query.ilike("current_location", `%${location}%`);
  if (gender) query = query.eq("gender", gender);
  if (relocate) query = query.eq("willing_to_relocate", relocate === "true");

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    grid.innerHTML = '<div class="col-span-full text-center text-red-500 py-10">Error loading profiles</div>';
    return;
  }

  if (!data || data.length === 0) {
    grid.innerHTML = '<div class="col-span-full text-center text-gray-500 py-10">No profiles found matching criteria.</div>';
    return;
  }

  grid.innerHTML = "";
  data.forEach(p => {
    const card = document.createElement("div");
    card.className = "bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer flex flex-col";
    
    // Photo logic
    let photoUrl = null;
    if (p.photos && Array.isArray(p.photos) && p.photos.length > 0) {
      photoUrl = p.photos.find(url => url && typeof url === "string" && url.length > 5);
    } else if (typeof p.photos === "string") {
        try {
            const parsed = JSON.parse(p.photos);
            if (Array.isArray(parsed) && parsed.length > 0) photoUrl = parsed[0];
        } catch(e) {}
    }

    const imgHtml = photoUrl 
      ? `<img src="${photoUrl}" class="w-full h-48 object-cover" alt="Profile Photo">` 
      : `<div class="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">No Photo</div>`;

    const name = `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Unnamed";
    const loc = p.current_location || "Unknown Location";
    const age = computeAge(p.datetime_of_birth);
    const ageText = age ? `${age} yrs` : "";

    card.innerHTML = `
      ${imgHtml}
      <div class="p-4 flex-grow">
        <h3 class="font-semibold text-lg text-gray-800 leading-tight">${name}</h3>
        <div class="text-sm text-gray-600 flex justify-between mt-2">
            <span>${ageText}</span>
            <span>${p.gender || ""}</span>
        </div>
        <p class="text-sm text-gray-500 mt-2 truncate">${loc}</p>
      </div>
    `;

    card.addEventListener("click", () => {
        window.location.hash = `#/profilevw/${p.id}`;
    });

    grid.appendChild(card);
  });
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
  return age;
}
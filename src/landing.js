import noUiSlider from 'https://esm.sh/nouislider@15.7.1';
import { supabase } from "./supabase.js";

let allFilteredProfiles = [];
let currentPage = 1;
const pageSize = 20;

export function init() {
  console.log("Landing page init");

  // ✅ Attach listeners early so they work even if sliders/data fail
  const addProfileBtn = document.getElementById("addProfileBtn");
  if (addProfileBtn) {
    addProfileBtn.addEventListener("click", () => window.location.hash = "#/process-biodata");
  }

  // Load noUiSlider CSS dynamically
  if (!document.getElementById("nouislider-css")) {
    const link = document.createElement("link");
    link.id = "nouislider-css";
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/nouislider@15.7.1/dist/nouislider.min.css";
    document.head.appendChild(link);
  }

  try {
    initSliders();
  } catch (e) { console.error("Slider init failed", e); }

  loadOccupationOptions();
  
  const form = document.getElementById("landingSearchForm");
  if (form) {
    form.addEventListener("submit", handleSearch);
  }

  const toggleBtn = document.getElementById("toggleSearchBtn");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", toggleSearchVisibility);
  }

  const showAllBtn = document.getElementById("showAllBtn");
  if (showAllBtn) {
    showAllBtn.addEventListener("click", handleShowAll);
  }

  const prevBtn = document.getElementById("prevPageBtn");
  const nextBtn = document.getElementById("nextPageBtn");
  if (prevBtn) prevBtn.addEventListener("click", () => changePage(-1));
  if (nextBtn) nextBtn.addEventListener("click", () => changePage(1));

  // Modal Listeners
  const profileModal = document.getElementById("profileModal");
  const closeProfileModalBtn = document.getElementById("closeProfileModalBtn");
  const modalCloseBtn = document.getElementById("modalCloseBtn");

  if (closeProfileModalBtn) closeProfileModalBtn.addEventListener("click", closeProfileModal);
  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeProfileModal);
  if (profileModal) {
    profileModal.addEventListener("click", (e) => { if (e.target === profileModal) closeProfileModal(); });
  }
}

function initSliders() {
  // --- Age Slider (20 - 50) ---
  const ageSlider = document.getElementById('ageSlider');
  const ageDisplay = document.getElementById('ageDisplay');
  
  if (ageSlider) {
    noUiSlider.create(ageSlider, {
      start: [24, 35],
      connect: true,
      range: { 'min': 18, 'max': 80 },
      step: 1
    });

    ageSlider.noUiSlider.on('update', (values) => {
      const min = Math.round(values[0]);
      const max = Math.round(values[1]);
      ageDisplay.textContent = `${min} - ${max}`;
    });
  }

  // --- Height Slider (4'0" - 7'0") ---
  const heightSlider = document.getElementById('heightSlider');
  const heightDisplay = document.getElementById('heightDisplay');

  if (heightSlider) {
    // Store values in inches: 4'0" = 48", 7'0" = 84"
    noUiSlider.create(heightSlider, {
      start: [64, 73],
      connect: true,
      range: { 'min': 48, 'max': 84 },
      step: 1
    });

    heightSlider.noUiSlider.on('update', (values) => {
      const minInches = Math.round(values[0]);
      const maxInches = Math.round(values[1]);
      
      const formatHeight = (inches) => {
        const ft = Math.floor(inches / 12);
        const inc = inches % 12;
        return `${ft}' ${inc}"`;
      };
      
      heightDisplay.textContent = `${formatHeight(minInches)} - ${formatHeight(maxInches)}`;
    });
  }
}

function toggleSearchVisibility() {
  const searchCard = document.getElementById("searchCard");
  const toggleBtn = document.getElementById("toggleSearchBtn");
  
  if (searchCard.classList.contains("hidden")) {
    searchCard.classList.remove("hidden");
    toggleBtn.textContent = "Hide Search Filters";
  } else {
    searchCard.classList.add("hidden");
    toggleBtn.textContent = "Show Search Filters";
  }
}

function handleShowAll() {
  const form = document.getElementById("landingSearchForm");
  if (!form) return;

  // Reset dropdowns
  const gender = document.getElementById("searchGender");
  if (gender) gender.value = "";
  const occupation = document.getElementById("searchOccupation");
  if (occupation) occupation.value = "";

  // Uncheck immigration to show all (including nulls)
  document.querySelectorAll('input[name="immigration"]').forEach(cb => cb.checked = false);

  // Reset sliders to full range
  const ageSlider = document.getElementById('ageSlider');
  if (ageSlider && ageSlider.noUiSlider) {
    const range = ageSlider.noUiSlider.options.range;
    ageSlider.noUiSlider.set([range.min, range.max]);
  }

  const heightSlider = document.getElementById('heightSlider');
  if (heightSlider && heightSlider.noUiSlider) {
    const range = heightSlider.noUiSlider.options.range;
    heightSlider.noUiSlider.set([range.min, range.max]);
  }

  form.dispatchEvent(new Event('submit', { cancelable: true }));
}

function changePage(delta) {
  const maxPage = Math.ceil(allFilteredProfiles.length / pageSize) || 1;
  const newPage = currentPage + delta;
  if (newPage >= 1 && newPage <= maxPage) {
    currentPage = newPage;
    renderPage();
  }
}

function renderPage() {
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageData = allFilteredProfiles.slice(start, end);
  
  renderResults(pageData);
  updatePaginationControls();
}

function updatePaginationControls() {
  const controls = document.getElementById("paginationControls");
  if (!controls) return;
  
  controls.classList.remove("hidden");
  const prevBtn = document.getElementById("prevPageBtn");
  const nextBtn = document.getElementById("nextPageBtn");
  const indicator = document.getElementById("pageIndicator");
  const maxPage = Math.ceil(allFilteredProfiles.length / pageSize) || 1;
  
  if (prevBtn) prevBtn.disabled = currentPage === 1;
  if (nextBtn) nextBtn.disabled = currentPage === maxPage;
  if (indicator) indicator.textContent = `Page ${currentPage} of ${maxPage}`;
}

async function handleSearch(e) {
  e.preventDefault();
  
  const btn = e.submitter || document.querySelector("button[type='submit']");
  const originalText = btn ? btn.textContent : "Search";
  if (btn) { btn.textContent = "Searching..."; btn.disabled = true; }

  const gender = document.getElementById("searchGender").value;
  const occupation = document.getElementById("searchOccupation").value;
  
  // Get Slider Values
  const ageValues = document.getElementById('ageSlider').noUiSlider.get();
  const minAge = Math.round(ageValues[0]);
  const maxAge = Math.round(ageValues[1]);

  const heightValues = document.getElementById('heightSlider').noUiSlider.get();
  const minHeight = Math.round(heightValues[0]);
  const maxHeight = Math.round(heightValues[1]);

  // Get Checkboxes
  let immigration = Array.from(document.querySelectorAll('input[name="immigration"]:checked'))
    .map(cb => cb.value);

  // --- Build Query ---
  // Querying 'ma_biodata' as requested
  let query = supabase.schema("cabo").from("ma_biodata").select("*");
  let debugSql = "SELECT * FROM cabo.ma_biodata";
  let debugWhere = [];

  if (gender) {
    query = query.eq("gender", gender);
    debugWhere.push(`gender = '${gender}'`);
  }

  if (occupation) {
    if (occupation === "Unknown") {
      query = query.is("occupation_tag", null);
      debugWhere.push(`occupation_tag IS NULL`);
    } else {
      query = query.eq("occupation_tag", occupation);
      debugWhere.push(`occupation_tag = '${occupation}'`);
    }
  }

  // Age Filter (via DOB)
  // Calculate date range based on age
  const today = new Date();
  // minDate (oldest allowed DOB) = today - maxAge
  const minDate = new Date(today.getFullYear() - maxAge - 1, today.getMonth(), today.getDate()).toISOString();
  // maxDate (youngest allowed DOB) = today - minAge
  const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate()).toISOString();
  
  query = query.gte("datetime_of_birth", minDate).lte("datetime_of_birth", maxDate);
  debugWhere.push(`datetime_of_birth >= '${minDate}' AND datetime_of_birth <= '${maxDate}'`);

  // Immigration Filter Logic
  const includeUnknown = immigration.includes("Unknown");
  immigration = immigration.filter(v => v !== "Unknown");

  if (includeUnknown) {
    if (immigration.length > 0) {
      // Filter for (Selected Values OR Null)
      const values = immigration.map(v => `"${v}"`).join(',');
      query = query.or(`citizenship.in.(${values}),citizenship.is.null,citizenship.eq.`);
      const debugValues = immigration.map(v => `'${v}'`).join(',');
      debugWhere.push(`(citizenship IN (${debugValues}) OR citizenship IS NULL OR citizenship = '')`);
    } else {
      // Filter for Null only
      query = query.or(`citizenship.is.null,citizenship.eq.`);
      debugWhere.push(`(citizenship IS NULL OR citizenship = '')`);
    }
  } else if (immigration.length > 0) {
    // Filter for Selected Values only
    query = query.in("citizenship", immigration);
    const debugValues = immigration.map(v => `'${v}'`).join(',');
    debugWhere.push(`citizenship IN (${debugValues})`);
  }

  query = query.order('last_name', { ascending: true }).order('first_name', { ascending: true });

  if (debugWhere.length > 0) {
    debugSql += " WHERE " + debugWhere.join(" AND ");
  }
  console.log("🚀 Executing SQL:", debugSql + " ORDER BY last_name ASC, first_name ASC");

  const { data, error } = await query;

  if (btn) { btn.textContent = originalText; btn.disabled = false; }

  if (error) {
    console.error("Search error", error);
    if (error.code === "42501") {
      alert("Database Permission Error: Public search is not allowed. Please run the SQL GRANT commands in Supabase.");
    } else {
      alert(`Error searching profiles: ${error.message}`);
    }
    return;
  }

  // Client-side Height Filter
  const filteredData = data.filter(p => {
    if (!p.height) return true; 
    const hInches = parseHeightToInches(p.height);
    if (!hInches) return true; // Keep if we can't parse, or strictly exclude? Keeping for now.
    return hInches >= minHeight && hInches <= maxHeight;
  });

  // Collapse search section and show toggle button
  const searchCard = document.getElementById("searchCard");
  const toggleContainer = document.getElementById("searchToggleContainer");
  const toggleBtn = document.getElementById("toggleSearchBtn");
  if (searchCard && toggleContainer) {
    searchCard.classList.add("hidden");
    toggleContainer.classList.remove("hidden");
    if (toggleBtn) toggleBtn.textContent = "Show Search Filters";
  }

  allFilteredProfiles = filteredData;
  currentPage = 1;
  renderPage();
}

function parseHeightToInches(heightStr) {
  if (!heightStr) return null;
  // Matches: 5' 10", 5ft 10in, 5'10
  const ftMatch = heightStr.match(/(\d+)\s*(?:'|ft)/);
  const inMatch = heightStr.match(/(\d+)\s*(?:"|in)/);
  
  if (ftMatch) {
    const ft = parseInt(ftMatch[1]);
    const inch = inMatch ? parseInt(inMatch[1]) : 0;
    return (ft * 12) + inch;
  }
  return null;
}

function renderResults(profiles) {
  const section = document.getElementById("searchResultsSection");
  const grid = document.getElementById("searchResultsGrid");
  
  if (section) section.classList.remove("hidden");
  if (!grid) return;

  grid.innerHTML = "";

  if (profiles.length === 0) {
    grid.innerHTML = `<div class="col-span-full text-center text-gray-500 py-8">No profiles found matching your criteria.</div>`;
    return;
  }

  profiles.forEach(p => {
    const card = document.createElement("div");
    card.className = "bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer flex flex-col";
    
    // Photo logic
    let photoUrl = null;
    if (Array.isArray(p.photos) && p.photos.length > 0) {
      photoUrl = p.photos[0];
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
    
    // Calculate Age
    let age = "N/A";
    if (p.datetime_of_birth) {
        const dob = new Date(p.datetime_of_birth);
        const diff = Date.now() - dob.getTime();
        const ageDate = new Date(diff);
        age = Math.abs(ageDate.getUTCFullYear() - 1970);
    }

    const occupationTag = p.occupation_tag || "Unknown";
    const citizenship = p.citizenship || "Unknown";

    card.innerHTML = `
      ${imgHtml}
      <div class="p-5 flex-grow flex flex-col">
        <div class="flex justify-between items-start mb-4">
           <div>
             <h3 class="font-bold text-gray-900">${name}</h3>
             <p class="text-xs text-gray-500">Verified Profile</p>
           </div>
           <span class="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">${p.gender || "Not Specified"}</span>
        </div>

        <div class="space-y-2 text-sm text-gray-600 mb-4">
           <div class="flex justify-between">
             <span>Age:</span>
             <span class="font-medium text-gray-900">${age} yrs</span>
           </div>
           <div class="flex justify-between">
             <span>Height:</span>
             <span class="font-medium text-gray-900">${p.height || "-"}</span>
           </div>
           <div class="flex justify-between">
             <span>Occupation:</span>
             <span class="font-medium text-gray-900" title="${p.occupation || ""}">${occupationTag}</span>
           </div>
           <div class="flex justify-between">
             <span>Immigration:</span>
             <span class="font-medium text-gray-900">${citizenship}</span>
           </div>
        </div>

        <div class="mt-auto pt-3 border-t border-gray-100">
          <span class="block w-full text-center text-sm font-semibold text-indigo-600 hover:text-indigo-500">
            View Profile &rarr;
          </span>
        </div>
      </div>
    `;

    card.addEventListener("click", () => openProfileModal(p));

    grid.appendChild(card);
  });
  
  // section.scrollIntoView({ behavior: 'smooth' }); // Removed to prevent annoying scroll on initial load
}

async function loadOccupationOptions() {
  const select = document.getElementById("searchOccupation");
  if (!select) return;

  const { data, error } = await supabase
    .schema("cabo")
    .from("ma_biodata")
    .select("occupation_tag");

  if (error) {
    console.error("Error loading occupations:", error);
    return;
  }

  const distinctTags = new Set();
  data.forEach(row => {
    const tag = row.occupation_tag || "Unknown";
    distinctTags.add(tag);
  });

  const sortedTags = Array.from(distinctTags).sort();

  select.innerHTML = '<option value="">Any Occupation</option>';

  sortedTags.forEach(tag => {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = tag;
    select.appendChild(option);
  });
}

function openProfileModal(p) {
  const modal = document.getElementById("profileModal");
  const nameEl = document.getElementById("modalProfileName");
  const contentEl = document.getElementById("modalProfileContent");
  const editBtn = document.getElementById("modalEditBtn");

  if (!modal) return;

  const name = `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Unnamed";
  nameEl.textContent = name;

  // Setup Edit Button
  editBtn.onclick = () => {
    window.location.hash = `#/details/${p.id}?edit=true`;
  };

  // Photo logic
  let photoUrl = null;
  if (Array.isArray(p.photos) && p.photos.length > 0) {
    photoUrl = p.photos[0];
  } else if (typeof p.photos === "string") {
    try {
      const parsed = JSON.parse(p.photos);
      if (Array.isArray(parsed) && parsed.length > 0) photoUrl = parsed[0];
    } catch(e) {}
  }
  const imgHtml = photoUrl 
    ? `<img src="${photoUrl}" class="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md mx-auto mb-4" alt="Profile Photo">` 
    : `<div class="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm mx-auto mb-4 border-4 border-white shadow-md">No Photo</div>`;

  // Calculate Age
  let age = "N/A";
  if (p.datetime_of_birth) {
    const dob = new Date(p.datetime_of_birth);
    const diff = Date.now() - dob.getTime();
    const ageDate = new Date(diff);
    age = Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  contentEl.innerHTML = `
    <div class="text-center">
      ${imgHtml}
      <h4 class="text-xl font-bold text-gray-900">${name}</h4>
      <p class="text-sm text-gray-500">${p.occupation || "Occupation not specified"}</p>
    </div>
    <div class="grid grid-cols-2 gap-4 text-sm mt-6">
      <div><span class="font-semibold text-gray-700">Age:</span> ${age}</div>
      <div><span class="font-semibold text-gray-700">Gender:</span> ${p.gender || "-"}</div>
      <div><span class="font-semibold text-gray-700">Height:</span> ${p.height || "-"}</div>
      <div><span class="font-semibold text-gray-700">Location:</span> ${p.current_location || "-"}</div>
      <div><span class="font-semibold text-gray-700">Citizenship:</span> ${p.citizenship || "-"}</div>
      <div><span class="font-semibold text-gray-700">Education:</span> ${p.education || "-"}</div>
    </div>
    <div class="mt-4">
      <h5 class="font-semibold text-gray-800 mb-1">About</h5>
      <p class="text-gray-600 text-sm leading-relaxed">${p.bio || "No bio available."}</p>
    </div>
  `;

  modal.classList.remove("hidden");
}

function closeProfileModal() {
  const modal = document.getElementById("profileModal");
  if (modal) modal.classList.add("hidden");
}
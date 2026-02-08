import { supabase } from "./supabase.js";
import { initPhoneInput } from "./profile_helpers.js";

// These will be null on first load — that's OK.
// We will re-query them inside initAdmin() after the DOM is ready.
let adminGate;
let adminContent;
let matchmakerList;
let createStatus;

let reloadBtn;
let createBtn;

// ✅ Wait until the DOM fragment is actually injected by router.js
async function initAdmin() {
  // Re-query DOM elements every time initAdmin runs
  adminGate = document.getElementById("adminGate");
  adminContent = document.getElementById("adminContent");
  matchmakerList = document.getElementById("matchmakerList");
  createStatus = document.getElementById("createStatus");

  reloadBtn = document.getElementById("reloadMatchmakers");
  createBtn = document.getElementById("createMatchmakerBtn");

  // ✅ If the router hasn't finished injecting admin.html yet, retry
if (!adminGate || !adminContent) {
  console.error("RK Admin HTML not found. Check router injection.");
  return;
}

  // ✅ Attach event listeners AFTER DOM exists
  reloadBtn?.addEventListener("click", loadMatchmakers);
  createBtn?.addEventListener("click", createMatchmaker);

  // ✅ Now run admin access check
  const user = await requireAdmin();
  if (!user) return;

  await loadMatchmakers();

  // Init create form phone
  await initPhoneInput(document.getElementById("mm_phone"));
}

async function requireAdmin() {
  adminGate.classList.add("hidden");
  adminContent.classList.add("hidden");
  adminGate.textContent = "";

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.user) {
    adminGate.textContent = "You must be signed in to access admin tools.";
    adminGate.classList.remove("hidden");
    return null;
  }

  const userId = session.user.id;

  const { data: adminRow } = await supabase
    .schema("cabo")
    .from("mm_admin")
    .select("id")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (!adminRow) {
    adminGate.textContent = "You do not have admin access.";
    adminGate.classList.remove("hidden");
    return null;
  }

  adminContent.classList.remove("hidden");
  return session.user;
}

async function loadMatchmakers() {
  matchmakerList.innerHTML =
    '<div class="text-sm text-gray-500">Loading matchmakers...</div>';

  const { data, error } = await supabase
    .schema("cabo")
    .from("mm_matchmakers")
    .select("*")
    .order("last_name", { ascending: true });

  if (error) {
    matchmakerList.innerHTML =
      '<div class="text-sm text-red-600">Error loading matchmakers.</div>';
    return;
  }

  if (!data || data.length === 0) {
    matchmakerList.innerHTML =
      '<div class="text-sm text-gray-500">No matchmakers yet.</div>';
    return;
  }

  matchmakerList.innerHTML = "";
  data.forEach(renderMatchmakerRow);
}

async function renderMatchmakerRow(m) {
  const container = document.createElement("div");
  container.className =
    "rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm";

  const name = `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim();

  container.innerHTML = `
    <div class="flex items-start justify-between">
      <div>
        <div class="font-medium text-gray-900">${name || "(No name)"}</div>
        <div class="text-sm text-gray-600">${m.email || "No email"}</div>
        ${
          m.phone
            ? `<div class="text-sm text-gray-600 mt-0.5">${m.phone}</div>`
            : ""
        }
      </div>
      <button
        class="text-sm text-blue-600 underline ml-4"
        data-mm-id="${m.id}"
      >
        Edit
      </button>
    </div>
    <div class="mt-3 hidden" data-mm-edit-panel="${m.id}"></div>
  `;

  const editBtn = container.querySelector("button[data-mm-id]");
  const panel = container.querySelector(`div[data-mm-edit-panel="${m.id}"]`);

  editBtn.addEventListener("click", () => {
    const isOpen = !panel.classList.contains("hidden");
    if (isOpen) {
      panel.classList.add("hidden");
      panel.innerHTML = "";
    } else {
      openEditPanel(m, panel);
    }
  });

  // Init edit form phone
  await initPhoneInput(panel.querySelector("[data-mm-edit-phone]"));

  matchmakerList.appendChild(container);
}

function openEditPanel(m, panel) {
  panel.classList.remove("hidden");

  panel.innerHTML = `
    <div class="mt-2 border-t border-gray-100 pt-3 space-y-3">
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">First Name</label>
        <input type="text" class="w-full rounded border border-gray-300 px-2 py-1 text-sm"
          value="${m.first_name ?? ""}" data-mm-edit-first />
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
        <input type="text" class="w-full rounded border border-gray-300 px-2 py-1 text-sm"
          value="${m.last_name ?? ""}" data-mm-edit-last />
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">Email</label>
        <input type="email" class="w-full rounded border border-gray-300 px-2 py-1 text-sm"
          value="${m.email ?? ""}" data-mm-edit-email />
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">Phone</label>
        <input type="tel" class="w-full rounded border border-gray-300 px-2 py-1 text-sm"
          value="${m.phone ?? ""}" data-mm-edit-phone />
      </div>

      <div class="flex items-center justify-between">
        <div class="text-xs text-gray-500" data-mm-edit-status></div>
        <div class="space-x-2">
          <button class="text-xs px-3 py-1 rounded border border-gray-300 text-gray-700"
            data-mm-edit-cancel>Cancel</button>
          <button class="text-xs px-3 py-1 rounded bg-blue-600 text-white"
            data-mm-edit-save>Save</button>
        </div>
      </div>
    </div>
  `;

  const firstInput = panel.querySelector("[data-mm-edit-first]");
  const lastInput = panel.querySelector("[data-mm-edit-last]");
  const emailInput = panel.querySelector("[data-mm-edit-email]");
  const phoneInput = panel.querySelector("[data-mm-edit-phone]");
  const statusEl = panel.querySelector("[data-mm-edit-status]");
  const cancelBtn = panel.querySelector("[data-mm-edit-cancel]");
  const saveBtn = panel.querySelector("[data-mm-edit-save]");

  cancelBtn.addEventListener("click", () => {
    panel.classList.add("hidden");
    panel.innerHTML = "";
  });

  saveBtn.addEventListener("click", async () => {
    statusEl.textContent = "Saving...";

    const payload = {
      first_name: firstInput.value.trim() || null,
      last_name: lastInput.value.trim() || null,
      email: emailInput.value.trim() || null,
      phone: phoneInput._iti 
        ? phoneInput._iti.getNumber() 
        : phoneInput.value.trim() || null,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .schema("cabo")
      .from("mm_matchmakers")
      .update(payload)
      .eq("id", m.id);

    if (error) {
      statusEl.textContent = "Error saving changes.";
      return;
    }

    statusEl.textContent = "Saved.";
    await loadMatchmakers();
  });
}

async function createMatchmaker() {
  createStatus.textContent = "";

  const first = document.getElementById("mm_first").value.trim();
  const last = document.getElementById("mm_last").value.trim();
  const email = document.getElementById("mm_email").value.trim();
  const phoneEl = document.getElementById("mm_phone");
  const phone = phoneEl._iti ? phoneEl._iti.getNumber() : phoneEl.value.trim();

  if (!first || !last || !email) {
    createStatus.textContent =
      "First name, last name, and email are required.";
    return;
  }

  createStatus.textContent = "Creating...";

  const payload = {
    first_name: first,
    last_name: last,
    email,
    phone: phone || null
  };

  const { error } = await supabase
    .schema("cabo")
    .from("mm_matchmakers")
    .insert(payload);

  if (error) {
    createStatus.textContent = "Error creating matchmaker.";
    return;
  }

  createStatus.textContent = "Matchmaker created.";

  document.getElementById("mm_first").value = "";
  document.getElementById("mm_last").value = "";
  document.getElementById("mm_email").value = "";
  document.getElementById("mm_phone").value = "";

  await loadMatchmakers();
}

// ✅ Start admin logic AFTER DOM fragment is injected
setTimeout(initAdmin, 0);
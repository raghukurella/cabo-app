import { supabase } from "./supabase.js";

let questions = [];

export async function init() {
  const btnAdd = document.getElementById("btnAddQuestion");
  const btnClose = document.getElementById("qbModalClose");
  const btnCancel = document.getElementById("qbCancel");
  const btnSave = document.getElementById("qbSave");
  const btnDelete = document.getElementById("qbDelete");
  const modal = document.getElementById("qbModal");

  if (btnAdd) btnAdd.addEventListener("click", () => openModal());
  if (btnClose) btnClose.addEventListener("click", closeModal);
  if (btnCancel) btnCancel.addEventListener("click", closeModal);
  if (btnSave) btnSave.addEventListener("click", handleSave);
  if (btnDelete) btnDelete.addEventListener("click", () => handleDelete());

  // Close on click outside
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }

  await loadQuestions();
}

async function loadQuestions() {
  const tbody = document.getElementById("qbList");
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">Loading...</td></tr>';

  const { data, error } = await supabase
    .schema("cabo")
    .from("mj_question_bank")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error loading questions:", error);
    tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-red-500">Error loading data</td></tr>';
    return;
  }

  questions = data || [];
  renderQuestions();
}

function renderQuestions() {
  const tbody = document.getElementById("qbList");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (questions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No questions found.</td></tr>';
    return;
  }

  questions.forEach(q => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-gray-50 cursor-pointer transition-colors";
    
    const activeBadge = q.is_active 
      ? '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>' 
      : '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Inactive</span>';
      
    const reqBadge = q.is_required
      ? '<span class="ml-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Req</span>'
      : '';

    tr.innerHTML = `
      <td class="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">${q.sort_order}</td>
      <td class="px-6 py-4 text-sm text-gray-900 font-medium">
        ${q.question_text}
        ${q.message ? `<div class="text-xs text-gray-400 mt-0.5">${q.message}</div>` : ''}
      </td>
      <td class="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div class="font-mono text-xs">${q.field_key}</div>
        <div class="text-xs text-gray-400">${q.control_type}</div>
      </td>
      <td class="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">${q.category || '-'}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        ${activeBadge}
        ${reqBadge}
      </td>
    `;

    tr.addEventListener("click", () => openModal(q));
    
    tbody.appendChild(tr);
  });
}

function openModal(q = null) {
  const modal = document.getElementById("qbModal");
  const title = document.getElementById("qbModalTitle");
  const btnDelete = document.getElementById("qbDelete");
  const form = document.getElementById("qbForm");
  
  form.reset();
  
  if (q) {
    title.textContent = "Edit Question";
    document.getElementById("qb_id").value = q.id;
    document.getElementById("qb_text").value = q.question_text || "";
    document.getElementById("qb_key").value = q.field_key || "";
    document.getElementById("qb_category").value = q.category || "profile";
    document.getElementById("qb_control").value = q.control_type || "input";
    document.getElementById("qb_sort").value = q.sort_order || 10;
    document.getElementById("qb_message").value = q.message || "";
    document.getElementById("qb_active").checked = !!q.is_active;
    document.getElementById("qb_required").checked = !!q.is_required;
    document.getElementById("qb_options").value = q.options ? JSON.stringify(q.options, null, 2) : "";
    btnDelete.classList.remove("hidden");
  } else {
    title.textContent = "Add New Question";
    document.getElementById("qb_id").value = "";
    document.getElementById("qb_active").checked = true;
    document.getElementById("qb_required").checked = false;
    document.getElementById("qb_sort").value = 10;
    btnDelete.classList.add("hidden");
  }
  
  modal.classList.remove("hidden");
  document.getElementById("qb_text").focus();
}

function closeModal() {
  document.getElementById("qbModal").classList.add("hidden");
}

async function handleSave() {
  const id = document.getElementById("qb_id").value;
  const text = document.getElementById("qb_text").value.trim();
  const key = document.getElementById("qb_key").value.trim();
  const category = document.getElementById("qb_category").value;
  const control = document.getElementById("qb_control").value;
  const sort = parseInt(document.getElementById("qb_sort").value) || 0;
  const message = document.getElementById("qb_message").value.trim();
  const active = document.getElementById("qb_active").checked;
  const required = document.getElementById("qb_required").checked;
  const optionsRaw = document.getElementById("qb_options").value.trim();

  if (!text || !key) {
    alert("Question Text and Field Key are required.");
    return;
  }

  let options = null;
  if (optionsRaw) {
    try {
      options = JSON.parse(optionsRaw);
      if (!Array.isArray(options)) {
        alert("Options must be a JSON Array.");
        return;
      }
    } catch (e) {
      alert("Invalid JSON in Options field.");
      return;
    }
  }

  const payload = {
    question_text: text,
    field_key: key,
    category: category,
    control_type: control,
    sort_order: sort,
    message: message || null,
    is_active: active,
    is_required: required,
    options: options
  };

  let error;
  
  if (id) {
    const { error: updateError } = await supabase
      .schema("cabo")
      .from("mj_question_bank")
      .update(payload)
      .eq("id", id);
    error = updateError;
  } else {
    const { error: insertError } = await supabase
      .schema("cabo")
      .from("mj_question_bank")
      .insert([{ ...payload, id: crypto.randomUUID() }]);
    error = insertError;
  }

  if (error) {
    console.error("Save error:", error);
    alert("Error saving: " + error.message);
    return;
  }

  closeModal();
  await loadQuestions();
}

async function handleDelete(id = null) {
  if (!id) {
    id = document.getElementById("qb_id").value;
  }
  if (!id) return;

  if (!confirm("Are you sure you want to delete this question?")) return;

  const { error } = await supabase
    .schema("cabo")
    .from("mj_question_bank")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Delete error:", error);
    alert("Error deleting: " + error.message);
    return;
  }

  closeModal();
  await loadQuestions();
}
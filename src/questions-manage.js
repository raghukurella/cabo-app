import { supabase } from "./supabase.js";

let questions = [];

export async function init() {
  const form = document.getElementById("questionForm");
  const btnCancel = document.getElementById("btnCancel");
  const btnAdd = document.getElementById("btnAdd");

  if (form) form.addEventListener("submit", handleSave);
  if (btnCancel) btnCancel.addEventListener("click", closeModal);
  if (btnAdd) btnAdd.addEventListener("click", openAddModal);

  await loadQuestions();
}

async function loadQuestions() {
  const tbody = document.getElementById("questionsList");
  if (!tbody) return;
  
  tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">Loading...</td></tr>';

  const { data, error } = await supabase
    .schema("cabo")
    .from("mm_questions")
    .select("*")
    .order("category", { ascending: false })
    .order("sort_order", { ascending: true });

  if (error) {
    console.error(error);
    tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">Error loading questions</td></tr>';
    return;
  }

  questions = data || [];
  renderQuestions();
}

function renderQuestions() {
  const tbody = document.getElementById("questionsList");
  if (!tbody) return;
  
  tbody.innerHTML = "";

  if (questions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">No questions found.</td></tr>';
    return;
  }

  questions.forEach(q => {
    const tr = document.createElement("tr");
    
    const statusClass = q.is_active 
      ? "bg-green-100 text-green-800" 
      : "bg-gray-100 text-gray-800";
    const statusText = q.is_active ? "Active" : "Inactive";

    tr.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${q.sort_order}</td>
      <td class="px-6 py-4 text-sm text-gray-900 font-medium">${q.question_text}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div class="font-mono text-xs">${q.field_key}</div>
        <div class="text-xs text-gray-400">${q.control_type}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">${q.category}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
          ${statusText}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button class="text-indigo-600 hover:text-indigo-900 btn-edit" data-id="${q.id}">Edit</button>
      </td>
    `;

    tr.querySelector(".btn-edit").addEventListener("click", () => editQuestion(q));
    tbody.appendChild(tr);
  });
}

function openAddModal() {
  resetForm();
  document.getElementById("questionModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("questionModal").classList.add("hidden");
  resetForm();
}

function editQuestion(q) {
  document.getElementById("formTitle").textContent = "Edit Question";
  document.getElementById("q_id").value = q.id;
  document.getElementById("q_text").value = q.question_text;
  document.getElementById("q_key").value = q.field_key;
  document.getElementById("q_category").value = q.category;
  document.getElementById("q_control").value = q.control_type;
  document.getElementById("q_sort").value = q.sort_order;
  document.getElementById("q_active").checked = q.is_active;
  
  const opts = q.dropdown_options;
  document.getElementById("q_options").value = opts ? JSON.stringify(opts, null, 2) : "";

  document.getElementById("btnSave").textContent = "Update Question";
  
  document.getElementById("questionModal").classList.remove("hidden");
}

function resetForm() {
  document.getElementById("questionForm").reset();
  document.getElementById("q_id").value = "";
  document.getElementById("formTitle").textContent = "Add New Question";
  document.getElementById("btnSave").textContent = "Save Question";
  document.getElementById("q_active").checked = true;
}

async function handleSave(e) {
  e.preventDefault();
  
  const id = document.getElementById("q_id").value;
  const text = document.getElementById("q_text").value.trim();
  const key = document.getElementById("q_key").value.trim();
  const category = document.getElementById("q_category").value;
  const control = document.getElementById("q_control").value;
  const sort = parseInt(document.getElementById("q_sort").value) || 0;
  const active = document.getElementById("q_active").checked;
  const optionsRaw = document.getElementById("q_options").value.trim();

  let options = null;
  if (optionsRaw) {
    try {
      options = JSON.parse(optionsRaw);
      if (!Array.isArray(options)) {
        alert("Dropdown options must be a JSON Array (e.g. ['A', 'B'])");
        return;
      }
    } catch (err) {
      alert("Invalid JSON in Dropdown Options");
      return;
    }
  }

  const payload = {
    question_text: text,
    field_key: key,
    category: category,
    control_type: control,
    sort_order: sort,
    is_active: active,
    dropdown_options: options
  };

  let error;
  
  if (id) {
    // Update
    const { data, error: updateError } = await supabase
      .schema("cabo")
      .from("mm_questions")
      .update(payload)
      .eq("id", id)
      .select();

    if (!updateError && (!data || data.length === 0)) {
      alert("Update failed: RLS policy blocked the change.");
      return;
    }
    error = updateError;
  } else {
    // Insert
    const { data, error: insertError } = await supabase
      .schema("cabo")
      .from("mm_questions")
      .insert([{ ...payload, id: crypto.randomUUID() }]);
      // Insert usually throws error on RLS failure, but good to be consistent
    error = insertError;
  }

  if (error) {
    console.error(error);
    alert("Error saving question: " + error.message);
    return;
  }

  closeModal();
  await loadQuestions();
}
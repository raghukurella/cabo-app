// --- UI Toggle for Filters ---
document.addEventListener('DOMContentLoaded', () => {
  const searchBar = document.getElementById('searchBar');
  const filtersPanel = document.getElementById('filtersPanel');
  const toggleBtn = document.getElementById('toggleFilters');
  const applyBtn = document.getElementById('applyFilters');

  if (!searchBar || !filtersPanel || !toggleBtn || !applyBtn) {
    console.warn('Filter UI elements missing');
    return;
  }

  // Start collapsed
  searchBar.classList.add('hidden');
  filtersPanel.classList.add('hidden');
  toggleBtn.textContent = 'Show Filters';

  function toggleFilters() {
    const isHidden = filtersPanel.classList.contains('hidden');
    if (isHidden) {
      searchBar.classList.remove('hidden');
      filtersPanel.classList.remove('hidden');
      toggleBtn.textContent = 'Hide Filters';
    } else {
      searchBar.classList.add('hidden');
      filtersPanel.classList.add('hidden');
      toggleBtn.textContent = 'Show Filters';
    }
  }

  // Toggle button uses the function
  toggleBtn.addEventListener('click', toggleFilters);

  // Apply button can also collapse after applying filters
  applyBtn.addEventListener('click', () => {
    toggleFilters(); // collapse panels after applying
  });
});

// --- Global State ---
const state = {
  currentPage: 0,
  pageSize: 10,
  filters: { gender: '', zip: '', education: '' },
  searchTerm: '',
  usersById: {},
  questions: []
};

// --- Helper Functions ---
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return '';

  let birthDate;
  if (/^\d{4}$/.test(dateOfBirth.toString().trim())) {
    birthDate = new Date(`${dateOfBirth}-01-01`);
  } else {
    birthDate = new Date(dateOfBirth);
  }

  if (isNaN(birthDate.getTime())) {
    return '';
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age > 0 ? age : '';
}

// --- UI Rendering ---
function renderHeader() {
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');

  ['Full Name', 'Age', 'Phone', 'Education', 'Actions'].forEach(label => {
    const th = document.createElement('th');
    th.textContent = label;
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  return thead;
}

function renderRow(user, questions) {
  console.log(user);

  const row = document.createElement('tr');

  if (user.gender) {
    const g = user.gender.toLowerCase();
    if (g === 'female') {
      row.style.backgroundColor = 'lightpink';
    } else if (g === 'male') {
      row.style.backgroundColor = 'lightblue';
    }
  }

  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();

  row.innerHTML = `
    <td>${fullName}</td>
    <td>${calculateAge(user.date_of_birth)}</td>
    <td>${user.phone_number || ''}</td>
    <td>${user.education || ''}</td>
    <td class="actions-cell"><button class="detailsBtn iconBtn">☰</button></td>
  `;

  const detailsRow = document.createElement('tr');
  detailsRow.style.display = 'none';
  const detailsCell = document.createElement('td');
  detailsCell.colSpan = 5;

let detailsHTML = `
  <table class="details-table">
    <tr><td>Full Name</td><td>${fullName}</td></tr>
    <tr><td>Place of Birth</td><td>${user.place_of_birth || ''}</td></tr>
    <tr><td>Email</td><td>${user.email || ''}</td></tr>
    <tr><td>Phone Number</td><td>${user.phone_number || ''}</td></tr>
    <tr><td>Date of Birth</td><td>${user.date_of_birth || ''}</td></tr>
    <tr><td>Time of Birth</td><td>${user.time_of_birth || ''}</td></tr>
    <tr><td>Height</td><td>${formatHeight(user.height_feet, user.height_inches)}</td></tr>
    <tr><td>Country of Citizenship</td><td>${user.country_of_citizenship || ''}</td></tr>
    <tr><td>Zipcode</td><td>${user.zip || ''}</td></tr>
    <tr><td>Citizenship at Birth</td><td>${user.citizenship_at_birth || ''}</td></tr>
    <tr><td>Highest Education</td><td>${user.education || ''} ${user.highest_degree || ''}</td></tr>
    <tr><td>Secondary Education</td><td>${user.secondary_education || ''}</td></tr>
    <tr><td>Secondary Degree</td><td>${user.secondary_degree || ''}</td></tr>
    <tr><td>Education Notes</td><td>${user.education_notes || ''}</td></tr>
    <tr><td>Previously Married</td><td>${user.previously_married ? 'Yes' : 'No'}</td></tr>
    <tr><td>Nakshatram</td><td>${user.nakshatram || ''}</td></tr>
    <tr><td>Raasi</td><td>${user.raasi || ''}</td></tr>
    <tr><td>Lagnam</td><td>${user.lagnam || ''}</td></tr>
    <tr><td>Gothram</td><td>${user.gothram || ''}</td></tr>
  </table>
  <div style="margin-top:1em;">
    <strong>Responses:</strong>
    <ul>
`;

questions.forEach(q => {
  detailsHTML += `<li>${q}: ${user.responses[q] || ''}</li>`;
});

detailsHTML += `</ul>
  <button class="removeBtn" data-id="${user.demographic_id}">🗑️ Remove</button>
</div>`;

  detailsCell.innerHTML = detailsHTML;
  detailsRow.appendChild(detailsCell);

  const detailsBtn = row.querySelector('.detailsBtn');
  if (detailsBtn) {
    detailsBtn.addEventListener('click', () => {
      detailsRow.style.display = detailsRow.style.display === 'none' ? 'table-row' : 'none';
    });
  }

  return [row, detailsRow];
}

function formatHeight(feet, inches) {
  if (!feet) return '';
  // Ensure values are numbers or strings
  const ft = feet.toString();
  const inch = inches ? inches.toString() : '';

  return inch ? `${ft}' ${inch}"` : `${ft}'`;
}

function renderBody(users, questions) {
  const tbody = document.createElement('tbody');
  users.forEach(user => {
    const [mainRow, detailsRow] = renderRow(user, questions);
    tbody.appendChild(mainRow);
    tbody.appendChild(detailsRow);
  });
  return tbody;
}

function renderPagination(currentPage, totalPages) {
  const pagination = document.getElementById('paginationControls');
  if (!pagination) return;
  pagination.innerHTML = '';

  if (totalPages <= 1) return;

  const prevBtn = document.createElement('button');
  prevBtn.textContent = 'Previous';
  prevBtn.disabled = currentPage <= 0;
  prevBtn.onclick = () => loadResults(currentPage - 1, state.filters, state.searchTerm);

  const pageInfo = document.createElement('span');
  pageInfo.textContent = `Page ${currentPage + 1} of ${totalPages}`;
  pageInfo.className = 'page-info';

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next';
  nextBtn.disabled = currentPage >= totalPages - 1;
  nextBtn.onclick = () => loadResults(currentPage + 1, state.filters, state.searchTerm);

  pagination.appendChild(prevBtn);
  pagination.appendChild(pageInfo);
  pagination.appendChild(nextBtn);
}

function renderTable(users, questions, totalUsers, totalPages) {
  const container = document.getElementById('resultsContainer');
  if (!container) return;
  container.innerHTML = '';

  if (!users || users.length === 0) {
    container.innerHTML = '<p>No results found.</p>';
    const pag = document.getElementById('paginationControls');
    if (pag) pag.innerHTML = '';
    return;
  }

  const table = document.createElement('table');
  table.appendChild(renderHeader());
  table.appendChild(renderBody(users, questions));
  container.appendChild(table);

  renderPagination(state.currentPage, totalPages);
}

// --- Filtering ---
function applyFilters(users, filters = {}, searchTerm = '') {
  const term = (searchTerm || '').toLowerCase();

  return users.filter(u => {
    const genderMatch = !filters.gender ||
      (u.gender || '').toLowerCase() === filters.gender.toLowerCase();

    const zipMatch = !filters.zip ||
      (u.zip || '').toLowerCase().includes(filters.zip.toLowerCase());

    const educationMatch = !filters.education ||
      (u.education || '').toLowerCase() === filters.education.toLowerCase();

    const searchMatch = !term ||
      (u.first_name || '').toLowerCase().includes(term) ||
      (u.last_name || '').toLowerCase().includes(term) ||
      (u.education || '').toLowerCase().includes(term);

    return genderMatch && zipMatch && educationMatch && searchMatch;
  });
}

// --- Data Fetch ---
async function fetchFromFirstAvailableView() {
  const viewCandidates = ['unified_results', 'matchmaker_results'];

  for (const viewName of viewCandidates) {
    const { data, error } = await window.supabaseClient
      .from(viewName)
      .select('*')
      .limit(2000);

    if (error) {
      console.warn(`${viewName} query error:`, error.message || error);
      continue;
    }

    const nonDeletedRows = (data || []).filter(row => !row.deleted_date);
    if (nonDeletedRows && nonDeletedRows.length) {
      return { view: viewName, rows: nonDeletedRows };
    }
  }

  return { view: null, rows: [] };
}

function groupRowsIntoUsers(rows) {
  const usersById = {};
  const questionsSet = new Set();

  rows.forEach(row => {
    const key = row.demographic_id;
    if (!key) return;

    if (row.question_text) {
      questionsSet.add(row.question_text);
    }

    if (!usersById[key]) {
      const [firstName, ...lastNameParts] = (row.full_name || '').split(' ');
      const lastName = lastNameParts.join(' ');

      usersById[key] = {
        demographic_id: row.demographic_id,
        first_name: firstName || '',
        last_name: lastName || '',
        email: row.email || '',
        phone_number: row.phone_number || '',
        gender: row.gender || '',
        zip: row.zip || '',
        date_of_birth: row.date_of_birth || '',
        education: row.education || '',
        responses: {}
      };
    }

    if (row.question_text) {
      usersById[key].responses[row.question_text] =
        row.answer === null || row.answer === undefined
          ? ''
          : (row.answer ? 'Yes' : 'No');
    }
  });

  return { usersById, questions: Array.from(questionsSet) };
}

async function hydrateResults() {
  const { view, rows } = await fetchFromFirstAvailableView();
  const { usersById, questions } = groupRowsIntoUsers(rows);

  // Enrich from demographics
  const { data: demographics, error } = await window.supabaseClient
    .from('demographics')
    .select('*')
    .limit(2000);

if (!error && demographics) {
  const demographicIds = new Set(Object.keys(usersById));
  demographics.forEach(demo => {
    if (demographicIds.has(demo.id)) {
      const user = usersById[demo.id];

      user.phone_number = demo.phone_number || '';
      user.zip = demo.zip || '';
      user.date_of_birth = demo.date_of_birth || '';
      user.time_of_birth = demo.time_of_birth || '';
      user.place_of_birth = demo.place_of_birth || '';
      user.height_feet = demo.height_feet || '';
      user.height_inches = demo.height_inches || '';
      user.country_of_citizenship = demo.country_of_citizenship || '';
      user.citizenship_at_birth = demo.citizenship_at_birth || '';
      user.highest_degree = demo.highest_degree || '';
      user.secondary_education = demo.secondary_education || '';
      user.secondary_degree = demo.secondary_degree || '';
      user.education_notes = demo.education_notes || '';
      user.previously_married = demo.previously_married || false;
      user.nakshatram = demo.nakshatram || '';
      user.raasi = demo.raasi || '';
      user.lagnam = demo.lagnam || '';
      user.gothram = demo.gothram || '';

      // keep your existing education/email logic
      user.education = demo.highest_education_level || '';
      if (!user.email && demo.email) {
        user.email = demo.email;
      }
    }
  });
}

  state.usersById = usersById;
  state.questions = questions;
}

// --- Populate Filters ---
async function populateFilters() {
  const genderSelect = document.getElementById('filterGender');
  const zipSelect = document.getElementById('filterZip');
  const educationSelect = document.getElementById('filterEducation');

  if (!genderSelect || !zipSelect || !educationSelect) {
    console.error('Filter elements not found.');
    return;
  }

  genderSelect.innerHTML = '<option value="">All</option>';
  zipSelect.innerHTML = '<option value="">All</option>';
  educationSelect.innerHTML = '<option value="">All</option>';

  const { data: allDemographics, error: fetchError } = await window.supabaseClient
    .from('demographics')
    .select('*')
    .limit(2000);

  if (fetchError) {
    console.error('Filter fetch error:', fetchError);
    alert('Error loading filters.');
    return;
  }

  const rows = allDemographics || [];

  const uniqueGenders = [...new Set(rows
    .filter(r => !r.deleted_date && r.gender)
    .map(r => r.gender.trim()))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const uniqueZips = [...new Set(rows
    .filter(r => !r.deleted_date && r.zip)
    .map(r => r.zip.trim()))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const uniqueEducations = [...new Set(rows
    .filter(r => !r.deleted_date && r.highest_education_level)
    .map(r => r.highest_education_level.trim()))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  uniqueGenders.forEach(gender => {
    const opt = document.createElement('option');
    opt.value = gender;
    opt.textContent = gender;
    genderSelect.appendChild(opt);
  });

  uniqueZips.forEach(zip => {
    const opt = document.createElement('option');
    opt.value = zip;
    opt.textContent = zip;
    zipSelect.appendChild(opt);
  });

  uniqueEducations.forEach(education => {
    const opt = document.createElement('option');
    opt.value = education;
    opt.textContent = education;
    educationSelect.appendChild(opt);
  });
}

// --- Results + Pagination ---
function loadResults(page = 0, filters = {}, searchTerm = '') {
  state.currentPage = page;
  state.filters = filters;
  state.searchTerm = searchTerm;

  const allUsers = Object.values(state.usersById);
  const filteredUsers = applyFilters(allUsers, filters, searchTerm);

  const totalUsers = filteredUsers.length;
  if (totalUsers === 0) {
    renderTable([], state.questions, 0, 1);
    return;
  }

  const totalPages = Math.max(1, Math.ceil(totalUsers / state.pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * state.pageSize;
  const end = start + state.pageSize;
  const pageUsers = filteredUsers.slice(start, end);

  renderTable(pageUsers, state.questions, totalUsers, totalPages);
}

// --- Soft Delete ---
async function softDeleteDemographics(id) {
  alert('Soft deleting demographics ID: ' + id);

  if (!id) {
    alert('Missing record ID. Please try again.');
    return;
  }

  const { data, error } = await window.supabaseClient
    .from('demographics')
    .update({ deleted_date: new Date().toISOString() })
    .eq('id', id)
    .select();

  if (error) {
    console.error('Soft delete failed:', error.message);
    alert('Failed to remove demographics record. Please try again.');
  } else {
    console.log('Soft deleted row:', data);
    alert('Demographics record removed successfully.');

    // Update local state and re-render
    delete state.usersById[id];
    const allUsers = Object.values(state.usersById);
    const totalUsers = allUsers.length;
    const totalPages = Math.max(1, Math.ceil(totalUsers / state.pageSize));
    loadResults(Math.min(state.currentPage, totalPages - 1), state.filters, state.searchTerm);
  }
}

// --- Event Delegation for dynamic rows ---
document.addEventListener('DOMContentLoaded', () => {
  const resultsContainer = document.getElementById('resultsContainer');
  if (!resultsContainer) {
    console.warn('resultsContainer not found');
    return;
  }

  resultsContainer.addEventListener('click', e => {
    const target = e.target;
    if (target && target.classList && target.classList.contains('removeBtn')) {
      const id = target.dataset.id; // UUID from data-id
      alert('Clicked remove button for ID: ' + id);
      softDeleteDemographics(id);
    }
  });
});

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await populateFilters();
    await hydrateResults();
    loadResults(0, state.filters, state.searchTerm);
  } catch (err) {
    console.error('Initialization error:', err);
    alert('Error initializing page.');
  }

  // Apply Filters
  document.getElementById('applyFilters')?.addEventListener('click', () => {
    const nextFilters = {
      gender: document.getElementById('filterGender')?.value || '',
      zip: document.getElementById('filterZip')?.value || '',
      education: document.getElementById('filterEducation')?.value || ''
    };
    loadResults(0, nextFilters, state.searchTerm);
  });

  // Reset Filters + Search
  document.getElementById('resetFilters')?.addEventListener('click', () => {
    const fg = document.getElementById('filterGender');
    const fz = document.getElementById('filterZip');
    const fe = document.getElementById('filterEducation');
    const si = document.getElementById('searchInput');
    if (fg) fg.value = '';
    if (fz) fz.value = '';
    if (fe) fe.value = '';
    if (si) si.value = '';

    loadResults(0, { gender: '', zip: '', education: '' }, '');
  });

  // Search
  document.getElementById('searchButton')?.addEventListener('click', () => {
    const term = document.getElementById('searchInput')?.value || '';
    loadResults(0, state.filters, term);
  });

  // Optional: live search on input
  document.getElementById('searchInput')?.addEventListener('input', (e) => {
    const term = e.target.value || '';
    loadResults(0, state.filters, term);
  });
});
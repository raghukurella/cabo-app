export function disableFieldsUntilGenderChosen() {
  // Disable inputs, selects and buttons in step0 until a gender is chosen.
  // Keep the gender toggle buttons enabled (they live inside #genderToggle).
  document.querySelectorAll('#step0 input, #step0 select, #step0 button').forEach(field => {
    // Skip the hidden gender input and the genderToggle buttons
    if (field.id === 'gender' || field.closest('#genderToggle')) return;
    field.disabled = true;
  });
}

export function enableFieldsAfterGender() {
  // Re-enable inputs, selects and buttons in step0 after gender has been selected.
  document.querySelectorAll('#step0 input, #step0 select, #step0 button').forEach(field => {
    if (field.id === 'gender' || field.closest('#genderToggle')) return;
    field.disabled = false;
  });
}

export function initGenderToggle() {
  const genderHidden = document.getElementById('gender');
  const toggleWrap = document.getElementById('genderToggle');
  toggleWrap.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      genderHidden.value = btn.dataset.value;
      toggleWrap.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === btn));
      enableFieldsAfterGender();
    });
  });
}

export function populateDob() {
  const yearSel = document.getElementById('dobYear');
  const monthSel = document.getElementById('dobMonth');
  const daySel = document.getElementById('dobDay');
  const dobHidden = document.getElementById('date_of_birth');
  if (!yearSel || !monthSel || !daySel || !dobHidden) return;

  const currentYear = new Date().getFullYear();
  const maxYear = currentYear - 18;  // Minimum age 18
  const minYear = currentYear - 75;  // Maximum age 75
  
  yearSel.innerHTML = '<option value="">Year</option>';
  for (let y = maxYear; y >= minYear; y--) {
    yearSel.innerHTML += `<option value="${y}">${y}</option>`;
  }

  monthSel.innerHTML = '<option value="">Month</option>';
  for (let m = 1; m <= 12; m++) {
    monthSel.innerHTML += `<option value="${String(m).padStart(2,'0')}">${String(m).padStart(2,'0')}</option>`;
  }

  function refreshDays() {
    const y = parseInt(yearSel.value, 10);
    const m = parseInt(monthSel.value, 10);
    daySel.innerHTML = '<option value="">Day</option>';
    if (!y || !m) return;
    const daysInMonth = new Date(y, m, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      daySel.innerHTML += `<option value="${String(d).padStart(2,'0')}">${String(d).padStart(2,'0')}</option>`;
    }
  }

  function updateDobHidden() {
    if (yearSel.value && monthSel.value && daySel.value) {
      dobHidden.value = `${yearSel.value}-${monthSel.value}-${daySel.value}`;
    }
  }

  yearSel.addEventListener('change', () => { refreshDays(); updateDobHidden(); });
  monthSel.addEventListener('change', () => { refreshDays(); updateDobHidden(); });
  daySel.addEventListener('change', updateDobHidden);
}

export function populateTob() {
  const hourSel = document.getElementById('tobHour');
  const minuteSel = document.getElementById('tobMinute');
  const ampmWrap = document.getElementById('tobAmPm');
  const tobHidden = document.getElementById('time_of_birth');
  if (!hourSel || !minuteSel || !ampmWrap || !tobHidden) return;

  hourSel.innerHTML = '<option value="">Hour</option>';
  for (let h = 1; h <= 12; h++) {
    hourSel.innerHTML += `<option value="${String(h).padStart(2,'0')}">${String(h).padStart(2,'0')}</option>`;
  }

  minuteSel.innerHTML = '<option value="">Min</option>';
  for (let m = 0; m <= 59; m++) {
    minuteSel.innerHTML += `<option value="${String(m).padStart(2,'0')}">${String(m).padStart(2,'0')}</option>`;
  }

  let ampm = '';
  function setAmPm(val) {
    ampm = val;
    ampmWrap.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.value === val));
    updateTobHidden();
  }

  function updateTobHidden() {
    if (hourSel.value && minuteSel.value && ampm) {
      tobHidden.value = `${hourSel.value}:${minuteSel.value} ${ampm}`;
    }
  }

  ampmWrap.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => setAmPm(btn.dataset.value));
  });
  hourSel.addEventListener('change', updateTobHidden);
  minuteSel.addEventListener('change', updateTobHidden);
}
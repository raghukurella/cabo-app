import { supabaseClient } from './config.js';

export async function populateEducationLevels() {
  const { data, error } = await supabaseClient.from('education_levels').select('value');
  if (error) return console.error(error);
  ['highest_education_level','secondary_education_level'].forEach(id => {
    const select = document.getElementById(id);
    select.innerHTML = '<option value="">Select Education</option>';
    data.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.value;
      opt.textContent = d.value;
      select.appendChild(opt);
    });
  });
}

export function populateCitizenshipDropdowns(countries) {
  ['citizenship_at_birth','current_citizenship'].forEach(id => {
    const select = document.getElementById(id);
    select.innerHTML = '<option value="">Select Country</option>';
    countries.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      select.appendChild(opt);
    });
  });
}
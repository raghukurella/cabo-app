import { supabaseClient } from './config.js';

export async function submitForm() {
  const form = document.getElementById('matchForm');
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  // Debug: log collected form data so we can verify gender is set
  console.log('submitForm() - collected form data:', data);

  // Insert demographics
  const { data: demoData, error: demoError } = await supabaseClient
    .from('demographics')
    .insert([{
      full_name: data.full_name,
      place_of_birth: data.place_of_birth,
      email: data.email,
      phone_number: data.phone_number,
      date_of_birth: data.date_of_birth,
      time_of_birth: data.time_of_birth,
      gender: data.gender,
      zip: data.zip,
      height_feet: data.height_feet ? parseInt(data.height_feet, 10) : null,
      height_inches: data.height_inches ? parseInt(data.height_inches, 10) : null,
      citizenship_at_birth: data.citizenship_at_birth,
      current_citizenship: data.current_citizenship,
      highest_education_level: data.highest_education_level,
      highest_education_school: data.highest_education_school,
      secondary_education_level: data.secondary_education_level,
      secondary_education_school: data.secondary_education_school,
      education_notes: data.education_notes
    }])
    .select();

  if (demoError) {
    console.error('Demographic insert error:', demoError);
    alert('Failed to submit demographic info.');
    return false;
  }

  console.log('submitForm() - demographics insert result:', demoData);

  const demographic_id = demoData[0].id;

  // Collect responses
  const responses = [];
  for (let [key, val] of formData.entries()) {
    if (key.startsWith('question_')) {
      responses.push({
        demographic_id,
        question_id: parseInt(key.split('_')[1], 10),
        answer: val === 'on' ? 'true' : val
      });
    }
  }

  if (responses.length > 0) {
    const { error: responseError } = await supabaseClient
      .from('responses')
      .insert(responses);

    if (responseError) {
      console.error('Response insert error:', responseError);
      alert('Failed to submit responses.');
      return false;
    }
  }

  alert('Form submitted successfully!');
  return true;
}
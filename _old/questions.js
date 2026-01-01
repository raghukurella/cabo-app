import { supabaseClient } from './config.js';

export async function loadQuestions(steps) {
  const { data: questions, error } = await supabaseClient
    .from('questions')
    .select('id, question_text, input_type, options, display_order, is_visible, is_required')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Questions load error:', error);
    return;
  }

  const visibleQuestions = (questions || []).filter(q => q.is_visible);
  renderQuestionCards(visibleQuestions, steps);
}

function renderQuestionCards(questions, steps) {
  const container = document.getElementById('questionStep');
  if (!container) return;

  const chunkSize = 7;
  container.innerHTML = ''; // clear any old cards

  for (let i = 0; i < questions.length; i += chunkSize) {
    const card = document.createElement('div');
    card.className = 'step hidden';

    const slice = questions.slice(i, i + chunkSize);
    slice.forEach(q => renderQuestion(q, card));

    container.appendChild(card);
    steps.push(card);
  }
}

function renderQuestion(q, container) {
  const div = document.createElement('div');
  div.className = 'form-field';

  const label = document.createElement('label');
  label.textContent = q.question_text;
  div.appendChild(label);

  if (q.input_type === 'dropdown' && Array.isArray(q.options) && q.options.length > 0) {
    const select = document.createElement('select');
    select.name = `question_${q.id}`;
    select.id = `question_${q.id}`;
    if (q.is_required) select.required = true;

    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = 'Select an option';
    select.appendChild(defaultOpt);

    q.options.forEach(optVal => {
      const opt = document.createElement('option');
      opt.value = optVal;
      opt.textContent = optVal;
      select.appendChild(opt);
    });

    div.appendChild(select);
  } else {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = `question_${q.id}`;
    input.id = `question_${q.id}`;
    if (q.is_required) input.required = true;
    div.appendChild(input);
  }

  container.appendChild(div);
}
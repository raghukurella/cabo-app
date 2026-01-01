export function validateInput(input) {
  if (input.disabled) {
    // ensure any previous invalid markers are cleared on disabled fields
    input.classList.remove('invalid');
    const container = input.closest('.form-field');
    if (container) container.classList.remove('invalid');
    return true;
  }

  let ok = true;
  if (input.type === 'checkbox') {
    ok = !input.required || input.checked;
  } else {
    ok = !input.required || input.value.trim() !== '';
  }

  // Toggle invalid class on the input and its containing .form-field
  if (!ok) {
    input.classList.add('invalid');
    const container = input.closest('.form-field');
    if (container) {
      container.classList.add('invalid');
      // add inline error message if not already present
      if (!container.querySelector('.field-error')) {
        const msg = document.createElement('div');
        msg.className = 'field-error';
        // friendly message depending on input type
        if (input.type === 'checkbox') msg.textContent = 'This option is required.';
        else if (input.tagName.toLowerCase() === 'select') msg.textContent = 'Please select an option.';
        else msg.textContent = 'This field is required.';
        container.appendChild(msg);
      }
    }
  } else {
    input.classList.remove('invalid');
    const container = input.closest('.form-field');
    if (container) {
      container.classList.remove('invalid');
      const err = container.querySelector('.field-error');
      if (err) err.remove();
    }
  }

  return ok;
}

export function validateStep(stepEl) {
  const inputs = stepEl.querySelectorAll('input, select, textarea');
  return Array.from(inputs).every(validateInput);
}
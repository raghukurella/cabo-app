// Robust dev-smoke script content (replaced by new logic)
(function(){
  // Dev smoke script for index.html (robust async version)
  // Usage: include this file on localhost or paste the body into the browser console.
  // By default this will auto-fill the form and ADVANCE steps but will NOT submit (autoSubmit = false).
  // Set `window.__DEV_SMOKE_AUTO_SUBMIT = true` before loading to allow final submit.

  const autoSubmit = window.__DEV_SMOKE_AUTO_SUBMIT === true; // safe-by-default
  const stepDelay = 400; // ms between step actions
  const selectWaitTimeout = 4000; // ms to wait for async selects to populate

  // Randomized sample generator (avoids identical test data each run)
  function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(arr){ return arr[randomInt(0, arr.length -1)]; }

  function randomDateBetween(minYearOffset, maxYearOffset){
    // minYearOffset: e.g. 75 (oldest), maxYearOffset: 18 (youngest)
    const now = new Date();
    const year = now.getFullYear() - randomInt(maxYearOffset, minYearOffset);
    const month = randomInt(1, 12);
    const day = new Date(year, month, 0).getDate(); // last day of month
    const d = randomInt(1, day);
    const mm = String(month).padStart(2,'0');
    const dd = String(d).padStart(2,'0');
    return `${year}-${mm}-${dd}`;
  }

  function randomTime(){
    const hour = randomInt(1,12);
    const minute = randomInt(0,59);
    const ampm = pick(['AM','PM']);
    return `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')} ${ampm}`;
  }

  function randomPhone(){
    const a = randomInt(100, 999);
    const b = randomInt(1000, 9999);
    return `555-${a}-${b}`;
  }

  function randomZip(){ return String(randomInt(10000, 99999)); }

  function randomSample(){
    const firstNames = ['Alex','Sam','Jordan','Taylor','Casey','Riley','Morgan','Jamie','Avery','Quinn'];
    const lastNames = ['Smith','Johnson','Lee','Brown','Garcia','Martinez','Davis','Clark','Wilson','Lopez'];
    const places = ['Springfield','Riverside','Greenville','Fairview','Madison','Franklin','Georgetown','Arlington','Ashland','Oakwood'];
    const genders = ['Male','Female','Other'];

    const first = pick(firstNames);
    const last = pick(lastNames);
    const fullName = `${first} ${last}`;
    const email = `dev+${first.toLowerCase()}.${last.toLowerCase()}.${Date.now() % 100000}@example.com`;

    return {
      gender: pick(genders),
      full_name: fullName,
      place_of_birth: pick(places),
      email,
      phone_number: randomPhone(),
      date_of_birth: randomDateBetween(75, 18),
      time_of_birth: randomTime(),
      zip: randomZip(),
      height_feet: String(randomInt(4,7)),
      height_inches: String(randomInt(0,11))
    };
  }

  function q(sel){ return document.querySelector(sel); }
  function qAll(sel){ return Array.from(document.querySelectorAll(sel)); }
  function wait(ms){ return new Promise(r=>setTimeout(r, ms)); }

  async function waitForSelector(selector, timeout = 3000){
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (document.querySelector(selector)) return document.querySelector(selector);
      await wait(100);
    }
    return null;
  }

  async function waitForSelectOptions(selector, minOptions = 2, timeout = selectWaitTimeout){
    const start = Date.now();
    while (Date.now() - start < timeout){
      const el = document.querySelector(selector);
      if (el && el.options && el.options.length >= minOptions) return el;
      await wait(100);
    }
    return document.querySelector(selector);
  }

  function safeSetValue(el, value){
    if (!el) return false;
    el.focus && el.focus();
    el.value = value;
    el.dispatchEvent(new Event('input', {bubbles:true}));
    el.dispatchEvent(new Event('change', {bubbles:true}));
    return true;
  }

  function clickButtonIn(el, selector){
    if (!el) return false;
    const btn = el.querySelector(selector);
    if (!btn) return false;
    btn.click();
    return true;
  }

  async function fillDemographics(sample){
    // Gender
    const genderWrap = q('#genderToggle');
    if (genderWrap && sample && sample.gender) {
      const btn = Array.from(genderWrap.querySelectorAll('button')).find(b => b.dataset.value === sample.gender);
      if (btn) btn.click();
    }

    safeSetValue(q('#full_name'), sample?.full_name || '');
    safeSetValue(q('#place_of_birth'), sample?.place_of_birth || '');
    safeSetValue(q('#email'), sample?.email || '');
    safeSetValue(q('#phone_number'), sample?.phone_number || '');

    // DOB: select year/month/day
    if (sample && sample.date_of_birth) {
      const [y,m,d] = sample.date_of_birth.split('-');
      // Wait for year/month/day selects
      const ysel = await waitForSelector('#dobYear');
      const msel = await waitForSelector('#dobMonth');
      const dsel = await waitForSelector('#dobDay');
      if (ysel) safeSetValue(ysel, y);
      if (msel) safeSetValue(msel, m);
      // allow day options to populate
      await wait(200);
      if (dsel) safeSetValue(dsel, d);
      // hidden field updated by listeners
    }

    // TOB
    if (sample && sample.time_of_birth) {
      const [time, ampm] = sample.time_of_birth.split(' ');
      if (time && ampm) {
        const [hh, mm] = time.split(':');
        const hsel = q('#tobHour');
        const msel = q('#tobMinute');
        if (hsel) safeSetValue(hsel, hh);
        if (msel) safeSetValue(msel, mm);
        // click AM/PM
        const ampmWrap = q('#tobAmPm');
        if (ampmWrap) {
          const btn = Array.from(ampmWrap.querySelectorAll('button')).find(b => b.dataset.value === ampm);
          if (btn) btn.click();
        }
      }
    }


    safeSetValue(q('#height_feet'), sample?.height_feet || '');
    safeSetValue(q('#height_inches'), sample?.height_inches || '');

    // zip
    safeSetValue(q('#zip'), sample?.zip || '');

    await wait(150);
  }

  async function fillEducation(){
    // Wait for selects to populate
    await waitForSelectOptions('#highest_education_level', 2);
    await waitForSelectOptions('#secondary_education_level', 2);
    await waitForSelectOptions('#citizenship_at_birth', 2);
    await waitForSelectOptions('#current_citizenship', 2);

    // Select first real option if present
    const highest = q('#highest_education_level');
    if (highest && highest.options.length > 1) { highest.selectedIndex = 1; highest.dispatchEvent(new Event('change',{bubbles:true})); }
    const secondary = q('#secondary_education_level');
    if (secondary && secondary.options.length > 1) { secondary.selectedIndex = 1; secondary.dispatchEvent(new Event('change',{bubbles:true})); }
    const cit1 = q('#citizenship_at_birth');
    if (cit1 && cit1.options.length > 1) { cit1.selectedIndex = 1; cit1.dispatchEvent(new Event('change',{bubbles:true})); }
    const cit2 = q('#current_citizenship');
    if (cit2 && cit2.options.length > 1) { cit2.selectedIndex = 1; cit2.dispatchEvent(new Event('change',{bubbles:true})); }

    await wait(120);
  }

  async function fillQuestionStep(stepEl){
    if (!stepEl) return;
    // For dropdowns, pick first option; for checkboxes, check them
    const selects = Array.from(stepEl.querySelectorAll('select'));
    for (const s of selects) {
      if (s.options && s.options.length > 1) {
        s.selectedIndex = 1;
        s.dispatchEvent(new Event('change', {bubbles:true}));
      }
    }
    const checks = Array.from(stepEl.querySelectorAll('input[type="checkbox"]'));
    for (const c of checks) {
      c.checked = true;
      c.dispatchEvent(new Event('change', {bubbles:true}));
    }
  }

  async function fillAllQuestionSteps(){
    // The question cards are grouped into .step elements inside #questionStep
    const questionSteps = qAll('#questionStep .step');
    for (const stepEl of questionSteps){
      // Make sure current step is visible before filling
      // If it's not visible, simulate navigating to it by clicking next until visible
      // But simpler: fill fields in hidden steps too (they exist in DOM)
      await fillQuestionStep(stepEl);
      await wait(80);
    }
  }

  async function runSequence(){
    if (!q('#matchForm')) {
      console.warn('This page does not look like index.html (match form not found).');
      return;
    }

    const sample = randomSample();
    console.log('dev-smoke: starting fill sequence (autoSubmit=', autoSubmit,') sample=', sample);

    // Step 0: demographics
    await fillDemographics(sample);

    // Click Next for demographics -> education
    const nextBtn = q('#nextBtn');
    const prevBtn = q('#prevBtn');
    if (!nextBtn) { console.warn('nextBtn not found'); return; }

    nextBtn.click();
    await wait(stepDelay);

    // Step 1: education
    await fillEducation();
    nextBtn.click();
    await wait(stepDelay);

    // Steps: question cards
    await fillAllQuestionSteps();

    // After filling questions, advance through remaining steps programmatically
    const steps = qAll('.step');
    for (let i = 0; i < steps.length; i++){
      const visibleIndex = steps.findIndex(s => !s.classList.contains('hidden'));
      if (visibleIndex === -1) break;
      // If last step, handle submit
      if (visibleIndex === steps.length - 1){
        if (autoSubmit){
          console.log('dev-smoke: submitting form');
          nextBtn.click(); // this should trigger submit
        } else {
          console.log('dev-smoke: reached final step; autoSubmit=false so not submitting.');
        }
        break;
      }
      // Otherwise advance
      nextBtn.click();
      await wait(stepDelay);
    }

    console.log('dev-smoke: finished');
  }

  // Auto-run only on localhost or when explicitly forced
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || window.__DEV_SMOKE_FORCE === true) {
    setTimeout(() => { runSequence().catch(err=>console.error('dev-smoke error:', err)); }, 600);
  } else {
    console.log('dev-smoke: not running automatically (only runs on localhost). To run anyway, set window.__DEV_SMOKE_FORCE = true then paste/run this script.');
  }
})();

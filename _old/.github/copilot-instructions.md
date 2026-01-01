# Copilot / AI Agent Instructions for Matchmaker App

This file gives focused, actionable guidance for AI coding agents working on this repository.

1. Big picture
- Purpose: a small static web app that gathers user demographics and questionnaire responses and stores them in Supabase tables.
- Architecture: client-side JavaScript (ES modules) drives a multi-step form. Key modules: `main.js`, `demographics.js`, `education.js`, `questions.js`, `validation.js`, `submit.js`. There is an older monolithic script in `script.js` and administrative UIs in `people.js` / `people - Copy.js`.
- Data flow: UI → `FormData` → `submit.js` uses `supabaseClient` (from `config.js`) to insert into `demographics` then `responses`. Questions/education data are read from Supabase (`questions`, `education_levels`, `unified_results`/`matchmaker_results` views).

2. Important files and patterns (reference examples)
- `config.js`: exports `supabaseClient` and currently contains hard-coded anon key and URL. Treat this as sensitive; prefer using environment variables or a .env process when modifying.
- `main.js`: orchestrates initialization, calls `loadQuestions(steps)` which appends question cards in chunks (7 per card) and pushes `div.step` elements into the `steps` array.
- `questions.js`: fetches `questions` and calls `renderQuestionCards(questions, steps)`; uses `chunkSize = 7` and creates `<div class="step hidden">` nodes — follow this pattern when modifying pagination/grouping.
- `submit.js`: constructs `FormData`, inserts demographics, then inserts `responses`. Note: responses map checkbox `on` → `true` string.
- `validation.js`: small utility `validateInput` + `validateStep` which checks `input, select, textarea`. Use these helpers for client-side validation.
- `people.js` / `people - Copy.js`: admin-style UIs that query `unified_results` or `matchmaker_results` and group rows by `demographic_id`. They implement client-side pagination and filter population; they also honor `deleted_date` soft-delete semantics.

3. Database tables / views referenced (important to know)
- `demographics` — inserted by `submit.js`.
- `responses` — inserted by `submit.js`.
- `questions` — drives the questionnaire UI (`questions.js`). Fields used: `id, question_text, input_type, options, display_order, is_visible, is_required`.
- `education_levels` — used to populate education dropdowns.
- `unified_results` / `matchmaker_results` — used by admin UIs to build unified rows and reports.

4. Project-specific conventions
- UI steps: elements with class `step` are toggled via `hidden` class. The `steps` array order is the source of truth for navigation; new question cards should be pushed into that array.
- Chunking: question cards are grouped in sizes of 7 (see `chunkSize` variable in `questions.js` / `script.js`). Keep that value consistent if altering pagination.
- Hidden fields: DOB/TOB are populated into hidden inputs `date_of_birth` and `time_of_birth` by `demographics.js` helper functions — prefer using these helpers rather than rewriting DOM logic.
- Checkbox normalization: answers coming from checkboxes are normalized: if value === `'on'` then stored as `'true'` in responses. Search for this pattern when changing answer handling.

5. Developer workflows
- No build tool: this is a plain static site — open `index.html` in a browser or serve the folder with a static server. Example quick-start commands (PowerShell):
  - `python -m http.server 8000` (from repo root) then open `http://localhost:8000`.
  - or `npx http-server -c-1 .` if Node.js is available.
- There's no test harness present. Use browser devtools to test flows and the Network tab to inspect Supabase API calls.

6. Security & secrets
- `config.js`, `people.js`, and `people - Copy.js` currently contain Supabase URL/keys. Treat them as secrets. Do not commit new secrets; prefer moving them into a secure store or CI environment variables.

7. Common gotchas & notes for PRs
- Duplicate logic: `script.js` contains a monolithic, older implementation that overlaps with the modular files (`main.js` + helpers). Prefer modifying the ES-module files (`main.js`, `questions.js`, etc.) for new features; only revise `script.js` if intentionally maintaining the legacy version.
- `submit.js` references `currentStep` in its reset flow — `currentStep` is a module-level variable in `main.js`. When refactoring, ensure the step state is passed explicitly or exported/imported correctly to avoid relying on globals.
- Admin queries fetch large result sets and do grouping client-side (see `loadResults()` in `people.js`). For large datasets, prefer paginated/aggregated queries server-side or via Supabase RPCs to avoid memory/performance issues.

8. Examples to copy/paste
- Load questions pattern:
  ```js
  const { data: questions } = await supabaseClient
    .from('questions')
    .select('id, question_text, input_type, options, display_order, is_visible, is_required')
    .order('display_order', { ascending: true });
  ```
- Insert demographics then responses pattern (follow `submit.js`): insert into `demographics`, read returned `id`, map `FormData` entries `question_*` to `responses` with `demographic_id`.

9. When in doubt — do this first
- Look for DOM IDs mentioned above (`matchForm`, `step0`, `stepEducation`, `questionStep`, `nextBtn`, `prevBtn`, `progressIndicator`) — tests and changes should preserve those hooks.
- Run the app locally with a static server and exercise the form end-to-end; monitor Network/Console for Supabase errors.

If any of the above is unclear or you want me to include CI/hosting deployment steps or a secrets-migration suggestion, tell me which area to expand.

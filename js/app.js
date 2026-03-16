/**
 * @fileoverview Application entry point.
 * Handles DOM setup, reactive form state, and UI interactions.
 * All business logic lives in generator.js / randomizer.js.
 */

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** @type {import('./generator.js').CharacterState} */
const state = {
  speciesId: SPECIES[0].id,
  sexId: SEX_OPTIONS[0].id,
  jobId: JOBS[0].id,
  selectedCostumes: new Set(),
};

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

/**
 * @param {string} id
 * @returns {HTMLElement}
 */
const $ = (id) => document.getElementById(id);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/** Populate the species <select>. */
function renderSpeciesSelect() {
  const select = $('species-select');
  select.innerHTML = SPECIES.map(
    (s) => `<option value="${s.id}">${s.label}</option>`
  ).join('');
  select.value = state.speciesId;
}

/** Render sex radio buttons. */
function renderSexRadios() {
  const group = $('sex-group');
  group.innerHTML = SEX_OPTIONS.map(
    (s) => `
    <label class="radio-option ${state.sexId === s.id ? 'radio-option--active' : ''}">
      <input type="radio" name="sex" value="${s.id}" ${state.sexId === s.id ? 'checked' : ''} />
      ${s.label}
    </label>`
  ).join('');
}

/** Populate the job <select>. */
function renderJobSelect() {
  const select = $('job-select');
  select.innerHTML = JOBS.map(
    (j) => `<option value="${j.id}">${j.label}</option>`
  ).join('');
  select.value = state.jobId;
}

/**
 * Render costume checkboxes grouped by category.
 * Items incompatible with the current species are disabled and marked visually.
 */
function renderCostumes() {
  const incompatible = getIncompatibleCostumes(state.speciesId);
  const container = $('costume-container');

  container.innerHTML = COSTUME_CATEGORIES.map((cat) => {
    const items = cat.items.map((item) => {
      const isIncompatible = incompatible.has(item.id);
      const isChecked = state.selectedCostumes.has(item.id) && !isIncompatible;
      const classes = [
        'costume-chip',
        isChecked ? 'costume-chip--active' : '',
        isIncompatible ? 'costume-chip--disabled' : '',
      ]
        .filter(Boolean)
        .join(' ');

      return `
        <label class="${classes}" title="${isIncompatible ? 'Not compatible with this species' : ''}">
          <input
            type="checkbox"
            class="costume-checkbox"
            data-item-id="${item.id}"
            ${isChecked ? 'checked' : ''}
            ${isIncompatible ? 'disabled' : ''}
          />
          ${item.label}
        </label>`;
    }).join('');

    return `
      <div class="costume-category">
        <h4 class="costume-category-title">${cat.label}</h4>
        <div class="costume-chips">${items}</div>
      </div>`;
  }).join('');
}

/** Write the generated tags to the output textarea. */
function renderOutput() {
  const output = $('tag-output');
  const tags = generateTags(state);
  output.value = tags;
}

/** Populate the character summary panel. */
function renderSummary() {
  const species = SPECIES.find((s) => s.id === state.speciesId);
  const sex     = SEX_OPTIONS.find((s) => s.id === state.sexId);
  const job     = JOBS.find((j) => j.id === state.jobId);

  const allItems = COSTUME_CATEGORIES.flatMap((c) => c.items);
  const incompatible = getIncompatibleCostumes(state.speciesId);
  const activeItems = allItems.filter(
    (item) => state.selectedCostumes.has(item.id) && !incompatible.has(item.id)
  );

  const list = $('summary-list');
  list.innerHTML = [
    `<li><span class="summary-key">Species</span><span class="summary-val">${species?.label ?? '—'}</span></li>`,
    `<li><span class="summary-key">Sex</span><span class="summary-val">${sex?.label ?? '—'}</span></li>`,
    `<li><span class="summary-key">Job</span><span class="summary-val">${job?.label ?? '—'}</span></li>`,
    `<li><span class="summary-key">Equipment</span><span class="summary-val">${
      activeItems.length ? activeItems.map((i) => i.label).join(', ') : 'None'
    }</span></li>`,
  ].join('');
}

/** Run all render functions that depend on state. */
function renderAll() {
  renderCostumes();
  renderOutput();
  renderSummary();
}

// ---------------------------------------------------------------------------
// State mutation helpers
// ---------------------------------------------------------------------------

/**
 * Apply an external CharacterState to `state`, then fully re-render.
 * Used by the randomizer to replace all selections at once.
 * @param {import('./generator.js').CharacterState} newState
 */
function applyState(newState) {
  state.speciesId = newState.speciesId;
  state.sexId     = newState.sexId;
  state.jobId     = newState.jobId;
  state.selectedCostumes = new Set(newState.selectedCostumes);

  // Re-render controls that hold their own DOM state
  $('species-select').value = state.speciesId;
  $('job-select').value     = state.jobId;
  renderSexRadios();
  renderAll();
}

// ---------------------------------------------------------------------------
// Event listeners
// ---------------------------------------------------------------------------

function bindEvents() {
  // Species
  $('species-select').addEventListener('change', (e) => {
    state.speciesId = /** @type {HTMLSelectElement} */ (e.target).value;
    // Remove any now-incompatible costumes from selection
    const incompatible = getIncompatibleCostumes(state.speciesId);
    for (const id of incompatible) state.selectedCostumes.delete(id);
    renderAll();
  });

  // Sex — use event delegation on the radio group container
  $('sex-group').addEventListener('change', (e) => {
    const target = /** @type {HTMLInputElement} */ (e.target);
    if (target.type === 'radio' && target.name === 'sex') {
      state.sexId = target.value;
      // Refresh radio appearance
      document.querySelectorAll('.radio-option').forEach((label) => {
        const input = label.querySelector('input');
        label.classList.toggle('radio-option--active', input?.checked ?? false);
      });
      renderOutput();
      renderSummary();
    }
  });

  // Job
  $('job-select').addEventListener('change', (e) => {
    state.jobId = /** @type {HTMLSelectElement} */ (e.target).value;
    renderOutput();
    renderSummary();
  });

  // Costume checkboxes — use event delegation
  $('costume-container').addEventListener('change', (e) => {
    const target = /** @type {HTMLInputElement} */ (e.target);
    if (!target.classList.contains('costume-checkbox')) return;

    const id = target.dataset.itemId;
    if (!id) return;

    if (target.checked) {
      state.selectedCostumes.add(id);

      // Deselect any other item in the same exclusion group
      const group = EXCLUSION_GROUPS.find((g) => g.includes(id));
      if (group) {
        for (const conflictId of group) {
          if (conflictId !== id) state.selectedCostumes.delete(conflictId);
        }
      }
    } else {
      state.selectedCostumes.delete(id);
    }

    // Re-render costumes so deselected chips update visually
    renderCostumes();
    renderOutput();
    renderSummary();
  });

  // Random button
  $('random-btn').addEventListener('click', () => {
    applyState(generateRandomCharacter());
  });

  // Copy button
  $('copy-btn').addEventListener('click', async () => {
    const text = $('tag-output').value;
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for browsers without Clipboard API
      const area = /** @type {HTMLTextAreaElement} */ ($('tag-output'));
      area.select();
      document.execCommand('copy');
    }

    showCopyFeedback();
  });
}

// ---------------------------------------------------------------------------
// Copy feedback
// ---------------------------------------------------------------------------

let feedbackTimer = null;

function showCopyFeedback() {
  const feedback = $('copy-feedback');
  feedback.textContent = 'Copied to clipboard!';
  feedback.classList.add('copy-feedback--visible');

  if (feedbackTimer) clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => {
    feedback.classList.remove('copy-feedback--visible');
  }, 2000);
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

function init() {
  renderSpeciesSelect();
  renderSexRadios();
  renderJobSelect();
  renderAll();
  bindEvents();
}

init();

/**
 * @fileoverview Application entry point.
 * Handles DOM setup, reactive form state, and UI interactions.
 * All business logic lives in generator.js / randomizer.js.
 */

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** @type {import('./generator.js').CharacterState} */
const RESET_STATE = {
  speciesId:     'human',
  sexId:         'female',
  jobId:         '',
  hairColorId:   '',
  eyeColorId:    '',
  skinColorId:   '',
  shotTypeId:    '',
  cameraAngleId: '',
  gazeId:        '',
};

const state = {
  speciesId:     RESET_STATE.speciesId,
  sexId:         RESET_STATE.sexId,
  jobId:         RESET_STATE.jobId,
  hairColorId:   RESET_STATE.hairColorId,
  eyeColorId:    RESET_STATE.eyeColorId,
  skinColorId:   RESET_STATE.skinColorId,
  shotTypeId:    RESET_STATE.shotTypeId,
  cameraAngleId: RESET_STATE.cameraAngleId,
  gazeId:        RESET_STATE.gazeId,
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

/**
 * Build the innerHTML for a color <select> from a ColorOption array.
 * @param {string} selectedId
 * @param {Array<{id:string,label:string}>} options
 * @returns {string}
 */
function colorSelectHTML(selectedId, options) {
  return options
    .map((c) => `<option value="${c.id}"${c.id === selectedId ? ' selected' : ''}>${c.label}</option>`)
    .join('');
}

/** Populate all three appearance color <select> elements. */
function renderColorSelects() {
  $('hair-color-select').innerHTML = colorSelectHTML(state.hairColorId, HAIR_COLORS);
  $('eye-color-select').innerHTML  = colorSelectHTML(state.eyeColorId,  EYE_COLORS);
  $('skin-color-select').innerHTML = colorSelectHTML(state.skinColorId, SKIN_COLORS);
}

/** Populate all three camera & framing <select> elements. */
function renderFramingSelects() {
  $('shot-type-select').innerHTML    = colorSelectHTML(state.shotTypeId,    SHOT_TYPES);
  $('camera-angle-select').innerHTML = colorSelectHTML(state.cameraAngleId, CAMERA_ANGLES);
  $('gaze-select').innerHTML         = colorSelectHTML(state.gazeId,        GAZE_OPTIONS);
}

/** Populate the job <select>. */
function renderJobSelect() {
  const select = $('job-select');
  select.innerHTML =
    '<option value="">— None —</option>' +
    JOBS.map((j) => `<option value="${j.id}">${j.label}</option>`).join('');
  select.value = state.jobId;
}

/**
 * Render costume checkboxes grouped by category.
 * Items incompatible with the current species, or whose prerequisites are
 * unmet, are disabled and marked visually with a descriptive tooltip.
 */
function renderCostumes() {
  const incompatible = getIncompatibleCostumes(state.speciesId);
  const container = $('costume-container');

  container.innerHTML = COSTUME_CATEGORIES.map((cat) => {
    const items = cat.items.map((item) => {
      const isIncompatible = incompatible.has(item.id);

      const prereqRule = COSTUME_PREREQUISITES[item.id];
      const isPrereqUnmet = prereqRule
        ? !prereqRule.prereqs.some((p) => state.selectedCostumes.has(p))
        : false;

      const isDisabled = isIncompatible || isPrereqUnmet;
      const isChecked  = state.selectedCostumes.has(item.id) && !isDisabled;

      let title = '';
      if (isIncompatible) {
        title = 'Not compatible with this species';
      } else if (isPrereqUnmet) {
        title = prereqRule.tooltip ?? (() => {
          const labels = prereqRule.prereqs
            .map((p) => COSTUME_CATEGORIES.flatMap((c) => c.items).find((i) => i.id === p)?.label ?? p)
            .join(', ');
          return `Requires: ${labels}`;
        })();
      }

      const classes = [
        'costume-chip',
        isChecked   ? 'costume-chip--active'   : '',
        isDisabled  ? 'costume-chip--disabled'  : '',
      ]
        .filter(Boolean)
        .join(' ');

      return `
        <label class="${classes}"${title ? ` title="${title}"` : ''}>
          <input
            type="checkbox"
            class="costume-checkbox"
            data-item-id="${item.id}"
            ${isChecked  ? 'checked'  : ''}
            ${isDisabled ? 'disabled' : ''}
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

  const hairColor   = HAIR_COLORS.find((c) => c.id === state.hairColorId);
  const eyeColor    = EYE_COLORS.find((c) => c.id === state.eyeColorId);
  const skinColor   = SKIN_COLORS.find((c) => c.id === state.skinColorId);
  const shotType    = SHOT_TYPES.find((o) => o.id === state.shotTypeId);
  const cameraAngle = CAMERA_ANGLES.find((o) => o.id === state.cameraAngleId);
  const gaze        = GAZE_OPTIONS.find((o) => o.id === state.gazeId);

  /**
   * Return a summary <li> string, or '' to omit the row entirely.
   * @param {string} key
   * @param {string|undefined} value  Falsy values cause the row to be skipped.
   */
  const row = (key, value) =>
    value ? `<li><span class="summary-key">${key}</span><span class="summary-val">${value}</span></li>` : '';

  const list = $('summary-list');
  list.innerHTML = [
    row('Species',   species?.label),
    row('Sex',       sex?.label),
    row('Hair',      hairColor?.label),
    row('Eyes',      eyeColor?.label),
    row('Skin',      skinColor?.label),
    row('Job',       job?.label),
    row('Equipment', activeItems.length ? activeItems.map((i) => i.label).join(', ') : ''),
    row('Shot',      shotType?.tag   ? shotType.label   : ''),
    row('Angle',     cameraAngle?.tag ? cameraAngle.label : ''),
    row('Gaze',      gaze?.tag       ? gaze.label       : ''),
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

/** Reset to the default state: Human, Female, no job, no costume. */
function resetState() {
  applyState({
    speciesId: RESET_STATE.speciesId,
    sexId: RESET_STATE.sexId,
    jobId: RESET_STATE.jobId,
    selectedCostumes: new Set(),
  });
}

/**
 * Apply an external CharacterState to `state`, then fully re-render.
 * Used by the randomizer and resetState to replace all selections at once.
 * @param {import('./generator.js').CharacterState} newState
 */
function applyState(newState) {
  state.speciesId   = newState.speciesId;
  state.sexId       = newState.sexId;
  state.jobId       = newState.jobId;
  state.hairColorId   = newState.hairColorId   ?? '';
  state.eyeColorId    = newState.eyeColorId    ?? '';
  state.skinColorId   = newState.skinColorId   ?? '';
  state.shotTypeId    = newState.shotTypeId    ?? '';
  state.cameraAngleId = newState.cameraAngleId ?? '';
  state.gazeId        = newState.gazeId        ?? '';
  state.selectedCostumes = new Set(newState.selectedCostumes);

  // Re-render controls that hold their own DOM state
  $('species-select').value = state.speciesId;
  $('job-select').value     = state.jobId;
  renderSexRadios();
  renderColorSelects();
  renderFramingSelects();
  renderAll();
}

// ---------------------------------------------------------------------------
// Event listeners
// ---------------------------------------------------------------------------

function bindEvents() {
  // Species
  $('species-select').addEventListener('change', (e) => {
    state.speciesId = /** @type {HTMLSelectElement} */ (e.target).value;
    // Remove incompatible costumes, then re-check prerequisites
    const incompatible = getIncompatibleCostumes(state.speciesId);
    for (const id of incompatible) state.selectedCostumes.delete(id);
    enforcePrerequisites(state.selectedCostumes);
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

  // Appearance colors
  $('hair-color-select').addEventListener('change', (e) => {
    state.hairColorId = /** @type {HTMLSelectElement} */ (e.target).value;
    renderOutput();
    renderSummary();
  });
  $('eye-color-select').addEventListener('change', (e) => {
    state.eyeColorId = /** @type {HTMLSelectElement} */ (e.target).value;
    renderOutput();
    renderSummary();
  });
  $('skin-color-select').addEventListener('change', (e) => {
    state.skinColorId = /** @type {HTMLSelectElement} */ (e.target).value;
    renderOutput();
    renderSummary();
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

      // Deselect conflicting items across all exclusion groups this item belongs to
      for (const group of EXCLUSION_GROUPS) {
        if (group.includes(id)) {
          for (const conflictId of group) {
            if (conflictId !== id) state.selectedCostumes.delete(conflictId);
          }
        }
      }
    } else {
      state.selectedCostumes.delete(id);
      // If this item was a prerequisite for another selected item, remove that item too
      enforcePrerequisites(state.selectedCostumes);
    }

    // Re-render costumes so deselected chips update visually
    renderCostumes();
    renderOutput();
    renderSummary();
  });

  // Camera & framing
  $('shot-type-select').addEventListener('change', (e) => {
    state.shotTypeId = /** @type {HTMLSelectElement} */ (e.target).value;
    renderOutput();
    renderSummary();
  });
  $('camera-angle-select').addEventListener('change', (e) => {
    state.cameraAngleId = /** @type {HTMLSelectElement} */ (e.target).value;
    renderOutput();
    renderSummary();
  });
  $('gaze-select').addEventListener('change', (e) => {
    state.gazeId = /** @type {HTMLSelectElement} */ (e.target).value;
    renderOutput();
    renderSummary();
  });

  // Random button
  $('random-btn').addEventListener('click', () => {
    applyState(generateRandomCharacter());
  });

  // Reset button
  $('reset-btn').addEventListener('click', () => {
    resetState();
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
  renderColorSelects();
  renderFramingSelects();
  renderJobSelect();
  renderAll();
  bindEvents();
}

init();

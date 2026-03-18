/**
 * @fileoverview Application entry point.
 * Handles DOM setup, reactive form state, and UI interactions.
 * All business logic lives in generator.js / randomizer.js.
 */

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** @type {import('./generator.js').CharacterState} */
/** Blank bodyEmphasis object — one key per body part, all set to ''. */
function blankBodyEmphasis() {
  return Object.fromEntries(BODY_PARTS.map((p) => [p.id, '']));
}

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
  bodyEmphasis:  null, // populated after BODY_PARTS is defined; see init()
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
  bodyEmphasis:  null, // populated in init()
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

/** Render the body part coverage rows. */
function renderBodyEmphasis() {
  const container = $('body-emphasis-container');
  const abdomenLocked = state.selectedCostumes.has('robe') || state.selectedCostumes.has('toga');

  container.innerHTML = BODY_PARTS.map((part) => {
    const isLocked = part.id === 'abdomen' && abdomenLocked;
    const current  = isLocked ? '' : (state.bodyEmphasis?.[part.id] ?? '');
    const options  = COVERAGE_LEVELS.map((level) =>
      `<option value="${level.id}"${level.id === current ? ' selected' : ''}>${level.label}</option>`
    ).join('');
    return `
      <div class="body-part-row">
        <label class="body-part-label" for="body-${part.id}">${part.label}</label>
        <select
          class="form-select body-coverage-select"
          id="body-${part.id}"
          data-part-id="${part.id}"
          ${isLocked ? 'disabled title="Covered by Robe or Toga"' : ''}
        >
          ${options}
        </select>
      </div>`;
  }).join('');
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

      const feetCoverage = state.bodyEmphasis?.feet ?? '';
      const isBootsConflict = item.id === 'boots'
        && (feetCoverage === 'partial' || feetCoverage === 'exposed');

      const chestCoverage  = state.bodyEmphasis?.chest ?? '';
      const isChestConflict = chestCoverage === 'exposed'
        && (item.id === 'tunic' || item.id === 'robe' || item.id === 'toga');

      const isDisabled = isIncompatible || isPrereqUnmet || isBootsConflict || isChestConflict;
      const isChecked  = state.selectedCostumes.has(item.id) && !isDisabled;

      let title = '';
      if (isIncompatible) {
        title = 'Not compatible with this species';
      } else if (isChestConflict) {
        title = 'Incompatible with uncovered chest';
      } else if (isBootsConflict) {
        title = 'Incompatible with current feet coverage setting';
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

  const configuredParts = BODY_PARTS
    .filter((p) => state.bodyEmphasis?.[p.id])
    .map((p) => {
      const level = COVERAGE_LEVELS.find((l) => l.id === state.bodyEmphasis[p.id]);
      return `${p.label}: ${level?.label ?? ''}`;
    });

  const hairColor   = HAIR_COLORS.find((c) => c.id === state.hairColorId);
  const eyeColor    = EYE_COLORS.find((c) => c.id === state.eyeColorId);
  const skinColor   = SKIN_COLORS.find((c) => c.id === state.skinColorId);
  const shotType    = SHOT_TYPES.find((o) => o.id === state.shotTypeId);
  const cameraAngle = CAMERA_ANGLES.find((o) => o.id === state.cameraAngleId);
  const gaze        = GAZE_OPTIONS.find((o) => o.id === state.gazeId);

  const list = $('summary-list');
  list.innerHTML = [
    `<li><span class="summary-key">Species</span><span class="summary-val">${species?.label ?? '—'}</span></li>`,
    `<li><span class="summary-key">Sex</span><span class="summary-val">${sex?.label ?? '—'}</span></li>`,
    `<li><span class="summary-key">Hair</span><span class="summary-val">${hairColor?.label || '—'}</span></li>`,
    `<li><span class="summary-key">Eyes</span><span class="summary-val">${eyeColor?.label || '—'}</span></li>`,
    `<li><span class="summary-key">Skin</span><span class="summary-val">${skinColor?.label || '—'}</span></li>`,
    `<li><span class="summary-key">Job</span><span class="summary-val">${job?.label ?? '—'}</span></li>`,
    `<li><span class="summary-key">Equipment</span><span class="summary-val">${
      activeItems.length ? activeItems.map((i) => i.label).join(', ') : 'None'
    }</span></li>`,
    `<li><span class="summary-key">Focus</span><span class="summary-val">${configuredParts.length ? configuredParts.join(', ') : '—'}</span></li>`,
    `<li><span class="summary-key">Shot</span><span class="summary-val">${shotType?.label    || '—'}</span></li>`,
    `<li><span class="summary-key">Angle</span><span class="summary-val">${cameraAngle?.label || '—'}</span></li>`,
    `<li><span class="summary-key">Gaze</span><span class="summary-val">${gaze?.label        || '—'}</span></li>`,
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

/** Reset to the default state: Human, Female, no job, no costume, no body emphasis. */
function resetState() {
  applyState({
    ...RESET_STATE,
    bodyEmphasis: blankBodyEmphasis(),
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

  // Copy body emphasis, filling in any missing parts with ''
  state.bodyEmphasis = blankBodyEmphasis();
  if (newState.bodyEmphasis) {
    for (const part of BODY_PARTS) {
      state.bodyEmphasis[part.id] = newState.bodyEmphasis[part.id] ?? '';
    }
  }

  // Re-render controls that hold their own DOM state
  $('species-select').value = state.speciesId;
  $('job-select').value     = state.jobId;
  renderSexRadios();
  renderColorSelects();
  renderFramingSelects();
  renderBodyEmphasis();
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

      // Robe and toga cover the abdomen — clear any body emphasis for it
      if (id === 'robe' || id === 'toga') {
        state.bodyEmphasis.abdomen = '';
      }
    } else {
      state.selectedCostumes.delete(id);
      // If this item was a prerequisite for another selected item, remove that item too
      enforcePrerequisites(state.selectedCostumes);
    }

    // Re-render costumes and body emphasis so disabled states stay in sync
    renderCostumes();
    renderBodyEmphasis();
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

  // Body & coverage — event delegation on the container
  $('body-emphasis-container').addEventListener('change', (e) => {
    const target = /** @type {HTMLSelectElement} */ (e.target);
    if (!target.classList.contains('body-coverage-select')) return;

    const partId   = target.dataset.partId;
    const coverage = target.value;
    state.bodyEmphasis[partId] = coverage;

    // Boots are incompatible with partial/exposed feet coverage
    if (partId === 'feet' && (coverage === 'partial' || coverage === 'exposed')) {
      state.selectedCostumes.delete('boots');
    }

    // Chest uncovered: remove clothing that covers the chest
    if (partId === 'chest' && coverage === 'exposed') {
      for (const id of ['tunic', 'robe', 'toga']) {
        state.selectedCostumes.delete(id);
      }
      // Removing robe/toga unlocks abdomen — clear any stale value
      state.bodyEmphasis.abdomen = '';
      enforcePrerequisites(state.selectedCostumes);
    }

    renderCostumes();
    renderBodyEmphasis();
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
  // bodyEmphasis depends on BODY_PARTS being defined, so initialize it here
  RESET_STATE.bodyEmphasis = blankBodyEmphasis();
  state.bodyEmphasis       = blankBodyEmphasis();

  renderSpeciesSelect();
  renderSexRadios();
  renderColorSelects();
  renderFramingSelects();
  renderBodyEmphasis();
  renderJobSelect();
  renderAll();
  bindEvents();
}

init();

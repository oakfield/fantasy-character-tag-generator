/**
 * @fileoverview Tag generation logic.
 * Converts a CharacterState into a booru-style tag string, respecting
 * per-species costume incompatibilities.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve a TagsSpec (array or function) to a plain string array.
 * @param {import('./data.js').TagsSpec} spec
 * @param {string} sex
 * @returns {string[]}
 */
function resolveTagsSpec(spec, sex) {
  return typeof spec === 'function' ? spec(sex) : spec;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Enforce mutual exclusion groups on a selectedCostumes Set in-place.
 * When multiple items from the same group are present, only the first one
 * (in group-definition order) is kept. This is used by the randomizer to
 * guarantee a coherent outfit after building from presets.
 *
 * @param {Set<string>} selectedCostumes - Modified in place
 */
function enforceExclusionGroups(selectedCostumes) {
  for (const group of EXCLUSION_GROUPS) {
    let kept = false;
    for (const id of group) {
      if (selectedCostumes.has(id)) {
        if (kept) {
          selectedCostumes.delete(id);
        } else {
          kept = true;
        }
      }
    }
  }
}

/**
 * Return the set of costume IDs that are incompatible with the given species.
 * @param {string} speciesId
 * @returns {Set<string>}
 */
function getIncompatibleCostumes(speciesId) {
  const species = SPECIES.find((s) => s.id === speciesId);
  return new Set(species?.incompatibleCostumes ?? []);
}

/**
 * Generate a booru-style comma-separated tag string from a CharacterState.
 * Tag order: sex → species → job → costume items
 *
 * @param {CharacterState} state
 * @returns {string}
 */
function generateTags(state) {
  const tags = [];

  // 1. Sex tag (e.g. "1girl")
  const sex = SEX_OPTIONS.find((s) => s.id === state.sexId);
  if (sex) tags.push(sex.tag);

  // 2. Species tags
  const species = SPECIES.find((s) => s.id === state.speciesId);
  if (species) {
    tags.push(...resolveTagsSpec(species.tags, state.sexId));
  }

  // 3. Job tags
  const job = JOBS.find((j) => j.id === state.jobId);
  if (job) tags.push(...job.tags);

  // 4. Costume tags, filtered by species incompatibilities
  const incompatible = getIncompatibleCostumes(state.speciesId);
  for (const category of COSTUME_CATEGORIES) {
    for (const item of category.items) {
      if (state.selectedCostumes.has(item.id) && !incompatible.has(item.id)) {
        tags.push(...item.tags);
      }
    }
  }

  return tags.join(', ');
}

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
 * Remove any costume items whose prerequisites are no longer satisfied.
 * Used by the randomizer and the species-change handler.
 * @param {Set<string>} selectedCostumes - Modified in place
 */
function enforcePrerequisites(selectedCostumes) {
  for (const [itemId, rule] of Object.entries(COSTUME_PREREQUISITES)) {
    if (selectedCostumes.has(itemId)) {
      const prereqMet = rule.prereqs.some((p) => selectedCostumes.has(p));
      if (!prereqMet) selectedCostumes.delete(itemId);
    }
  }
}

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

  // 3. Appearance color tags
  // When a selector is "Any" (id: ''), fall back to the species's implied colour
  // so that e.g. a vampire always gets red eyes unless explicitly overridden.
  const implied = species?.impliedColors ?? {};
  const resolveColor = (selectedId, impliedKey) =>
    selectedId || (typeof implied[impliedKey] === 'string' ? implied[impliedKey] : '');

  const hairColor = HAIR_COLORS.find((c) => c.id === resolveColor(state.hairColorId, 'hair'));
  if (hairColor?.tag) tags.push(hairColor.tag);

  const eyeColor = EYE_COLORS.find((c) => c.id === resolveColor(state.eyeColorId, 'eyes'));
  if (eyeColor?.tag) tags.push(eyeColor.tag);

  const skinColor = SKIN_COLORS.find((c) => c.id === resolveColor(state.skinColorId, 'skin'));
  if (skinColor?.tag) tags.push(skinColor.tag);

  // 4. Job tags
  const job = JOBS.find((j) => j.id === state.jobId);
  if (job) tags.push(...job.tags);

  // 5. Costume tags, filtered by species incompatibilities
  const incompatible = getIncompatibleCostumes(state.speciesId);
  for (const category of COSTUME_CATEGORIES) {
    for (const item of category.items) {
      if (state.selectedCostumes.has(item.id) && !incompatible.has(item.id)) {
        tags.push(...item.tags);
      }
    }
  }

  // 6. Camera & framing tags (appended last so they describe the composition,
  //    not the character itself)
  const shotType    = SHOT_TYPES.find((o) => o.id === state.shotTypeId);
  const cameraAngle = CAMERA_ANGLES.find((o) => o.id === state.cameraAngleId);
  const gaze        = GAZE_OPTIONS.find((o) => o.id === state.gazeId);
  if (shotType?.tag)    tags.push(shotType.tag);
  if (cameraAngle?.tag) tags.push(cameraAngle.tag);
  if (gaze?.tag)        tags.push(gaze.tag);

  return tags.join(', ');
}

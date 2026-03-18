/**
 * @fileoverview Weighted-random character generation.
 *
 * The randomizer is intentionally biased toward "desirable" results:
 *  - Common, recognizable species appear more often than exotic ones.
 *  - Job outfit presets produce cohesive equipment sets instead of
 *    random item noise.
 *  - Female characters appear slightly more often (55/45) to match
 *    typical fantasy illustration conventions.
 */

// ---------------------------------------------------------------------------
// Weighted-random helper
// ---------------------------------------------------------------------------

/**
 * Pick one item from a list according to each item's `.weight` property.
 * @template {{ weight: number }} T
 * @param {T[]} items
 * @returns {T}
 */
function weightedRandom(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

// ---------------------------------------------------------------------------
// Job outfit presets
// ---------------------------------------------------------------------------
// Each preset lists:
//   required  – always added (if compatible with the species)
//   optional  – each item has a 60 % chance of being included

/** @type {Record<string, { required: string[], optional: string[] }>} */
const JOB_OUTFIT_PRESETS = {
  adventurer:    { required: ['boots', 'belt', 'tunic'],            optional: ['cloak', 'sword', 'leather_armor', 'scarf']           },
  warrior:       { required: ['sword', 'boots', 'belt'],            optional: ['plate_armor', 'chainmail', 'shield', 'gauntlets', 'helmet'] },
  knight:        { required: ['plate_armor', 'sword', 'boots'],     optional: ['shield', 'helmet', 'gauntlets', 'cloak', 'belt']     },
  paladin:       { required: ['plate_armor', 'boots'],              optional: ['shield', 'sword', 'helmet', 'gauntlets', 'cloak', 'circlet'] },
  ranger:        { required: ['bow', 'boots'],                      optional: ['leather_armor', 'cloak', 'hood', 'belt', 'dagger']   },
  rogue:         { required: ['dagger', 'boots', 'hood'],           optional: ['leather_armor', 'cloak', 'belt', 'gloves']           },
  assassin:      { required: ['dagger', 'boots', 'hood'],           optional: ['leather_armor', 'cloak', 'belt', 'gloves']           },
  wizard:        { required: ['robe', 'staff'],                     optional: ['boots', 'belt', 'cloak', 'witch_hat', 'circlet']     },
  black_mage:    { required: ['robe', 'staff', 'witch_hat'],        optional: ['cloak', 'belt', 'boots']                             },
  white_mage:    { required: ['robe', 'staff'],                     optional: ['circlet', 'cloak', 'boots', 'belt']                  },
  bard:          { required: ['tunic', 'boots'],                    optional: ['feathered_hat', 'cloak', 'vest', 'cape', 'dagger']   },
  cleric:        { required: ['robe', 'boots'],                     optional: ['circlet', 'staff', 'shield', 'cloak', 'belt']        },
  druid:         { required: ['robe', 'staff', 'boots'],            optional: ['cloak', 'hood', 'belt', 'scarf']                     },
  necromancer:   { required: ['robe', 'staff'],                     optional: ['hood', 'cloak', 'boots', 'belt', 'crown']            },
  summoner:      { required: ['robe', 'wand'],                      optional: ['circlet', 'boots', 'cloak', 'belt', 'scarf']         },
  berserker:     { required: ['axe', 'boots'],                      optional: ['leather_armor', 'chainmail', 'belt', 'gloves']       },
  monk:          { required: ['boots'],                             optional: ['tunic', 'belt', 'gloves', 'gauntlets', 'scarf']      },
  archer:        { required: ['bow', 'boots'],                      optional: ['leather_armor', 'cloak', 'belt', 'dagger', 'hood']   },
  alchemist:     { required: ['robe', 'boots', 'belt'],             optional: ['vest', 'gloves', 'hood', 'scarf']                    },
  enchanter:     { required: ['robe', 'wand', 'circlet'],           optional: ['cloak', 'boots', 'belt', 'necklace']                 },
  tavern_keeper: { required: ['tunic', 'boots', 'belt'],            optional: ['vest', 'scarf', 'skirt', 'trousers']                 },
  blacksmith:    { required: ['vest', 'boots', 'belt'],             optional: ['gauntlets', 'gloves', 'axe', 'trousers']             },
  merchant:      { required: ['tunic', 'boots'],                    optional: ['cloak', 'belt', 'vest', 'scarf', 'necklace']         },
  pirate:        { required: ['tricorne', 'boots', 'sword'],        optional: ['cloak', 'belt', 'vest', 'cape', 'dagger']            },
  fortune_teller:{ required: ['robe', 'scarf'],                     optional: ['circlet', 'cloak', 'earrings', 'necklace', 'crown']  },
};

/** Fallback preset used when a job has no explicit entry. */
const DEFAULT_PRESET = { required: ['boots', 'tunic'], optional: ['belt', 'cloak'] };

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a weighted-random CharacterState.
 * The result is intentionally biased toward coherent, visually interesting
 * characters rather than purely uniform randomness.
 *
 * @returns {import('./generator.js').CharacterState}
 */
function generateRandomCharacter() {
  const species = weightedRandom(SPECIES);
  const sex     = weightedRandom(SEX_OPTIONS);
  const job     = weightedRandom(JOBS);

  const incompatible = getIncompatibleCostumes(species.id);
  const preset = JOB_OUTFIT_PRESETS[job.id] ?? DEFAULT_PRESET;

  const selectedCostumes = new Set();

  // Always include required items (skip if incompatible)
  for (const id of preset.required) {
    if (!incompatible.has(id)) selectedCostumes.add(id);
  }

  // Include each optional item with 60 % probability (skip if incompatible)
  for (const id of preset.optional) {
    if (!incompatible.has(id) && Math.random() < 0.6) {
      selectedCostumes.add(id);
    }
  }

  // Remove any accidental conflicts (e.g. two headwear items from overlapping presets)
  enforceExclusionGroups(selectedCostumes);
  // Remove items whose prerequisites weren't included in this outfit
  enforcePrerequisites(selectedCostumes);

  // ---------------------------------------------------------------------------
  // Appearance colours
  // Skin is picked first so eye/hair pools can be biased toward realistic
  // combinations (dark skin → dark eyes/hair; light skin → light eyes).
  // ---------------------------------------------------------------------------

  const implied   = species.impliedColors ?? {};
  const skinColor = implied.skin ? { id: '', toneGroup: null } : weightedRandom(SKIN_COLORS.filter((c) => c.weight > 0));
  const toneGroup = skinColor.toneGroup ?? null;

  /**
   * Return a copy of a colour pool with each entry's weight scaled by a
   * per-id multiplier map. Missing ids default to ×1; results are floored to
   * a minimum weight of 1 so no option is completely removed.
   * @param {Array<{id:string,weight:number}>} pool
   * @param {Record<string,number>} multipliers
   */
  function applyMultipliers(pool, multipliers) {
    return pool.map((c) => {
      const m = multipliers[c.id] ?? 1;
      return m === 1 ? c : { ...c, weight: Math.max(1, Math.round(c.weight * m)) };
    });
  }

  // Eye-colour weight multipliers per skin tone group.
  // 'light' skin → light eyes likely;  'dark' skin → dark eyes likely.
  const EYE_MULTIPLIERS = {
    light: { brown: 0.5, blue: 1.8, green: 1.6, hazel: 1.3, gray: 2.0,
             amber: 0.8, red: 0.5, purple: 0.6, gold: 0.7, silver: 2.0,
             black: 0.2, heterochromia: 0.5 },
    dark:  { brown: 2.5, blue: 0.3, green: 0.3, hazel: 2.0, gray: 0.4,
             amber: 2.0, red: 0.8, purple: 0.8, gold: 0.8, silver: 0.5,
             black: 3.0, heterochromia: 0.5 },
  };

  // Hair-colour weight multipliers for dark skin tones only.
  const DARK_SKIN_HAIR_MULTIPLIERS = {
    black: 1.6, brown: 1.4, auburn: 1.1,
    blonde: 0.2, white: 0.2, silver: 0.2, gray: 0.3, platinum: 0.2,
    red: 0.6, blue: 0.6, purple: 0.6, pink: 0.6, green: 0.6, orange: 0.6,
  };

  const baseEyes = EYE_COLORS.filter((c) => c.weight > 0);
  const eyePool  = EYE_MULTIPLIERS[toneGroup] ? applyMultipliers(baseEyes, EYE_MULTIPLIERS[toneGroup]) : baseEyes;

  const baseHair = HAIR_COLORS.filter((c) => c.weight > 0);
  const hairPool = toneGroup === 'dark' ? applyMultipliers(baseHair, DARK_SKIN_HAIR_MULTIPLIERS) : baseHair;

  const eyeColor  = implied.eyes ? { id: '' } : weightedRandom(eyePool);
  const hairColor = implied.hair ? { id: '' } : weightedRandom(hairPool);

  // Pick camera & framing — "Any" (id: '') is included in the pool with a high
  // weight, so framing will be left unspecified most of the time.
  const shotType    = weightedRandom(SHOT_TYPES);
  const cameraAngle = weightedRandom(CAMERA_ANGLES);
  const gaze        = weightedRandom(GAZE_OPTIONS);

  return {
    speciesId:     species.id,
    sexId:         sex.id,
    jobId:         job.id,
    hairColorId:   hairColor.id,
    eyeColorId:    eyeColor.id,
    skinColorId:   skinColor.id,
    shotTypeId:    shotType.id,
    cameraAngleId: cameraAngle.id,
    gazeId:        gaze.id,
    selectedCostumes,
  };
}

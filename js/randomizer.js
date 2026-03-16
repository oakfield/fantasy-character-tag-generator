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

import { SPECIES, SEX_OPTIONS, JOBS } from './data.js';
import { getIncompatibleCostumes } from './generator.js';

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
export function generateRandomCharacter() {
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

  return {
    speciesId: species.id,
    sexId: sex.id,
    jobId: job.id,
    selectedCostumes,
  };
}

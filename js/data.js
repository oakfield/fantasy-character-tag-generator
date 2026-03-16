/**
 * @fileoverview Master data for the Fantasy Character Tag Generator.
 * Each record drives both the UI (label) and booru-tag output (tags).
 *
 * Species.tags may be an array of strings (always applied) or a function
 * (sex: string) => string[] for species whose canonical tag is sex-specific
 * (e.g. "catgirl" vs "catboy").
 */

// ---------------------------------------------------------------------------
// Species
// ---------------------------------------------------------------------------

/** @typedef {string[] | ((sex: string) => string[])} TagsSpec */

/**
 * @typedef {Object} Species
 * @property {string}   id
 * @property {string}   label
 * @property {TagsSpec} tags
 * @property {number}   weight       - Relative probability for weighted-random
 * @property {string[]} incompatibleCostumes - Costume item IDs disabled for this species
 */

/** @type {Species[]} */
const SPECIES = [
  {
    id: 'human',
    label: 'Human',
    tags: [],
    weight: 25,
    incompatibleCostumes: [],
  },
  {
    id: 'elf',
    label: 'Elf',
    tags: ['elf', 'pointy ears'],
    weight: 12,
    incompatibleCostumes: [],
  },
  {
    id: 'dark_elf',
    label: 'Dark Elf',
    tags: ['dark elf', 'pointy ears', 'dark skin', 'white hair'],
    weight: 8,
    incompatibleCostumes: [],
  },
  {
    id: 'high_elf',
    label: 'High Elf',
    tags: ['high elf', 'pointy ears', 'blonde hair'],
    weight: 5,
    incompatibleCostumes: [],
  },
  {
    id: 'half_elf',
    label: 'Half-Elf',
    tags: ['half elf', 'slightly pointed ears'],
    weight: 5,
    incompatibleCostumes: [],
  },
  {
    id: 'orc',
    label: 'Orc',
    tags: ['orc', 'green skin', 'tusks'],
    weight: 6,
    incompatibleCostumes: [],
  },
  {
    id: 'half_orc',
    label: 'Half-Orc',
    tags: ['half-orc', 'gray skin', 'small tusks'],
    weight: 4,
    incompatibleCostumes: [],
  },
  {
    id: 'goblin',
    label: 'Goblin',
    tags: ['goblin', 'green skin', 'pointy ears'],
    weight: 7,
    incompatibleCostumes: [],
  },
  {
    id: 'tiefling',
    label: 'Tiefling',
    tags: ['tiefling', 'horns', 'demon tail', 'colored skin'],
    weight: 8,
    // Tieflings already have horns — horned helm would be redundant/clipping
    incompatibleCostumes: ['helmet', 'horned_helm'],
  },
  {
    id: 'vampire',
    label: 'Vampire',
    tags: ['vampire', 'fangs', 'pale skin', 'red eyes'],
    weight: 6,
    incompatibleCostumes: [],
  },
  {
    id: 'slime',
    label: 'Slime Monster',
    // Slimes are almost exclusively depicted as female in fantasy art
    tags: (sex) =>
      sex === 'male'
        ? ['slime', 'monster', 'slime body']
        : ['slime girl', 'monster girl', 'slime body'],
    weight: 4,
    // Slimes cannot meaningfully wear solid physical items
    incompatibleCostumes: [
      'plate_armor', 'chainmail', 'leather_armor',
      'boots', 'gloves', 'gauntlets', 'belt',
      'trousers', 'skirt', 'shorts', 'tunic', 'vest',
    ],
  },
  {
    id: 'dwarf',
    label: 'Dwarf',
    tags: ['dwarf'],
    weight: 5,
    incompatibleCostumes: [],
  },
  {
    id: 'cat_person',
    label: 'Cat Person',
    tags: (sex) =>
      sex === 'male'
        ? ['cat ears', 'cat tail', 'catboy']
        : ['cat ears', 'cat tail', 'catgirl'],
    weight: 5,
    incompatibleCostumes: [],
  },
  {
    id: 'kitsune',
    label: 'Kitsune',
    tags: (sex) =>
      sex === 'male'
        ? ['fox ears', 'fox tail', 'kitsune', 'foxboy']
        : ['fox ears', 'fox tail', 'kitsune', 'fox girl'],
    weight: 4,
    incompatibleCostumes: [],
  },
  {
    id: 'fairy',
    label: 'Fairy',
    tags: ['fairy', 'fairy wings', 'pointy ears', 'small'],
    weight: 3,
    // Heavy armor doesn't fit on a tiny winged fairy
    incompatibleCostumes: ['plate_armor', 'chainmail', 'helmet', 'horned_helm'],
  },
  {
    id: 'lizardfolk',
    label: 'Lizardfolk',
    tags: ['lizard person', 'scales', 'lizard tail', 'reptile'],
    weight: 3,
    // Scaled feet make standard boots awkward
    incompatibleCostumes: ['boots'],
  },
  {
    id: 'gnome',
    label: 'Gnome',
    tags: ['gnome', 'pointy ears'],
    weight: 3,
    incompatibleCostumes: [],
  },
  {
    id: 'harpy',
    label: 'Harpy',
    tags: ['harpy', 'bird wings', 'talons', 'feathers'],
    weight: 2,
    // Harpies have wings for arms — no hand-based items
    incompatibleCostumes: ['gloves', 'gauntlets', 'shield', 'sword', 'axe', 'spear', 'bow'],
  },
  {
    id: 'werewolf',
    label: 'Werewolf',
    tags: ['werewolf', 'wolf ears', 'wolf tail', 'claws'],
    weight: 2,
    // Clawed hands/feet conflict with these items
    incompatibleCostumes: ['gloves', 'boots'],
  },
];

// ---------------------------------------------------------------------------
// Sex
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} SexOption
 * @property {string} id
 * @property {string} label
 * @property {string} tag   - Booru tag (e.g. "1girl")
 * @property {number} weight
 */

/** @type {SexOption[]} */
const SEX_OPTIONS = [
  { id: 'female', label: 'Female', tag: '1girl', weight: 55 },
  { id: 'male',   label: 'Male',   tag: '1boy',  weight: 45 },
];

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} Job
 * @property {string}   id
 * @property {string}   label
 * @property {string[]} tags    - Booru tags identifying the job/class
 * @property {number}   weight
 */

/** @type {Job[]} */
const JOBS = [
  { id: 'adventurer',     label: 'Adventurer',     tags: ['adventurer'],     weight: 10 },
  { id: 'warrior',        label: 'Warrior',        tags: ['warrior'],        weight: 9  },
  { id: 'knight',         label: 'Knight',         tags: ['knight'],         weight: 8  },
  { id: 'paladin',        label: 'Paladin',        tags: ['paladin'],        weight: 7  },
  { id: 'ranger',         label: 'Ranger',         tags: ['ranger'],         weight: 7  },
  { id: 'rogue',          label: 'Rogue / Thief',  tags: ['rogue', 'thief'], weight: 8  },
  { id: 'assassin',       label: 'Assassin',       tags: ['assassin'],       weight: 6  },
  { id: 'wizard',         label: 'Wizard',         tags: ['wizard'],         weight: 8  },
  { id: 'black_mage',     label: 'Black Mage',     tags: ['black mage'],     weight: 7  },
  { id: 'white_mage',     label: 'White Mage',     tags: ['white mage'],     weight: 7  },
  { id: 'bard',           label: 'Bard',           tags: ['bard'],           weight: 5  },
  { id: 'cleric',         label: 'Cleric',         tags: ['cleric'],         weight: 6  },
  { id: 'druid',          label: 'Druid',          tags: ['druid'],          weight: 5  },
  { id: 'necromancer',    label: 'Necromancer',    tags: ['necromancer'],    weight: 5  },
  { id: 'summoner',       label: 'Summoner',       tags: ['summoner'],       weight: 4  },
  { id: 'berserker',      label: 'Berserker',      tags: ['berserker'],      weight: 5  },
  { id: 'monk',           label: 'Monk',           tags: ['monk'],           weight: 5  },
  { id: 'archer',         label: 'Archer',         tags: ['archer'],         weight: 6  },
  { id: 'alchemist',      label: 'Alchemist',      tags: ['alchemist'],      weight: 4  },
  { id: 'enchanter',      label: 'Enchanter',      tags: ['enchanter'],      weight: 3  },
  { id: 'tavern_keeper',  label: 'Tavern Keeper',  tags: ['tavern keeper'],  weight: 5  },
  { id: 'blacksmith',     label: 'Blacksmith',     tags: ['blacksmith'],     weight: 4  },
  { id: 'merchant',       label: 'Merchant',       tags: ['merchant'],       weight: 4  },
  { id: 'pirate',         label: 'Pirate',         tags: ['pirate'],         weight: 4  },
  { id: 'fortune_teller', label: 'Fortune Teller', tags: ['fortune teller'], weight: 3  },
];

// ---------------------------------------------------------------------------
// Costumes
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} CostumeItem
 * @property {string}   id
 * @property {string}   label
 * @property {string[]} tags
 */

/**
 * @typedef {Object} CostumeCategory
 * @property {string}        id
 * @property {string}        label
 * @property {CostumeItem[]} items
 */

/**
 * Groups of costume item IDs where only one may be selected at a time.
 * Selecting a new item in a group automatically deselects the others.
 * @type {string[][]}
 */
const EXCLUSION_GROUPS = [
  // Body armor — only one protection tier at a time
  ['plate_armor', 'chainmail', 'leather_armor'],
  // Headwear — only one piece on your head at a time
  ['witch_hat', 'crown', 'circlet', 'hood', 'helmet', 'bandana', 'feathered_hat', 'tricorne', 'horned_helm'],
  // Hand protection — gauntlets and gloves cover the same anatomy
  ['gloves', 'gauntlets'],
  // Bottoms — only one lower-body garment at a time
  ['trousers', 'skirt', 'shorts'],
];

/** @type {CostumeCategory[]} */
const COSTUME_CATEGORIES = [
  {
    id: 'armor',
    label: 'Armor & Protection',
    items: [
      { id: 'plate_armor',   label: 'Plate Armor',   tags: ['plate armor']   },
      { id: 'chainmail',     label: 'Chainmail',     tags: ['chainmail']     },
      { id: 'leather_armor', label: 'Leather Armor', tags: ['leather armor'] },
      { id: 'shield',        label: 'Shield',        tags: ['shield']        },
    ],
  },
  {
    id: 'clothing',
    label: 'Clothing',
    items: [
      { id: 'tunic',    label: 'Tunic',    tags: ['tunic']    },
      { id: 'robe',     label: 'Robe',     tags: ['robe']     },
      { id: 'toga',     label: 'Toga',     tags: ['toga']     },
      { id: 'vest',     label: 'Vest',     tags: ['vest']     },
      { id: 'trousers', label: 'Trousers', tags: ['trousers'] },
      { id: 'skirt',    label: 'Skirt',    tags: ['skirt']    },
      { id: 'shorts',   label: 'Shorts',   tags: ['shorts']   },
      { id: 'cloak',    label: 'Cloak',    tags: ['cloak']    },
      { id: 'cape',     label: 'Cape',     tags: ['cape']     },
    ],
  },
  {
    id: 'headwear',
    label: 'Headwear',
    items: [
      { id: 'witch_hat',     label: 'Witch Hat',     tags: ['witch hat']     },
      { id: 'crown',         label: 'Crown',         tags: ['crown']         },
      { id: 'circlet',       label: 'Circlet',       tags: ['circlet']       },
      { id: 'hood',          label: 'Hood',          tags: ['hood']          },
      { id: 'helmet',        label: 'Helmet',        tags: ['helmet']        },
      { id: 'bandana',       label: 'Bandana',       tags: ['bandana']       },
      { id: 'feathered_hat', label: 'Feathered Hat', tags: ['feathered hat'] },
      { id: 'tricorne',      label: 'Tricorne Hat',  tags: ['tricorne hat']  },
      { id: 'horned_helm',   label: 'Horned Helm',   tags: ['horned helmet'] },
    ],
  },
  {
    id: 'accessories',
    label: 'Accessories',
    items: [
      { id: 'belt',     label: 'Belt',     tags: ['belt']     },
      { id: 'boots',    label: 'Boots',    tags: ['boots']    },
      { id: 'gloves',   label: 'Gloves',   tags: ['gloves']   },
      { id: 'gauntlets',label: 'Gauntlets',tags: ['gauntlets']},
      { id: 'scarf',    label: 'Scarf',    tags: ['scarf']    },
      { id: 'earrings', label: 'Earrings', tags: ['earrings'] },
      { id: 'necklace', label: 'Necklace', tags: ['necklace'] },
    ],
  },
  {
    id: 'weapons',
    label: 'Weapons',
    items: [
      { id: 'sword',  label: 'Sword',  tags: ['sword']  },
      { id: 'staff',  label: 'Staff',  tags: ['staff']  },
      { id: 'bow',    label: 'Bow',    tags: ['bow']    },
      { id: 'dagger', label: 'Dagger', tags: ['dagger'] },
      { id: 'axe',    label: 'Axe',    tags: ['axe']    },
      { id: 'wand',   label: 'Wand',   tags: ['wand']   },
      { id: 'spear',  label: 'Spear',  tags: ['spear']  },
    ],
  },
];

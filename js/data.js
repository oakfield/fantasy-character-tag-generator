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
    impliedColors: { hair: true, skin: true },
  },
  {
    id: 'high_elf',
    label: 'High Elf',
    tags: ['high elf', 'pointy ears', 'blonde hair'],
    weight: 5,
    incompatibleCostumes: [],
    impliedColors: { hair: true },
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
    impliedColors: { skin: true },
  },
  {
    id: 'half_orc',
    label: 'Half-Orc',
    tags: ['half-orc', 'gray skin', 'small tusks'],
    weight: 4,
    incompatibleCostumes: [],
    impliedColors: { skin: true },
  },
  {
    id: 'goblin',
    label: 'Goblin',
    tags: ['goblin', 'green skin', 'pointy ears'],
    weight: 7,
    incompatibleCostumes: [],
    impliedColors: { skin: true },
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
    impliedColors: { skin: true, eyes: true },
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

// ---------------------------------------------------------------------------
// Appearance colors
// ---------------------------------------------------------------------------

/**
 * @typedef {{ id: string, label: string, tag: string, weight: number }} ColorOption
 * weight: 0 means "Any" — excluded from weighted-random selection.
 */

/** @type {ColorOption[]} */
const HAIR_COLORS = [
  { id: '',         label: '— Any —',   tag: '',                     weight: 0  },
  { id: 'black',    label: 'Black',     tag: 'black hair',           weight: 15 },
  { id: 'brown',    label: 'Brown',     tag: 'brown hair',           weight: 14 },
  { id: 'blonde',   label: 'Blonde',    tag: 'blonde hair',          weight: 12 },
  { id: 'red',      label: 'Red',       tag: 'red hair',             weight: 10 },
  { id: 'auburn',   label: 'Auburn',    tag: 'auburn hair',          weight: 7  },
  { id: 'white',    label: 'White',     tag: 'white hair',           weight: 7  },
  { id: 'silver',   label: 'Silver',    tag: 'silver hair',          weight: 6  },
  { id: 'gray',     label: 'Gray',      tag: 'gray hair',            weight: 4  },
  { id: 'platinum', label: 'Platinum',  tag: 'platinum blonde hair', weight: 3  },
  { id: 'blue',     label: 'Blue',      tag: 'blue hair',            weight: 5  },
  { id: 'purple',   label: 'Purple',    tag: 'purple hair',          weight: 5  },
  { id: 'pink',     label: 'Pink',      tag: 'pink hair',            weight: 4  },
  { id: 'green',    label: 'Green',     tag: 'green hair',           weight: 3  },
  { id: 'orange',   label: 'Orange',    tag: 'orange hair',          weight: 3  },
];

/** @type {ColorOption[]} */
const EYE_COLORS = [
  { id: '',          label: '— Any —',      tag: '',              weight: 0  },
  { id: 'brown',     label: 'Brown',        tag: 'brown eyes',    weight: 15 },
  { id: 'blue',      label: 'Blue',         tag: 'blue eyes',     weight: 14 },
  { id: 'green',     label: 'Green',        tag: 'green eyes',    weight: 12 },
  { id: 'hazel',     label: 'Hazel',        tag: 'hazel eyes',    weight: 8  },
  { id: 'gray',      label: 'Gray',         tag: 'gray eyes',     weight: 7  },
  { id: 'amber',     label: 'Amber',        tag: 'amber eyes',    weight: 7  },
  { id: 'red',       label: 'Red',          tag: 'red eyes',      weight: 6  },
  { id: 'purple',    label: 'Purple',       tag: 'purple eyes',   weight: 5  },
  { id: 'gold',      label: 'Gold',         tag: 'gold eyes',     weight: 5  },
  { id: 'silver',    label: 'Silver',       tag: 'silver eyes',   weight: 4  },
  { id: 'black',     label: 'Black',        tag: 'black eyes',    weight: 3  },
  { id: 'heterochromia', label: 'Heterochromia', tag: 'heterochromia', weight: 2 },
];

/** @type {ColorOption[]} */
const SKIN_COLORS = [
  { id: '',       label: '— Any —', tag: '',            weight: 0  },
  { id: 'pale',   label: 'Pale',    tag: 'pale skin',   weight: 12 },
  { id: 'fair',   label: 'Fair',    tag: 'fair skin',   weight: 14 },
  { id: 'light',  label: 'Light',   tag: 'light skin',  weight: 12 },
  { id: 'tan',    label: 'Tan',     tag: 'tan skin',    weight: 11 },
  { id: 'brown',  label: 'Brown',   tag: 'brown skin',  weight: 9  },
  { id: 'dark',   label: 'Dark',    tag: 'dark skin',   weight: 8  },
  { id: 'ebony',  label: 'Ebony',   tag: 'dark skin',   weight: 5  },
  { id: 'green',  label: 'Green',   tag: 'green skin',  weight: 4  },
  { id: 'gray',   label: 'Gray',    tag: 'gray skin',   weight: 4  },
  { id: 'blue',   label: 'Blue',    tag: 'blue skin',   weight: 3  },
  { id: 'purple', label: 'Purple',  tag: 'purple skin', weight: 3  },
  { id: 'golden', label: 'Golden',  tag: 'golden skin', weight: 3  },
];

// ---------------------------------------------------------------------------

/**
 * Maps a costume item ID to its prerequisite rule.
 * `prereqs`  – at least one of these item IDs must be selected.
 * `tooltip`  – optional override for the disabled-state tooltip; falls back
 *              to a generated "Requires: X, Y, Z" string if omitted.
 * @type {Record<string, { prereqs: string[], tooltip?: string }>}
 */
const COSTUME_PREREQUISITES = {
  hood: {
    prereqs: ['robe', 'cloak', 'cape'],
    tooltip: 'To add a hood, select Robe, Cloak or Cape',
  },
};

/**
 * Groups of costume item IDs where only one may be selected at a time.
 * Selecting a new item in a group automatically deselects the others.
 * @type {string[][]}
 */
const EXCLUSION_GROUPS = [
  // Armor — plate/chainmail can stack; leather is a separate tier
  ['plate_armor', 'leather_armor'],
  ['chainmail',   'leather_armor'],

  // Headwear — only one piece on your head at a time
  ['witch_hat', 'crown', 'circlet', 'hood', 'helmet', 'bandana', 'feathered_hat', 'tricorne', 'horned_helm'],

  // Hand protection — gauntlets and gloves cover the same anatomy
  ['gloves', 'gauntlets'],

  // Bottoms — only one lower-body garment at a time
  ['trousers', 'skirt', 'shorts'],

  // Robe is a full-body garment — mutually exclusive with all other clothing
  ['robe', 'toga'],
  ['robe', 'tunic'],
  ['robe', 'vest'],
  ['robe', 'cloak'],
  ['robe', 'cape'],
  ['robe', 'trousers'],
  ['robe', 'skirt'],
  ['robe', 'shorts'],

  // Toga is a full-body garment — mutually exclusive with all other clothing and belt
  ['toga', 'tunic'],
  ['toga', 'vest'],
  ['toga', 'cloak'],
  ['toga', 'cape'],
  ['toga', 'trousers'],
  ['toga', 'skirt'],
  ['toga', 'shorts'],
  ['toga', 'belt'],
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

// ---------------------------------------------------------------------------
// Camera & Framing
// ---------------------------------------------------------------------------

/**
 * @typedef {{ id: string, label: string, tag: string, weight: number }} FramingOption
 *
 * Unlike color options (where weight:0 excludes "Any" from random selection),
 * framing options include "Any" in the weighted pool with a high weight so
 * that the randomizer leaves framing unspecified most of the time.
 */

/** @type {FramingOption[]} */
const SHOT_TYPES = [
  { id: '',            label: '— Any —',      tag: '',            weight: 70 },
  { id: 'portrait',    label: 'Portrait',      tag: 'portrait',    weight: 5  },
  { id: 'bust',        label: 'Bust Shot',     tag: 'bust',        weight: 8  },
  { id: 'upper_body',  label: 'Upper Body',    tag: 'upper body',  weight: 10 },
  { id: 'cowboy_shot', label: 'Cowboy Shot',   tag: 'cowboy shot', weight: 8  },
  { id: 'full_body',   label: 'Full Body',     tag: 'full body',   weight: 12 },
  { id: 'wide_shot',   label: 'Wide Shot',     tag: 'wide shot',   weight: 5  },
];

/** @type {FramingOption[]} */
const CAMERA_ANGLES = [
  { id: '',             label: '— Any —',        tag: '',            weight: 75 },
  { id: 'profile',      label: 'Profile / Side',  tag: 'profile',     weight: 5  },
  { id: 'from_behind',  label: 'From Behind',     tag: 'from behind', weight: 6  },
  { id: 'from_above',   label: 'From Above',      tag: 'from above',  weight: 5  },
  { id: 'from_below',   label: 'From Below',      tag: 'from below',  weight: 4  },
  { id: 'dutch_angle',  label: 'Dutch Angle',     tag: 'dutch angle', weight: 5  },
];

/** @type {FramingOption[]} */
const GAZE_OPTIONS = [
  { id: '',                   label: '— Any —',          tag: '',                  weight: 60 },
  { id: 'looking_at_viewer',  label: 'Looking at Viewer', tag: 'looking at viewer', weight: 20 },
  { id: 'looking_away',       label: 'Looking Away',      tag: 'looking away',      weight: 8  },
  { id: 'looking_back',       label: 'Looking Back',      tag: 'looking back',      weight: 5  },
  { id: 'eyes_closed',        label: 'Eyes Closed',       tag: 'closed eyes',       weight: 4  },
  { id: 'winking',            label: 'Winking',           tag: 'winking',           weight: 3  },
];

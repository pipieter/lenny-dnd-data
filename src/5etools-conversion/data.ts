export const CreatureSizes = new Map<string, string>([
    ['F', 'Fine'],
    ['D', 'Diminutive'],
    ['T', 'Tiny'],
    ['S', 'Small'],
    ['M', 'Medium'],
    ['L', 'Large'],
    ['H', 'Huge'],
    ['G', 'Gargantuan'],
    ['C', 'Colossal'],
    ['V', 'Varies'],
]); // parser.js,2947

export const AbilityScores = new Map<string, string>([
    ['str', 'Strength'],
    ['dex', 'Dexterity'],
    ['con', 'Constitution'],
    ['int', 'Intelligence'],
    ['wis', 'Wisdom'],
    ['cha', 'Charisma'],
]);

export const DamageTypes = new Map([
    ['A', 'Acid'],
    ['B', 'Bludgeoning'],
    ['C', 'Cold'],
    ['F', 'Fire'],
    ['O', 'Force'],
    ['L', 'Lightning'],
    ['N', 'Necrotic'],
    ['P', 'Piercing'],
    ['I', 'Poison'],
    ['Y', 'Psychic'],
    ['R', 'Radiant'],
    ['S', 'Slashing'],
    ['T', 'Thunder'],
]);

export const SpellSchools = new Map([
    ['A', 'Abjuration'],
    ['C', 'Conjuration'],
    ['D', 'Divination'],
    ['E', 'Enchantment'],
    ['V', 'Evocation'],
    ['I', 'Illusion'],
    ['N', 'Necromancy'],
    ['P', 'Psionic'],
    ['T', 'Transmutation'],
]);

export const SpeedTypes = ['walk', 'burrow', 'climb', 'fly', 'swim']; // parser.js,333
export const SpecialSpeedTypes = [/*'walk',*/ 'burrow', 'climb', 'fly', 'swim']; // parser.js,333

export const SkillAbilities = new Map<string, string>([
    ['athletics', 'str'],
    ['acrobatics', 'dex'],
    ['sleight of hand', 'dex'],
    ['stealth', 'dex'],
    ['arcana', 'int'],
    ['history', 'int'],
    ['investigation', 'int'],
    ['nature', 'int'],
    ['religion', 'int'],
    ['animal handling', 'wis'],
    ['insight', 'wis'],
    ['medicine', 'wis'],
    ['perception', 'wis'],
    ['survival', 'wis'],
    ['deception', 'cha'],
    ['intimidation', 'cha'],
    ['performance', 'cha'],
    ['persuasion', 'cha'],
]);

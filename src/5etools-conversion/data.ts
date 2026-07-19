export const AbilityScores = new Map<string, string>([
    ['str', 'Strength'],
    ['dex', 'Dexterity'],
    ['con', 'Constitution'],
    ['int', 'Intelligence'],
    ['wis', 'Wisdom'],
    ['cha', 'Charisma'],
]);

export const Advantages = new Map([
    ['adv', 'Advantage'],
    ['dis', 'Disadvantage'],
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

export const Alignments = new Map<string, string>([
    ['L', 'lawful'],
    ['N', 'neutral'],
    ['NX', 'neutral (law/chaos axis)'],
    ['NY', 'neutral (good/evil axis)'],
    ['C', 'chaotic'],
    ['G', 'good'],
    ['E', 'evil'],
    // "special" values
    ['U', 'unaligned'],
    ['A', 'any alignment'],
]);

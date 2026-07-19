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

export const SpeedTypes = ['walk', 'burrow', 'climb', 'fly', 'swim']; // parser.js,333
export const SpecialSpeedTypes = [/*'walk',*/ 'burrow', 'climb', 'fly', 'swim']; // parser.js,333

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

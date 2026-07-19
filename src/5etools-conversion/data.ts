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

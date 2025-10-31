// parser.js:273 Parser.getAbilityModNumber
export function scoreToModifier(score: number) {
    return Math.floor((score - 10) / 2);
}

// parser.js:397 Parser.crToNumber
function crToNumber(cr: any): number | null {
    if (cr === 'Unknown' || cr === '\u2014' || cr == null) return null;
    if (cr.cr) return crToNumber(cr.cr);

    const parts = cr.trim().split('/').filter(Boolean);
    if (!parts.length || parts.length >= 3) return null;
    if (isNaN(parts[0])) return null;

    if (parts.length === 2) {
        if (isNaN(Number(parts[1]))) return null;
        return Number(parts[0]) / Number(parts[1]);
    }

    return Number(parts[0]);
}

// parser.js:424 Parser.crToPb
export function crToProficiencyBonus(cr: any): number {
    const crNumber = crToNumber(cr);
    if (crNumber === null) return 0;
    if (crNumber < 5) return 2;
    return Math.ceil(crNumber / 4) + 1;
}
